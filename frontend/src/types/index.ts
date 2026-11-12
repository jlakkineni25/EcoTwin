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

export interface WhatIfData {
  scenarios: Array<{ key: string; label: string }>;
  cpcb_threshold: number;
  windows: Record<string, Record<string, ScenarioItem>>;
}

export type WindEdgesMap = Record<string, [number, number, number][]>;

export interface ModelMetric {
  rmse: number;
  mae: number;
  r2: number;
}

export interface BaselinesData {
  note: string;
  overall: Record<string, ModelMetric>;
  by_horizon: Record<string, Record<string, number>>;
  by_volatility_regime: Record<string, Record<string, number>>;
  by_wind_regime?: Record<string, Record<string, number>>;
  latency_ms_per_window: Record<string, number>;
}

export interface AttributionFactor {
  name: string;
  category: 'Transport' | 'Meteorology' | 'Inertia' | 'Diurnal';
  impact: number; // positive = pushes AQI up, negative = cleans air
  description: string;
}

export interface ExplainabilityData {
  summarySentence: string;
  confidenceScore: number;
  attentionWeights: number[]; // 48 values for historical window
  shapFactors: AttributionFactor[];
  topUpwindStations: Array<{ id: number; name: string; weight: number }>;
}

