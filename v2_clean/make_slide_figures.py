r"""Figures for the Phase II presentation (slides 13 and 14), built only from saved result files.

Run from v2_clean:  python make_slide_figures.py
Writes PNG (200 dpi) and PDF into v2_clean/ppt_figures/:
  S13_configuration_comparison   version progression + graph ablation (numbers of slide 13)
  S14_forecast_vs_actual         actual PM2.5 against the +6 h and +24 h forecasts over four days (city mean)
The figures already in ecotwin_outputs/plots/report (horizon, regime, scenarios, Shapley) are copied next to them by this script.
"""
import json, os, shutil
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

HERE = os.path.dirname(os.path.abspath(__file__))
RES = os.path.join(HERE, "ecotwin_outputs", "results")
OUT = os.path.join(HERE, "ppt_figures")
os.makedirs(OUT, exist_ok=True)

NAVY, TEAL, GOLD, GREY, RED = "#1F3A5F", "#2A9D8F", "#C8921A", "#8B8F98", "#C0392B"
plt.rcParams.update({"font.size": 13, "axes.spines.top": False, "axes.spines.right": False, "axes.titlesize": 14, "axes.titleweight": "bold"})

def load(name):
    return json.load(open(os.path.join(RES, name), encoding="utf-8"))

def save(fig, name):
    fig.savefig(os.path.join(OUT, name + ".png"), dpi=200, bbox_inches="tight")
    fig.savefig(os.path.join(OUT, name + ".pdf"), bbox_inches="tight")
    plt.close(fig)
    print("wrote", name)

# ------------------------------------------------------------------ slide 13: configurations
card = json.load(open(os.path.join(HERE, "..", "frontend", "public", "data", "model_card.json"), encoding="utf-8"))
bm = {b["key"]: b for b in card["benchmarks"]}
fin = load("dynadv_final_metrics.json")
v1 = load("final_metrics.json")["rmse"]
v2 = load("v2_metrics.json")["rmse"]
v3 = load("v3_metrics.json")["rmse"]
oracle = fin["overall"]["perfect"]["test"]["rmse"]
seeds = fin["per_seed_test_rmse_forecast"]

rows = [  # label, rmse, colour, hatched (uses actual future wind, so not available live)
    ("Persistence (copy last value)", bm["persistence"]["rmse"], GREY, False),
    ("WA-TGCN v1 (14 features, 1 hop)", v1, GREY, False),
    ("WA-TGCN v2 (26 features)", v2, GREY, False),
    ("WA-TGCN v3, actual future wind", v3, TEAL, True),
    ("Graph-free + upwind features", bm["none_adv_fc"]["rmse"], TEAL, False),
    ("dyn_adv, actual future wind", oracle, NAVY, True),
    ("EcoTwin (dyn_adv), day-old forecast wind", bm["final"]["rmse"], NAVY, False),
]
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5.6), gridspec_kw={"width_ratios": [1.25, 1]})
y = np.arange(len(rows))[::-1]
for yi, (lab, v, c, hatch) in zip(y, rows):
    ax1.barh(yi, v, color=c, hatch="//" if hatch else None, edgecolor="white" if hatch else c, alpha=0.9 if not hatch else 0.55)
    ax1.text(v + 1.0, yi, f"{v:.2f}", va="center", fontsize=12)
ax1.set_yticks(y)
ax1.set_yticklabels([r[0] for r in rows])
ax1.set_xlim(0, 100)
ax1.set_xlabel("Test RMSE (µg/m³), lower is better")
ax1.set_title("Version progression (axis starts at 0)")
fig.text(0.02, -0.02, "Hatched bars use the actual future wind: an upper bound that is not available live.", fontsize=11, color="#444")

abl = [
    ("No graph", bm["none"]["rmse"], TEAL),
    ("Fixed 12 km graph", bm["static"]["rmse"], GOLD),
    ("Wind graph (v3)", bm["dynamic"]["rmse"], RED),
    ("Graph-free + upwind", bm["none_adv_fc"]["rmse"], TEAL),
    ("EcoTwin: wind graph + upwind", bm["final"]["rmse"], NAVY),
]
ax2.axhspan(min(seeds), max(seeds), color=GREY, alpha=0.18, lw=0)
ax2.text(len(abl) - 0.5, max(seeds) + 0.08, f"single-seed EcoTwin models: {min(seeds):.1f} to {max(seeds):.1f}", ha="right", fontsize=10, color="#444")
for i, (lab, v, c) in enumerate(abl):
    ax2.scatter(i, v, s=150, color=c, zorder=3)
    ax2.text(i, v - 0.22, f"{v:.2f}", ha="center", va="top", fontsize=12)
ax2.set_xticks(range(len(abl)))
ax2.set_xticklabels([a[0] for a in abl], rotation=20, ha="right")
ax2.set_ylim(56.6, 62.0)
ax2.set_ylabel("Test RMSE (µg/m³)")
ax2.set_title("Graph ablation, real forecast wind (axis zoomed)")
spread_graph = max(a[1] for a in abl) - min(a[1] for a in abl)
ax2.text(0.02, 0.03, f"Graph choices differ by {spread_graph:.1f} µg/m³ at most; the seeds of one model differ by {max(seeds) - min(seeds):.1f}",
         transform=ax2.transAxes, fontsize=10.5, color="#444")
fig.tight_layout()
save(fig, "S13_configuration_comparison")

# ------------------------------------------------------------------ slide 14: forecast against actual
pb = json.load(open(os.path.join(HERE, "dashboard_export_dynadv", "playback.json"), encoding="utf-8"))
t0 = [pd.Timestamp(f["timestamp"]) for f in pb]
act = {}                      # target time -> city-mean actual
f6, f24 = {}, {}              # target time -> city-mean forecast made 6 h / 24 h earlier
for t, f in zip(t0, pb):
    a = np.mean([s["actual_24h"] for s in f["stations"]], axis=0)
    p = np.mean([s["predicted_24h"] for s in f["stations"]], axis=0)
    for k in range(24):
        act[t + pd.Timedelta(hours=k + 1)] = a[k]
    f6[t + pd.Timedelta(hours=6)] = p[5]
    f24[t + pd.Timedelta(hours=24)] = p[23]
s_act = pd.Series(act).sort_index()
s6_all, s24_all = pd.Series(f6).sort_index(), pd.Series(f24).sort_index()
rm = lambda f: float(np.sqrt(np.mean((f - s_act.reindex(f.index)) ** 2)))
first_ok = s_act.index[0] + pd.Timedelta(hours=24)
last_ok = s_act.index[-1] - pd.Timedelta(hours=96)
# 1) typical stretch: the 4-day window whose mean observed PM2.5 is closest to the median over all 4-day windows of the test period
starts = pd.date_range(first_ok, last_ok, freq="12h")
means = pd.Series({t: s_act[(s_act.index >= t) & (s_act.index <= t + pd.Timedelta(hours=96))].mean() for t in starts})
typical_start = (means - means.median()).abs().idxmin()
# 2) severe stretch: centred on the highest-pollution hour of the test period
peak_time = s_act.idxmax()
severe_start = min(max(first_ok, peak_time - pd.Timedelta(hours=48)), last_ok)
fig, axes = plt.subplots(2, 1, figsize=(13, 9.2))
for ax, start, title in [(axes[0], typical_start, "A typical four days (mean observed level close to the test-period median)"),
                         (axes[1], severe_start, "The most severe four days (around the highest-pollution hour of the test period)")]:
    end = start + pd.Timedelta(hours=96)
    sel = lambda x: x[(x.index >= start) & (x.index <= end)]
    a_w, s6, s24 = sel(s_act), sel(s6_all), sel(s24_all)
    ax.plot(a_w.index, a_w.values, color="black", lw=2.2, label="Observed PM2.5 (mean of 37 stations)")
    ax.plot(s6.index, s6.values, color=NAVY, lw=2.4, marker="o", ms=4, label=f"EcoTwin forecast made 6 h earlier (RMSE {rm(s6):.0f})")
    ax.plot(s24.index, s24.values, color=TEAL, lw=2.2, ls="--", marker="s", ms=4, label=f"EcoTwin forecast made 24 h earlier (RMSE {rm(s24):.0f})")
    ax.axhline(60, color=RED, lw=1, ls=":")
    ax.text(a_w.index[0], a_w.max() * 0.02 + 62, "CPCB 60 µg/m³", color=RED, fontsize=10)
    ax.set_ylabel("PM2.5 (µg/m³)")
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%d %b\n%H:%M"))
    ax.xaxis.set_major_locator(mdates.HourLocator(byhour=[0, 12]))
    ax.set_title(title, fontsize=13)
    ax.legend(loc="upper left", frameon=False, fontsize=10.5)
    ax.grid(alpha=0.25)
    print(title[:20], start, "->", end, "| RMSE +6h", round(rm(s6), 1), "+24h", round(rm(s24), 1), "| mean observed", round(a_w.mean()))
fig.text(0.01, -0.005, "RMSE here is of the city-mean series over these four days (test period 8 Dec 2025 to 9 Apr 2026).", fontsize=10.5, color="#444")
fig.tight_layout()
save(fig, "S14_forecast_vs_actual")

# ------------------------------------------------------------------ existing report figures, named by slide
for src, dst in [("fig_horizon.png", "S13_14_error_by_horizon.png"), ("fig_regime.png", "S13_error_by_regime.png"),
                 ("fig_scenarios.png", "S10_what_if_scenarios.png"), ("fig_shapley.png", "S10_shapley_attribution.png")]:
    p = os.path.join(RES, "..", "plots", "report", src)
    if os.path.exists(p):
        shutil.copy(p, os.path.join(OUT, dst))
        print("copied", dst)
