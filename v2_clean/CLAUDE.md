# EcoTwin — WA-TGCN Air Quality Digital Twin

## Project Overview

Final Year Project (FYP), team of 5, guide: Dr. Divya Bharathi P (Amritha Vishwa
Vidyapeetham, Dept. of CSE, Team 86). Core contribution: a **Wind-Aware Temporal
Graph Convolutional Network (WA-TGCN)** that forecasts PM2.5 24 hours ahead across
Delhi CPCB monitoring stations, using a dynamically recomputed wind-driven
adjacency matrix A(t) instead of a static distance-based graph.

**Novelty claim (do not lose this in any refactor):** no prior work uses a
wind-vector-driven dynamic adjacency matrix for pollution transport modelling.
Existing GCN-based AQI models use static/distance-only graphs. This is the one
thing every other design decision should protect.

## Project Evolution — Read Before Assuming Anything

The project has changed shape multiple times. Do not assume the original
presentation (Type 1 Research Project slides, "Fog-Enabled Federated Deep
Learning Digital Twin Architecture") is still accurate:

- **Federated Learning removed.** Original plan used FL across fog nodes
  (SFEGs) for privacy. Since CPCB data is public, the privacy justification
  no longer holds. FL is currently OUT unless re-justified on other grounds
  (bandwidth, institutional boundaries).
- **Open question, unresolved:** what replaces FL as the second research axis.
  Leading candidate is **cross-city transfer learning** — train on Delhi,
  test zero-shot on a second city (Coimbatore was proposed but station count
  there is unverified and may be too sparse for a meaningful graph — check
  CAAQMS station count before committing). The hypothesis: a physics-grounded
  wind-aware graph should transfer across cities better than a static
  distance-based graph, because wind physics is universal but geometry is not.
  This has NOT been decided. Do not build multi-city pipeline code without
  confirming this decision first.
- Architecture framing shifts from "decentralized Edge-Fog-Cloud" to
  "centralized" if FL is fully dropped — this cascades into the problem
  statement, research gaps (RG1-RG5 were FL/architecture gaps), and literature
  survey framing. RG6 (the wind-aware graph gap) is untouched and remains the
  anchor regardless of what happens with FL.

## Data Pipeline — v1 vs v2

Two dataset versions exist on disk. **Always use v2_clean. v1_original is kept
only so nothing is lost — do not build on it.**

```
D:\FYP\Eco-Twin\
├── Raw Sets\                    45 raw CPCB station Excel files, hourly, Jan 2024–Apr 2026
├── Delhi_list.xlsx              ORIGINAL station list (44 stations, some missing coords)
├── v1_original\                 first working pipeline — superseded, do not extend
└── v2_clean\                    CURRENT — everything below lives here
    ├── EcoTwin_Final_Dataset.csv
    ├── Delhi_list_v2.xlsx       37-station cleaned list with verified coordinates
    ├── static_adj_matrix.npy    (37, 37) distance-threshold adjacency, 12km
    ├── dynamic_adj_matrix.npy   (19921, 37, 37) wind-aware A(t), one matrix per hour
    ├── v2_clim_grid.npy         (12, 24, 37, 2) train-only wind climatology for the v2 model's A_fc
    ├── dashboard_export\        JSON exports consumed by the Streamlit dashboard (currently v2)
    ├── dashboard_export_v1\     backup of the v1-model export
    └── ecotwin_outputs\
        ├── data\                X/Y/At windowed .npy files (train/val/test)
        ├── scalers\             feature_scaler.pkl, pm25_scaler.pkl, log_scaler.pkl
        │                        + v2_feature_scaler.pkl, v2_log_scaler.pkl
        ├── plots\
        ├── models\              watgcn_final_seed*.pt = v1 (nb 07); watgcn_v2_seed*.pt = v2 (nb 09)
        └── results\             metrics JSONs, per-station CSVs (final_* = v1; v2_* = v2)
```

### Why v2 exists — station cleanup

Started at 44 stations in the original Excel. A raw-file missingness audit
(checking PM2.5 completeness in the ORIGINAL files, not the imputed dataset)
found 7 stations were ~85-96% missing PM2.5 — essentially fake nodes:
Talkatora Garden, IGNOU_Maidan Garhi, Cantonment Area, NSUT Jaffarpur,
Commonwealth Sports Complex, JNU, IIT Delhi. New Moti Bagh (25% missing PM2.5,
plus pm10/so2/o3 entirely absent) was also dropped. That's 8 drops, 44→36.

Then discovered 2 stations (Aya Nagar, Wazirpur) had raw data files but no
coordinates in the Excel — added verified coordinates, 36→38. Then discovered
IHBAS had coordinates but no raw data file at all (phantom station, explains
why it scored R²=0.0000 constant-output in early model runs) — removed, 38→37.

**Final: 37 stations.** This is the authoritative station count everywhere
downstream (A(t) shape, model n_stations config, etc).

### Key data pipeline decisions (do not silently revert these)

1. **StandardScaler, not MinMaxScaler.** MinMax was crushing the signal —
   68.7% of PM2.5 values landed below 0.1 on the scaled range because a few
   extreme spikes stretched the range. Worse: u_wind/v_wind had std ≈0.013
   after MinMax, i.e. the wind-aware model's core input was nearly flat. After
   switching to StandardScaler, every feature has std ≈1.0 and wind is alive.
2. **Wind vectorization**: raw WS (speed) + WD (direction, degrees) are
   converted to u_wind/v_wind (East/North components) BEFORE scaling.
   `u = -WS*sin(WD_rad)`, `v = -WS*cos(WD_rad)` (meteorological "wind FROM"
   convention). WD=360 normalized to 0 first.
3. **Imputation is tiered**: (1) spatial — mean of graph neighbours at same
   timestamp, (2) timestamp-wise city mean (NOT global column mean — that was
   an earlier mistake, fixed), (3) linear interpolation per station, (4)
   forward/backward fill as last resort. Physical range clipping happens
   BEFORE imputation so sensor spikes don't get borrowed by neighbours.
4. **Adjacency self-loops**: A(t) as computed has NO self-loops (wind blowing
   from a station to itself is undefined). The MODEL adds self-loops
   internally (`A + I`, renormalized) so each station retains its own signal
   during graph convolution. This was a major bug fix — without it, stations
   with no active wind-driven edges lost their own features entirely (some
   scored R²=0.0000).
5. **37-station coverage is airtight**: every station has exactly 19,921
   hourly rows, zero duplicates, zero gaps (verified against the full
   Jan 2024–Apr 2026 hourly range).

## Model Architecture

Two model revisions exist, both in `v2_clean`. This "v1 / v2" is model
iteration and is **separate from the dataset v1/v2 distinction above**:

- **WA-TGCN v1** — `07_final_model.ipynb`. The original hybrid; still the
  documented baseline and the A-E ablation reference.
- **WA-TGCN v2** — `09_model_v2.ipynb`. Richer-feature revision, current best,
  now feeds the dashboard (via `10_export_dashboard_v2.ipynb`). Details below.

### WA-TGCN v1 (notebook 07)

**WA-TGCN**: GCN (using A(t), self-loops added) → residual → GRU → multi-head
attention → time-conditioned per-horizon decoder → gated anchor (last observed
PM2.5, weighted per forecast hour, added back to the residual output).

Key design choices, each empirically justified through ablation (see
`ecotwin_outputs/results/experiment_comparison.csv` for the A-E experiment
table):

- **hidden_dim=32, gru_layers=1** — tested against hidden=64/gru=2, identical
  performance with 5.6x fewer params. Capacity was never the bottleneck.
- **Log-transformed target** (`log1p` then StandardScaler) — PM2.5 is heavily
  right-skewed (skew 2.58 raw → -0.18 in log space). Combined with Huber loss
  instead of MSE, this stopped extreme spikes from dominating the loss.
- **Future time conditioning** — the model receives calendar features
  (hour/day-of-week/month/weekend) for the 24 forecast hours it's predicting,
  not just the 48 input hours. Fixed a mid-horizon flatline where the model
  was outputting a smooth average shape with no diurnal awareness.
- **Gated anchor** (delta-style prediction) — `anchor_gate` is a learned
  per-horizon weight (init ~1.0 at +1h decaying to ~0.3 at +24h) applied to
  the last observed PM2.5, added to the decoder's residual output. Keeps
  strong short-horizon accuracy while letting longer horizons rely more on
  learned dynamics.
- **5-seed ensemble** (seeds 42, 7, 123, 2024, 999), average predictions.
- Input window 48h, forecast horizon 24h. Train/val/test split is
  time-based 70/15/15, NO shuffling (this is a time series).

v1 held-out test results (5-seed ensemble):

```
RMSE 64.59 µg/m³  |  MAE 41.50  |  R² 0.589
By horizon: +1h 43.0, +6h 61.1, +12h 67.0, +18h 69.8, +24h 69.4
By volatility regime:
  Stable   (33% of windows): RMSE 28.11  (6.3% of total error)
  Moderate (33% of windows): RMSE 44.78  (15.9% of total error)
  Volatile (34% of windows): RMSE 97.76  (77.9% of total error)
```

### WA-TGCN v2 (notebook 09) — current best

Same backbone as v1 plus five historical-only changes, each selected on the
validation set (test scored once). No NWP, no forecast weather feeds, no
test-set tuning. Leakage was explicitly checked (scalers/climatology fit on
train only; splits made before windowing; persistence baseline 81.5 on the
same pipeline).

1. **26 features instead of 14** — cyclical time encoding (sin/cos of
   hour/day/month), 6h & 24h rolling mean + std of PM2.5, 3h delta, wind-speed
   magnitude, regional context (city mean, city max, station-minus-city). The
   rolling std is an explicit volatility signal v1 never had; the city
   aggregates carry the synoptic episode signal directly.
2. **Forecast-graph decoder** — a second wind-aware adjacency `A_fc` built from
   a TRAIN-only wind climatology (`v2_clim_grid.npy`), propagating the encoder
   context spatially across the 24 forecast hours. The direct answer to v1's
   "only ever sees historical wind" limitation, with no external data — and it
   extends the RG6 novelty claim to the decoder side of the graph.
3. **2-hop GCN encoder** (v1 was 1 hop).
4. **Volatility-weighted Huber loss** — training windows weighted by target
   swing (0.56×–1.87×). Label-based emphasis, not leakage; no weight at
   inference. Set `LOSS_VOL_ALPHA = 0` in nb 09 cell 2 to revert.
5. **7-seed ensemble** (adds seeds 2025, 77), cosine LR schedule with warmup.

v2 held-out test results (7-seed ensemble), v1 in parens:

```
RMSE 60.92 µg/m³  |  MAE 39.69  |  R² 0.634        (v1: 64.59 / 41.50 / 0.589)
By horizon: +1h 41.4, +6h 56.7, +12h 63.0, +18h 66.0, +24h 66.5
By volatility regime:
  Stable   RMSE 29.89   (v1 28.11 — slight regression, the designed cost of change 4)
  Moderate RMSE 42.95   (v1 44.78)
  Volatile RMSE 90.87   (v1 97.76 — the targeted bucket, ~76% of total error)
```

All 37 stations improved (mean −3.50 µg/m³), biggest gains at the dirtiest,
hardest-to-forecast stations (Mundka −6.4, Karni Singh −5.7, Bawana −5.4, DTU
−5.3). **Validation ensemble RMSE is 55.14 but that slice
(Aug–Dec) is easier than the test slice (deep winter) — quote 60.92, not 55.**
Full write-up:
https://claude.ai/code/artifact/e55824a3-7a9c-4610-9726-19961375d4fc

**Interpretation, important for the report**: both models are genuinely good on
typical days and degrade during rapid weather-driven episodes because they
still never see *forecast* wind. v1's six architecture variants (A through the
final hybrid) all landed at RMSE 64-67 / R² 0.56-0.59 — that plateau was real
**for raw 14-feature, 1-hop inputs**. v2 shows that engineered features + a
2-hop + forecast-climatology graph move it to ~61 / 0.63, but the per-horizon
curve still flattens (~66.5 past +19h), so a real historical-only ceiling
remains. Numerical weather prediction wind is still the thing that would break
it further.

**Do not chase RMSE < 20 or R² > 0.85** — those were the original
presentation's targets and are not achievable for hourly PM2.5 at 24h horizon
without numerical weather prediction inputs. Report metrics per-horizon and
per-regime instead of one aggregate number; it's more accurate and a stronger
story.

## What's Built

- Full data pipeline (preprocessing → static adjacency → dynamic A(t) →
  feature engineering with StandardScaler → sliding windows)
- **WA-TGCN v1** (`07_final_model.ipynb`) — 5-seed ensemble saved
  (`watgcn_final_seed*.pt` + `final_config.json`), the ablation baseline.
- **WA-TGCN v2** (`09_model_v2.ipynb`) — 7-seed ensemble
  (`watgcn_v2_seed*.pt` + `v2_config.json` + `v2_metrics.json` +
  `v2_per_station.csv`), current best, RMSE 60.92 on test. The notebook
  rebuilds its own 26-feature dataset from the CSV and slices
  `dynamic_adj_matrix.npy` directly (no windowed At_*.npy — RAM-lean).
- Data quality audits (raw missingness, spatial-borrowing check, structural
  gap check) — see conversation history / prior notebooks if these need
  re-running for a modified station list
- **Streamlit dashboard** (`app.py`) — dark instrument-panel UI, live map of
  37 stations color-coded by CPCB AQI, click-to-inspect station forecast chart
  (actual vs predicted, REAL model output on held-out test data), alert panel
  for predicted threshold breaches, playback slider through 300 sampled
  test-set hours. Run: `streamlit run app.py` from the folder containing
  `dashboard_export/`. **Currently serves v2** — regenerate the export with
  `10_export_dashboard_v2.ipynb` (v2) or `08_export_dashboard_data.ipynb` (v1);
  the v1 export is backed up at `dashboard_export_v1/`.

## What's Next (in priority order)

1. **Phase 4 — Baselines.** LSTM (no graph, per-station independent
   forecasting) and static-GCN (identical architecture but with the FIXED
   static_adj_matrix.npy instead of dynamic A(t)). This is the ablation that
   evidences the wind-aware novelty claim (RG6) — currently the most important
   missing piece of the project. Build these on the **v2 pipeline**
   (`09_model_v2.ipynb`), since v2 is now the model: reuse its training loop
   and feature set; swap only the adjacency inputs (static-GCN also drops the
   `A_fc` forecast graph; LSTM drops the GCN layers). Fair comparison means all
   three share v2's features and loss.
2. **Resolve the FL vs multi-city question** with the guide before building
   more infrastructure around either path.
3. If multi-city goes ahead: verify second city's CAAQMS station count first
   (hard blocker — needs enough stations for a meaningful graph, similar
   density to Delhi's 37).
4. Wind what-if slider for the dashboard (recompute A(t) with user-adjusted
   wind, rerun forward pass live) — the most direct demo of the actual
   novelty, not yet built (current dashboard is playback-only on precomputed
   test-set predictions).
5. Live CPCB data connector for the dashboard (currently uses static
   playback export, not a live feed).


## Conventions

- All paths are Windows (`D:\FYP\Eco-Twin\...`), team runs Jupyter locally.
- Notebooks are written as individual cells with inline "HOW TO CHECK"
  comments explaining what output to expect — keep this pattern, the team
  relies on it to self-verify without deep ML background.
- Prefer plain code comments over markdown headers in notebooks.
- When something changes (station list, scaler, architecture), always check
  whether it needs to propagate through the full pipeline chain: raw data →
  static adjacency → dynamic A(t) → feature engineering/windows → model
  config → dashboard export. These have gotten out of sync before (e.g.
  station count mismatches between Excel and dataset).
- The v2 model shortcuts part of that chain: `09_model_v2.ipynb` and
  `10_export_dashboard_v2.ipynb` each rebuild the 26-feature matrix straight
  from `EcoTwin_Final_Dataset.csv` and must stay byte-identical in their
  feature block (both assert against `v2_config.json`'s `feature_cols`). Change
  one, change both, and retrain.
