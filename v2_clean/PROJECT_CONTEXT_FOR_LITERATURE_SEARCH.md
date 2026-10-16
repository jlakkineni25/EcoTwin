# EcoTwin / WA-TGCN — Project Context for Literature Search

Use this document as the brief when searching for research papers (or when pasting into an AI research assistant). It states what was built, what was found (including negative results), what is planned, and what kinds of papers are needed to support, contextualise, or challenge each part.

---

## 1. One-paragraph summary

EcoTwin is a final-year project (Amrita Vishwa Vidyapeetham, CSE, Team 86) that forecasts **PM2.5 24 hours ahead, hourly, across 37 CPCB monitoring stations in Delhi** using a **Wind-Aware Temporal Graph Convolutional Network (WA-TGCN)**. The model's central idea is a **dynamic, wind-driven adjacency matrix A(t)** recomputed every hour, so that a station only influences stations located *downwind* of it, instead of using a fixed distance-based graph. The forecasts feed a **digital-twin-style dashboard** (map, forecast playback, counterfactual wind "what-if" scenarios, threshold alerts). Planned but not yet done: **explainable AI (XAI)** for the graph model and a **cross-city generalisation** study. Federated learning was in the original proposal and has been dropped.

## 2. Problem and motivation

- Delhi PM2.5 is severe and highly episodic (state-of-air reports cite Delhi AQI 433 in 2025).
- Most operational AQI systems are reactive (report after thresholds are crossed). Goal: proactive multi-step forecasting plus early breach alerts.
- Pollution is **spatio-temporal**: it advects across locations and evolves hourly.

**Research gaps stated in the deck**
- RG1: reactive rather than proactive systems.
- RG2: graph models mostly use static, distance-only adjacency and ignore wind.
- RG3: the "wind-aware graph helps via pollutant transport" mechanism is assumed, rarely tested (e.g., via regime-stratified ablation).
- RG4: AQI forecasters give point predictions, no counterfactual "what-if" capability expected of a digital twin.
- RG5: explainability in AQI forecasting is mostly feature-level (SHAP/LIME); graph-level interpretability is underexplored.
- RG6: single-city training; cross-city transferability of graph models is untested.

## 3. Data

- Source: CPCB CAAQMS station files, hourly, Jan 2024 – Apr 2026. 45 raw station files.
- Cleaning: an audit of raw missingness found 7 stations ~85–96% missing PM2.5 and one more (New Moti Bagh) heavily incomplete; two stations lacked coordinates (added), one listed station (IHBAS) had no data file. **Final: 37 stations**, each with exactly 19,921 hourly rows.
- Variables: PM2.5, PM10, NO2, SO2, CO, O3, relative humidity, wind speed, wind direction, ambient temperature.
- Wind is converted to vector form (meteorological "wind from" convention): u = −WS·sin(WD), v = −WS·cos(WD).
- Imputation is tiered: spatial neighbour mean at the same timestamp → timestamp-wise city mean → per-station linear interpolation → forward/backward fill; physical range clipping happens before imputation.
- Scaling: StandardScaler (MinMax was rejected — it pushed 68.7% of scaled PM2.5 below 0.1 and flattened the wind signal). Target uses log1p then standardisation; skew drops from 2.58 to −0.18.
- Split: time-based 70/15/15, no shuffling. Test period 2025-12-08 → 2026-04-09 (deep winter, harder than the validation slice). Input window 48 h, horizon 24 h.

## 4. The wind-aware graph (core idea)

For each hour, edge weight from station *i* to station *j*:

A[i,j] = WindAlignment(i→j) / Distance(i,j), kept only if (a) stations are within 12 km, (b) alignment > 0 (wind blows from *i* toward *j*), then **row-normalised**. Self-loops are added inside the model so isolated stations retain their own signal.

Notes on this choice that a literature search should address:
- 12 km was chosen as a physically motivated default (roughly the distance wind can carry pollutants in one hour at typical speeds, matching the hourly resolution). It was **not** tuned by a radius sweep, unlike other hyperparameters.
- A wider-radius (~35 km), **advection-time-weighted** variant, `w = exp(−travel_time/τ)` with `travel_time = distance / (wind_speed · alignment)`, was designed and 7 checkpoints trained, but the evaluation was never completed.
- A second graph **A_fc** (built from a train-only wind climatology) propagates information across the 24 forecast hours inside the decoder.

## 5. Model architecture (WA-TGCN)

2-hop graph convolution (uses A(t)) → GRU (temporal) → multi-head self-attention → time-conditioned decoder (receives calendar features for the 24 future hours) → **gated anchor** (a learned per-horizon weight, ~1.0 at +1 h decaying to ~0.3 at +24 h, applied to the last observed PM2.5 and added to the decoder's residual output).

Training details: hidden size 32 and 1 GRU layer (a 64/2-layer version performed identically with 5.6× more parameters); **volatility-weighted Huber loss in log space**, `w = clip(1 + α·swing/median_swing, 0.5, 4)`; AdamW with cosine schedule and warmup; gradient clipping; early stopping (patience 12; best epoch typically 5–7); **7-seed ensemble**. Local training on an RTX 3050 Laptop GPU (6 GB), ~15–22 s/epoch, ~25–35 min per ensemble. 26 engineered features (cyclical time encodings, 6 h/24 h rolling mean and std, 3 h delta, wind-speed magnitude, city-wide mean/max, station-minus-city).

## 6. Results so far (held-out test set)

**Model iterations**
| Model | RMSE (µg/m³) | MAE | R² |
|---|---|---|---|
| WA-TGCN v1 (14 features, 1-hop, 5 seeds) | 64.59 | 41.50 | 0.589 |
| WA-TGCN v2 (26 features, forecast-graph decoder, vol-weighted loss, 7 seeds) | 60.92 | 39.69 | 0.634 |

v2 by horizon: +1 h 41.4, +6 h 56.7, +12 h 63.0, +18 h 66.0, +24 h 66.5 (curve flattens after ~+19 h). By volatility regime: Stable 29.9, Moderate 43.0, Volatile 90.9; the volatile third of windows accounts for ~76% of total error.

**Baseline / ablation ladder (same pipeline, only the graph differs)**
| Model | RMSE | R² |
|---|---|---|
| Persistence (repeat last value) | 83.87 | 0.307 |
| Graph-free (no spatial graph) | 62.18 | 0.619 |
| Static distance-graph GCN | 61.73 | 0.624 |
| WA-TGCN dynamic wind graph | 60.88 | 0.635 |

Regime breakdown (Static-GCN vs dynamic): Stable 29.56 vs 30.24 (dynamic slightly worse), Moderate 43.81 vs 43.24, Volatile 92.18 vs 90.54 (dynamic better). So the wind graph's gain over a plain distance graph is small, and concentrated in volatile conditions.

## 7. Key findings, including the negative/inconclusive ones

1. **Station wind quality is poor.** CPCB station wind correlates only ~0.25 with ERA5 reanalysis wind. A lag-scan cross-correlation and convention tests (met-from vs met-to vs math convention) ruled out timezone or sign-convention bugs, so this appears to be genuine sensor/siting noise.
2. **Rebuilding on ERA5 wind (Open-Meteo, 37 stations) and adding forecast wind as decoder features** (using actual future ERA5 as an "oracle" stand-in for an NWP forecast, so this is an upper bound) improved RMSE to 58.79. Gain was horizon- and regime-dependent, consistent with a real mechanism.
3. **Rigorous ablation on the ERA5 pipeline did not support the wind-graph claim.** No-graph 58.41, Static-GCN 58.16, dynamic wind graph 59.08 — the dynamic graph was the *worst*. The accuracy gain from better wind came from wind as an **input feature**, not from graph structure.
4. Therefore the honest state of RG6/RG3 is: the dynamic wind-aware graph is implemented, functional, reactive to wind, and gives a small gain on the original pipeline concentrated in volatile windows, but a strong per-station model with good wind features matches or beats it. The project's defensible contributions are the rigorous forecaster, a transparent negative/inconclusive result on graph structure, the wind-data-quality audit, and the forecast-wind lever.
5. Practical ceiling: roughly RMSE ~60 / R² ~0.63 for 24 h hourly PM2.5 from historical data; further gains likely need real NWP forecast wind. Targets like RMSE < 20 or R² > 0.85 are not realistic at this horizon.

## 8. Digital twin / dashboard (built base)

Streamlit app: station map (AQI-coloured), forecast playback over held-out test windows, actual-vs-predicted 24 h charts, CPCB-threshold breach alerts, **counterfactual wind scenarios** (wind ×2, north-west inflow, reversed wind) that re-run the model under perturbed wind, and an animated wind-coupling graph overlay. The dashboard reads precomputed JSON exports; it does not run inference live.

## 9. Planned / not yet done

- **XAI:** surface the existing attention weights (temporal interpretability), SHAP (feature-level), GNNExplainer (edge-level: which wind links matter).
- **Cross-city generalisation:** train on Delhi, test zero-shot on a second city; hypothesis is that a physics-grounded wind graph transfers better than a static distance graph. Blocker: a second city with enough CAAQMS stations (unverified; Coimbatore proposed but likely too sparse).
- **Hardware prototype (conceptual, optional):** IoT edge nodes (PM + meteorological sensors) feeding the same pipeline; any edge-side cleaning must mirror the validated central imputation to avoid train/serve skew.
- Federated learning was dropped (CPCB data is public, privacy justification no longer holds).

## 10. Papers already cited in the deck (don't re-find these)

Xia et al. 2025 (dynamic synchronous graph transformer, Neurocomputing); Wang et al. 2024 (wind-direction-based dynamic graph for ozone, Sci. Total Environ.); Xu et al. 2023 (dynamic GNN with adaptive edge attributes, Heliyon); Zhao et al. 2025 (dynamic geographical GNN for PM2.5, Environ. Modelling & Software); Ma et al. 2026 (RL-based dynamic multi-graph ensemble, Eng. Appl. AI); Hu et al. 2024 (adaptive hierarchical graph conv, J. Cleaner Prod.); Teng et al. 2023 (72 h PM2.5 hybrid graph network, Environ. Int.); Neerukonda et al. 2026 (hybrid spatio-temporal graph attention, Delhi multi-day AQI); Jana et al. 2024 (GCN short-term pollution, Technol. Forecast. Soc. Change); Mandal & Thakur 2023 (spatially attentive cluster-based GNN); Sui & Han 2023 (multi-view multi-task STGCN); Chauhan et al. 2026 (interpretable STGNN, Sci. Reports); Wei et al. 2026 (nowcasting with wind profile data for Smart City Digital Twins, Urban Climate); Zhou & Chen 2026 (transferable cross-city forecasting via invariant structural knowledge).

---

## 11. What to search for (by need)

For each bucket: why it matters to us, and example search strings.

**A. Does a wind-/direction-aware dynamic graph actually help? (our central, now contested claim)**
Looking for: ablations comparing wind-driven vs static vs no-graph; papers reporting that graph structure adds little over strong per-station models; reasons why (over-smoothing, noisy wind, spatial redundancy, station density).
- "wind-aware graph neural network PM2.5 ablation static graph"
- "does graph structure help air quality forecasting strong baseline"
- "negative results spatio-temporal graph neural networks air quality"
- "advection-based graph construction air pollution forecasting"
- "wind direction adjacency matrix dynamic graph air quality"

**B. Wind data quality and NWP / reanalysis wind as input**
Looking for: station wind unreliability, ERA5 vs ground observations, benefits of forecast weather (NWP) as exogenous inputs for PM2.5 forecasting, handling forecast-wind error.
- "ERA5 wind versus station observations air quality forecasting"
- "numerical weather prediction forecast meteorology input PM2.5 deep learning"
- "meteorological forecast features multi-step PM2.5 prediction oracle versus forecast"
- "low-cost station wind measurement uncertainty India"

**C. Physics-informed / transport-grounded graph models**
- "physics-informed graph neural network atmospheric transport pollutant"
- "Lagrangian advection graph neural network air pollution"
- "travel-time weighted edges pollutant transport graph"

**D. Volatility- and episode-aware forecasting**
Looking for: loss weighting for spikes/extremes, Huber/robust losses, log transforms for skewed PM2.5, evaluation by regime.
- "volatility weighted loss PM2.5 extreme episode forecasting"
- "spike-aware loss function air pollution deep learning"
- "regime-stratified evaluation air quality forecast"
- "heavy-tailed PM2.5 forecasting log transformation Huber"

**E. Delhi / India benchmarks**
- "Delhi PM2.5 24 hour forecast deep learning CPCB stations"
- "multi-station Delhi air quality graph neural network"
- "India CAAQMS spatio-temporal forecasting benchmark"

**F. Forecast anchoring / residual (delta) prediction**
- "persistence residual learning multi-horizon forecasting gated"
- "last-value anchor decoder residual time series forecasting"

**G. Explainability for spatio-temporal graph models (planned XAI)**
- "GNNExplainer spatio-temporal air quality"
- "explainable graph neural network air pollution edge importance"
- "attention weights interpretability time series forecasting caveats"
- "SHAP PM2.5 forecasting feature importance wind"

**H. Cross-city generalisation / transfer (planned)**
- "cross-city transfer learning air quality forecasting"
- "zero-shot spatio-temporal graph transfer different cities"
- "domain adaptation air quality monitoring stations graph"
- "few-shot PM2.5 forecasting new city"
Also useful: how many stations a city needs for a meaningful graph; candidate second cities with dense public monitoring (CAAQMS city networks, or non-Indian open networks).

**I. Digital twins for air quality / counterfactual scenarios**
- "urban air quality digital twin framework"
- "counterfactual what-if analysis air pollution forecasting model wind scenario"
- "digital twin PM2.5 early warning system"

**J. Federated / edge architecture (dropped, only needed if re-justified)**
- "federated learning air quality forecasting bandwidth institutional boundaries"

## 12. Specific questions papers could help answer

1. Why might a dynamic wind graph fail to beat a static or no-graph model when wind inputs are already present as features? (redundancy, over-smoothing, noisy wind, hourly time resolution vs transport scale)
2. Is a ~12 km radius sensible, or do advection-time-based radii (20–50 km) work better? Typical urban transport scales and station spacing.
3. How should forecast (not observed) wind be integrated, and how much accuracy is lost when forecast wind has realistic error versus an oracle?
4. What is the accepted way to evaluate graph benefit — regime-stratified, per-horizon, per-station, statistical significance across seeds?
5. What baselines are standard for Delhi/India PM2.5 forecasting, and what RMSE/MAE/R² ranges are reported for 24 h horizons?
6. Which XAI methods are appropriate and validated for graph + recurrent forecasters, and what are their known failure modes (especially attention-as-explanation)?
7. What conditions make a graph model transfer across cities, and does a physics-based graph help zero-shot transfer?

## 13. Caveats to carry into any citation/claim

- Numbers across different pipelines (original CPCB-wind pipeline vs ERA5 pipeline) are not directly comparable.
- The ERA5-based v3 result uses *actual future wind* (oracle), so it is an upper bound, not a deployable forecast.
- The wider-radius advection-weighted graph experiment was not completed; do not cite it as a result.
- The test period is deep winter (harder than the validation period); quote test numbers, not validation.
- Cross-city, XAI and hardware are plans, not results.
