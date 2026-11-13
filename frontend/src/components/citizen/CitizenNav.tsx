import React, { useState, useRef, useEffect } from 'react';
import { Station } from '../../types';
import { DelhiZone, DELHI_ZONES, STATION_ZONE_MAPPING, formatObservationTimestamp } from '../../utils/citizenZones';
import {
  Search,
  MapPin,
  Clock,
  Sparkles,
  ChevronDown,
  X,
  Compass,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  stations: Station[];
  selectedStationId: number;
  onSelectStation: (stationId: number) => void;
  activeZone: DelhiZone;
  onSelectZone: (zone: DelhiZone) => void;
  timestamp: string;
  onExploreResearch: () => void;
}

export const CitizenNav: React.FC<Props> = ({
  stations,
  selectedStationId,
  onSelectStation,
  activeZone,
  onSelectZone,
  timestamp,
  onExploreResearch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = searchQuery.trim()
    ? stations
        .filter((s) => {
          const q = searchQuery.toLowerCase();
          const zoneMeta = STATION_ZONE_MAPPING[s.id];
          return (
            s.name.toLowerCase().includes(q) ||
            zoneMeta?.zone.toLowerCase().includes(q) ||
            zoneMeta?.landmark.toLowerCase().includes(q)
          );
        })
        .slice(0, 6)
    : [];

  const selectedStation = stations.find((s) => s.id === selectedStationId);
  const timeInfo = formatObservationTimestamp(timestamp);

  return (
    <header className="sticky top-0 z-40 bg-[#0B0E14]/95 backdrop-blur-md border-b border-[#232A3B] transition-all">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Brand & Citizen Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-[#ECC138] flex items-center justify-center text-base shadow-md shadow-emerald-500/20">
              🌱
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm sm:text-base font-black tracking-tight text-white">
                  ECOTWIN
                </span>
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Citizen Companion
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-400">
                Delhi NCR Clean Air Insights & Neighborhood Forecasts
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar & Auto-Suggestions */}
        <div ref={searchRef} className="relative flex-1 max-w-xs sm:max-w-md mx-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search your neighborhood (e.g. Rohini, Anand Vihar)..."
              className="w-full bg-[#121620] border border-[#232A3B] rounded-xl pl-9 pr-8 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#121620] border border-[#232A3B] rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1">
              <div className="px-3 py-1.5 bg-[#181E2B] text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Found {searchResults.length} Delhi Neighborhoods
              </div>
              {searchResults.map((s) => {
                const zoneMeta = STATION_ZONE_MAPPING[s.id];
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectStation(s.id);
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-[#1C2333] transition-colors border-b border-[#232A3B]/50 last:border-0"
                  >
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">
                        {s.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {zoneMeta?.zone} Delhi · {zoneMeta?.landmark}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Select
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Research Exploration CTA & Timestamp */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 bg-[#121620] px-3 py-1.5 rounded-full border border-[#232A3B]">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-[11px] text-slate-300">
              {timeInfo.formattedDate} · {timeInfo.formattedTime}
            </span>
          </div>

          <button
            onClick={onExploreResearch}
            className="group flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500/15 to-[#ECC138]/20 hover:from-amber-500/25 hover:to-[#ECC138]/30 border border-[#ECC138]/40 text-[#ECC138] text-xs font-semibold transition-all shadow-sm hover:shadow-[#ECC138]/15 cursor-pointer whitespace-nowrap"
            title="Switch to full Neural Twin research site"
          >
            <span>🔬</span>
            <span className="hidden sm:inline">Explore the Research</span>
            <span className="sm:hidden">Research</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Zone Filter Strip (Horizontal pills) */}
      <div className="border-t border-[#232A3B]/60 bg-[#0E121B]/80 px-3.5 sm:px-6 py-2 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap flex items-center gap-1 mr-1">
            <MapPin className="w-3 h-3 text-emerald-400" />
            Delhi Zones:
          </span>
          {DELHI_ZONES.map((z) => {
            const isActive = activeZone === z.id;
            return (
              <button
                key={z.id}
                onClick={() => onSelectZone(z.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'bg-[#141923] text-slate-400 hover:text-slate-200 hover:bg-[#1A212E] border border-[#232A3B]'
                }`}
              >
                {z.label}
                <span className={`ml-1 text-[10px] ${isActive ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                  ({z.count})
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

