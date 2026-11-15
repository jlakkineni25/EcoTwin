r"""Live refresh for EcoTwin: one run = fresh OpenAQ readings + Open-Meteo wind -> 24 h forecast + what-if scenarios -> 5 JSON files.

This is notebook 41 (live_whatif_lab) as a plain script, so it can run on a schedule (GitHub Actions) with no Jupyter and no D:\ paths.
The notebook stays the place to experiment; if the live logic changes there, change it here too.

Usage (from the v2_clean folder):
    set OPENAQ_API_KEY=...            (Windows)   |   export OPENAQ_API_KEY=...   (Linux)
    python live_refresh.py                                    # writes live_export/ and uses live_cache/
    python live_refresh.py --out-dir OUT --cache-dir CACHE    # choose other folders
    python live_refresh.py --publish-dir ..\frontend\public\data\live   # also copy the 5 files the page reads

Writes: live_frame.json, live_meta.json, live_whatif.json, live_wind_now.json, live_wind_edges.json (+ live_playback.json, live_log.csv) in the out folder.
The API key is read only from the OPENAQ_API_KEY environment variable and is never printed.
"""
import argparse, sys


import os, json, time, copy, io, math, pickle, warnings, datetime as dt
import numpy as np, pandas as pd, requests
import torch, torch.nn as nn
warnings.filterwarnings('ignore', message='Mean of empty slice')     # a station with no data in an hour: the fill-in handles it

ap = argparse.ArgumentParser(description='EcoTwin live refresh')
ap.add_argument('--out-dir', default=None, help='where the live JSON files are written (default: live_export next to this script)')
ap.add_argument('--cache-dir', default=None, help='where the OpenAQ readings cache is kept (default: live_cache next to this script)')
ap.add_argument('--publish-dir', default=None, help='optional: also copy the 5 page files here')
ARGS = ap.parse_args()
V2_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR, SCALER_DIR = os.path.join(V2_DIR, 'ecotwin_outputs', 'models'), os.path.join(V2_DIR, 'ecotwin_outputs', 'scalers')
LIVE_DIR, CACHE = ARGS.out_dir or os.path.join(V2_DIR, 'live_export'), ARGS.cache_dir or os.path.join(V2_DIR, 'live_cache')
os.makedirs(LIVE_DIR, exist_ok=True); os.makedirs(CACHE, exist_ok=True)
KEY = os.environ.get('OPENAQ_API_KEY', '')
API = 'https://api.openaq.org/v3'
DEVICE = torch.device('cpu')          # one window x 7 small models: CPU is plenty and leaves the GPU free for training
MIN_FRESH_FRACTION = 0.60              # the 'now' hour is the latest hour in which at least this share of stations reported PM2.5
PARAMS = ['pm25', 'pm10', 'no2', 'so2', 'co', 'o3', 'relativehumidity', 'temperature']
TO_FEATURE = {'pm25': 'pm2.5', 'pm10': 'pm10', 'no2': 'no2', 'so2': 'so2', 'co': 'co', 'o3': 'o3', 'relativehumidity': 'rh', 'temperature': 'at'}
INPUT_WINDOW, HORIZON, THRESHOLD_KM, CPCB_THRESHOLD = 48, 24, 12.0, 60.0
if not KEY: sys.exit('OPENAQ_API_KEY is not set (environment variable). Stopping.')
print('API key set: True | device', DEVICE)
MAX_LAG = 6                            # hours: cap on the upwind travel-time lag (same as training)

# 1) the 37 Delhi stations and their OpenAQ monitors (matched by coordinates, cached list from notebook 23)
st = pd.read_excel(os.path.join(V2_DIR, 'Delhi_list_v2.xlsx')); st.columns = st.columns.str.strip().str.lower()
NAMES = st['station'].str.strip().tolist(); LAT = st['latitude'].values.astype(float); LON = st['longitude'].values.astype(float); N = len(NAMES)

# the small tracked list (monitors near the 37 stations); falls back to the full list from notebook 23
loc_cache = os.path.join(V2_DIR, 'live_locations_delhi.json')
if not os.path.exists(loc_cache): loc_cache = os.path.join(V2_DIR, 'crosscity_cache', 'india_locations.json')
assert os.path.exists(loc_cache), 'missing live_locations_delhi.json (or run notebook 23 to create the full OpenAQ location list)'
LOCS = {L['id']: L for L in json.load(open(loc_cache))}
SENSOR = {}                                                         # sensor id -> (parameter, units)
for L in LOCS.values():
    for s in L.get('sensors', []):
        SENSOR[s['id']] = ((s.get('parameter') or {}).get('name'), (s.get('parameter') or {}).get('units'))

def km(a, b, c, d):
    p1, p2 = np.radians(a), np.radians(c); x = np.sin((p2 - p1) / 2) ** 2 + np.cos(p1) * np.cos(p2) * np.sin(np.radians(d - b) / 2) ** 2
    return 12742 * np.arcsin(np.sqrt(x))
monitors = [L for L in LOCS.values() if L.get('isMonitor') and not L.get('isMobile') and L.get('coordinates')
            and any((s.get('parameter') or {}).get('name') == 'pm25' for s in L.get('sensors', []))]
LOC_ID = []
for i in range(N):
    d, best = min(((km(LAT[i], LON[i], L['coordinates']['latitude'], L['coordinates']['longitude']), L) for L in monitors), key=lambda t: t[0])
    LOC_ID.append(best['id'] if d <= 1.0 else None)
print(f'stations matched to an OpenAQ monitor within 1 km: {sum(x is not None for x in LOC_ID)} of {N}')
print('unmatched:', [NAMES[i] for i in range(N) if LOC_ID[i] is None])

# HOW TO CHECK: 35 of 37 matched. Unmatched stations are filled from their neighbours like any missing data.

# 2) OpenAQ helpers with the rate limit respected (60 requests a minute)
def api_get(path, params=None, tries=4):
    for k in range(tries):
        r = requests.get(API + path, headers={'X-API-Key': KEY}, params=params, timeout=60)
        rem, reset = r.headers.get('X-Ratelimit-Remaining'), r.headers.get('X-Ratelimit-Reset')
        if r.status_code == 429:
            time.sleep(float(reset or 30) + 1); continue
        r.raise_for_status()
        if rem is not None and int(rem) <= 2:
            time.sleep(float(reset or 30) + 1)
        return r.json()
    raise RuntimeError('OpenAQ rate limit kept blocking: ' + path)

def pick_sensors(max_age_h=72):
    # for each station and parameter choose the sensor that reported most recently (some monitors carry duplicate or dead sensors)
    out = {}
    now = pd.Timestamp.now(tz='UTC')
    for i, lid in enumerate(LOC_ID):
        if lid is None: continue
        rows = api_get(f'/locations/{lid}/latest')['results']
        best = {}
        for r in rows:
            p = SENSOR.get(r['sensorsId'], (None, None))[0]
            if p in PARAMS:
                t = pd.Timestamp(r['datetime']['utc'])
                if (now - t) <= pd.Timedelta(hours=max_age_h) and (p not in best or t > best[p][0]):
                    best[p] = (t, r['sensorsId'])
        out[i] = {p: int(v[1]) for p, v in best.items()}
    return out

smap_file = os.path.join(CACHE, 'sensor_map.json')
if os.path.exists(smap_file) and time.time() - os.path.getmtime(smap_file) < 12 * 3600:
    SMAP = {int(k): v for k, v in json.load(open(smap_file)).items()}
else:
    t0 = time.time(); SMAP = pick_sensors(); json.dump(SMAP, open(smap_file, 'w'))
    print(f'sensor map built in {time.time()-t0:.0f}s')
have = {p: sum(p in v for v in SMAP.values()) for p in PARAMS}
print('stations with a fresh sensor per parameter:', have)

# HOW TO CHECK: PM2.5 for about 33-35 stations; the other parameters are usually a few fewer.

# 3) hourly values per sensor, kept in a cache panel that later runs only top up
def fetch_hours(sensor_id, start_utc, end_utc):
    rows, page = [], 1
    while True:
        j = api_get(f'/sensors/{sensor_id}/hours', {'datetime_from': start_utc.strftime('%Y-%m-%dT%H:%M:%SZ'),
                                                    'datetime_to': end_utc.strftime('%Y-%m-%dT%H:%M:%SZ'), 'limit': 1000, 'page': page})
        res = j.get('results', []); rows += res
        if len(res) < 1000: break
        page += 1
    if not rows: return pd.Series(dtype=float)
    t = pd.to_datetime([r['period']['datetimeFrom']['local'] for r in rows], utc=True).tz_convert('Asia/Kolkata').tz_localize(None).floor('h')
    return pd.Series([r['value'] for r in rows], index=t).groupby(level=0).mean()

panel_file = os.path.join(CACHE, 'panel.pkl')
def update_panel(hours_back):
    panel = pd.read_pickle(panel_file) if os.path.exists(panel_file) else {}
    now = pd.Timestamp.now(tz='UTC'); start = now - pd.Timedelta(hours=hours_back)
    now_local = pd.Timestamp.now(tz='Asia/Kolkata').floor('h').tz_localize(None)          # local on-the-hour grid (data are labelled :00 IST)
    grid = pd.date_range(now_local - pd.Timedelta(hours=hours_back), now_local, freq='h')
    t0 = time.time(); calls = 0
    for p in PARAMS:
        df = panel.get(p, pd.DataFrame(columns=range(N), dtype=float))
        df = df.reindex(df.index.union(grid))
        for i, sm in SMAP.items():
            if p not in sm: continue
            s = fetch_hours(sm[p], start.to_pydatetime(), now.to_pydatetime() + dt.timedelta(hours=1)); calls += 1
            if p == 'co' and SENSOR.get(sm[p], (None, None))[1] == 'µg/m³': s = s / 1000.0       # CPCB CO is mg/m3
            df.loc[s.index.intersection(df.index), i] = s.reindex(s.index.intersection(df.index)).values
        panel[p] = df
    pd.to_pickle(panel, panel_file)
    print(f'panel updated: {calls} sensor calls in {time.time()-t0:.0f}s')
    return panel

panel = update_panel(84 if not os.path.exists(panel_file) else 10)
last = panel['pm25'].dropna(how='all').index.max()
print('latest hour with any PM2.5:', last, '| now (IST):', pd.Timestamp.now(tz='Asia/Kolkata').tz_localize(None).floor('min'))

# HOW TO CHECK: first run about 5-6 minutes. The latest hour is normally within 2-4 hours of now (OpenAQ lags the stations a little).

# 4) wind: recent hours and the next 3 days from Open-Meteo (one request for all 37 stations, no key)
def fetch_wind():
    p = {'latitude': ','.join(f'{x:.4f}' for x in LAT), 'longitude': ','.join(f'{x:.4f}' for x in LON),
         'hourly': 'wind_speed_10m,wind_direction_10m', 'wind_speed_unit': 'ms', 'timezone': 'Asia/Kolkata', 'past_days': 4, 'forecast_days': 3}
    for k in range(4):
        r = requests.get('https://api.open-meteo.com/v1/forecast', params=p, timeout=90)
        if r.status_code == 200: break
        time.sleep(8 * (k + 1))
    r.raise_for_status()
    js = r.json(); js = js if isinstance(js, list) else [js]
    idx = pd.DatetimeIndex(js[0]['hourly']['time'])
    uv = np.zeros((len(idx), N, 2), dtype=np.float32)
    for i, j in enumerate(js):
        ws = np.array(j['hourly']['wind_speed_10m'], float); wd = np.deg2rad(np.array(j['hourly']['wind_direction_10m'], float) % 360)
        uv[:, i, 0], uv[:, i, 1] = np.nan_to_num(-ws * np.sin(wd)), np.nan_to_num(-ws * np.cos(wd))      # same convention as training
    return idx, uv
W_IDX, W_UV = fetch_wind()
print('wind hours:', W_IDX[0], '->', W_IDX[-1], '| mean speed', float(np.hypot(W_UV[..., 0], W_UV[..., 1]).mean()), 'm/s')

# HOW TO CHECK: the wind covers 4 days back and 3 days ahead. Mean speed about 1-3 m/s in Delhi.

# 5) cleaning, imputation, features and graph: the same recipe as training (notebooks 01, 03 and 15)
RANGES = {'pm2.5': (0, 1000), 'pm10': (0, 2000), 'no2': (0, 500), 'so2': (0, 500), 'co': (0, 50), 'o3': (0, 500), 'rh': (0, 100), 'at': (-10, 55)}
def geometry():
    dist = np.zeros((N, N)); du = np.zeros((N, N)); dv = np.zeros((N, N))
    for i in range(N):
        for j in range(N):
            if i != j:
                dist[i, j] = km(LAT[i], LON[i], LAT[j], LON[j])
                de = (LON[j] - LON[i]) * np.cos(np.radians(LAT[i])); dn = LAT[j] - LAT[i]; nr = np.hypot(de, dn)
                if nr > 0: du[i, j], dv[i, j] = de / nr, dn / nr
    return dist, du, dv, (dist > 0) & (dist <= THRESHOLD_KM)
DIST, DU, DV, WITHIN = geometry(); STATIC = WITHIN.astype(np.float32)

def impute(P, A):
    P = P.copy(); miss0 = np.isnan(P)
    valid = (~np.isnan(P)).astype(float); v0 = np.nan_to_num(P)
    num, den = v0 @ A.T, valid @ A.T
    P = np.where(np.isnan(P), np.where(den > 0, num / np.maximum(den, 1e-9), np.nan), P)                 # 1 neighbour mean
    with np.errstate(all='ignore'):
        cm = np.nanmean(P, axis=1, keepdims=True)
    P = np.where(np.isnan(P), np.broadcast_to(cm, P.shape), P)                                              # 2 city mean at that hour
    P = pd.DataFrame(P).interpolate(limit_direction='both').ffill().bfill().values                          # 3-4 interpolation, fill
    P = np.where(np.isnan(P), np.nanmedian(P) if np.isfinite(P).any() else 0.0, P)
    return P.astype(np.float32), miss0

def compute_At_vec(u, v, eps=1e-6):
    align = u[:, None] * DU + v[:, None] * DV
    A = np.where(WITHIN & (align > 0.0), align / (DIST + eps), 0.0).astype(np.float32)
    rs = A.sum(1, keepdims=True); rs[rs == 0] = 1.0
    return A / rs

cfg = json.load(open(os.path.join(MODEL_DIR, 'dynadv_final_config.json')))
FEATURE_COLS = cfg['feature_cols'][:26]; F = 26; F_IN = cfg['in_features']          # 26 base channels; the model adds adv_pm and adv_diff -> 28
assert cfg['feature_cols'][26:] == ['adv_pm', 'adv_diff'] and FEATURE_COLS == json.load(open(os.path.join(MODEL_DIR, 'v3_config.json')))['feature_cols'], 'feature list changed'
TIME_COLS = ['hour_sin', 'hour_cos', 'dow_sin', 'dow_cos', 'mon_sin', 'mon_cos', 'is_weekend']
FUT_IDX = [FEATURE_COLS.index(c) for c in TIME_COLS + ['u_wind', 'v_wind', 'wspd']]
feat_scaler = pickle.load(open(os.path.join(SCALER_DIR, 'v5_feature_scaler.pkl'), 'rb'))        # 30-channel scaler fit on the training period; this model uses channels 0-27
def scale(a): c = a.shape[-1]; return ((a - feat_scaler.mean_[:c]) / feat_scaler.scale_[:c]).astype(np.float32)
log_scaler = pickle.load(open(os.path.join(SCALER_DIR, 'v3_log_scaler.pkl'), 'rb'))
def from_log(a): return np.expm1(log_scaler.inverse_transform(a.reshape(-1, 1)).reshape(a.shape))
def to_log(a):   return log_scaler.transform(np.log1p(np.clip(a, 0, None)).reshape(-1, 1)).reshape(a.shape).astype(np.float32)

def calendar(idx):
    hh, dow, mon = idx.hour.values, idx.day_of_week.values, idx.month.values
    return {'hour_sin': np.sin(2*np.pi*hh/24), 'hour_cos': np.cos(2*np.pi*hh/24), 'dow_sin': np.sin(2*np.pi*dow/7), 'dow_cos': np.cos(2*np.pi*dow/7),
            'mon_sin': np.sin(2*np.pi*(mon-1)/12), 'mon_cos': np.cos(2*np.pi*(mon-1)/12), 'is_weekend': (dow >= 5).astype(float)}
print('recipe ready | features', F)

# upwind transport features (same function as notebook 28): for each station and hour, the PM2.5 of its upwind neighbours (within 12 km) taken at the
# lag equal to the travel time distance / wind speed (cap 6 h), weighted by the aligned wind component. Uses only values at or before hour t.
def transport_features(pm, uv, dist, du, dv, within):
    T_, n = pm.shape
    adv = pm.copy(); nb = pm.copy()
    src = np.arange(n)[:, None] * np.ones((1, n), dtype=int)
    stat = within.astype(float); cnt = stat.sum(0); has_nb = cnt > 0
    for t in range(T_):
        align = uv[t, :, 0][:, None] * du + uv[t, :, 1][:, None] * dv
        w = np.where(within & (align > 0), align / (dist + 1e-6), 0.0)
        wsum = w.sum(0); has = wsum > 0
        lag = np.clip(np.rint(dist / (np.maximum(align, 0.5) * 3.6)), 0, MAX_LAG).astype(int)
        vals = pm[np.clip(t - lag, 0, T_ - 1), src]
        adv[t, has] = ((w * vals).sum(0))[has] / wsum[has]
        nb[t, has_nb] = ((stat * pm[t][:, None]).sum(0))[has_nb] / cnt[has_nb]
    return adv, nb
print('transport features ready | model input channels', F_IN)

# model with three graph modes plus the learned blend, and optional context dropout at training time
CTX_COLS = ['city_mean_pm', 'city_max_pm', 'pm_minus_city']
CTX_IDX = [FEATURE_COLS.index(c) for c in CTX_COLS]
WSPD_IDX = FEATURE_COLS.index('wspd')
FUT_WSPD = 9                                  # wspd is the last of the 10 future channels (7 calendar + u, v, wspd)

class WATGCNv4(nn.Module):
    def __init__(self, in_features, hidden_dim, gru_layers, attn_heads, forecast_horizon, n_stations,
                 dropout=0.2, n_fut=10, gcn_hops=2, graph_mode='dynamic', static_adj=None):
        super().__init__()
        H = hidden_dim
        self.input_proj = nn.Linear(in_features, H)
        self.gcn_lin  = nn.ModuleList(nn.Linear(H, H) for _ in range(gcn_hops))
        self.gcn_norm = nn.ModuleList(nn.LayerNorm(H) for _ in range(gcn_hops))
        self.act = nn.ReLU()
        self.gru = nn.GRU(H, H, gru_layers, batch_first=True, dropout=dropout if gru_layers > 1 else 0.0)
        self.attn = nn.MultiheadAttention(H, attn_heads, dropout=dropout, batch_first=True)
        self.attn_norm = nn.LayerNorm(H)
        self.dropout = nn.Dropout(dropout)
        self.fut_enc = nn.Sequential(nn.Linear(n_fut, H), nn.ReLU(), nn.Linear(H, H))
        self.decoder = nn.Sequential(nn.Linear(H*3, H), nn.ReLU(), nn.Dropout(dropout), nn.Linear(H, 1))
        self.anchor_gate = nn.Parameter(torch.linspace(1.0, 0.3, forecast_horizon))
        self.H, self.FH, self.graph_mode = H, forecast_horizon, graph_mode
        sa = torch.eye(n_stations) if static_adj is None else torch.from_numpy(static_adj.astype('float32'))
        sa = sa.clone(); sa.fill_diagonal_(0)
        self.register_buffer('static_adj', sa, persistent=False)
        self.register_buffer('static_rn', sa / sa.sum(1, keepdim=True).clamp(min=1.0), persistent=False)   # row-normalised
        if graph_mode == 'blend':
            self.blend_a = nn.Parameter(torch.zeros(1)); self.blend_b = nn.Parameter(torch.zeros(1))

    @staticmethod
    def _n(A):
        return A / A.sum(-1, keepdim=True).clamp(min=1e-6)

    def alpha(self, speed):                       # speed: (B, steps) standardised wind speed -> weight of the wind graph
        return torch.sigmoid(self.blend_a + self.blend_b * speed)[..., None, None]

    def forward(self, X, At, Afc, Fut, Anchor):
        B, Tin, n, _ = X.shape; dev = X.device; I = torch.eye(n, device=dev)
        h = self.act(self.input_proj(X))
        if self.graph_mode == 'none':
            A = None
        elif self.graph_mode == 'dynamic':
            A = self._n(At + I.view(1, 1, n, n))
        elif self.graph_mode == 'static':
            A = self._n((self.static_adj + I).view(1, 1, n, n)).expand(B, Tin, n, n)
        else:                                      # blend
            a = self.alpha(X[..., WSPD_IDX].mean(-1))
            A = self._n(a * At + (1 - a) * self.static_rn.view(1, 1, n, n) + I.view(1, 1, n, n))
        for lin, nrm in zip(self.gcn_lin, self.gcn_norm):
            h = self.act(nrm(lin(h if A is None else torch.matmul(A, h)))) + h
        hf = h.permute(0, 2, 1, 3).reshape(B*n, Tin, self.H)
        gg, _ = self.gru(hf); gg = self.dropout(gg)
        aa, _ = self.attn(gg, gg, gg)
        ctx = self.attn_norm(aa + gg)[:, -1, :].reshape(B, n, self.H)
        ctx_rep = ctx.unsqueeze(1).expand(B, self.FH, n, self.H)
        if self.graph_mode == 'none':
            ctx_fc = ctx_rep
        elif self.graph_mode == 'dynamic':
            ctx_fc = torch.matmul(self._n(Afc + I.view(1, 1, n, n)), ctx_rep)
        elif self.graph_mode == 'static':
            ctx_fc = torch.matmul(self._n((self.static_adj + I).view(1, 1, n, n)), ctx_rep)
        else:
            af = self.alpha(Fut[..., FUT_WSPD].mean(-1))
            ctx_fc = torch.matmul(self._n(af * Afc + (1 - af) * self.static_rn.view(1, 1, n, n) + I.view(1, 1, n, n)), ctx_rep)
        resid = self.decoder(torch.cat([ctx_rep, ctx_fc, self.fut_enc(Fut)], dim=-1)).squeeze(-1)
        return resid + Anchor.unsqueeze(1) * self.anchor_gate.view(1, self.FH, 1)

# 6) the 5 final dyn_adv models (dynamic wind graph + upwind features), on CPU, and the scenario engine
SEEDS5 = cfg['seeds']
MODELS = []
for sd in SEEDS5:
    m = WATGCNv4(F_IN, cfg['hidden_dim'], cfg['gru_layers'], cfg['attn_heads'], HORIZON, N, cfg['dropout'], cfg['n_fut'], cfg['gcn_hops'],
                 graph_mode='dynamic', static_adj=STATIC).to(DEVICE)
    m.load_state_dict(torch.load(os.path.join(MODEL_DIR, f'watgcn_v5dyn_adv_seed{sd}.pt'), map_location=DEVICE)); m.eval(); MODELS.append(m)
print(f'{len(MODELS)} models loaded (seeds {SEEDS5})')

def aqi_category(v):
    return 'Good' if v <= 30 else 'Satisfactory' if v <= 60 else 'Moderate' if v <= 90 else 'Poor' if v <= 120 else 'Very Poor' if v <= 250 else 'Severe'

def build_ctx(panel):
    pm = panel['pm25']; n_map = sum(x is not None for x in LOC_ID)
    ok = pm.notna().sum(axis=1) >= MIN_FRESH_FRACTION * n_map
    H0 = ok[ok].index.max()                                            # the 'now' hour: latest hour with enough stations reporting
    idx = pd.date_range(H0 - pd.Timedelta(hours=71), H0, freq='h')     # 24 hours of warm-up for the rolling features + the 48-hour input
    P_obs = {}
    for p in PARAMS:
        f = TO_FEATURE[p]; P = panel[p].reindex(idx).reindex(columns=range(N)).values.astype(float)
        lo, hi = RANGES[f]; P_obs[f] = np.where((P >= lo) & (P < hi), P, np.nan)                  # range-clipped, NOT yet imputed (scenarios edit this)
    wpos = W_IDX.get_indexer(idx); assert (wpos >= 0).all(), 'wind does not cover the input hours'
    fidx = pd.date_range(H0 + pd.Timedelta(hours=1), periods=HORIZON, freq='h')
    fpos = W_IDX.get_indexer(fidx); assert (fpos >= 0).all(), 'wind forecast does not cover the next 24 hours'
    last_obs_h = {i: (None if not pm[i].notna().any() else float((H0 - pm[i].dropna().index.max()) / pd.Timedelta(hours=1))) for i in range(N)}
    return {'H0': H0, 'idx': idx, 'P_obs': P_obs, 'uv_h': W_UV[wpos], 'uv_f': W_UV[fpos], 'cal_f': calendar(fidx), 'n_map': n_map, 'last_obs_h': last_obs_h}

def impute_all(P_obs):
    raw, obs_mask = {}, None
    for f, P in P_obs.items():
        raw[f], miss = impute(P, STATIC)
        if f == 'pm2.5': obs_mask = ~miss
    return raw, obs_mask

def features26(raw, uv_h, idx):
    pmv = pd.DataFrame(raw['pm2.5'])
    der = {'pm_roll6_mean': pmv.rolling(6, min_periods=1).mean().values, 'pm_roll6_std': pmv.rolling(6, min_periods=1).std().fillna(0.0).values,
           'pm_roll24_mean': pmv.rolling(24, min_periods=1).mean().values, 'pm_roll24_std': pmv.rolling(24, min_periods=1).std().fillna(0.0).values,
           'pm_delta3': (pmv - pmv.shift(3)).fillna(0.0).values}
    cm = pmv.mean(axis=1).values[:, None]
    der['city_mean_pm'] = np.broadcast_to(cm, pmv.shape); der['city_max_pm'] = np.broadcast_to(pmv.max(axis=1).values[:, None], pmv.shape)
    der['pm_minus_city'] = pmv.values - cm
    for k, v in calendar(idx).items(): der[k] = np.broadcast_to(v[:, None], pmv.shape)
    X = np.zeros((len(idx), N, F), dtype=np.float32)
    for fi, col in enumerate(FEATURE_COLS):
        if col in raw: X[:, :, fi] = raw[col]
        elif col == 'u_wind': X[:, :, fi] = uv_h[..., 0]
        elif col == 'v_wind': X[:, :, fi] = uv_h[..., 1]
        elif col == 'wspd': X[:, :, fi] = np.hypot(uv_h[..., 0], uv_h[..., 1])
        else: X[:, :, fi] = der[col]
    return X

def run(ctx, mods=None):
    # one forecast for the live frame, with optional scenario edits; returns (5 seeds, 24, N) in ug/m3
    mods = mods or {}
    P_obs = {f: a.copy() for f, a in ctx['P_obs'].items()}
    if 'pm_scale' in mods: ids, fac = mods['pm_scale']; P_obs['pm2.5'][:, ids] *= fac                  # emission cut: scale the observed PM2.5 at those stations
    if 'offline' in mods:                                                                              # sensor outage: the station reports nothing, then gets imputed from neighbours
        for f in P_obs: P_obs[f][:, mods['offline']] = np.nan
    if 'dT' in mods: P_obs['at'] = P_obs['at'] + mods['dT']
    if 'dRH' in mods: P_obs['rh'] = np.clip(P_obs['rh'] + mods['dRH'], 0, 100)
    raw, _ = impute_all(P_obs)
    uv_h = ctx['uv_h']; uf, vf = ctx['uv_f'][..., 0] * mods.get('fscale', 1.0), ctx['uv_f'][..., 1] * mods.get('fscale', 1.0)
    if mods.get('fdir') == 'nw': sp = np.hypot(uf, vf); uf, vf = sp * 0.7071, -sp * 0.7071            # wind FROM the north-west
    elif mods.get('fdir') == 'rev': uf, vf = -uf, -vf
    uvf = np.stack([uf, vf], -1).astype(np.float32)
    X26 = features26(raw, uv_h, ctx['idx'])
    adv, _ = transport_features(raw['pm2.5'].astype(float), uv_h, DIST, DU, DV, WITHIN)
    X28 = np.concatenate([X26, adv[:, :, None].astype(np.float32), (adv - raw['pm2.5'])[:, :, None].astype(np.float32)], axis=2)
    Xs = scale(X28[-INPUT_WINDOW:]); uvi = uv_h[-INPUT_WINDOW:]
    At = np.stack([compute_At_vec(uvi[k, :, 0], uvi[k, :, 1]) for k in range(INPUT_WINDOW)])
    Afc = np.stack([compute_At_vec(uvf[k, :, 0], uvf[k, :, 1]) for k in range(HORIZON)])
    g = mods.get('graph')
    if g == 'none': At, Afc = np.zeros_like(At), np.zeros_like(Afc)                                    # no neighbours: the model adds only the self-loop
    elif g == 'static': At, Afc = np.broadcast_to(STATIC, At.shape).copy(), np.broadcast_to(STATIC, Afc.shape).copy()
    elif g == 'transpose': At, Afc = At.transpose(0, 2, 1).copy(), Afc.transpose(0, 2, 1).copy()      # information flows the other way along the same edges
    fut_raw = np.zeros((HORIZON, N, F), dtype=np.float32)
    for k, v in ctx['cal_f'].items(): fut_raw[:, :, FEATURE_COLS.index(k)] = v[:, None]
    fut_raw[:, :, FEATURE_COLS.index('u_wind')], fut_raw[:, :, FEATURE_COLS.index('v_wind')] = uvf[..., 0], uvf[..., 1]
    fut_raw[:, :, FEATURE_COLS.index('wspd')] = np.hypot(uvf[..., 0], uvf[..., 1])
    Fut = scale(fut_raw)[:, :, FUT_IDX]; anchor = to_log(raw['pm2.5'][-1])
    t = lambda a: torch.from_numpy(np.ascontiguousarray(a))[None].to(DEVICE)
    with torch.no_grad():
        outs = np.stack([m(t(Xs), t(At), t(Afc), t(Fut), t(anchor)).cpu().numpy()[0] for m in MODELS])          # (5, 24, N) log space
    return from_log(outs)

def scenario_list(ctx, cur):
    top = [int(i) for i in np.argsort(-cur)[:5]]
    # (key, label, group, edits, expected)  expected: 'neg' forecast falls | 'pos' rises | 'small' barely changes | None exploratory
    return [('wind_x0_25', 'Calm: wind x0.25', 'wind', {'fscale': 0.25}, 'pos'), ('wind_x0_5', 'Wind halved', 'wind', {'fscale': 0.5}, 'pos'),
            ('wind_x1_5', 'Wind x1.5', 'wind', {'fscale': 1.5}, 'neg'), ('wind_x2', 'Wind doubled', 'wind', {'fscale': 2.0}, 'neg'),
            ('wind_nw', 'NW inflow (stubble smoke)', 'wind', {'fdir': 'nw'}, 'small'), ('wind_rev', 'Wind reversed', 'wind', {'fdir': 'rev'}, 'small'),
            ('graph_off', 'Wind graph switched off', 'graph', {'graph': 'none'}, None), ('graph_static', 'Fixed distance graph instead of the wind graph', 'graph', {'graph': 'static'}, None),
            ('graph_flip', 'Wind graph direction flipped', 'graph', {'graph': 'transpose'}, None),
            ('cut_hotspots_30', 'Cut the 5 worst hotspots by 30%', 'emission', {'pm_scale': (top, 0.7)}, 'neg'), ('cut_city_20', 'Cut every station by 20%', 'emission', {'pm_scale': (list(range(N)), 0.8)}, 'neg'),
            ('offline_top1', 'Worst hotspot sensor offline', 'outage', {'offline': top[:1]}, 'small'), ('offline_top5', '5 worst hotspot sensors offline', 'outage', {'offline': top}, 'small'),
            ('temp_m5', '5 C colder', 'weather', {'dT': -5.0}, None), ('temp_p5', '5 C warmer', 'weather', {'dT': 5.0}, None), ('rh_p20', 'Humidity +20 points', 'weather', {'dRH': 20.0}, None)]

def check(expected, delta, base):
    if expected is None: return 'exploratory'
    ok = (delta < -1.0) if expected == 'neg' else (delta > 1.0) if expected == 'pos' else (abs(delta) <= 0.05 * base)
    return 'as expected' if ok else 'unexpected'

def forecast_now(panel):
    ctx = build_ctx(panel); H0 = ctx['H0']
    raw0, obs_mask = impute_all(ctx['P_obs'])
    P = run(ctx)                                                                                          # (5, 24, N) ug/m3
    base = P.mean(0)                                                                                      # (24, N)
    whatif = {'scenarios': [], 'cpcb_threshold': CPCB_THRESHOLD, 'mode': 'live', 'windows': {'0': {}}}
    for key, label, group, edits, expected in scenario_list(ctx, raw0['pm2.5'][-1]):
        pk = run(ctx, edits).mean(0); d = float(pk.mean() - base.mean())
        whatif['scenarios'].append({'key': key, 'label': label, 'group': group, 'mean_change': round(d, 1), 'stations_up': int((pk.mean(0) > base.mean(0)).sum()),
                                    'check': check(expected, d, float(base.mean()))})
        whatif['windows']['0'][key] = {'predicted_24h': np.round(pk).astype(int).T.tolist(), 'peak': np.round(pk.max(0)).astype(int).tolist(),
                                       'breach_h': [int(next((h + 1 for h, v_ in enumerate(pk[:, i]) if v_ > CPCB_THRESHOLD), 0)) for i in range(N)]}
    stations = []
    for i in range(N):
        mean = P[:, :, i].mean(0); p10, p90 = np.percentile(P[:, :, i], 10, axis=0), np.percentile(P[:, :, i], 90, axis=0)
        cur = float(raw0['pm2.5'][-1, i])
        stations.append({'station_id': i, 'current_pm25': round(cur, 1), 'current_aqi': aqi_category(cur), 'actual_24h': [],
                         'predicted_24h': [round(float(x), 1) for x in mean], 'peak_predicted': round(float(mean.max()), 1),
                         'hours_to_breach_cpcb': next((h + 1 for h, v in enumerate(mean) if v > CPCB_THRESHOLD), None),
                         'p10_24h': [round(float(x), 1) for x in p10], 'p90_24h': [round(float(x), 1) for x in p90],
                         'observed_now': bool(obs_mask[-1, i]), 'hours_since_last_observation': ctx['last_obs_h'][i]})
    meta = {'generated_at': pd.Timestamp.now(tz='Asia/Kolkata').strftime('%Y-%m-%d %H:%M:%S %Z'), 'now_hour': H0.strftime('%Y-%m-%d %H:%M'),
            'age_hours': round(float((pd.Timestamp.now(tz='Asia/Kolkata').tz_localize(None) - H0) / pd.Timedelta(hours=1)), 1),
            'stations_total': N, 'stations_mapped': ctx['n_map'], 'stations_observed_now': int(obs_mask[-1].sum()),
            'model': 'WA-TGCN dyn_adv, 5-seed ensemble (dynamic wind graph + upwind transport features), forecast wind from Open-Meteo',
            'sources': ['OpenAQ v3 hourly (CPCB network)', 'Open-Meteo forecast API (recent + forecast wind)'],
            'reference_test_rmse': 58.32,
            'notes': ['actual_24h is empty in live frames (the future is not known yet)',
                      'p10_24h / p90_24h are the 10th / 90th percentile across the 5 seeds (ensemble spread, not a calibrated interval)',
                      'training wind was ERA5 reanalysis; live wind is Open-Meteo recent analysis and forecast',
                      'reference_test_rmse is the Delhi test-period RMSE (ug/m3) of this model with a real day-old forecast wind (notebook 39)',
                      'what-if scenarios are model-sensitivity tests, not causal predictions; each carries a check field (as expected / unexpected / exploratory)']}
    if meta['stations_observed_now'] < 0.5 * N: meta['warning'] = 'fewer than half of the stations reported in the latest hour; forecasts lean on imputed values'
    if meta['age_hours'] > 6: meta['warning'] = 'latest data is more than 6 hours old'
    frame = {'window_idx': 0, 'mode': 'live', 'timestamp': H0.strftime('%Y-%m-%d %H:%M'), 'stations': stations}
    # live wind for the page: city-mean wind at the last observed hour and the mean forecast wind over the next 24 h (same convention as the replay data),
    # and the strongest wind links now (the hourly wind graph at the last observed hour)
    def wind_summary(uv):
        spd = float(np.hypot(uv[..., 0], uv[..., 1]).mean()); u, v = float(uv[..., 0].mean()), float(uv[..., 1].mean())
        return round(spd, 2), int(round(float(np.degrees(np.arctan2(-u, -v)) % 360))) % 360          # speed (m/s), direction the wind blows FROM (deg)
    s_, d_ = wind_summary(ctx['uv_h'][-1:]); fs_, fd_ = wind_summary(ctx['uv_f'])
    meta['wind_now'] = {'s': s_, 'd': d_, 'fs': fs_, 'fd': fd_}
    A_now = compute_At_vec(ctx['uv_h'][-1][:, 0], ctx['uv_h'][-1][:, 1])
    ii, jj = np.where(A_now > 0.03); ww = A_now[ii, jj]; keep = np.argsort(ww)[::-1][:120]
    meta['_edges'] = [[int(ii[k]), int(jj[k]), round(float(ww[k]), 3)] for k in keep]
    return frame, meta, whatif
print('forecast function and scenario engine ready:', len(scenario_list({}, np.arange(N, dtype=float))), 'scenarios')

# 7) one live cycle: top up the data, fetch wind, forecast, write the JSON files
PUBLISH_DIR = ARGS.publish_dir
def write_outputs(frame, meta, whatif):
    meta = dict(meta); edges = meta.pop('_edges', [])          # the wind links go to their own file
    json.dump(frame, open(os.path.join(LIVE_DIR, 'live_frame.json'), 'w'))
    json.dump([frame], open(os.path.join(LIVE_DIR, 'live_playback.json'), 'w'))
    json.dump(meta, open(os.path.join(LIVE_DIR, 'live_meta.json'), 'w'), indent=2)
    json.dump(whatif, open(os.path.join(LIVE_DIR, 'live_whatif.json'), 'w'), separators=(',', ':'))
    json.dump({'0': meta['wind_now']}, open(os.path.join(LIVE_DIR, 'live_wind_now.json'), 'w'), separators=(',', ':'))
    json.dump({'0': edges}, open(os.path.join(LIVE_DIR, 'live_wind_edges.json'), 'w'), separators=(',', ':'))
    log = os.path.join(LIVE_DIR, 'live_log.csv')
    pd.DataFrame([{'generated_at': meta['generated_at'], 'now_hour': meta['now_hour'], 'age_hours': meta['age_hours'],
                   'observed_now': meta['stations_observed_now'], 'mean_now': np.mean([s['current_pm25'] for s in frame['stations']]),
                   'mean_peak': np.mean([s['peak_predicted'] for s in frame['stations']])}]).to_csv(log, mode='a', header=not os.path.exists(log), index=False)
    if PUBLISH_DIR:
        import shutil
        os.makedirs(PUBLISH_DIR, exist_ok=True)
        for f in ('live_frame.json', 'live_meta.json', 'live_whatif.json', 'live_wind_now.json', 'live_wind_edges.json'):
            shutil.copy(os.path.join(LIVE_DIR, f), os.path.join(PUBLISH_DIR, f))




frame, meta, whatif = forecast_now(panel)
write_outputs(frame, meta, whatif)
cur = np.array([s['current_pm25'] for s in frame['stations']]); pk = np.array([s['peak_predicted'] for s in frame['stations']])
print(f"now_hour {meta['now_hour']} (age {meta['age_hours']} h) | stations observed now {meta['stations_observed_now']} of {N}")
print(f"mean PM2.5 now {cur.mean():.0f} ug/m3 | mean forecast peak next 24 h {pk.mean():.0f}")
print('scenarios:', len(whatif['scenarios']), '| unexpected:', [s['key'] for s in whatif['scenarios'] if s['check'] == 'unexpected'] or 'none')
print('written to', LIVE_DIR + (' and ' + PUBLISH_DIR if PUBLISH_DIR else ''))
