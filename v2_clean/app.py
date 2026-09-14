"""
EcoTwin — Wind-Aware Air Quality Digital Twin
================================================
Run:  streamlit run app.py

Needs the 'dashboard_export/' folder (stations.json, playback.json, summary.json,
optionally whatif.json and wind_edges.json) next to this file, produced by the
export notebooks (10_export_dashboard_v2 / 12_whatif_scenarios).

pip install streamlit streamlit-folium folium plotly
"""

import json
import os
from datetime import datetime, timedelta

import folium
import plotly.graph_objects as go
import streamlit as st
from folium.plugins import PolyLineTextPath
from streamlit_folium import st_folium

# =============================================================================
# CONFIG & DATA
# =============================================================================
st.set_page_config(
    page_title="EcoTwin — Delhi Air Quality Digital Twin",
    page_icon="🌫️",
    layout="wide",
    initial_sidebar_state="expanded",
)

EXPORT_DIR = os.path.join(os.path.dirname(__file__), "dashboard_export")

# palette (kept in sync with the CSS tokens below; used by plotly / folium / inline styles)
BG, PANEL, PANEL_2 = "#0B0E14", "#141A24", "#1A212D"
BORDER, HAIRLINE = "#28303D", "#1E2530"
INK, INK_DIM, INK_FAINT = "#E9ECF2", "#98A2B2", "#5E6A7A"
ACCENT = "#3DB4F2"
C_ACTUAL, C_FORECAST, C_SCENARIO = "#3DB4F2", "#F5924E", "#A78BFA"
C_GOOD, C_WARN, C_BAD = "#4ADE80", "#FBBF24", "#F0616D"

AQI_COLORS = {
    "Good": "#4ADE80", "Satisfactory": "#A3E635", "Moderate": "#FACC15",
    "Poor": "#FB923C", "Very Poor": "#F87171", "Severe": "#B91C1C",
}
AQI_ORDER = ["Good", "Satisfactory", "Moderate", "Poor", "Very Poor", "Severe"]


@st.cache_data
def load_data():
    with open(os.path.join(EXPORT_DIR, "stations.json")) as f:
        stations = json.load(f)
    with open(os.path.join(EXPORT_DIR, "playback.json")) as f:
        playback = json.load(f)
    with open(os.path.join(EXPORT_DIR, "summary.json")) as f:
        summary = json.load(f)
    whatif = None
    p = os.path.join(EXPORT_DIR, "whatif.json")
    if os.path.exists(p):
        with open(p) as f:
            whatif = json.load(f)
    wind_edges = None
    p = os.path.join(EXPORT_DIR, "wind_edges.json")
    if os.path.exists(p):
        with open(p) as f:
            wind_edges = json.load(f)
    return stations, playback, summary, whatif, wind_edges


try:
    stations, playback, summary, whatif, wind_edges = load_data()
except FileNotFoundError:
    st.error("`dashboard_export/` not found. Run the export notebook and place the folder next to app.py.")
    st.stop()

station_lookup = {s["id"]: s for s in stations}

# =============================================================================
# STYLE
# =============================================================================
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

:root {
  --bg:#0B0E14; --panel:#141A24; --panel-2:#1A212D;
  --border:#28303D; --hairline:#1E2530;
  --ink:#E9ECF2; --ink-dim:#98A2B2; --ink-faint:#5E6A7A;
  --accent:#3DB4F2;
}

/* hide Streamlit chrome, keep the sidebar toggle (collapse + expand) working */
header[data-testid="stHeader"] { background:transparent; }
#MainMenu, [data-testid="stToolbarActions"], [data-testid="stDecoration"],
[data-testid="stStatusWidget"], [data-testid="stAppDeployButton"], footer { display:none !important; }
[data-testid="stExpandSidebarButton"], [data-testid="stSidebarCollapseButton"] {
  display:inline-flex !important; visibility:visible !important; opacity:1 !important;
}

html, body, [class*="css"], [class*="st-"], .stApp * {
  font-family:'Inter', system-ui, -apple-system, sans-serif;
}
/* do not clobber Streamlit's Material icon font */
[data-testid="stIconMaterial"], .material-icons, .material-symbols-rounded,
span[translate="no"][class*="Icon"], [data-testid*="Icon"] {
  font-family:'Material Symbols Rounded','Material Symbols Outlined','Material Icons' !important;
}

.stApp { background:var(--bg); color:var(--ink); }
.block-container { padding:2.2rem 2.6rem 3rem; max-width:1500px; }
h1,h2,h3,h4 { font-family:'Space Grotesk', sans-serif; letter-spacing:-0.01em; }

/* hero */
.hero {
  border:1px solid var(--border); border-radius:14px; padding:1.5rem 1.8rem;
  background:linear-gradient(180deg, var(--panel) 0%, var(--panel-2) 100%);
  margin-bottom:1.4rem;
}
.hero h1 { font-size:1.75rem; font-weight:600; margin:0.55rem 0 0.3rem; color:#F4F6FB; }
.hero p  { color:var(--ink-dim); margin:0; font-size:0.92rem; }
.chips { display:flex; flex-wrap:wrap; gap:8px; }
.chip {
  font-family:'IBM Plex Mono', monospace; font-size:0.68rem; letter-spacing:0.06em;
  text-transform:uppercase; padding:4px 10px; border-radius:6px;
  background:rgba(61,180,242,0.10); border:1px solid rgba(61,180,242,0.28); color:var(--accent);
}

/* stat cards */
.stat { border:1px solid var(--border); border-radius:12px; padding:1rem 1.15rem; background:var(--panel); height:100%; }
.stat .k { font-size:0.66rem; letter-spacing:0.09em; text-transform:uppercase; color:var(--ink-faint); font-weight:600; margin-bottom:0.5rem; }
.stat .v { font-family:'IBM Plex Mono', monospace; font-size:1.7rem; font-weight:600; color:#F4F6FB; line-height:1; font-variant-numeric:tabular-nums; }
.stat .s { color:var(--ink-dim); font-size:0.72rem; margin-top:0.4rem; }

/* section label */
.section { font-size:0.7rem; text-transform:uppercase; letter-spacing:0.1em; color:var(--ink-faint); font-weight:600; margin:0.4rem 0 0.7rem; display:flex; align-items:center; gap:8px; }
.section::before { content:""; width:3px; height:12px; border-radius:2px; background:var(--accent); }

/* panel / station card */
.panel { border:1px solid var(--border); border-radius:12px; background:var(--panel); padding:1.1rem 1.2rem; }
.st-name { font-family:'Space Grotesk', sans-serif; font-size:1.15rem; font-weight:600; color:#F4F6FB; }
.st-when { font-family:'IBM Plex Mono', monospace; font-size:0.72rem; color:var(--ink-faint); margin-top:2px; }
.st-aqi  { padding:3px 10px; border-radius:6px; font-size:0.72rem; font-weight:600; }
.st-now  { font-family:'IBM Plex Mono', monospace; font-size:2rem; color:#F4F6FB; margin-top:0.5rem; font-variant-numeric:tabular-nums; }
.st-now span { font-size:0.9rem; color:var(--ink-faint); }

/* note cards */
.note { border-radius:10px; padding:0.7rem 0.95rem; margin-top:0.55rem; font-size:0.82rem; }
.note b { font-weight:600; }
.note .sub { color:var(--ink-dim); font-size:0.76rem; margin-top:2px; }
.note.bad  { background:rgba(240,97,109,0.08);  border:1px solid rgba(240,97,109,0.35); }
.note.scen { background:rgba(167,139,250,0.08); border:1px solid rgba(167,139,250,0.35); }
.note.ok   { background:rgba(74,222,128,0.07);  border:1px solid rgba(74,222,128,0.30); color:var(--ink-dim); }

/* alerts */
.alert { display:flex; justify-content:space-between; align-items:center; border:1px solid var(--border); border-left:3px solid #F0616D; border-radius:9px; padding:0.55rem 0.85rem; background:var(--panel); margin-bottom:7px; }
.alert .n { font-weight:500; color:var(--ink); font-size:0.86rem; }
.alert .t { font-family:'IBM Plex Mono', monospace; color:#F0616D; font-size:0.8rem; }

/* sidebar */
[data-testid="stSidebar"] { background:var(--panel-2); border-right:1px solid var(--border); }
.sb-h { font-family:'Space Grotesk', sans-serif; font-size:0.78rem; font-weight:600; text-transform:uppercase; letter-spacing:0.08em; color:var(--ink-dim); margin:1.1rem 0 0.5rem; }
.ts-pill { font-family:'IBM Plex Mono', monospace; font-size:0.82rem; color:var(--accent); text-align:center; background:var(--panel); border:1px solid var(--border); padding:7px 10px; border-radius:8px; margin-top:8px; }
.hz-row { display:flex; justify-content:space-between; font-size:0.78rem; color:var(--ink-dim); padding:2px 0; }
.hz-row .val { font-family:'IBM Plex Mono', monospace; color:var(--ink); }

/* footer */
.foot { color:var(--ink-faint); font-size:0.76rem; line-height:1.65; margin-top:0.5rem; }
.foot b { color:var(--ink-dim); }
hr { border-color:var(--hairline); }
</style>
""", unsafe_allow_html=True)

# =============================================================================
# HERO
# =============================================================================
_model = summary.get("model_name", "WA-TGCN").split(" (")[0]
st.markdown(f"""
<div class="hero">
  <div class="chips">
    <span class="chip">{_model}</span>
    <span class="chip">Wind-aware dynamic graph</span>
    <span class="chip">{summary['n_stations']} stations · Delhi</span>
  </div>
  <h1>EcoTwin — Air Quality Digital Twin</h1>
  <p>24-hour PM2.5 forecasting across Delhi's CPCB network · held-out test data the model never trained on</p>
</div>
""", unsafe_allow_html=True)

# =============================================================================
# STAT ROW
# =============================================================================
_stable = summary["rmse_by_regime"].get("Stable")
_stats = [
    ("Ensemble RMSE", f"{summary['rmse']:.1f}", "µg/m³ · mean over 24 h", "1.7rem"),
    ("R² score", f"{summary['r2']:.2f}", "variance explained", "1.7rem"),
    ("Stable-day RMSE", f"{_stable:.1f}", "µg/m³ · typical conditions", "1.7rem"),
    ("Test period", summary["test_period"], f"{summary['test_windows_total']:,} forecast windows", "1.0rem"),
]
for col, (k, v, s, vsize) in zip(st.columns(4), _stats):
    col.markdown(
        f'<div class="stat"><div class="k">{k}</div>'
        f'<div class="v" style="font-size:{vsize}">{v}</div>'
        f'<div class="s">{s}</div></div>',
        unsafe_allow_html=True,
    )

st.write("")

# =============================================================================
# SIDEBAR
# =============================================================================
st.sidebar.markdown('<div class="sb-h">Forecast time</div>', unsafe_allow_html=True)
st.sidebar.caption("Pick a moment from the held-out test period.")

_ts = [datetime.strptime(f["timestamp"], "%Y-%m-%d %H:%M") for f in playback]
_dmin, _dmax = min(_ts).date(), max(_ts).date()


@st.cache_data
def _window_errors():
    errs = []
    for f in playback:
        a = [v for s in f["stations"] for v in s["actual_24h"]]
        p = [v for s in f["stations"] for v in s["predicted_24h"]]
        errs.append((sum((x - y) ** 2 for x, y in zip(a, p)) / len(a)) ** 0.5)
    return errs


_errs = _window_errors()
_default_i = min(range(len(_errs)), key=lambda i: _errs[i])

_pick_date = st.sidebar.date_input(
    "Date", value=_ts[_default_i].date(),
    min_value=_dmin, max_value=_dmax, format="DD/MM/YYYY",
)
if isinstance(_pick_date, (list, tuple)):
    _pick_date = _pick_date[0]

_cand = [i for i, t in enumerate(_ts) if t.date() == _pick_date]
if not _cand:
    _ni = min(range(len(_ts)), key=lambda i: abs((_ts[i].date() - _pick_date).days))
    _cand = [i for i, t in enumerate(_ts) if t.date() == _ts[_ni].date()]
    st.sidebar.caption(f"No forecast on {_pick_date:%d %b %Y} — showing {_ts[_cand[0]]:%d %b %Y}")

_times = [_ts[i].strftime("%H:%M") for i in _cand]
_t_default = _ts[_default_i].strftime("%H:%M") if _default_i in _cand else _times[len(_times) // 2]
if len(_times) == 1:
    frame_idx = _cand[0]
    st.sidebar.caption(f"Forecast issued {_times[0]}")
else:
    _pick_t = st.sidebar.selectbox("Time", _times, index=_times.index(_t_default))
    frame_idx = _cand[_times.index(_pick_t)]
frame = playback[frame_idx]

st.sidebar.markdown(
    f'<div class="ts-pill">{frame["timestamp"]} &nbsp;·&nbsp; {frame_idx + 1}/{len(playback)}</div>',
    unsafe_allow_html=True,
)

# wind what-if
scenario_key = "baseline"
_pick = "Off"
if whatif is not None:
    st.sidebar.markdown('<div class="sb-h">Wind scenario</div>', unsafe_allow_html=True)
    st.sidebar.caption("Re-forecast under a different wind field.")
    _opts = whatif["scenarios"]
    _labels = ["Off"] + [o["label"] for o in _opts]
    _pick = st.sidebar.radio("scenario", _labels, label_visibility="collapsed")
    if _pick != "Off":
        scenario_key = next(o["key"] for o in _opts if o["label"] == _pick)

# airshed graph toggle
show_wind = False
if wind_edges is not None:
    st.sidebar.markdown('<div class="sb-h">Airshed graph</div>', unsafe_allow_html=True)
    show_wind = st.sidebar.checkbox("Show wind coupling A(t)", value=False)
    st.sidebar.caption("Arrows point downwind — station → station it feeds.")

st.sidebar.markdown('<div class="sb-h">AQI scale</div>', unsafe_allow_html=True)
st.sidebar.markdown(
    "".join(
        f'<div style="display:flex;align-items:center;gap:7px;font-size:0.78rem;color:var(--ink-dim);'
        f'padding:2px 0;"><span style="width:9px;height:9px;border-radius:2px;'
        f'background:{AQI_COLORS[c]};display:inline-block;"></span>{c}</div>'
        for c in AQI_ORDER
    ),
    unsafe_allow_html=True,
)

st.sidebar.markdown('<div class="sb-h">Error by horizon</div>', unsafe_allow_html=True)
st.sidebar.markdown(
    "".join(
        f'<div class="hz-row"><span>{hl}</span><span class="val">{v:.1f}</span></div>'
        for hl, v in list(summary["rmse_by_horizon"].items())[::5]
    ),
    unsafe_allow_html=True,
)

# =============================================================================
# STATE
# =============================================================================
if "selected_station" not in st.session_state:
    st.session_state.selected_station = max(frame["stations"], key=lambda s: s["current_pm25"])["station_id"]

frame_by_station = {s["station_id"]: s for s in frame["stations"]}

# =============================================================================
# MAIN — map + detail
# =============================================================================
map_col, detail_col = st.columns([1.45, 1], gap="large")

with map_col:
    st.markdown('<div class="section">Station map</div>', unsafe_allow_html=True)

    center_lat = sum(s["lat"] for s in stations) / len(stations)
    center_lon = sum(s["lon"] for s in stations) / len(stations)

    m = folium.Map(location=[center_lat, center_lon], zoom_start=10, tiles=None, zoom_control=False)
    folium.TileLayer(
        tiles="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
        attr="&copy; Stadia Maps · OpenMapTiles · OpenStreetMap",
        name="dark", control=False,
    ).add_to(m)

    # wind coupling A(t) — under the station markers
    if show_wind and wind_edges is not None:
        _edges = wind_edges.get(str(frame["window_idx"]), [])[:45]
        _wmax = max((w for _, _, w in _edges), default=1.0)
        for i, j, w in _edges:
            a, b = station_lookup[i], station_lookup[j]
            rel = w / _wmax
            pl = folium.PolyLine(
                [[a["lat"], a["lon"]], [b["lat"], b["lon"]]],
                color=ACCENT, weight=0.7 + 2.0 * rel, opacity=0.14 + 0.42 * rel,
            )
            pl.add_to(m)
            PolyLineTextPath(
                pl, "  ➤  ", repeat=True, offset=3.5,
                attributes={"fill": ACCENT, "font-size": "9", "opacity": "0.55"},
            ).add_to(m)

    for st_meta in stations:
        sid = st_meta["id"]
        sdata = frame_by_station[sid]
        color = AQI_COLORS[sdata["current_aqi"]]
        is_sel = sid == st.session_state.selected_station
        folium.CircleMarker(
            location=[st_meta["lat"], st_meta["lon"]],
            radius=10 if is_sel else 6.5,
            color="#FFFFFF" if is_sel else color,
            weight=2.5 if is_sel else 1,
            fill=True, fill_color=color, fill_opacity=0.9,
            popup=folium.Popup(
                f"<b>{st_meta['name']}</b><br>PM2.5 {sdata['current_pm25']} µg/m³<br>{sdata['current_aqi']}",
                max_width=200,
            ),
            tooltip=st_meta["name"],
        ).add_to(m)

    map_result = st_folium(m, height=520, width=None, returned_objects=["last_object_clicked_tooltip"])
    if map_result and map_result.get("last_object_clicked_tooltip"):
        match = next((s for s in stations if s["name"] == map_result["last_object_clicked_tooltip"]), None)
        if match:
            st.session_state.selected_station = match["id"]

with detail_col:
    sid = st.session_state.selected_station
    sname = station_lookup[sid]["name"]
    sdata = frame_by_station[sid]
    ac = AQI_COLORS[sdata["current_aqi"]]
    _now = _ts[frame_idx]

    st.markdown('<div class="section">Selected station</div>', unsafe_allow_html=True)
    st.markdown(f"""
    <div class="panel">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div class="st-name">{sname}</div>
          <div class="st-when">{_now:%d %b %Y, %H:%M}</div>
        </div>
        <span class="st-aqi" style="background:{ac}22;border:1px solid {ac};color:{ac};">{sdata['current_aqi']}</span>
      </div>
      <div class="st-now">{sdata['current_pm25']}<span> µg/m³ now</span></div>
    </div>
    """, unsafe_allow_html=True)

    hours = [_now + timedelta(hours=h) for h in range(1, 25)]
    _hover = "%{x|%d %b %H:%M}<br>%{y:.0f} µg/m³<extra></extra>"
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=hours, y=sdata["actual_24h"], name="Actual",
        line=dict(color=C_ACTUAL, width=2.4), mode="lines+markers", marker=dict(size=4),
        hovertemplate=_hover,
    ))
    _base_name = "Forecast" if scenario_key == "baseline" else "Forecast — current wind"
    fig.add_trace(go.Scatter(
        x=hours, y=sdata["predicted_24h"], name=_base_name,
        line=dict(color=C_FORECAST, width=2.4, dash="dash"), mode="lines+markers", marker=dict(size=4),
        hovertemplate=_hover,
    ))

    scen_series = None
    if whatif is not None and scenario_key != "baseline":
        _w = whatif["windows"].get(str(frame["window_idx"]))
        if _w is not None:
            scen_series = _w[scenario_key]["predicted_24h"][sid]
            fig.add_trace(go.Scatter(
                x=hours, y=scen_series, name=f"Forecast — {_pick}",
                line=dict(color=C_SCENARIO, width=2.4), mode="lines+markers", marker=dict(size=4),
                hovertemplate=_hover,
            ))

    fig.add_hline(y=summary["cpcb_threshold"], line_dash="dot", line_color=C_WARN,
                  annotation_text="CPCB 24 h limit", annotation_font_color=C_WARN, annotation_font_size=10)
    fig.update_layout(
        height=300, margin=dict(l=8, r=8, t=26, b=8),
        paper_bgcolor=PANEL, plot_bgcolor=PANEL,
        font=dict(color=INK_DIM, family="Inter", size=11),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, x=0, font=dict(size=10)),
        xaxis=dict(title=None, gridcolor=HAIRLINE, zeroline=False, tickformat="%H:%M",
                   dtick=4 * 3600 * 1000, tickangle=0),
        yaxis=dict(title="PM2.5 µg/m³", gridcolor=HAIRLINE, zeroline=False),
    )
    st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})

    if sdata["hours_to_breach_cpcb"] is not None:
        st.markdown(
            f'<div class="note bad"><b style="color:{C_BAD};">Predicted CPCB breach in '
            f'{sdata["hours_to_breach_cpcb"]} h</b>'
            f'<div class="sub">Peak forecast {sdata["peak_predicted"]} µg/m³</div></div>',
            unsafe_allow_html=True,
        )

    if scen_series is not None:
        _dpeak = round(max(scen_series) - sdata["peak_predicted"], 1)
        _b = whatif["windows"][str(frame["window_idx"])][scenario_key]["breach_h"][sid]
        _btxt = f"breach in {_b} h" if _b else "no breach predicted"
        st.markdown(
            f'<div class="note scen"><b style="color:{C_SCENARIO};">{_pick}</b>'
            f'<div class="sub">Peak {"+" if _dpeak >= 0 else ""}{_dpeak} µg/m³ vs current wind · {_btxt}</div></div>',
            unsafe_allow_html=True,
        )

# =============================================================================
# ALERTS
# =============================================================================
st.markdown('<div class="section" style="margin-top:1.4rem;">Active alerts — this window</div>', unsafe_allow_html=True)

alerts = sorted(
    [s for s in frame["stations"] if s["hours_to_breach_cpcb"] is not None],
    key=lambda s: s["hours_to_breach_cpcb"],
)
if not alerts:
    st.markdown('<div class="note ok">No CPCB threshold breaches predicted in the next 24 h.</div>',
                unsafe_allow_html=True)
else:
    a_cols = st.columns(3)
    for i, a in enumerate(alerts[:9]):
        a_cols[i % 3].markdown(
            f'<div class="alert"><span class="n">{station_lookup[a["station_id"]]["name"]}</span>'
            f'<span class="t">+{a["hours_to_breach_cpcb"]} h</span></div>',
            unsafe_allow_html=True,
        )
    if len(alerts) > 9:
        st.caption(f"+ {len(alerts) - 9} more stations with predicted breaches")

# =============================================================================
# FOOTER
# =============================================================================
st.markdown("---")
st.markdown("""
<div class="foot">
<b>EcoTwin</b> forecasts come from <b>WA-TGCN</b> (Wind-Aware Temporal Graph Convolutional Network):
a spatio-temporal graph model whose adjacency matrix A(t) is recomputed each hour from wind
direction and speed, so a station only influences a downwind neighbour. The v2 model adds a second
wind-aware graph over the 24 forecast hours, rolling-volatility and regional-context features, and a
volatility-weighted training loss. All forecasts shown are genuine model output on held-out test data.
</div>
""", unsafe_allow_html=True)
