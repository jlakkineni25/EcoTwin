import React from 'react';
import { Station, StationForecast } from '../../types';
import { formatObservationTimestamp } from '../../utils/citizenZones';
import { ShieldCheck, Sparkles, MapPin, Clock } from 'lucide-react';

interface Props {
  stations: Station[];
  forecasts: StationForecast[];
  timestamp: string;
}

export const CitizenHero: React.FC<Props> = ({
  stations,
  forecasts,
  timestamp,
}) => {
  const timeInfo = formatObservationTimestamp(timestamp);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#101520] via-[#0D111A] to-[#0B0E14] border-b border-[#232A3B] px-4 sm:px-6 pt-5 sm:pt-7 pb-6 sm:pb-7">
      {/* Subtle atmospheric ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          {/* Main Title & Accessible Subtitle */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-[#232A3B] text-[11px] font-mono text-emerald-400 mb-2.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>CITIZEN CLEAN AIR COMPANION</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-300">Delhi NCR</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Know what you are breathing in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ECC138] to-[#C89B6D]">
                your neighborhood
              </span>
              .
            </h1>

            <p className="mt-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Clear air quality readings for your local area, 24-hour neural forecasts, and calm, practical daily health advice.
            </p>
          </div>

          {/* Historical Data Transparency Badge */}
          <div className="self-start md:self-end flex flex-col items-start md:items-end text-left md:text-right">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121620] border border-[#232A3B] text-slate-300 text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-mono text-[11px] text-slate-300">
                {timeInfo.formattedDate} · {timeInfo.formattedTime}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-1">
              Historical CPCB Station Record · 37 Monitored Nodes
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
