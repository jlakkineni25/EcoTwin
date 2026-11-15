import { AQICategory, Calibration } from '../types';

export const CPCB_CATEGORIES: Record<
  AQICategory,
  {
    min: number;
    max: number;
    color: string;
    bgHex: string;
    borderHex: string;
    textHex: string;
    description: string;
    healthAdvisory: string;
    actionableTips: string[];
  }
> = {
  Good: {
    min: 0,
    max: 30,
    color: '#10B981',
    bgHex: 'rgba(16, 185, 129, 0.12)',
    borderHex: 'rgba(16, 185, 129, 0.4)',
    textHex: '#34D399',
    description: 'Minimal health impact',
    healthAdvisory: 'Air quality is considered satisfactory, and air pollution poses little or no risk.',
    actionableTips: ['Ideal day for outdoor running and sports', 'Ventilate indoors and open windows'],
  },
  Satisfactory: {
    min: 31,
    max: 60,
    color: '#84CC16',
    bgHex: 'rgba(132, 204, 22, 0.12)',
    borderHex: 'rgba(132, 204, 22, 0.4)',
    textHex: '#A3E635',
    description: 'Minor breathing discomfort to sensitive people',
    healthAdvisory: 'Acceptable air quality for healthy individuals; hypersensitive individuals may experience mild throat irritation.',
    actionableTips: ['Safe for general commute & exercise', 'Sensitive groups should monitor symptoms'],
  },
  Moderate: {
    min: 61,
    max: 90,
    color: '#FACC15',
    bgHex: 'rgba(250, 204, 21, 0.12)',
    borderHex: 'rgba(250, 204, 21, 0.4)',
    textHex: '#FDE047',
    description: 'Breathing discomfort to people with lungs, asthma and heart diseases',
    healthAdvisory: 'Elevated particle levels. People with respiratory conditions should reduce prolonged heavy exertion.',
    actionableTips: ['Plan morning exercise before traffic spikes', 'Keep car recirculate mode ON during commute'],
  },
  Poor: {
    min: 91,
    max: 120,
    color: '#FB923C',
    bgHex: 'rgba(251, 146, 60, 0.12)',
    borderHex: 'rgba(251, 146, 60, 0.4)',
    textHex: '#FDBA74',
    description: 'Breathing discomfort to most people on prolonged exposure',
    healthAdvisory: 'Unhealthy for sensitive groups. General public likely to begin experiencing eye and throat irritation.',
    actionableTips: ['Wear N95/FFP2 masks outdoors', 'Avoid heavy evening outdoor cardio'],
  },
  'Very Poor': {
    min: 121,
    max: 250,
    color: '#F87171',
    bgHex: 'rgba(248, 113, 113, 0.14)',
    borderHex: 'rgba(248, 113, 113, 0.45)',
    textHex: '#FCA5A5',
    description: 'Respiratory illness on prolonged exposure',
    healthAdvisory: 'Significant health hazard. Everyone may experience adverse health effects; serious effects for sensitive populations.',
    actionableTips: ['Run indoor HEPA air purifiers', 'Reschedule outdoor sports to low-AQI hours', 'Keep all windows tightly sealed'],
  },
  Severe: {
    min: 251,
    max: 999,
    color: '#DC2626',
    bgHex: 'rgba(220, 38, 38, 0.18)',
    borderHex: 'rgba(220, 38, 38, 0.55)',
    textHex: '#F87171',
    description: 'Affects healthy people and seriously impacts those with existing diseases',
    healthAdvisory: 'Emergency condition. High alert across Delhi NCR. Severe risk of acute cardiovascular and respiratory distress.',
    actionableTips: ['Strictly stay indoors', 'High-efficiency air purifiers at max power', 'Use medical-grade N95 if travel is unavoidable'],
  },
};

export const CPCB_ORDER: AQICategory[] = [
  'Good',
  'Satisfactory',
  'Moderate',
  'Poor',
  'Very Poor',
  'Severe',
];

export function getAQICategory(pm25: number): AQICategory {
  if (pm25 <= 30) return 'Good';
  if (pm25 <= 60) return 'Satisfactory';
  if (pm25 <= 90) return 'Moderate';
  if (pm25 <= 120) return 'Poor';
  if (pm25 <= 250) return 'Very Poor';
  return 'Severe';
}

export function getAQIColor(category: AQICategory): string {
  return CPCB_CATEGORIES[category]?.color || '#94A3B8';
}

// Calibrated uncertainty (notebook 44). For each forecast horizon the table holds quantiles of the model's real error on the
// validation windows, as z = log((actual + 1) / (forecast + 1)). An interval is (forecast + 1) * exp(q) - 1, and the probability that
// PM2.5 exceeds a threshold is read off the same table. Nothing here is a fixed assumption about the error shape.
function interp(x: number, xs: number[], ys: number[]): number {
  if (x <= xs[0]) return ys[0];
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
  let i = 1;
  while (xs[i] < x) i++;
  const t = (x - xs[i - 1]) / (xs[i] - xs[i - 1] || 1);
  return ys[i - 1] + t * (ys[i] - ys[i - 1]);
}

function quantileZ(cal: Calibration, horizonIdx: number, percent: number): number {
  const h = Math.min(Math.max(horizonIdx, 0), cal.quantiles.length - 1);
  return interp(percent, cal.levels_percent, cal.quantiles[h]);
}

// [lower, upper] of the central interval holding `coverage` percent (80 -> 10th..90th percentile)
export function calibratedInterval(forecast: number, horizonIdx: number, cal: Calibration, coverage: number): [number, number] {
  const lo = (100 - coverage) / 2;
  const hi = 100 - lo;
  const lower = Math.max(0, (forecast + 1) * Math.exp(quantileZ(cal, horizonIdx, lo)) - 1);
  const upper = (forecast + 1) * Math.exp(quantileZ(cal, horizonIdx, hi)) - 1;
  return [lower, upper];
}

// Probability (percent, 1..99) that the real PM2.5 will exceed `threshold`, given the forecast
export function computeBreachProbability(forecastVal: number, horizonIdx: number, cal: Calibration, threshold = 60.0): number {
  const h = Math.min(Math.max(horizonIdx, 0), cal.quantiles.length - 1);
  const z0 = Math.log((threshold + 1) / (forecastVal + 1));
  const levels = cal.levels_percent.map((l) => l / 100);
  const lowEdge = levels[0] / 2;
  const highEdge = 1 - (1 - levels[levels.length - 1]) / 2;
  const q = cal.quantiles[h];
  const F = z0 <= q[0] ? lowEdge : z0 >= q[q.length - 1] ? highEdge : interp(z0, q, levels);
  return Math.min(Math.max(Math.round((1 - F) * 100), 1), 99);
}
