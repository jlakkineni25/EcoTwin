# EcoTwin — Project Status & Next Steps

Read **CLAUDE.md** first for full technical context (architecture decisions, data
pipeline history, why things are built the way they are). This file is the task
checklist — what's done, what's open, what's next.

> Naming note: "model v1 / v2" = model iteration (notebook 07 vs notebook 09).
> "dataset v1/v2" = `v1_original` vs `v2_clean`. Different things. Everything
> current lives in `v2_clean`.

---

## DONE

### Data pipeline

- [x] CPCB data downloaded — 45 stations, hourly, Jan 2024–Apr 2026
- [x] Open-Meteo skipped deliberately — using CPCB's own WS/WD instead
- [x] Full preprocessing: column standardization, null handling, physical range
  clipping, tiered imputation (spatial neighbour mean → timestamp city mean →
  linear interpolation → ffill/bfill), hourly resampling
- [x] Wind vectorization (u_wind, v_wind derived from WS/WD)
- [x] Four independent data quality audits: constant-run, interpolation-smoothness,
  spatial-borrowing, raw-file missingness
- [x] Dropped 8 dead stations (85–96% missing PM2.5 in raw files)
- [x] Recovered 2 stations with verified coordinates: Aya Nagar, Wazirpur
- [x] Removed 1 phantom station: IHBAS (no raw data file)
- [x] `v2_clean` rebuilt — 37 stations, 19,921 hours, zero gaps, zero residual NaN
- [x] Fixed MinMaxScaler bug — StandardScaler restores wind std to ~1.0
- [x] Static adjacency matrix (Haversine, 12 km threshold) + validated
- [x] Dynamic wind-aware A(t) built and validated (calm vs high-wind graph,
  heatmap asymmetry, ~51% edge survival vs static)
- [x] Feature engineering — time features, StandardScaler, 48h/24h sliding
  windows, saved to `ecotwin_outputs/data/`

### Model — v1 (notebook 07)

- [x] WA-TGCN architecture: GCN w/ self-loops on wind-aware A(t) → residual →
  GRU → multi-head attention → time-conditioned decoder → gated anchor
- [x] Fixed self-loop bug (R²=0.0000 constant-output failures)
- [x] Six architecture experiments (A–E): capacity, pooling, delta prediction,
  future-time conditioning, log-transform + Huber + gated anchor
- [x] v1 final — 5-seed ensemble: **RMSE 64.59, MAE 41.50, R² 0.589**.
  Beats persistence (~82) and naive average.
- [x] Volatility-regime error breakdown — 77.9% of error from the most volatile
  34% of windows (weather-transition episodes)

### Model — v2 (notebook 09)  ← current best

- [x] Five historical-only changes over v1, all selected on validation:
  26 features (rolling volatility + regional context + cyclical time),
  forecast-graph decoder (`A_fc` from train-only wind climatology, extends RG6
  to the decoder side), 2-hop GCN, volatility-weighted Huber loss, 7-seed ensemble
- [x] v2 final — 7-seed ensemble: **RMSE 60.92, MAE 39.69, R² 0.634**
  (test). All 37 stations improved (mean −3.50). Volatile-regime RMSE
  97.76 → 90.87.
- [x] Leakage checks pass (persistence 81.5 on same pipeline; scalers/climatology
  train-only; splits before windowing)
- [x] Report: https://claude.ai/code/artifact/e55824a3-7a9c-4610-9726-19961375d4fc
- [x] `v2_metrics.json`, `v2_per_station.csv`, 7× `watgcn_v2_seed*.pt`,
  `v2_config.json`, v2 scalers, `v2_clim_grid.npy` saved

### Dashboard

- [x] Export scripts — real ensemble predictions on held-out test data
  (`08_export_dashboard_data.ipynb` = v1, `10_export_dashboard_v2.ipynb` = v2)
- [x] Streamlit dashboard (`app.py`) — live station map by AQI, click-to-inspect
  forecast chart, alert panel, 300-hour playback slider
- [x] **Dashboard now serves v2** — verified live; v1 export backed up to
  `dashboard_export_v1/`; `app.py` badge + footer updated

### Infrastructure

- [x] College resource request drafted (CPU/RAM/storage — local RTX 3050
  sufficient for this model size)
- [x] Claude Code + Jupyter MCP set up
- [x] CLAUDE.md written and kept current

---

## OPEN DECISION — BLOCKS SEVERAL ITEMS BELOW

Federated Learning was removed (privacy justification gone — CPCB data is public).
Replacement not decided. Options:

- **(a)** Re-justify FL on other grounds (bandwidth, DPCC/TNPCB institutional
  boundaries) — minimal rework
- **(b)** Cross-city transfer learning: train Delhi, zero-shot a second city.
  Hypothesis: physics-grounded wind-aware graph transfers better than static.
  **CURRENT LEANING.**
- **(c)** Joint multi-city training — needs a real mechanism (city embeddings,
  domain adaptation); "more data" alone isn't novel
- **(d)** Drop the second axis, deepen single-city work

**BLOCKER if (b)/(c):** second city's CAAQMS station count is UNVERIFIED — needs
density similar to Delhi's 37 for the graph to be meaningful. Coimbatore proposed,
not confirmed. Check current station count before committing code.

Cascades into: problem statement, RG1–RG5, literature survey, objectives 1–3.
RG6 (wind-aware graph gap) is untouched regardless.

**ACTION:** surface this explicitly before any multi-city / FL work. Do not build
(b)/(c) infrastructure without station-count confirmation and guide sign-off.

---

## NOT STARTED — PRIORITY ORDER

### 1. Baselines & ablation study — HIGHEST PRIORITY, IN PROGRESS

Direct evidence for the wind-aware novelty claim (RG6). Does not depend on the
FL/multi-city decision. **Built on the v2 pipeline** (`11_baselines.ipynb`) —
same 26 features, same loss, same windows; the wind-aware graph is the *only*
variable.

- [ ] No-graph baseline (temporal-only ≈ LSTM slot) — GCN + `A_fc` ablated,
  GRU/attention/decoder/anchor kept
- [ ] Static-GCN baseline — same architecture, `static_adj_matrix.npy`
  (distance-only) in place of dynamic A(t) and `A_fc`
- [ ] WA-TGCN v2 (dynamic) — reuse the 7 trained checkpoints
- [ ] Formal comparison table: WA-TGCN vs static-GCN vs no-graph vs persistence,
  RMSE/MAE/R² overall and by horizon
- [ ] Ablation: does the wind-aware graph help *more* in high-wind / volatile
  windows? (test against the volatility split + a wind-speed split)
- [ ] Latency / scalability measurement (originally deliverable D5)

### 2. Resolve the FL / multi-city decision

- [ ] Verify second city's CAAQMS station count (if pursuing b/c)
- [ ] Guide sign-off on direction
- [ ] Update problem statement, research gaps, objectives

### 3. Alert & decision-support module

- [x] Basic threshold breach detection (in dashboard)
- [ ] WHO vs CPCB threshold toggle in the dashboard UI
- [ ] Lead-time categorization (3h / 6h / 24h warning tiers — D4)

### 4. Dashboard — live-inference features (best demo material, do after baselines)

- [ ] Live wind what-if slider — user adjusts wind, recompute A(t) live, rerun
  forward pass, show updated forecast. The most direct visual demo of the novelty
  (current dashboard replays precomputed predictions only)
- [ ] Live CPCB data connector (currently historical playback)
- [ ] FL status panel — skip unless (a) chosen

### 5. Documentation & writeup — do last

- [ ] Problem statement rewrite (pending decision above)
- [ ] Research gaps rewrite (pending decision above)
- [ ] Literature survey additions if going transfer-learning route
- [ ] Novelty statement rewrite
- [ ] Objectives rewrite
- [ ] Revise performance targets — original RMSE<20 / R²>0.85 not achievable for
  hourly PM2.5 at 24h without weather forecast inputs; report per-horizon and
  per-regime instead of one aggregate
- [ ] Final report / paper
- [ ] Updated presentation slides

---

## Immediate next task

**Baselines (Section 1).** Build no-graph and static-GCN through the v2 pipeline,
produce the comparison table and the wind-regime ablation. Does not require the
FL/multi-city decision.
