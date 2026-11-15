// The what-if scenarios computed by the final model (notebook 43) and how the panel presents them.
// Every scenario is a model-sensitivity test on the held-out windows, not a causal prediction.

// Forecast wind speed levels (the speed slider). 'baseline' is the unchanged forecast.
export const WIND_SPEED_LEVELS: Array<{ key: string; mult: number }> = [
  { key: 'wind_x0_25', mult: 0.25 },
  { key: 'wind_x0_5', mult: 0.5 },
  { key: 'baseline', mult: 1 },
  { key: 'wind_x1_5', mult: 1.5 },
  { key: 'wind_x2', mult: 2 },
];

export function scenarioSpeed(key: string): number | undefined {
  return WIND_SPEED_LEVELS.find((l) => l.key === key)?.mult;
}

export const GROUP_TITLES: Record<string, string> = {
  wind: 'Wind direction',
  graph: 'Wind graph',
  emission: 'Emission cuts',
  outage: 'Sensor outages',
};

export const SCENARIO_LABELS: Record<string, string> = {
  wind_nw: 'Wind from the north-west',
  graph_off: 'Wind graph off',
  cut_hotspots_30: 'Cut 5 hotspots by 30%',
  cut_city_20: 'Cut all stations by 20%',
  offline_top1: 'Worst hotspot offline',
  offline_top5: '5 hotspots offline',
};

export const SCENARIO_NOTES: Record<string, string> = {
  wind_x0_25: 'The forecast wind speed for the next 24 hours is quartered.',
  wind_x0_5: 'The forecast wind speed for the next 24 hours is halved.',
  wind_x1_5: 'The forecast wind speed for the next 24 hours is multiplied by 1.5.',
  wind_x2: 'The forecast wind speed for the next 24 hours is doubled.',
  wind_nw: 'The forecast wind for the next 24 hours is turned to blow from the north-west, speed unchanged. Direction barely moves the forecast on average.',
  graph_off: 'The hourly wind graph is switched off, so stations stop exchanging information. This shows how much the graph contributes to the forecast.',
  cut_hotspots_30: 'Observed PM2.5 at the five chronic hotspots (Anand Vihar, Jahangirpuri, Rohini, Wazirpur, Nehru Nagar) is cut by 30%.',
  cut_city_20: 'Observed PM2.5 at every station is cut by 20%.',
  offline_top1: 'The sensor of the worst hotspot goes offline and its values are filled in from neighbouring stations.',
  offline_top5: 'The sensors of the five chronic hotspots go offline and their values are filled in from neighbouring stations.',
};
