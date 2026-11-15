"""Build the frontend data files for the FINAL model (dyn_adv) from the saved result files.

Reads : v2_clean/dashboard_export_dynadv/*  (notebook 43)  and  ecotwin_outputs/results/*.json
Writes: frontend/public/data/{stations,summary,whatif,model_card,wind_now,calibration}.json + playback/ wind_edges/ whatif/ explain/
        (whatif.json is trimmed to the scenarios listed in KEEP; the stale v2 baselines files are removed)

Run from anywhere:  python make_frontend_data.py
Nothing is trained and nothing in ecotwin_outputs is changed.
"""
import json, os, shutil
import numpy as np

BASE = r"D:\FYP\Eco-Twin"
V2 = os.path.join(BASE, "v2_clean")
SRC = os.path.join(V2, "dashboard_export_dynadv")
RES = os.path.join(V2, "ecotwin_outputs", "results")
DST = os.path.join(BASE, "frontend", "public", "data")

# the ten validated scenarios (notebook 43: wind speed, NW inflow, wind graph off, emission cuts, outages)
KEEP = ["wind_x0_25", "wind_x0_5", "wind_x1_5", "wind_x2", "wind_nw",
        "graph_off", "cut_hotspots_30", "cut_city_20", "offline_top1", "offline_top5"]

def load(p): return json.load(open(p, encoding="utf-8"))
def r2(x): return round(float(x), 2)
def r4(x): return round(float(x), 4)

fm = load(os.path.join(RES, "dynadv_final_metrics.json"))
integ = load(os.path.join(RES, "v3_integration.json"))["results"]       # real day-old forecast wind: none / static / dynamic, 5 seeds
v7 = load(os.path.join(RES, "v7_realfc_delhi.json"))["test"]             # none_adv_fc etc.
lat = load(os.path.join(RES, "baselines_metrics.json"))["latency_ms_per_window"]
summary = load(os.path.join(SRC, "summary.json"))

fin = fm["overall"]["forecast"]["test"]; pers = fm["persistence"]
reg_f, reg_p = fm["by_volatility"]["forecast"], fm["by_volatility"]["persistence"]
hz_f, hz_p = fm["by_horizon"]["forecast"], fm["by_horizon"]["persistence"]

def row(key, model, ours, m, regimes, latency, notes):
    return {"key": key, "model": model, "isOurs": ours, "rmse": r2(m["rmse"]), "mae": r2(m["mae"]), "r2": r4(m["r2"]),
            "stable": None if regimes is None else r2(regimes["Stable"]), "moderate": None if regimes is None else r2(regimes["Moderate"]),
            "volatile": None if regimes is None else r2(regimes["Volatile"]), "latency": latency, "notes": notes}

benchmarks = [
    row("final", "WA-TGCN final model (wind graph + upwind feature)", True, fin, reg_f, f"{lat['dynamic']:.2f} ms",
        "Hourly wind graph A(t) + upwind transport feature; trained on actual wind, run on a real day-old forecast wind; 5-seed ensemble"),
    row("none_adv_fc", "Graph-free + upwind feature", False, v7["none_adv_fc"], None, f"{lat['none']:.2f} ms",
        "No graph; same upwind feature and forecast wind; the best graph-free score"),
    row("none", "Graph-free (temporal GRU + attention)", False, integ["none"]["ens"], integ["none"]["by_volatility"], f"{lat['none']:.2f} ms",
        "No spatial graph; stations modelled independently; real forecast wind"),
    row("static", "Static-GCN (fixed 12 km graph)", False, integ["static"]["ens"], integ["static"]["by_volatility"], f"{lat['static']:.2f} ms",
        "Fixed distance graph without wind awareness; real forecast wind"),
    row("dynamic", "Wind graph, no upwind feature", False, integ["dynamic"]["ens"], integ["dynamic"]["by_volatility"], f"{lat['dynamic']:.2f} ms",
        "Hourly wind graph A(t) and forecast graph, trained and run on the forecast wind"),
    row("persistence", "Persistence (last value repeated)", False, pers, reg_p, "<0.01 ms",
        "Last observed PM2.5 carried forward across all 24 horizons"),
]
static_rmse, none_rmse = integ["static"]["ens"]["rmse"], integ["none"]["ens"]["rmse"]

card = {
    "model_label": "WA-TGCN final model", "seeds": 5, "setting": "real day-old forecast wind",
    "test_period": summary["test_period"], "test_windows": summary["test_windows_total"], "stations": summary["n_stations"],
    "overall": {"rmse": r2(fin["rmse"]), "mae": r2(fin["mae"]), "r2": r4(fin["r2"])},
    "perfect_wind": {k: r2(v) if k != "r2" else r4(v) for k, v in fm["overall"]["perfect"]["test"].items()},
    "persistence": {"rmse": r2(pers["rmse"]), "mae": r2(pers["mae"]), "r2": r4(pers["r2"])},
    "rmse_by_horizon": {k: r2(v) for k, v in hz_f.items()}, "persistence_by_horizon": {k: r2(v) for k, v in hz_p.items()},
    "rmse_by_regime": {k: r2(v) for k, v in reg_f.items()}, "persistence_by_regime": {k: r2(v) for k, v in reg_p.items()},
    "regime_share": {"Stable": "33%", "Moderate": "33%", "Volatile": "34%"},
    "improvement_vs_persistence_pct": round(100 * (pers["rmse"] - fin["rmse"]) / pers["rmse"], 1),
    "gap_vs_static_ugm3": r2(static_rmse - fin["rmse"]), "gap_vs_graph_free_ugm3": r2(none_rmse - fin["rmse"]),
    "latency_ms_per_model": r2(lat["dynamic"]),
    "benchmarks": benchmarks,
    "note": ("Final-model scores use a real day-old forecast wind for the 24 future hours; with the actual future wind the RMSE is "
             f"{r2(fm['overall']['perfect']['test']['rmse'])}. Baseline rows are 5-seed ensembles on the same test windows with the same forecast wind. "
             "Differences between the graph variants are within seed noise (about 1 ug/m3)."),
}

# ---- files
os.makedirs(DST, exist_ok=True)
for f in ("stations.json", "summary.json"):
    shutil.copy(os.path.join(SRC, f), os.path.join(DST, f))

# wind links: one small file per window (about 1.5 KB) instead of one 1.5 MB file the browser must load in full
edges = load(os.path.join(SRC, "wind_edges.json"))
edir = os.path.join(DST, "wind_edges")
if os.path.isdir(edir): shutil.rmtree(edir)
os.makedirs(edir)
for w, e in edges.items():
    json.dump(e, open(os.path.join(edir, f"{w}.json"), "w"), separators=(",", ":"))
if os.path.exists(os.path.join(DST, "wind_edges.json")): os.remove(os.path.join(DST, "wind_edges.json"))

# playback: one small file per window (about 17 KB) plus an index, so a browser only fetches the window it shows
pbdir = os.path.join(DST, "playback")
if os.path.isdir(pbdir): shutil.rmtree(pbdir)
os.makedirs(pbdir)
frames = load(os.path.join(SRC, "playback.json"))
for fr in frames:
    json.dump(fr, open(os.path.join(pbdir, f"{fr['window_idx']}.json"), "w"), separators=(",", ":"))
json.dump({"windows": [fr["window_idx"] for fr in frames], "timestamps": [fr["timestamp"] for fr in frames]},
          open(os.path.join(pbdir, "index.json"), "w"), separators=(",", ":"))

wf = load(os.path.join(SRC, "whatif.json"))
wf["scenarios"] = [s for s in wf["scenarios"] if s["key"] in KEEP]
assert [s["key"] for s in wf["scenarios"]] == KEEP, "a kept scenario is missing from the export"
wdir = os.path.join(DST, "whatif")
if os.path.isdir(wdir): shutil.rmtree(wdir)
os.makedirs(wdir)
for w, per in wf["windows"].items():
    json.dump({k: {"predicted_24h": per[k]["predicted_24h"], "breach_h": per[k]["breach_h"]} for k in KEEP},
              open(os.path.join(wdir, f"{w}.json"), "w"), separators=(",", ":"))
json.dump({"scenarios": wf["scenarios"], "cpcb_threshold": wf["cpcb_threshold"], "windows": [int(w) for w in wf["windows"]]},
          open(os.path.join(wdir, "index.json"), "w"), separators=(",", ":"))
json.dump(card, open(os.path.join(DST, "model_card.json"), "w"), indent=1)

# ---- calibration table (notebook 44): per-horizon quantiles of the log-ratio error on the validation windows
cal = load(os.path.join(RES, "dynadv_calibration.json"))
cal_out = {"method": cal["method"], "levels_percent": cal["levels_percent"], "quantiles": cal["quantiles"],
           "validation_windows": cal["validation_windows"], "test_windows": cal["test_windows"],
           "test_coverage_80": round(float(np.mean(cal["test_coverage"]["cal80"])), 3),
           "test_coverage_95": round(float(np.mean(cal["test_coverage"]["cal95"])), 3),
           "breach_threshold": cal["breach"]["threshold"]}
json.dump(cal_out, open(os.path.join(DST, "calibration.json"), "w"), separators=(",", ":"))

# ---- wind at each playback window: city-mean observed wind at the "now" hour and the mean forecast wind over the next 24 h
#      s = mean station wind speed (m/s), d = direction the wind blows FROM (degrees, 0 = north, 90 = east), f* = same for the next 24 h
era5 = np.load(os.path.join(V2, "openmeteo_reanalysis_uv.npy")).astype(np.float64)       # (T, N, 2), u/v = direction the air moves TOWARD
fcw = np.load(os.path.join(V2, "openmeteo_prevday1_uv.npy")).astype(np.float64)
T_ = era5.shape[0]; val_end = int(T_ * 0.85); IN = 48
def wind_summary(uv):                                                                    # uv: (hours, N, 2)
    spd = float(np.hypot(uv[..., 0], uv[..., 1]).mean())
    u, v = float(uv[..., 0].mean()), float(uv[..., 1].mean())
    frm = float(np.degrees(np.arctan2(-u, -v)) % 360)                                    # meteorological "from" direction
    return round(spd, 2), int(round(frm)) % 360
wind_now = {}
for k in frames:                                                                          # the playback frames loaded above
    w = int(k["window_idx"]); g = val_end + w
    s_, d_ = wind_summary(era5[g + IN - 1: g + IN])
    fs_, fd_ = wind_summary(fcw[g + IN: g + IN + 24])
    wind_now[str(w)] = {"s": s_, "d": d_, "fs": fs_, "fd": fd_}
json.dump(wind_now, open(os.path.join(DST, "wind_now.json"), "w"), separators=(",", ":"))

# ---- real explainability (notebook 42), one small file per window so a browser only fetches the window it shows (about 9 KB each)
#      explain/index.json : the eight players, the layout and the list of windows
#      explain/<window>.json : "r" = per station [baseline, forecast_mean, impact of each player in order] (ug/m3, mean 24 h forecast),
#                              "a" = per station the 48 attention weights (oldest hour first) x 10000, averaged over heads and the 5 seeds
ex = load(os.path.join(V2, "frontend_export_dynadv", "explain_windows.json"))
players = ex["groups"]
exdir = os.path.join(DST, "explain")
if os.path.isdir(exdir): shutil.rmtree(exdir)
os.makedirs(exdir)
for w in ex["windows"]:
    rows = sorted(w["stations"], key=lambda r: r["station_id"])
    json.dump({"r": [[r["baseline"], r["forecast_mean"]] + [r["impacts"][g] for g in players] for r in rows], "a": [r["attention_1e4"] for r in rows]},
              open(os.path.join(exdir, f"{w['window_idx']}.json"), "w"), separators=(",", ":"))
json.dump({"players": players, "windows": [w["window_idx"] for w in ex["windows"]],
           "layout": "per window file: r = rows per station [baseline, forecast_mean, impact per player (players order)] in ug/m3 on the mean 24 h forecast; a = 48 attention weights x 10000 per station"},
          open(os.path.join(exdir, "index.json"), "w"), separators=(",", ":"))

for f in ("baselines_metrics.json", "v2_metrics.json", "playback.json", "whatif.json"):                    # stale v2 files; no code reads them after this change
    p = os.path.join(DST, f)
    if os.path.exists(p): os.remove(p)

for f in sorted(os.listdir(DST)):
    q = os.path.join(DST, f)
    if os.path.isdir(q):
        sizes = [os.path.getsize(os.path.join(q, g)) for g in os.listdir(q)]
        print(f"{f + '/':20}{sum(sizes) / 1e6:8.1f} MB total, {len(sizes)} files, largest {max(sizes) / 1e3:.0f} KB")
    else:
        print(f"{f:20}{os.path.getsize(q) / 1e6:8.1f} MB")
print("card:", card["overall"], "| vs persistence", card["improvement_vs_persistence_pct"], "% | vs static", card["gap_vs_static_ugm3"], "| vs graph-free", card["gap_vs_graph_free_ugm3"])
