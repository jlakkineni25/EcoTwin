import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Station, StationForecast } from '../../types';
import { CPCB_CATEGORIES, getAQICategory } from '../../utils/aqi';
import { STATION_ZONE_MAPPING, DelhiZone, formatObservationTimestamp } from '../../utils/citizenZones';
import { AQICharacter, getCompanionDialogue } from './CitizenCharacters';
import { FloatingParticles } from './FloatingParticles';
import {
  MapPin,
  ChevronDown,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  BarChart,
  Search,
  X,
  MessageSquare,
  Sparkles,
  Check,
} from 'lucide-react';

interface Props {
  station: Station;
  forecast: StationForecast;
  allStations: Station[];
  allForecasts: StationForecast[];
  onSelectStation: (id: number) => void;
  citywideAvg: number;
  timestamp: string;
  onScrollToMap: () => void;
}

export const CitizenStationCard: React.FC<Props> = ({
  station,
  forecast,
  allStations,
  allForecasts,
  onSelectStation,
  citywideAvg,
  timestamp,
  onScrollToMap,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const currentVal = Math.round(forecast.current_pm25);
  const currentCat = forecast.current_aqi || getAQICategory(currentVal);
  const catCfg = CPCB_CATEGORIES[currentCat] || CPCB_CATEGORIES.Moderate;

  const timeInfo = formatObservationTimestamp(timestamp);
  const companionDialogue = useMemo(
    () => getCompanionDialogue(currentCat, station.name, currentVal),
    [currentCat, station.name, currentVal]
  );

  const zoneMeta = STATION_ZONE_MAPPING[station.id] || {
    zone: 'Central' as DelhiZone,
    areaType: 'Urban Area',
    landmark: 'Central Delhi',
  };

  // Safe CPCB 24-hr threshold
  const cpcbSafeThreshold = 60;
  const timesOverSafe = (currentVal / cpcbSafeThreshold).toFixed(1);

  // Difference from citywide average
  const diffFromAvg = currentVal - citywideAvg;
  const isCleanerThanAvg = diffFromAvg < 0;

  // Map station ID to forecast for search results
  const forecastMap = useMemo(() => {
    return new Map(allForecasts.map((f) => [f.station_id, f]));
  }, [allForecasts]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Compute Cleanest & Peak stations across Delhi
  const { cleanestStation, peakStation } = useMemo(() => {
    if (!allForecasts || allForecasts.length === 0) {
      return {
        cleanestStation: { name: 'Aya Nagar', val: 78, cat: 'Moderate' as const },
        peakStation: { name: 'Anand Vihar', val: 248, cat: 'Very Poor' as const },
      };
    }

    let minVal = Infinity;
    let minStationId = 0;
    let maxVal = -Infinity;
    let maxStationId = 0;

    allForecasts.forEach((f) => {
      if (f.current_pm25 < minVal) {
        minVal = f.current_pm25;
        minStationId = f.station_id;
      }
      if (f.current_pm25 > maxVal) {
        maxVal = f.current_pm25;
        maxStationId = f.station_id;
      }
    });

    const stationMap = new Map(allStations.map((s) => [s.id, s.name]));
    const minRounded = Math.round(minVal);
    const maxRounded = Math.round(maxVal);

    return {
      cleanestStation: {
        name: stationMap.get(minStationId) || 'Aya Nagar',
        val: minRounded,
        cat: getAQICategory(minRounded),
      },
      peakStation: {
        name: stationMap.get(maxStationId) || 'Anand Vihar',
        val: maxRounded,
        cat: getAQICategory(maxRounded),
      },
    };
  }, [allStations, allForecasts]);

  // Filter stations for search dropdown
  const filteredDropdownStations = useMemo(() => {
    if (!searchFilter.trim()) return allStations;
    const q = searchFilter.toLowerCase();
    return allStations.filter((s) => {
      const z = STATION_ZONE_MAPPING[s.id];
      const stF = forecastMap.get(s.id);
      const cat = stF?.current_aqi || '';
      return (
        s.name.toLowerCase().includes(q) ||
        z?.zone.toLowerCase().includes(q) ||
        z?.landmark.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q)
      );
    });
  }, [allStations, searchFilter, forecastMap]);

  return (
    <div className="space-y-4">
      {/* 1. PRIMARY FOCAL HERO: Selected Station Card */}
      <div className="bg-[#121620] border-2 border-[#232A3B] hover:border-slate-700 rounded-3xl p-5 sm:p-7 shadow-2xl relative transition-all">
        {/* Subtle floating ambient particles */}
        <FloatingParticles color={catCfg.color} count={10} className="opacity-40" />

        {/* Subtle category-colored glow backdrop */}
        <div
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ backgroundColor: catCfg.color }}
        />

        {/* SECTION A: Station Header & Quick Location Overview */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-bold">
                <MapPin className="w-3 h-3 text-emerald-400" />
                SELECTED NEIGHBORHOOD
              </span>
              <span className="text-[11px] font-mono text-slate-400 px-2.5 py-0.5 rounded-full bg-[#181E2B] border border-[#232A3B]">
                {zoneMeta.zone} Delhi
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {station.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Near {zoneMeta.landmark} · {zoneMeta.areaType}
            </p>
          </div>

          {/* Observation Time & Locate on Map */}
          <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-1.5 shrink-0">
            <button
              onClick={onScrollToMap}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181E2B] hover:bg-[#1E2638] border border-[#232A3B] text-slate-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
            >
              <span>Locate on Map</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <span className="text-[10px] font-mono text-slate-400">
              Observed: {timeInfo.formattedDate} at {timeInfo.formattedTime}
            </span>
          </div>
        </div>

        {/* SECTION B: Dedicated Station Finder (Fixed Position at Top of Panel, No Overlap) */}
        <div ref={searchContainerRef} className="relative z-30 mb-6">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => {
                  setSearchFilter(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Type to search or switch station (e.g. Rohini, Anand Vihar, Dwarka)..."
                className="w-full bg-[#0D111A] border border-[#232A3B] focus:border-emerald-500 rounded-2xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all shadow-inner"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-3 py-2.5 rounded-2xl bg-[#181E2B] hover:bg-[#1E2638] border border-[#232A3B] text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>37 Stations</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Clean Elevated Dropdown (Positioned safely below search input, never overlapping AQI display) */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-[#141A26] border border-[#232A3B] rounded-2xl shadow-2xl z-50 p-2 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-slate-400 border-b border-[#232A3B] flex items-center justify-between">
                <span>Select from 37 Delhi Monitoring Stations</span>
                <span>{filteredDropdownStations.length} Results</span>
              </div>

              <div className="space-y-1 pt-1">
                {filteredDropdownStations.map((st) => {
                  const stForecast = forecastMap.get(st.id);
                  const pm25Val = stForecast ? Math.round(stForecast.current_pm25) : 120;
                  const cat = stForecast?.current_aqi || getAQICategory(pm25Val);
                  const catColor = CPCB_CATEGORIES[cat]?.color || '#94A3B8';
                  const isSelected = st.id === station.id;

                  return (
                    <button
                      key={st.id}
                      onClick={() => {
                        onSelectStation(st.id);
                        setIsDropdownOpen(false);
                        setSearchFilter('');
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-emerald-500/20 text-white font-bold border border-emerald-500/40'
                          : 'text-slate-300 hover:bg-[#1C2436]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate pr-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: catColor }}
                        />
                        <div className="truncate">
                          <span className="font-semibold block truncate text-slate-100">
                            {st.name}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">
                            {STATION_ZONE_MAPPING[st.id]?.zone || 'Delhi'} Delhi · Near {STATION_ZONE_MAPPING[st.id]?.landmark}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-200">
                            {pm25Val} µg/m³
                          </span>
                          <span
                            className="block text-[9px] font-semibold"
                            style={{ color: catColor }}
                          >
                            {cat}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SECTION C: SEPARATE, STABLE LAYOUT FOR AQI READING, CHARACTER & ADVICE */}
        <div className="border-t border-[#232A3B]/80 pt-5 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Left: Main Number & Category Badge */}
            <div className="md:col-span-4 flex flex-col justify-center">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                Particulate Air Quality (PM2.5)
              </span>

              <div className="flex items-baseline gap-3">
                <span
                  className="text-6xl sm:text-7xl font-black font-mono tracking-tight"
                  style={{ color: catCfg.textHex }}
                >
                  {currentVal}
                </span>
                <div>
                  <span className="text-base font-bold text-slate-200 block">
                    µg/m³
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    CPCB Metric
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black font-mono border shadow-md"
                  style={{
                    backgroundColor: catCfg.bgHex,
                    borderColor: catCfg.borderHex,
                    color: catCfg.textHex,
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: catCfg.color }}
                  />
                  {currentCat.toUpperCase()}
                </span>
                <span className="text-xs text-slate-400">
                  National Standard
                </span>
              </div>
            </div>

            {/* Center: Expressive Human Companion Character */}
            <div className="md:col-span-3 flex justify-center items-center py-1">
              <div className="relative flex flex-col items-center">
                <AQICharacter category={currentCat} size={118} />
                <span className="text-[10px] font-mono uppercase font-semibold text-slate-400 mt-1">
                  {currentCat} Atmosphere
                </span>
              </div>
            </div>

            {/* Right: Friendly Companion Dialogue & Benchmark Comparison */}
            <div className="md:col-span-5 bg-[#0E121B] p-4 sm:p-5 rounded-2xl border border-[#232A3B] space-y-3">
              {/* Friendly Companion Speech Bubble */}
              <div className="flex items-start gap-2.5 bg-[#141A26] p-3 rounded-xl border border-slate-700/60 shadow-sm">
                <MessageSquare className="w-4 h-4 text-[#ECC138] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-bold text-[#ECC138] block mb-0.5">
                    EcoTwin Companion
                  </span>
                  <p className="text-xs text-slate-200 leading-snug">
                    "{companionDialogue.advice}"
                  </p>
                </div>
              </div>

              {/* Benchmark Comparison */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#232A3B]">
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    National Standard:
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    {timesOverSafe}× safe limit ({cpcbSafeThreshold} µg/m³)
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    Delhi Average:
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      isCleanerThanAvg ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {Math.abs(diffFromAvg)} µg/m³ {isCleanerThanAvg ? 'cleaner' : 'higher'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUBORDINATE DELHI-WIDE BENCHMARKS (Clearly Differentiated as Reference Points) */}
      <div className="bg-[#0E121B] border border-[#232A3B] rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-1.5">
            <BarChart className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              Delhi-Wide Context (Reference Across 37 Stations)
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {timeInfo.formattedDate}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Benchmark 1: Citywide Average */}
          <div className="p-3 rounded-xl bg-[#121620] border border-[#232A3B] flex items-center justify-between sm:flex-col sm:items-start">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Delhi Average (37 Nodes)
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Citywide Mean
              </span>
            </div>
            <div className="sm:mt-2 flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-slate-200">
                {citywideAvg}
              </span>
              <span className="text-xs text-slate-400">µg/m³</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 ml-1">
                {getAQICategory(citywideAvg)}
              </span>
            </div>
          </div>

          {/* Benchmark 2: Cleanest Monitored Station */}
          <div className="p-3 rounded-xl bg-[#121620] border border-[#232A3B] flex items-center justify-between sm:flex-col sm:items-start">
            <div>
              <span className="text-[10px] font-mono uppercase text-emerald-400 block">
                Lowest Station (Cleanest)
              </span>
              <span className="text-xs text-slate-300 font-semibold truncate block max-w-[140px]">
                {cleanestStation.name}
              </span>
            </div>
            <div className="sm:mt-2 flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-emerald-400">
                {cleanestStation.val}
              </span>
              <span className="text-xs text-slate-400">µg/m³</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ml-1">
                {cleanestStation.cat}
              </span>
            </div>
          </div>

          {/* Benchmark 3: Highest Hotspot */}
          <div className="p-3 rounded-xl bg-[#121620] border border-[#232A3B] flex items-center justify-between sm:flex-col sm:items-start">
            <div>
              <span className="text-[10px] font-mono uppercase text-rose-400 block">
                Highest Station (Peak)
              </span>
              <span className="text-xs text-slate-300 font-semibold truncate block max-w-[140px]">
                {peakStation.name}
              </span>
            </div>
            <div className="sm:mt-2 flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-rose-400">
                {peakStation.val}
              </span>
              <span className="text-xs text-slate-400">µg/m³</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 ml-1">
                {peakStation.cat}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
