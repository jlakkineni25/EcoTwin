// Live data: how old it is, and when it still counts as "live"
export const LIVE_FRESH_HOURS = 6;

// now_hour in the live files is IST ("YYYY-MM-DD HH:MM")
export function liveAgeHours(nowHour: string, now: number = Date.now()): number {
  const t = Date.parse(nowHour.replace(' ', 'T') + ':00+05:30');
  return (now - t) / 3_600_000;
}
