# EcoTwin — Paper verification and implementation brief

Checked: `EcoTwin_Research_Paper.docx` (text, 8 figures, 2 tables, 19 references) against the result files, notebooks, config files and dashboard exports in `D:\FYP\Eco-Twin\v2_clean`.

---

## PART A — Paper verification

### A1. Verified correct (matches files)

| Paper claim | Source checked |
|---|---|
| v1 64.59 / 41.50 / 0.589 and v2 60.92 / 39.69 / 0.634 | `final_metrics.json`, `v2_metrics.json` |
| Ablation ladder 83.87 / 62.18 / 61.73 / 60.88, R² 0.307 / 0.619 / 0.624 / 0.635 | `baselines_metrics.json` |
| Dynamic vs static advantage ≈ 1.4% (0.85 / 61.73) | arithmetic |
| ERA5 re-ablation 58.41 (no graph), 58.16 (static), 59.08 (dynamic); v3 = 58.79 | `baselines_v3.json`; v3 re-evaluated from checkpoints (reproduced exactly) |
| 18,201 parameters | `09_model_v2.ipynb` output; recomputed |
| AdamW lr 1e-3, weight decay 1e-4, patience 12, vol-loss α = 1, 7 seeds, hidden 32 / 1 GRU / 4 heads / 2-hop | `v2_config.json`, `09_model_v2.ipynb` |
| Horizon RMSE 41.4 / 56.7 / 63.0 / 66.0–66.5; regime RMSE 29.9 / 43.0 / 90.9 | `v2_metrics.json` |
| Station cleanup story (44→45 files, 7+1 dropped, 2 coordinates added, IHBAS removed, 37 final, 19,921 rows) | project notes, dataset |
| MinMax 68.7% below 0.1; skew 2.58 → −0.18 | project notes |
| Test period 8 Dec 2025 – 9 Apr 2026 | dashboard summary |
| Calm 233 edges / active 306 edges | dynamic adjacency, figure code |
| Station wind vs ERA5 correlation ≈ 0.25 | wind audit (nb13) |
| Persistence has no parameters (see A2-7: wording) | — |

### A2. Must fix (factual or consistency errors)

1. **Fig. 3 (loss curve) is the wrong run, and my chart caused it.** `training_history.json` is written by `05_training.ipynb` (the early first model, July), not by v2. The loss values (0.41 → 0.16 train, ~0.43–0.49 val) are on a different scale from the real v2 logs (0.20 → 0.095 train, ~0.13–0.15 val). Its validation minimum is at epoch 2, which contradicts the caption's "early stopping around epoch 5–7". I labelled it "WA-TGCN v2" without verifying the source; that was my error. **Fix:** replace with `ecotwin_outputs/plots/slide_charts/C1_loss_curve_v2_corrected.png`, built from the true v2 logs for all 7 seeds (parsed into `results/v2_training_history.json`). The real best epochs are 5, 4, 4, 4, 5, 6, 7 (median 5), so write "epochs 4–7, median 5" instead of "typically 5–7". The same wrong chart is on **slide 18**.
2. **Section 7.5 / Fig. 6 numbers do not match each other.** Text: best sample #2080 RMSE 16.8, worst #958 RMSE 184.5, error "+13.6 at +1 h to −248.7 at +13 h". Figure and dashboard data: best 17.3, worst 179.2 (RMSE over all 37 stations, 970-window playback export). The plotted line is a single station (ITO), whose worst-window errors are +95.9 at +1 h and −230.7 at +13 h; the all-station means are +33.2 and −149.4. None of these reproduce the text. **Fix:** rewrite the text to the figure's numbers, and use `D2_best_worst_window_corrected.png`, which now names the plotted station and states that the RMSE is over all 37 stations.
3. **Section 8.4 and Limitations are out of date.** The paper says the wider-radius advection graph was "not completed". It was completed (RMSE 62.21, 7 seeds) and then controlled: with the same 23 no-wind inputs, dynamic 62.80, no-graph 63.21, static 62.72 (5-seed ensembles, per-seed std 1.1–1.5). Wind delivered only through the graph adds nothing measurable. Update 8.4, Limitation 2 and future-work item 3.
4. **Forecast-wind is no longer "not deployable".** Notebook 19 shows a real day-old Open-Meteo forecast gets 58.53, against 60.59 with observed wind only and 58.41 with the oracle. It also breaks the flat ~66 plateau (+24 h: 66.1 → 62.5). Limitation 5, the "practical ceiling ≈ RMSE 60 without NWP wind" statement, and future-work item 4 need updating. This is now the paper's strongest positive result.
5. **Fig. 1 overclaims.** "Attention weights – temporal interpretability" sits inside the Digital Twin box next to implemented features. Attention is computed inside the model but is not shown in the dashboard. Move it to the planned group. The caption says XAI is drawn with dashed outlines, but the SHAP/GNNExplainer box is solid.
6. **References 6–14 have wrong author initials and titles compared with your own deck (slides 19–21).** Examples: "Hu, K." should be Hu, W. et al.; "Jana, R. K." should be Jana, S., Middya, A. I., Roy, S.; "Sui, Y., & Han, J." should be Sui, S., & Han, Q.; "Chauhan, P." should be Chauhan, A., Kumar, G., Shakya, H. K.; "Wei, L." should be Wei, J. et al.; "Zhou, Y., & Chen, L." should be Zhou, Q., & Chen, N. Titles for Mandal & Thakur, Chauhan, Wei and Zhou differ from the deck, and volume, pages and DOI are missing for most. References 15–19 still carry "verify before submission" placeholders and are never cited in the text; Teng and Neerukonda are listed but not cited; "State of Global Air 2025" is cited but not listed. Citations use author-year in the text and numbers in the list. Verify every entry against its DOI page.
7. **Small wording:** "all four graph-capable variants share 18,201 parameters" — Persistence has none; say "the three learned models". The abstract compares 60.92 (7 seeds) with graph-free 62.18 (5 seeds); use the same-pipeline 60.88 for the like-for-like comparison.
8. **Intro statistic needs a source check.** "India recorded an average AQI of 343.2 in 2025, the second worst since monitoring began" — in your own deck the chart behind this number is labelled as the average AQI between 1 and 31 December. Check whether it is an India-wide annual figure before keeping the wording.

### A3. Should add (honest, strengthens the paper)

- **Wind-speed regime result you already computed** (`by_wind_regime`): dynamic vs static RMSE is 77.78 vs 79.87 under calm (+2.09), 57.96 vs 58.07 breezy (+0.11), and 42.04 vs 41.75 windy (−0.29). This is the evidence for the "regulariser in stagnant conditions" reading in 8.4, but the paper never shows it. The abstract's "concentrated in volatile episodes" (volatility split) and the calm-conditions result (wind split) are both true; present both.
- **Persistence beats every learned model at +1 h** (33.8 vs 41.5–43.4) and peaks at +12–15 h before dropping; Fig. 4 shows this. State it as a limitation (the learned models do not beat the last observed value in the first hour).
- **Fig. 7/8 captions:** edge counts (233, 306) are for the full graph; only the strongest 60 edges are drawn.
- **Section 8.3:** say the ERA5 models also received the oracle future-wind features.
- **Dashboard (Sec. 9):** counterfactual scenarios are three precomputed scenarios (wind ×2, north-west inflow, reversed), not arbitrary user wind and not live inference; the current wording "re-runs the trained model ensemble" can be read as live.
- **Seed noise:** single-model RMSE varies by about 1–2 between seeds; differences under ~0.5–1 between configurations are within noise. Say so next to Tables 1–2.

### A4. Retraction of an earlier statement of mine

Earlier I told you slide 17's "calm vs windy" regime numbers were wrong and had no matching split. That was incorrect: I had only checked the volatility key. `baselines_metrics.json` also holds `by_wind_regime`, and the slide's 2.09 (calm) is right. The only slip on the slide is the sign of the second number: under windy conditions the wind-aware graph is **0.29 worse**, not "better by only 0.29". Please keep the slide's regime result and fix only that sign.

---

## PART B — Complete implementation brief (everything built so far)

### B1. Data
- 45 raw CPCB CAAQMS station files (hourly, Jan 2024 – Apr 2026) audited and cleaned to **37 stations**, 19,921 hourly rows each (`01_preprocessing`).
- Tiered imputation (spatial neighbour mean → timestamp city mean → per-station interpolation → forward/backward fill), physical-range clipping first. Wind converted to u/v components. StandardScaler (fit on train only), log1p target. Time-based 70/15/15 split; 48 h input, 24 h horizon.

### B2. Graph
- Static distance graph (12 km) and **dynamic wind-aware A(t)**, one 37×37 matrix per hour (`03_dynamic_adjacency`): edge i→j = wind alignment ÷ distance, downwind only, 12 km, row-normalised, self-loops added in the model. Forecast graph A_fc from a train-only wind climatology (v2).

### B3. Models
- **v1** (nb07): 14 features, 1-hop GCN → GRU → attention → time-conditioned decoder → gated anchor; A–E architecture ablation; RMSE 64.59.
- **v2** (nb09): 26 features, 2-hop, forecast-graph decoder, volatility-weighted Huber loss, 7 seeds; RMSE 60.92, R² 0.634; all 37 stations improved.
- **Baselines / ablation** (nb11): Persistence, graph-free, static-GCN, dynamic — 83.87 / 62.18 / 61.73 / 60.88; regime tables by volatility and by wind.
- **Wind-quality audit and ERA5** (nb13): CPCB wind r ≈ 0.25 vs ERA5; timezone and convention bugs ruled out.
- **v3** (nb14): ERA5-driven graph and decoder wind features with oracle forecast wind; RMSE 58.79. **ERA5 re-ablation** (nb15): no-graph 58.41, static 58.16, dynamic 59.08.

### B4. Digital twin
- Streamlit dashboard (`app.py`): station map (AQI colours), forecast playback with date/time picker over 970 test windows, actual-vs-predicted 24 h chart on a real clock axis, CPCB-breach alerts, three precomputed wind counterfactuals (nb12), and a wind-coupling graph overlay. The dashboard reads precomputed JSON exports (nb10) and does not load PyTorch.

### B5. Repository
- 14 commits on GitHub (real dates, honest co-authorship); `TASKS.md`, `CLAUDE.md`, memory notes.

---

## PART C — What was done after PPT 2 (14 Sep 2026)

**Presentation material (14–19 Sep)**
- Slide charts: baseline bar, RMSE by horizon, regime comparison, wind-graph snapshot, calm-vs-active graph, wind-vectors-vs-graph, best/worst window, loss curve.
- Dashboard visual redesign (glass-panel styling, hover motion, colour-coded stat tiles) and an **animated wind-coupling overlay** (flow along each edge, speed scaled by edge weight); pushed to GitHub.
- Three architecture diagrams: full project, technical (offline-training vs online-serving lanes, tech stack, artifact filenames), hardware prototype concept, plus an overall flow diagram; a review of the old edge/fog diagram (not what was built).
- Slide-18 speech, explanations of GRU, epochs, baselines and formulas, and the literature-search brief.
- Review of the deck: found slide 17's windy-sign slip, the old edge/fog architecture slide, and the missing results slides.

**Research results (Oct 2026)**
- Found that v3b had actually completed but had **overwritten the v3 config, scalers and metrics**. Backed up as `v3b_*` and rebuilt the originals; verified they reproduce 59.08 (5 seeds) and 58.79 (7 seeds) exactly.
- **v3b matched controls (nb17):** wind-only-via-graph 62.80 vs no-graph 63.21 vs static 62.72 — indistinguishable. The wind-graph claim is not supported.
- **Real forecast wind (nb18, nb19):** Open-Meteo previous-runs API gives genuine day-old forecasts (speed correlation 0.60 overall, 0.79 on the test period; RMSE 0.59 m/s on the test period). Graph-free ladder: no wind 63.21 → observed wind 60.59 → **real forecast 58.53** → oracle 58.41. A real forecast keeps essentially all of the oracle gain and removes the long-horizon plateau (+24 h: 66.1 → 62.5).
- **Integration notebook (nb20) built and smoke-tested, not yet run:** static vs dynamic graph with real forecast wind, future-hour graph built from the forecast wind (recipe verified against the saved adjacency to 1.5e-8). Expected ~50–60 min on your GPU.
- Corrected the mislabelled loss curve and the best/worst-window chart.

## PART D — Still open
1. Run `20_integrate_realfc_graph.ipynb` (does the graph add anything once real forecast wind is in?).
2. Update the paper per A2–A3, including the new real-forecast result as a main contribution.
3. XAI (attention view, SHAP, GNNExplainer); cross-city generalisation (second city unverified); optional hardware proof-of-concept.
4. Retrain v2/v3 with the forecast-wind model as the dashboard's source if you want the dashboard to serve the best model; uncommitted: nb17–20, corrected charts, `11_baselines.ipynb` edits.
