export type AQICategory = 
  | 'Good' 
  | 'Satisfactory' 
  | 'Moderate' 
  | 'Poor' 
  | 'Very Poor' 
  | 'Severe';

export interface Station {
  id: number;
  name: string;
  lat: number;
  lon: number;
}

export interface StationForecast {
  station_id: number;
  // live frames only:
  observed_now?: boolean;
  hours_since_last_observation?: number | null;
  current_pm25: number;
  current_aqi: AQICategory;
  actual_24h: number[];
  predicted_24h: number[];
  peak_predicted: number;
  hours_to_breach_cpcb: number | null;
}

export interface PlaybackFrame {
  window_idx: number;
  timestamp: string;
  stations: StationForecast[];
}

export interface SummaryData {
  model_name: string;
  n_stations: number;
  test_windows_total: number;
  test_windows_exported: number;
  test_period: string;
  rmse: number;
  mae: number;
  r2: number;
  rmse_by_horizon: Record<string, number>;
  rmse_by_regime: {
    Stable: number;
    Moderate: number;
    Volatile: number;
  };
  cpcb_threshold: number;
  who_threshold: number;
}

export interface ScenarioItem {
  predicted_24h: number[][]; // [37 stations][24 horizons]
  breach_h: (number | null)[];
}

export interface ScenarioMeta {
  key: string;
  label: string;
  group: string; // wind | graph | emission | outage
  mean_change: number; // average change of the mean 24 h forecast over the exported windows (ug/m3)
  share_windows_as_expected: number | null; // share of windows moving the expected way (null = exploratory)
  check: string;
}

// /data/whatif/index.json
export interface WhatIfIndex {
  scenarios: ScenarioMeta[];
  cpcb_threshold: number;
  windows: number[];
}

// /data/whatif/<window>.json: scenario key -> forecast of that scenario for every station
export type WhatIfWindow = Record<string, ScenarioItem>;

// /data/live/live_meta.json (written by notebook 41)
export interface LiveMeta {
  generated_at: string; // "YYYY-MM-DD HH:MM:SS IST"
  now_hour: string; // last observed hour, "YYYY-MM-DD HH:MM" IST
  age_hours: number; // age when the file was written
  stations_total: number;
  stations_observed_now: number;
  warning?: string;
  wind_now: WindNow;
}

// /data/live/live_whatif.json: the live scenarios, window '0'
export interface LiveWhatIf {
  windows: Record<string, WhatIfWindow>;
}

// /data/playback/index.json
export interface PlaybackIndex {
  windows: number[];
  timestamps: string[];
}

export type WindEdgesMap = Record<string, [number, number, number][]>;

// city-mean wind per playback window: s = speed (m/s), d = direction it blows FROM (deg); fs / fd = mean over the next 24 h
export interface WindNow { s: number; d: number; fs: number; fd: number }
export type WindNowMap = Record<string, WindNow>;

// Written by make_frontend_data.py from notebook 44: per-horizon quantiles of z = log((actual + 1) / (forecast + 1)) on the validation windows
export interface Calibration {
  method: string;
  levels_percent: number[];
  quantiles: number[][]; // [24 horizons][levels]
  validation_windows: number;
  test_windows: number;
  test_coverage_80: number;
  test_coverage_95: number;
  breach_threshold: number;
}

export interface ModelMetric {
  rmse: number;
  mae: number;
  r2: number;
}

export interface BenchmarkRow {
  key: string;
  model: string;
  isOurs: boolean;
  rmse: number;
  mae: number;
  r2: number;
  stable: number | null;
  moderate: number | null;
  volatile: number | null;
  latency: string;
  notes: string;
}

// Written by v2_clean/make_frontend_data.py from the saved result files of the final model
export interface ModelCard {
  model_label: string;
  seeds: number;
  setting: string;
  test_period: string;
  test_windows: number;
  stations: number;
  overall: ModelMetric;
  perfect_wind: ModelMetric;
  persistence: ModelMetric;
  rmse_by_horizon: Record<string, number>;
  persistence_by_horizon: Record<string, number>;
  rmse_by_regime: { Stable: number; Moderate: number; Volatile: number };
  persistence_by_regime: { Stable: number; Moderate: number; Volatile: number };
  regime_share: { Stable: string; Moderate: string; Volatile: string };
  improvement_vs_persistence_pct: number;
  gap_vs_static_ugm3: number;
  gap_vs_graph_free_ugm3: number;
  latency_ms_per_model: number;
  benchmarks: BenchmarkRow[];
  note: string;
}

export interface AttributionFactor {
  name: string;
  category: 'History' | 'Chemistry' | 'Weather' | 'Wind' | 'Context' | 'Calendar';
  impact: number; // exact Shapley value in ug/m3 on the mean 24 h forecast; positive = pushes it up
  description: string;
}

export interface ExplainabilityData {
  summarySentence: string;
  attentionWeights: number[]; // 48 weights (sum about 1); empty when not available
  shapFactors: AttributionFactor[]; // sorted by |impact|, largest first
  topUpwindStations: Array<{ id: number; name: string; weight: number }>;
  baseline?: number; // forecast with every input at its training average
  forecastMean?: number;
  available: boolean;
}

// /data/explain/index.json
export interface ExplainIndex {
  players: string[];
  windows: number[];
  layout: string;
}

// /data/explain/<window>.json: r = per station [baseline, forecast_mean, impact of each player in `players` order] (ug/m3),
// a = per station the 48 attention weights (oldest hour first) x 10000
export interface ExplainWindow {
  r: number[][];
  a: number[][];
}
