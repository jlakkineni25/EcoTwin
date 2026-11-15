// Helpers for the real wind shown in the app (direction = where the wind blows FROM, degrees, 0 = north, 90 = east)
const POINTS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

export function degToCompass(deg: number): string {
  const d = ((deg % 360) + 360) % 360;
  return POINTS[Math.round(d / 22.5) % 16];
}

export function windSpeedWord(kmh: number): string {
  if (kmh < 3.6) return 'calm';
  if (kmh < 12) return 'light';
  if (kmh < 20) return 'gentle';
  if (kmh < 30) return 'moderate';
  return 'strong';
}
