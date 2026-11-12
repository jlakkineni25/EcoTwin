import { AQICategory } from '../types';

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

// Horizon-specific uncertainty sigma (based on v2 held-out test residuals)
export const HORIZON_UNCERTAINTY_SIGMA: number[] = [
  24.5, 27.2, 29.5, 31.8, 33.4, 34.6, 35.5, 36.3, 37.0, 37.6, 38.1, 38.5,
  38.9, 39.3, 39.6, 39.8, 40.1, 40.3, 40.5, 40.6, 40.7, 40.7, 40.6, 40.6
];

// Cumulative standard normal distribution approximation for breach probabilities
function normalCDF(z: number): number {
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.39894228;

  if (z >= 0.0) {
    const t = 1.0 / (1.0 + p * z);
    return 1.0 - c * Math.exp(-z * z / 2.0) * t *
      (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  } else {
    const t = 1.0 / (1.0 - p * z);
    return c * Math.exp(-z * z / 2.0) * t *
      (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  }
}

export function computeBreachProbability(forecastVal: number, horizonIdx: number, threshold = 60.0): number {
  const sigma = HORIZON_UNCERTAINTY_SIGMA[horizonIdx] || 38.0;
  const z = (threshold - forecastVal) / sigma;
  const prob = 1.0 - normalCDF(z);
  return Math.min(Math.max(Math.round(prob * 100), 1), 99);
}
