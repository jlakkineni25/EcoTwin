# EcoTwin — Industry-Level Frontend

An interactive, instrument-grade digital twin frontend for **WA-TGCN** (Wind-Aware Temporal Graph Convolutional Network), forecasting PM2.5 across Delhi's 37 CPCB monitoring stations.

---

## Key Features

1. **Live Airshed Map & Wind Advection**:
   - 37 continuous monitoring stations rendered with CPCB standard color bands.
   - Dynamic $A(t)$ graph overlay showing hourly recomputed downwind transport links.
   - 60fps canvas particle advection streamlines simulating regional atmospheric transport.
2. **24-Hour Horizon & Uncertainty Fan Chart**:
   - Median prediction trajectory with calibrated 80% and 95% confidence bands from the 7-seed ensemble.
   - Ground truth actuals overlay with window-level error tracking.
   - Probabilistic breach warnings with lead times (e.g. *84% breach probability by 18:00*).
3. **"Why This Forecast" (XAI & Interpretability)**:
   - Faithful, deterministic natural language template synthesis (zero hallucination).
   - 48-hour historical temporal attention strip.
   - Grouped SHAP contribution bars (Transport, Meteorology, Inertia, Diurnal).
   - Upwind source station ranking with graph coupling weights.
4. **Counterfactual "What-If" Meteorological Engine**:
   - 360° interactive wind compass dial + wind speed slider.
   - Split-view comparison between baseline and counterfactual scenarios (`wind_x2`, `wind_nw`, `wind_rev`).
   - Real-time $\Delta$ Peak Concentration and breach delay calculation.
5. **Weather-App Health & Commute Advisor**:
   - Safe departure window recommendations (*"Lowest exposure window: 14:00 - 17:00"*).
   - Activity feasibility ratings for outdoor running, cycling, and commuting.
   - Vulnerable group medical advisories (Asthmatics, Children, Elderly) and HEPA/N95 recommendations.
6. **Academic Credibility & Verification Page**:
   - Formal baseline comparison leaderboard (WA-TGCN v2 vs Static-GCN vs No-Graph vs Persistence).
   - Atmospheric volatility regime error breakdown (Stable vs Moderate vs Volatile).
   - Pipeline health and telemetry (37/37 stations verified, 19,921 hourly rows, 0% missingness).
7. **Examiner Panel Day Demo Mode**:
   - Interactive 5-step guided tour designed for examiners and evaluators.
   - Complete with presentation talking points and automatic scene setup.

---

## Getting Started

### 1. Run the Development Server
```bash
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Build for Production
```bash
cd frontend
npm run build
npm run preview
```

