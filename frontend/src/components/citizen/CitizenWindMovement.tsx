import React from 'react';
import { describeWindMovement } from '../../utils/citizenZones';
import { Wind, Compass, ArrowUp, Navigation, Info, Sparkles } from 'lucide-react';

interface Props {
  compassAngle: number;
  windSpeedKmh?: number;
}

export const CitizenWindMovement: React.FC<Props> = ({
  compassAngle,
  windSpeedKmh = 8.4,
}) => {
  const windInfo = describeWindMovement(compassAngle, windSpeedKmh);

  return (
    <div className="bg-[#121620] border-2 border-[#232A3B] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between h-full relative overflow-hidden">
      <div>
        {/* Header with Simple Citizen Title */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              Where is the Smoke Moving?
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>{windInfo.directionText.split(' ')[0]} Breeze</span>
          </span>
        </div>

        {/* 1. LEAD WITH CITIZEN-FRIENDLY EXPLANATION */}
        <div className="p-3.5 bg-gradient-to-r from-cyan-950/30 to-[#0F1420] rounded-2xl border border-cyan-500/30 mb-3.5">
          <p className="text-xs sm:text-sm text-cyan-100 font-medium leading-relaxed">
            {windInfo.impactNarrative}
          </p>
        </div>

        {/* Subtle Flowing Wind Streamlines Animation */}
        <div className="my-2 px-1">
          <svg className="w-full h-6 overflow-hidden" viewBox="0 0 280 20" fill="none">
            <style>
              {`
                @keyframes windStreamFlow {
                  0% { stroke-dashoffset: 40; }
                  100% { stroke-dashoffset: 0; }
                }
                .wind-stream {
                  stroke-dasharray: 8 6;
                  animation: windStreamFlow 2.5s linear infinite;
                }
                @media (prefers-reduced-motion: reduce) {
                  .wind-stream {
                    animation: none !important;
                  }
                }
              `}
            </style>
            <path
              d="M0 6 Q70 12 140 6 T280 6"
              stroke="#38BDF8"
              strokeWidth="1.8"
              strokeLinecap="round"
              className="wind-stream"
              opacity="0.8"
            />
            <path
              d="M10 14 Q80 8 160 14 T280 14"
              stroke="#7DD3FC"
              strokeWidth="1.4"
              strokeLinecap="round"
              className="wind-stream"
              opacity="0.6"
              style={{ animationDuration: '3.4s' }}
            />
          </svg>
        </div>

        {/* 2. Visual Compass & Directional Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Compass Graphic */}
          <div className="sm:col-span-4 flex flex-col items-center justify-center p-3 bg-[#0D111A] rounded-2xl border border-[#232A3B]">
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Outer Direction Ring */}
              <div className="absolute inset-0 rounded-full border border-dashed border-[#232A3B] flex items-center justify-center">
                <span className="absolute top-1 text-[9px] font-mono font-bold text-slate-400">N</span>
                <span className="absolute bottom-1 text-[9px] font-mono font-bold text-slate-400">S</span>
                <span className="absolute left-1.5 text-[9px] font-mono font-bold text-slate-400">W</span>
                <span className="absolute right-1.5 text-[9px] font-mono font-bold text-slate-400">E</span>
              </div>

              {/* Rotating Arrow with smooth transition */}
              <div
                className="w-14 h-14 flex items-center justify-center transition-transform duration-700 ease-out"
                style={{ transform: `rotate(${compassAngle}deg)` }}
              >
                <div className="flex flex-col items-center">
                  <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[16px] border-b-cyan-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]" />
                  <div className="w-1 h-5 bg-cyan-400/60 rounded-full" />
                </div>
              </div>

              {/* Center Hub */}
              <div className="absolute w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/50" />
            </div>

            <span className="text-xs font-bold text-white mt-1">
              {windInfo.directionText}
            </span>
            <span className="text-[11px] text-cyan-400 font-mono">
              Speed: {windSpeedKmh} km/h
            </span>
          </div>

          {/* Upwind vs Downwind Quick Cards */}
          <div className="sm:col-span-8 space-y-2">
            <div className="p-2.5 bg-[#0D111A] rounded-xl border border-[#232A3B]">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Origin (Upwind Area)
              </span>
              <span className="text-xs font-semibold text-slate-200 block">
                🍃 {windInfo.sourceText}
              </span>
            </div>

            <div className="p-2.5 bg-[#0D111A] rounded-xl border border-[#232A3B]">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Drifting Toward (Downwind Area)
              </span>
              <span className="text-xs font-semibold text-slate-200 block">
                💨 {windInfo.destinationText}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer takeaway */}
      <div className="mt-3 pt-3 border-t border-[#232A3B]/60 flex items-center gap-2 text-[11px] text-slate-400">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
        <span>
          Downwind neighborhoods in East & Central Delhi face heavier smoke accumulation today.
        </span>
      </div>
    </div>
  );
};
