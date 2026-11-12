import React, { useState, useMemo } from 'react';
import { useInView } from '../../hooks/useInView';
import { Station, StationForecast, WindEdgesMap, WhatIfData } from '../../types';
import { useTwinStore, StudioView } from '../../store/useTwinStore';
import { DigitalTwinMap } from '../map/DigitalTwinMap';
import { StationForecastPanel } from '../station/StationForecastPanel';
import { WhyForecastTab } from '../explainability/WhyForecastTab';
import { WhatIfStudio } from '../whatif/WhatIfStudio';
import { HealthAdvisor } from '../health/HealthAdvisor';
import { TimelineScrubber } from '../layout/TimelineScrubber';
import { CPCB_CATEGORIES, computeBreachProbability } from '../../utils/aqi';
import { generateStationAttribution } from '../../utils/explainability';
import { 
  Activity,
  TrendingUp, 
  Compass, 
  BrainCircuit, 
  HeartHandshake,
  Maximize2,
  Minimize2,
  MapPin,
  Clock,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  ArrowDownRight,
  Wind,
  Radio,
  Network,
  Columns2,
  Layers,
  PanelRight
} from 'lucide-react';

interface Props {
  stations: Station[];
  currentFrame: { window_idx: number; timestamp: string; stations: StationForecast[] };
  selectedStation: Station;
  selectedForecast: StationForecast;
  totalWindows: number;
  windEdges?: WindEdgesMap;
  whatIfData?: WhatIfData;
}

type MaximizeMode = 'split' | 'map' | 'inspector';

export const StoryTwinStudio: React.FC<Props> = ({
  stations,
  currentFrame,
  selectedStation,
  selectedForecast,
  totalWindows,
  windEdges,
  whatIfData,
}) => {
  const { ref, isInView } = useInView({ threshold: 0.1 });
  const { 
    activeStudioView, 
    setActiveStudioView, 
    compassAngle, 
    windSpeedMultiplier 
  } = useTwinStore();

  const [maximizeMode, setMaximizeMode] = useState<MaximizeMode>('split');

  // Compact inspector tab labels designed to fit neatly in one line
  const inspectorTabs: Array<{ id: StudioView; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'map', label: 'Overview', icon: Activity },
    { id: 'forecast', label: 'Forecast', icon: TrendingUp },
    { id: 'whatif', label: 'What-If', icon: Compass },
    { id: 'why', label: 'Why?', icon: BrainCircuit },
    { id: 'health', label: 'Advisory', icon: HeartHandshake },
  ];

  // Active edges for current frame
  const activeEdges = useMemo(() => {
    if (!windEdges) return [];
    return windEdges[String(currentFrame.window_idx)] || [];
  }, [windEdges, currentFrame.window_idx]);

  // Network average PM2.5 across all 37 stations in this frame
  const networkMean = useMemo(() => {
    if (!currentFrame.stations || currentFrame.stations.length === 0) return 0;
    const sum = currentFrame.stations.reduce((acc, f) => acc + f.current_pm25, 0);
    return Math.round(sum / currentFrame.stations.length);
  }, [currentFrame]);

  // Selected station metrics
  const currentVal = Math.round(selectedForecast.current_pm25);
  const peakVal = Math.round(selectedForecast.peak_predicted);
  const category = selectedForecast.current_aqi;
  const catConfig = CPCB_CATEGORIES[category] || CPCB_CATEGORIES.Moderate;
  const leadHours = selectedForecast.hours_to_breach_cpcb;

  // Max breach probability in next 6h
  const next6hMaxProb = useMemo(() => {
    const probs = selectedForecast.predicted_24h.slice(0, 6).map((pred, i) => 
      computeBreachProbability(pred, i, 60.0)
    );
    return Math.max(...probs, 0);
  }, [selectedForecast]);

  // Plain-Language Explainability Synthesis
  const attribution = useMemo(() => {
    return generateStationAttribution(selectedForecast, selectedStation, stations, activeEdges);
  }, [selectedForecast, selectedStation, stations, activeEdges]);

  // 24-hour Sparkline SVG path for Overview card
  const sparklineSvg = useMemo(() => {
    const series = selectedForecast.predicted_24h;
    if (!series || series.length === 0) return { path: '', thresholdY: 20, pts: [] };
    const max = Math.max(...series, 140);
    const min = Math.min(...series, 20);
    const range = Math.max(max - min, 1);
    const w = 300;
    const h = 42;

    const pts = series.map((val, i) => {
      const x = (i / (series.length - 1)) * (w - 16) + 8;
      const y = h - 6 - ((val - min) / range) * (h - 12);
      return { x, y, val: Math.round(val) };
    });

    let dStr = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx = (p0.x + p1.x) / 2;
      dStr += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const thresholdY = h - 6 - ((60.0 - min) / range) * (h - 12);
    return { path: dStr, thresholdY, pts };
  }, [selectedForecast]);

  return (
    <section
      id="twin-studio"
      ref={ref}
      className="relative min-h-screen py-16 sm:py-20 px-4 sm:px-6 lg:px-10 bg-[#0B0E14] text-white flex flex-col justify-between border-t border-[#232A3B]"
    >
      <div className="max-w-[1440px] mx-auto w-full">
        {/* Title Header & Command Bar */}
        <div
          className={`transition-all duration-1000 transform ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Eyebrow + Title Row with View Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[10px] sm:text-[11px] font-mono tracking-[0.2em] uppercase font-semibold text-[#C89B6D] mb-1 flex items-center gap-2">
                <span>Environmental Intelligence Platform</span>
                <span className="text-slate-600">/</span>
                <span className="text-slate-400">Delhi NCT Airshed</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-extrabold uppercase tracking-tight text-[#FFFDF8] leading-none">
                  Digital Twin Studio
                </h2>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECC138]/10 border border-[#ECC138]/30 text-[#ECC138] font-mono text-[11px] font-semibold tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ECC138] animate-pulse" />
                  <span>COMMAND COCKPIT</span>
                </div>
              </div>
              <p className="mt-1.5 text-xs sm:text-[13px] text-slate-400 font-light max-w-2xl leading-relaxed">
                Persistent spatial airshed canvas synchronized with real-time multi-horizon neural telemetry.
              </p>
            </div>

            {/* Split / Maximize Controls */}
            <div className="flex items-center gap-1 bg-[#121620] p-1 rounded-xl border border-[#232A3B] text-xs font-mono shrink-0 shadow-sm self-start sm:self-center">
              <button
                onClick={() => setMaximizeMode('split')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  maximizeMode === 'split'
                    ? 'bg-[#C89B6D] text-[#0B0E14] font-bold shadow'
                    : 'text-slate-400 hover:text-white hover:bg-[#1A202C]'
                }`}
                title="60% Map / 40% Inspector Split"
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>Split View</span>
              </button>
              <button
                onClick={() => setMaximizeMode('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  maximizeMode === 'map'
                    ? 'bg-[#C89B6D] text-[#0B0E14] font-bold shadow'
                    : 'text-slate-400 hover:text-white hover:bg-[#1A202C]'
                }`}
                title="Expand Map to Full Width"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Full Map</span>
              </button>
              <button
                onClick={() => setMaximizeMode('inspector')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  maximizeMode === 'inspector'
                    ? 'bg-[#C89B6D] text-[#0B0E14] font-bold shadow'
                    : 'text-slate-400 hover:text-white hover:bg-[#1A202C]'
                }`}
                title="Expand Flight Deck to Full Width"
              >
                <PanelRight className="w-3.5 h-3.5" />
                <span>Flight Deck</span>
              </button>
            </div>
          </div>

          {/* Precision Telemetry Instrumentation Ribbon */}
          <div className="mt-4 px-3.5 py-2.5 rounded-xl bg-[#121620]/80 backdrop-blur-md border border-[#232A3B] text-xs font-mono flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Radio className="w-3.5 h-3.5 text-[#ECC138]" />
                <span className="text-slate-400">Network:</span>
                <span className="text-[#FFFDF8] font-semibold">37 CAAQMS Nodes</span>
              </div>
              <div className="h-3 w-px bg-[#232A3B] hidden sm:block" />
              <div className="flex items-center gap-1.5 text-slate-300">
                <Network className="w-3.5 h-3.5 text-[#C89B6D]" />
                <span className="text-slate-400">Couplings:</span>
                <span className="text-[#FFFDF8] font-semibold">{activeEdges.length} Directed Links A(t)</span>
              </div>
              <div className="h-3 w-px bg-[#232A3B] hidden md:block" />
              <div className="flex items-center gap-1.5 text-slate-300">
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400">Wind Advection:</span>
                <span className="text-cyan-300 font-semibold">{compassAngle}° NW @ {windSpeedMultiplier.toFixed(1)}x</span>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Activity className="w-3.5 h-3.5 text-[#ECC138]" />
                <span className="text-slate-400">Airshed Mean:</span>
                <span className="text-[#ECC138] font-bold">{networkMean} µg/m³</span>
              </div>
              <div className="h-3 w-px bg-[#232A3B] hidden lg:block" />
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-300">{currentFrame.timestamp}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 60% Map / 40% Flight Deck Grid */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT: Persistent Interactive Map (60% width by default) */}
          {(maximizeMode === 'split' || maximizeMode === 'map') && (
            <div
              className={`min-w-0 max-w-full transition-all duration-300 ${
                maximizeMode === 'map'
                  ? 'lg:col-span-12'
                  : 'lg:col-span-7 xl:col-span-7'
              }`}
            >
              <DigitalTwinMap
                stations={stations}
                forecasts={currentFrame.stations}
                windEdgesMap={windEdges}
                windowIdx={currentFrame.window_idx}
                className="h-[460px] sm:h-[540px] lg:h-[620px] xl:h-[680px]"
                onToggleExpand={() => setMaximizeMode(maximizeMode === 'map' ? 'split' : 'map')}
                isExpanded={maximizeMode === 'map'}
              />
            </div>
          )}

          {/* RIGHT: Contextual Flight-Deck Inspector (40% width by default) */}
          {(maximizeMode === 'split' || maximizeMode === 'inspector') && (
            <div
              className={`min-w-0 max-w-full transition-all duration-300 ${
                maximizeMode === 'inspector'
                  ? 'lg:col-span-12'
                  : 'lg:col-span-5 xl:col-span-5'
              }`}
            >
              {/* Flight-Deck Inspector Card with Strict Containment */}
              <div className="rounded-2xl bg-[#121620] border border-[#232A3B] shadow-2xl flex flex-col h-[500px] sm:h-[560px] lg:h-[620px] xl:h-[680px] overflow-hidden w-full max-w-full">
                {/* Persistent Station Flight-Deck Header (Visible across all tabs) */}
                <div className="p-3 sm:p-4 border-b border-[#232A3B] bg-[#0B0E14] flex items-center justify-between gap-3 shrink-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-[#ECC138]">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-bold">Station #{selectedStation.id}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400 truncate">
                        {selectedStation.lat.toFixed(3)}°N, {selectedStation.lon.toFixed(3)}°E
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-display font-extrabold text-[#FFFDF8] tracking-tight mt-0.5 truncate">
                      {selectedStation.name}
                    </h3>
                  </div>

                  {/* Live PM2.5 Callout & CPCB Category Badge */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="flex items-baseline justify-end gap-1">
                        <span className="text-2xl sm:text-3xl font-display font-black text-[#FFFDF8] tracking-tight">
                          {currentVal}
                        </span>
                        <span className="text-xs font-mono text-[#ECC138]">µg/m³</span>
                      </div>
                    </div>

                    <div
                      className="px-2.5 py-1 rounded-xl border text-[11px] font-mono font-bold uppercase tracking-wider shrink-0 shadow-sm"
                      style={{
                        backgroundColor: catConfig.bgHex,
                        borderColor: catConfig.borderHex,
                        color: catConfig.textHex,
                      }}
                    >
                      {category}
                    </div>

                    <button
                      onClick={() => setMaximizeMode(maximizeMode === 'inspector' ? 'split' : 'inspector')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#ECC138] hover:bg-[#121620] border border-transparent hover:border-[#232A3B] transition-colors shrink-0"
                      title={maximizeMode === 'inspector' ? "Restore Cockpit Split" : "Expand Inspector to Full Width"}
                    >
                      {maximizeMode === 'inspector' ? <Minimize2 className="w-4 h-4 text-[#ECC138]" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Unified Segmented View Tabs */}
                <div className="px-3 sm:px-4 py-2 border-b border-[#232A3B] bg-[#121620] shrink-0">
                  <div className="flex items-center gap-1 bg-[#0B0E14] p-1 rounded-xl border border-[#232A3B] w-full overflow-x-auto scrollbar-none">
                    {inspectorTabs.map((t) => {
                      const Icon = t.icon;
                      const isActive = activeStudioView === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setActiveStudioView(t.id)}
                          className={`shrink-0 sm:flex-1 min-w-fit sm:min-w-0 flex items-center justify-center gap-1.5 py-1.5 px-3 sm:px-2 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                            isActive
                              ? 'bg-[#C89B6D] text-[#0B0E14] shadow-sm'
                              : 'text-slate-400 hover:text-white hover:bg-[#181E2B]'
                          }`}
                          title={t.label}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Inspector Content Body: Pure Vertical Scroll, Zero Horizontal Overflow */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 scrollbar-thin scrollbar-thumb-[#232A3B] scrollbar-track-transparent">
                  {/* TAB 1: Station Tactical Overview */}
                  {activeStudioView === 'map' && (
                    <div className="flex flex-col gap-4 animate-fade-in text-white w-full max-w-full min-w-0">
                      {/* Telemetry Metric Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#232A3B] flex flex-col justify-between">
                          <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
                            vs Airshed Mean
                          </span>
                          <div className="flex items-baseline gap-1 mt-1.5">
                            <span className={`text-xl font-display font-extrabold ${currentVal >= networkMean ? 'text-[#ECC138]' : 'text-slate-200'}`}>
                              {currentVal >= networkMean ? `+${currentVal - networkMean}` : currentVal - networkMean}
                            </span>
                            <span className="text-xs font-mono text-slate-400">µg/m³</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 mt-1">
                            Delhi Avg: {networkMean} µg/m³
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#232A3B] flex flex-col justify-between">
                          <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
                            24h Projected Peak
                          </span>
                          <div className="flex items-baseline gap-1 mt-1.5">
                            <span className="text-xl font-display font-extrabold text-[#FFFDF8]">
                              {peakVal}
                            </span>
                            <span className="text-xs font-mono text-slate-400">µg/m³</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-1 truncate">
                            {leadHours !== null ? (
                              <span className="text-[#ECC138] font-bold">⚠️ Breach: +{leadHours}h</span>
                            ) : (
                              <span className="text-[#C89B6D]">Safe / Compliant</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 24h Predictive Trajectory Sparkline & Breach Alert */}
                      <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#232A3B] flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-2 text-xs font-mono">
                          <span className="uppercase text-[#ECC138] font-bold flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#ECC138] shrink-0" />
                            <span>24h Predictive Trajectory</span>
                          </span>
                          
                          {leadHours !== null ? (
                            <span className="px-2 py-0.5 rounded-md bg-[#ECC138]/15 border border-[#ECC138]/40 text-[#ECC138] font-bold flex items-center gap-1 text-[11px] shrink-0">
                              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                              <span>Breach in +{leadHours}h ({next6hMaxProb}%)</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-[#C89B6D]/20 border border-[#C89B6D]/40 text-[#C89B6D] font-bold flex items-center gap-1 text-[11px] shrink-0">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Compliant</span>
                            </span>
                          )}
                        </div>

                        {/* Sparkline Canvas with Area Gradient */}
                        <div className="w-full h-14 overflow-hidden my-1">
                          <svg className="w-full h-full" viewBox="0 0 300 48" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="overviewSparkGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ECC138" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#ECC138" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            {/* Area fill */}
                            <path
                              d={`${sparklineSvg.path} L 300 48 L 0 48 Z`}
                              fill="url(#overviewSparkGrad)"
                            />
                            {/* Standard 60 threshold */}
                            <line
                              x1="0"
                              y1={sparklineSvg.thresholdY}
                              x2="300"
                              y2={sparklineSvg.thresholdY}
                              stroke="#C89B6D"
                              strokeWidth="1.2"
                              strokeDasharray="3 3"
                              opacity="0.7"
                            />
                            {/* Trajectory line */}
                            <path
                              d={sparklineSvg.path}
                              fill="none"
                              stroke="#ECC138"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>

                        <div className="flex justify-between items-center text-xs font-mono text-slate-400 border-t border-[#232A3B]/60 pt-2">
                          <span>Now: <b className="text-white font-bold">{currentVal}</b> µg/m³</span>
                          <span className="text-[#C89B6D]">CPCB Limit: 60 µg/m³</span>
                          <span>Peak: <b className="text-[#ECC138] font-bold">{peakVal}</b> µg/m³</span>
                        </div>
                      </div>

                      {/* Plain-Language Explainability Synthesis */}
                      <div className="p-4 rounded-xl bg-[#0B0E14] border-l-4 border-l-[#ECC138] border border-[#232A3B]">
                        <div className="text-xs font-mono uppercase text-[#ECC138] font-bold mb-1.5 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#ECC138] shrink-0" />
                          <span>Why This Forecast (Attribution)</span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-sans">
                          "{attribution.summarySentence}"
                        </p>

                        {/* Active Inflow Feeder Stations */}
                        {attribution.topUpwindStations.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-[#232A3B]/60 flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-400 uppercase flex items-center gap-1 mr-1">
                              <ArrowDownRight className="w-3.5 h-3.5 text-[#ECC138]" />
                              <span>Upwind:</span>
                            </span>
                            {attribution.topUpwindStations.slice(0, 3).map((u) => (
                              <div
                                key={u.id}
                                className="px-2.5 py-1 rounded-lg bg-[#121620] border border-[#232A3B] text-xs font-mono flex items-center gap-1.5"
                              >
                                <span className="text-slate-300 truncate max-w-[120px]">{u.name}</span>
                                <span className="text-[#ECC138] font-bold">w={u.weight}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quick Jump Navigation Buttons */}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <button
                          onClick={() => setActiveStudioView('forecast')}
                          className="py-2.5 px-3.5 rounded-xl bg-[#C89B6D] hover:bg-[#d8a879] text-[#0B0E14] font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md group"
                        >
                          <span>24h Fan Chart</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                        <button
                          onClick={() => setActiveStudioView('whatif')}
                          className="py-2.5 px-3.5 rounded-xl bg-[#0B0E14] hover:bg-[#181E2B] border border-[#232A3B] text-slate-200 font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm group"
                        >
                          <span>What-If Wind</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform text-[#ECC138]" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Full 24h Fan Chart with Intervals */}
                  {activeStudioView === 'forecast' && (
                    <div className="animate-fade-in w-full max-w-full">
                      <StationForecastPanel
                        station={selectedStation}
                        forecast={selectedForecast}
                        timestamp={currentFrame.timestamp}
                        isEmbedded
                      />
                    </div>
                  )}

                  {/* TAB 3: What-If Wind Engine */}
                  {activeStudioView === 'whatif' && (
                    <div className="animate-fade-in w-full max-w-full">
                      <WhatIfStudio
                        station={selectedStation}
                        baselineForecast={selectedForecast}
                        whatIfData={whatIfData}
                        windowIdx={currentFrame.window_idx}
                        isEmbedded
                      />
                    </div>
                  )}

                  {/* TAB 4: Explainability & Attention Strips */}
                  {activeStudioView === 'why' && (
                    <div className="animate-fade-in w-full max-w-full">
                      <WhyForecastTab
                        station={selectedStation}
                        forecast={selectedForecast}
                        allStations={stations}
                        windEdgesMap={windEdges}
                        windowIdx={currentFrame.window_idx}
                        isEmbedded
                      />
                    </div>
                  )}

                  {/* TAB 5: Weather Companion & Citizen Health */}
                  {activeStudioView === 'health' && (
                    <div className="animate-fade-in w-full max-w-full">
                      <HealthAdvisor
                        station={selectedStation}
                        forecast={selectedForecast}
                        timestamp={currentFrame.timestamp}
                        allStations={stations}
                        allForecasts={currentFrame.stations}
                        onNavigateToMap={() => setActiveStudioView('map')}
                        onNavigateToForecast={() => setActiveStudioView('forecast')}
                        isEmbedded
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Full-Bleed Docked Timeline Scrubber */}
        <div className="mt-5">
          <TimelineScrubber
            totalWindows={totalWindows}
            currentTimestamp={currentFrame.timestamp}
          />
        </div>
      </div>
    </section>
  );
};
