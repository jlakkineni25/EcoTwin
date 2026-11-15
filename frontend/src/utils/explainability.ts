import { StationForecast, Station, ExplainabilityData, AttributionFactor } from '../types';

// What each of the eight Shapley "players" of the final model means (notebook 42)
const PLAYER_INFO: Record<string, { category: AttributionFactor['category']; phrase: string; description: string }> = {
  'PM2.5 history': { category: 'History', phrase: 'recent PM2.5 history', description: 'Recent PM2.5 levels at this station and their rolling statistics' },
  'Other pollutants': { category: 'Chemistry', phrase: 'the other pollutants', description: 'PM10, NO2, SO2, CO and O3 readings' },
  'Weather (T, RH)': { category: 'Weather', phrase: 'temperature and humidity', description: 'Temperature and relative humidity' },
  'Wind (inputs + forecast)': { category: 'Wind', phrase: 'the wind', description: 'Observed wind and the forecast wind for the next 24 hours' },
  'City context': { category: 'Context', phrase: 'the city-wide level', description: 'City-wide mean and maximum PM2.5, and this station compared with them' },
  'Calendar (input + future)': { category: 'Calendar', phrase: 'the time of day and season', description: 'Hour, weekday and month of the input window and the forecast hours' },
  'Upwind PM2.5 (transport)': { category: 'Wind', phrase: 'PM2.5 at the upwind neighbours', description: 'PM2.5 at upwind neighbouring stations, taken at their travel-time lag' },
  'Wind graph': { category: 'Wind', phrase: 'the wind graph', description: 'The hourly wind-driven links between stations (switched off = no neighbour exchange)' },
};

export const LIVE_EXPLAIN_MSG = 'Explanations are available in replay only: they are computed on the stored test days, not on live data.';

const signed = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}`;

/**
 * Builds the explanation of one station's forecast from the REAL exports (one file per window, /data/explain/<window>.json):
 *  - row: [baseline, forecast_mean, impact of each player in `players` order], exact Shapley values in ug/m3 on the mean 24 h forecast
 *  - attention: the 48 attention weights (scaled by 10000)
 * Nothing here is invented: when the data for a window is missing the result says so.
 */
export function buildAttribution(
  forecast: StationForecast,
  station: Station,
  allStations: Station[],
  windEdges: [number, number, number][] | undefined,
  players: string[] | undefined,
  row: number[] | undefined,
  attention: number[] | undefined,
  loading = false,
  unavailableMessage?: string
): ExplainabilityData {
  // Strongest incoming links of the hourly wind graph at this window: [source, target, weight] with target == station
  const incoming = (windEdges || []).filter(([, target]) => target === station.id);
  incoming.sort((a, b) => b[2] - a[2]);
  const stationMap = new Map(allStations.map((s) => [s.id, s]));
  const topUpwindStations = incoming.slice(0, 3).map(([src, , weight]) => ({
    id: src,
    name: stationMap.get(src)?.name || `Station ${src}`,
    weight: Math.round(weight * 100) / 100,
  }));

  const attentionWeights = attention ? attention.map((v) => v / 10000) : [];

  if (!players || !row || row.length < 2 + players.length) {
    return {
      summarySentence: unavailableMessage ?? (loading ? 'Loading the explanation…' : 'The explanation for this window is not available.'),
      attentionWeights,
      shapFactors: [],
      topUpwindStations,
      available: false,
    };
  }

  const baseline = row[0];
  const forecastMean = row[1];
  const shapFactors: AttributionFactor[] = players
    .map((name, i) => ({
      name,
      category: PLAYER_INFO[name]?.category ?? 'Context',
      impact: row[2 + i],
      description: PLAYER_INFO[name]?.description ?? '',
    }))
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  const phrase = (f: AttributionFactor) => PLAYER_INFO[f.name]?.phrase ?? f.name;
  const up = [...shapFactors].sort((a, b) => b.impact - a.impact)[0];
  const down = [...shapFactors].sort((a, b) => a.impact - b.impact)[0];

  let summarySentence = `The model's 24-hour mean forecast for ${station.name} is ${Math.round(forecastMean)} µg/m³. From a reference of ${Math.round(baseline)} µg/m³ (the forecast with every input at its training average)`;
  if (up.impact > 0.5) summarySentence += `, the biggest push up comes from ${phrase(up)} (${signed(up.impact)} µg/m³)`;
  if (down.impact < -0.5) summarySentence += `${up.impact > 0.5 ? ' and' : ','} the biggest pull down from ${phrase(down)} (${signed(down.impact)} µg/m³)`;
  if (up.impact <= 0.5 && down.impact >= -0.5) summarySentence += ', no single input moves it by more than 0.5 µg/m³';
  summarySentence += '.';

  return { summarySentence, attentionWeights, shapFactors, topUpwindStations, baseline, forecastMean, available: true };
}
