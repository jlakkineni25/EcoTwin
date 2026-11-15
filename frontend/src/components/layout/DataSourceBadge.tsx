import React from 'react';
import { useLiveMeta } from '../../hooks/useTwinData';
import { useTwinStore } from '../../store/useTwinStore';
import { liveAgeHours, LIVE_FRESH_HOURS } from '../../utils/live';
import { formatObservationTimestamp } from '../../utils/citizenZones';

interface Props {
  compact?: boolean; // plain wording for the Citizen page
  timestamp?: string; // time of the window on screen ("YYYY-MM-DD HH:MM")
}

// Says where the data on screen comes from (live station readings or a recorded test day) and lets the visitor switch
export const DataSourceBadge: React.FC<Props> = ({ compact = false, timestamp }) => {
  const { data: meta } = useLiveMeta();
  const { dataMode, setDataMode } = useTwinStore();
  const isLive = dataMode === 'live' && !!meta;
  const age = meta ? liveAgeHours(meta.now_hour) : null;
  const stale = age !== null && age > LIVE_FRESH_HOURS;
  const t = timestamp ? formatObservationTimestamp(timestamp) : null;
  const updated = meta ? meta.generated_at.slice(11, 16) : '';

  return (
    <div className="flex flex-col items-start md:items-end gap-1.5 text-left md:text-right">
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono ${
          isLive && !stale
            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
            : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
        }`}
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${isLive && !stale ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
        {isLive ? (
          <span>
            <b>{stale ? 'LIVE · OLD SNAPSHOT' : 'LIVE'}</b>
            {t ? ` · latest readings from ${t.formattedTime}` : ''}
            {age !== null ? ` (${age.toFixed(1)} h ago)` : ''}
            {meta ? ` · ${meta.stations_observed_now} of ${meta.stations_total} stations reporting` : ''}
            {!compact && updated ? ` · updated ${updated}` : ''}
          </span>
        ) : (
          <span>
            <b>REPLAY</b>
            {t ? ` · a recorded day: ${t.formattedDate}, ${t.formattedTime}` : ''}
          </span>
        )}
      </div>
      {meta && (
        <button
          onClick={() => setDataMode(isLive ? 'replay' : 'live')}
          className="text-[11px] font-mono text-[#ECC138] hover:underline cursor-pointer"
        >
          {isLive ? 'Switch to a recorded day (replay)' : 'Switch to live data'}
        </button>
      )}
    </div>
  );
};
