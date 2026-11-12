import React, { useEffect } from 'react';
import { useTwinStore } from '../../store/useTwinStore';
import { Play, Pause, SkipBack, SkipForward, Clock, FastForward } from 'lucide-react';

interface Props {
  totalWindows: number;
  currentTimestamp: string;
}

export const TimelineScrubber: React.FC<Props> = ({
  totalWindows,
  currentTimestamp,
}) => {
  const {
    currentWindowIdx,
    setCurrentWindowIdx,
    isPlaying,
    togglePlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
  } = useTwinStore();

  // Playback timer effect
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentWindowIdx((currentWindowIdx + 1) % totalWindows);
    }, playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, currentWindowIdx, totalWindows, playbackSpeed, setCurrentWindowIdx]);

  return (
    <div className="w-full p-4 rounded-2xl bg-[#121620] border border-[#232A3B] shadow-xl flex flex-col gap-3 text-white">
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="px-2.5 py-1 rounded-lg bg-[#ECC138]/15 text-[#ECC138] border border-[#ECC138]/30 text-xs font-mono font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ECC138] animate-pulse"></span>
            <span>REPLAY SIMULATION</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-[#FFFDF8]">{currentTimestamp}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <span>
            Window <b className="text-[#FFFDF8]">{currentWindowIdx + 1}</b> of {totalWindows}
          </span>

          {/* Speed Toggle */}
          <div className="flex items-center gap-1 bg-[#0B0E14] p-1 rounded-lg border border-[#232A3B]">
            {[
              { label: '1x', speed: 1200 },
              { label: '2x', speed: 600 },
              { label: '4x', speed: 300 },
            ].map((s) => (
              <button
                key={s.label}
                onClick={() => setPlaybackSpeed(s.speed)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  playbackSpeed === s.speed
                    ? 'bg-[#C89B6D] text-[#0B0E14]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrub Slider */}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min="0"
          max={Math.max(0, totalWindows - 1)}
          value={currentWindowIdx}
          onChange={(e) => {
            setIsPlaying(false);
            setCurrentWindowIdx(parseInt(e.target.value, 10));
          }}
          className="w-full accent-[#ECC138] h-2 bg-[#0B0E14] rounded-lg cursor-pointer"
        />
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentWindowIdx(Math.max(0, currentWindowIdx - 1));
            }}
            className="p-2 rounded-lg bg-[#0B0E14] border border-[#232A3B] text-slate-300 hover:text-[#ECC138] hover:border-[#ECC138]/50 transition-colors"
            title="Step Back -1h"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlaying}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-md ${
              isPlaying
                ? 'bg-[#ECC138] text-[#0B0E14] shadow-[#ECC138]/20'
                : 'bg-[#C89B6D] text-[#0B0E14] shadow-[#C89B6D]/30 hover:bg-[#d8a879]'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause Replay</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Play Simulation</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentWindowIdx((currentWindowIdx + 1) % totalWindows);
            }}
            className="p-2 rounded-lg bg-[#0B0E14] border border-[#232A3B] text-slate-300 hover:text-[#ECC138] hover:border-[#ECC138]/50 transition-colors"
            title="Step Forward +1h"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-mono hidden sm:inline">
          Held-out CPCB test sequence: Dec 2025 – Apr 2026
        </div>
      </div>
    </div>
  );
};
