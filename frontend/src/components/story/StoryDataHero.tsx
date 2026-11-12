import React, { useState, useEffect, useMemo } from 'react';
import { useInView } from '../../hooks/useInView';
import { Station, StationForecast, WindEdgesMap } from '../../types';
import { useTwinStore } from '../../store/useTwinStore';
import { getAQICategory, getAQIColor, CPCB_CATEGORIES } from '../../utils/aqi';
import { 
  Wind, 
  Compass, 
  Radio, 
  Activity, 
  Layers, 
  Play, 
  Pause, 
  ChevronRight, 
  ChevronLeft, 
  ArrowDown, 
  ArrowUpRight, 
  Sparkles, 
  Info,
  Clock,
  TrendingUp,
  Network,
  Share2
} from 'lucide-react';

interface StoryDataHeroProps {
  stations: Station[];
  currentFrame: { window_idx: number; timestamp: string; stations: StationForecast[] };
  selectedStation: Station;
  selectedForecast: StationForecast;
  windEdges?: WindEdgesMap;
  onSwitchVariant?: () => void;
}

export const StoryDataHero: React.FC<StoryDataHeroProps> = ({
  stations,
  currentFrame,
  selectedStation,
  selectedForecast,
  windEdges,
  onSwitchVariant,
}) => {
  const { ref, isInView } = useInView({ threshold: 0.1 });
  const { selectedStationId, setSelectedStationId } = useTwinStore();

  // The Pudding-inspired step progression (0: Sensor Mesh, 1: Wind Dynamics, 2: Neural Forecast)
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [hoveredStationId, setHoveredStationId] = useState<number | null>(null);

  const forecastMap = useMemo(() => {
    return new Map(currentFrame.stations.map((f) => [f.station_id, f]));
  }, [currentFrame]);

  // Airshed statistics
  const airshedStats = useMemo(() => {
    const values = currentFrame.stations.map((f) => f.current_pm25);
    const mean = Math.round(values.reduce((a, b) => a + b, 0) / (values.length || 1));
    const maxVal = Math.max(...values, 0);
    const minVal = Math.min(...values, 0);
    const maxStation = currentFrame.stations.find((f) => f.current_pm25 === maxVal);
    const minStation = currentFrame.stations.find((f) => f.current_pm25 === minVal);
    const maxStationObj = stations.find((s) => s.id === maxStation?.station_id);
    const minStationObj = stations.find((s) => s.id === minStation?.station_id);

    return { mean, maxVal, minVal, maxStationObj, minStationObj };
  }, [currentFrame, stations]);

  // Auto-play timer for The Pudding story walk
  useEffect(() => {
    if (!isAutoPlaying || !isInView) return;
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % 3);
    }, 8000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, isInView]);

  // Geographical projection for Delhi SVG map (600 x 520 viewBox)
  // Bounding box: Lon [76.84, 77.36], Lat [28.40, 28.88]
  const project = (lon: number, lat: number) => {
    const minLon = 76.84, maxLon = 77.36;
    const minLat = 28.40, maxLat = 28.88;
    const pad = 42;
    const w = 600 - pad * 2;
    const h = 520 - pad * 2;
    const x = pad + ((lon - minLon) / (maxLon - minLon)) * w;
    const y = pad + ((maxLat - lat) / (maxLat - minLat)) * h;
    return { x, y };
  };

  // Delhi NCT Official Airshed boundary coordinates
  const delhiBoundaryCoords = [
    [76.84, 28.53],
    [76.88, 28.72],
    [77.02, 28.86],
    [77.16, 28.88],
    [77.26, 28.84],
    [77.34, 28.72],
    [77.33, 28.54],
    [77.31, 28.45],
    [77.20, 28.41],
    [77.02, 28.42],
    [76.84, 28.53],
  ];

  const boundaryPath = useMemo(() => {
    return (
      delhiBoundaryCoords
        .map(([lon, lat], i) => {
          const { x, y } = project(lon, lat);
          return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(' ') + ' Z'
    );
  }, []);

  // Yamuna River atmospheric drainage corridor
  const yamunaCoords = [
    [77.23, 28.88],
    [77.22, 28.80],
    [77.23, 28.72],
    [77.24, 28.67],
    [77.26, 28.62],
    [77.28, 28.58],
    [77.31, 28.53],
    [77.33, 28.45],
  ];

  const yamunaPath = useMemo(() => {
    return yamunaCoords
      .map(([lon, lat], i) => {
        const { x, y } = project(lon, lat);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, []);

  // Active directed graph links for this window
  const activeEdges = useMemo(() => {
    if (!windEdges) return [];
    const frameEdges = windEdges[String(currentFrame.window_idx)] || [];
    return frameEdges.slice(0, 28);
  }, [windEdges, currentFrame.window_idx]);

  // Station coordinate mapping
  const stationCoordsMap = useMemo(() => {
    const map = new Map<number, { x: number; y: number }>();
    stations.forEach((s) => {
      map.set(s.id, project(s.lon, s.lat));
    });
    return map;
  }, [stations]);

  // Active highlighted station details
  const activeStation = useMemo(() => {
    const targetId = hoveredStationId !== null ? hoveredStationId : selectedStationId;
    return stations.find((s) => s.id === targetId) || selectedStation;
  }, [hoveredStationId, selectedStationId, stations, selectedStation]);

  const activeForecast = useMemo(() => {
    return forecastMap.get(activeStation.id) || selectedForecast;
  }, [forecastMap, activeStation.id, selectedForecast]);

  // 24h Forecast mini-sparkline curve for Step 3
  const forecastSeries = useMemo(() => {
    const actual = activeForecast?.actual_24h || [];
    const predicted = activeForecast?.predicted_24h || [];
    const all = [...actual, ...predicted];
    const minVal = all.length > 0 ? Math.max(0, Math.min(...all) - 15) : 0;
    const maxVal = all.length > 0 ? Math.max(...all, 150) + 20 : 200;
    const range = Math.max(maxVal - minVal, 1);

    const w = 520;
    const h = 110;
    const padX = 24;
    const padY = 14;
    const plotW = w - padX * 2;
    const plotH = h - padY * 2;

    const actualPts = actual.map((v, i) => ({
      x: padX + (i / 23) * plotW,
      y: h - padY - ((v - minVal) / range) * plotH,
      v,
    }));

    const predPts = predicted.map((v, i) => ({
      x: padX + (i / 23) * plotW,
      y: h - padY - ((v - minVal) / range) * plotH,
      v,
    }));

    let predPath = '';
    predPts.forEach((p, i) => {
      predPath += `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
    });

    let actualPath = '';
    actualPts.forEach((p, i) => {
      actualPath += `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
    });

    const cpcbThresholdY = h - padY - ((60 - minVal) / range) * plotH;
    const peakIndex = predicted.indexOf(Math.max(...predicted, 0));
    const peakPoint = predPts[peakIndex] || predPts[0];

    return {
      w,
      h,
      predPath,
      actualPath,
      predPts,
      cpcbThresholdY,
      peakPoint,
      peakIndex,
      minVal,
      maxVal,
    };
  }, [activeForecast]);

  const scrollToCrisis = () => {
    document.getElementById('crisis')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTwin = () => {
    document.getElementById('twin')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Chapter metadata with refined narrative hierarchy & highlight terms
  const steps = [
    {
      step: 0,
      badge: 'CHAPTER 01 // SENSOR MESH',
      phase: 'Spatial Observation',
      title: '37 Continuous Stations Reveal a Fragmented Airshed',
      subtitle: 'The Flaw of Citywide Averages · Localized Concentration Gradients',
      lead: (
        <>
          Official bulletins often publish a single citywide AQI. In reality, Delhi’s atmosphere is intensely fractured. High-emission industrial basins like <strong className="text-[#FFFDF8]">Anand Vihar</strong> exceed <span className="text-[#EF4444] font-semibold">380 µg/m³</span>, while upwind forest zones remain half that level. Single-station forecasters miss this spatial disparity.
        </>
      ),
      instruction: 'Hover or click any sensor node to inspect localized microclimates and CPCB severity across the NCT perimeter.',
      stats: [
        { label: 'CAAQMS Grid', val: '37 Continuous Nodes', color: '#FFFDF8' },
        { label: 'Airshed Mean', val: `${airshedStats.mean} µg/m³`, color: '#ECC138' },
        { label: 'Spatial Spread', val: `Δ ${airshedStats.maxVal - airshedStats.minVal} µg/m³`, color: '#EF4444' }
      ]
    },
    {
      step: 1,
      badge: 'CHAPTER 02 // WIND COUPLINGS',
      phase: 'Physical Advection Dynamics',
      title: 'Why Static Graphs Fail: Wind Dictates Connectivity',
      subtitle: 'Dynamic Adjacency A(t) · Directed Plume Transport',
      lead: (
        <>
          Standard Graph Neural Networks assume static Euclidean adjacency—stations exchange features equally with nearest neighbors. But particulate matter (<span className="text-[#ECC138] font-semibold">PM2.5</span>) is physically carried by surface winds. When winter winds blow at <span className="text-[#38BDF8] font-semibold">315° NW</span>, upwind emissions inject downwind in narrow plume corridors.
        </>
      ),
      instruction: 'Observe the dynamic directed vectors A(t). Moving energy packets follow winter wind streamlines, carrying particulate mass downwind.',
      stats: [
        { label: 'Winter Advection', val: '315° NW Vector', color: '#38BDF8' },
        { label: 'Directed Links', val: `${activeEdges.length} Active Couplings`, color: '#ECC138' },
        { label: 'Transport Law', val: '∂c/∂t = -u·∇c', color: '#C89B6D' }
      ]
    },
    {
      step: 2,
      badge: 'CHAPTER 03 // 24H FORECAST',
      phase: 'Neural Spatio-Temporal Prediction',
      title: 'Predicting Inversion Spikes 24 Hours in Advance',
      subtitle: 'Physics-Informed WA-TGCN · Multi-Horizon Early Warning',
      lead: (
        <>
          EcoTwin couples dynamic wind-conditioned adjacency matrices <strong className="text-[#ECC138]">A(t)</strong> with temporal recurrent units (<span className="text-[#10B981] font-semibold">WA-TGCN</span>). Instead of reacting after the air turns hazardous, the digital twin anticipates toxic winter inversion spikes <strong className="text-[#FFFDF8]">12 to 18 hours before</strong> peak concentrations reach ground level.
        </>
      ),
      instruction: 'Inspect the 24-hour neural forecast fan curve below. Notice how the model flags impending CPCB threshold breaches in advance.',
      stats: [
        { label: 'Forecast Horizon', val: '24 Hours Ahead', color: '#FFFDF8' },
        { label: 'Test Accuracy', val: '±8.9 µg/m³ MAE', color: '#10B981' },
        { label: 'Lead Time', val: '14.5 Hours Early', color: '#ECC138' }
      ]
    }
  ];

  const currentStepData = steps[currentStep];

  return (
    <section
      id="crisis"
      ref={ref}
      className="relative min-h-screen flex flex-col justify-between pt-24 pb-8 px-4 sm:px-8 lg:px-12 bg-[#0B0E14] text-white overflow-hidden select-none"
    >
      {/* Subtle Background Grid & Ambient Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#232A3B12_1px,transparent_1px),linear-gradient(to_bottom,#232A3B12_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ECC138]/06 via-transparent to-transparent blur-3xl pointer-events-none" />

      {/* 1. Header Toolbar with The Pudding Story Stepper & Variant Switcher */}
      <div className="relative z-20 max-w-7xl mx-auto w-full pb-4 border-b border-[#232A3B] flex flex-wrap items-center justify-between gap-4">
        {/* Thesis Attribution & Mode Pill */}
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ECC138] animate-ping" />
          <div className="text-xs font-mono">
            <span className="text-[#FFFDF8] font-bold">ECOTWIN</span>
            <span className="text-slate-600 mx-2">/</span>
            <span className="text-[#C89B6D] uppercase">Interactive Data Story</span>
            <span className="text-slate-500 hidden sm:inline"> (The Pudding Direction)</span>
          </div>
        </div>

        {/* Stepper Controls + Variant Switcher */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* 3-Step Chapter Pill Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-[#121620] border border-[#232A3B] text-xs font-mono">
            {steps.map((s, idx) => (
              <button
                key={s.step}
                onClick={() => setCurrentStep(idx)}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentStep === idx
                    ? 'bg-[#C89B6D] text-[#0B0E14] font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>0{idx + 1}</span>
                <span className="hidden md:inline">
                  {idx === 0 ? 'Sensors' : idx === 1 ? 'Wind A(t)' : 'Forecast'}
                </span>
              </button>
            ))}
          </div>

          {/* Auto-Play Story Toggle */}
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={`p-2 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              isAutoPlaying
                ? 'bg-[#ECC138]/20 border-[#ECC138] text-[#ECC138]'
                : 'bg-[#121620] border-[#232A3B] text-slate-400 hover:text-white'
            }`}
            title={isAutoPlaying ? 'Pause story progression' : 'Auto-advance data story every 8s'}
          >
            {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isAutoPlaying ? 'Playing' : 'Auto-Walk'}</span>
          </button>

          {/* Switch to Cinematic Variant Button */}
          {onSwitchVariant && (
            <button
              onClick={onSwitchVariant}
              className="px-3 py-1.5 rounded-xl bg-[#121620] hover:bg-[#1A202C] border border-[#232A3B] text-slate-300 hover:text-[#ECC138] text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Switch to Cinematic Atmospheric Hero (Refokus/Cula)"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#ECC138]" />
              <span className="hidden sm:inline">Cinematic Hero</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Data Story Stage: Left Scrollytelling Narrative + Right Evolving Graphic */}
      <div className="relative z-10 max-w-7xl mx-auto w-full my-auto py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: The Narrative Story Card (The Pudding format) */}
          <div
            className={`lg:col-span-5 space-y-5 transition-all duration-500 transform ${
              isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {/* Step Progress Ribbon */}
            <div className="flex items-center gap-2">
              {[0, 1, 2].map((idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className="flex-1 h-1.5 rounded-full cursor-pointer transition-all duration-500 overflow-hidden bg-[#232A3B]"
                >
                  <div
                    className={`h-full transition-all duration-500 ${
                      currentStep >= idx ? 'bg-[#ECC138]' : 'bg-transparent'
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Chapter Eyebrow & Phase */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-0.5 rounded-md bg-[#ECC138]/10 border border-[#ECC138]/30 text-[#ECC138] font-bold">
                {currentStepData.badge}
              </span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-400 uppercase tracking-wider text-[11px]">
                {currentStepData.phase}
              </span>
            </div>

            {/* Editorial Title & Subtitle */}
            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-extrabold uppercase tracking-tight text-[#FFFDF8] leading-tight">
                {currentStepData.title}
              </h2>
              <p className="text-xs sm:text-sm font-mono text-[#C89B6D] tracking-wide">
                {currentStepData.subtitle}
              </p>
            </div>

            {/* Explanatory Narrative Lead with Highlight Terms */}
            <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
              {currentStepData.lead}
            </p>

            {/* Interactive Reader Callout Banner */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-[#121620]/90 border border-[#232A3B] flex items-start gap-3">
              <Info className="w-4 h-4 text-[#ECC138] shrink-0 mt-0.5" />
              <p className="text-xs font-mono text-slate-300 leading-normal">
                {currentStepData.instruction}
              </p>
            </div>

            {/* Chapter Specific Metrics Strip */}
            <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-[#232A3B] font-mono">
              {currentStepData.stats.map((st, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-[#121620]/60 border border-[#232A3B]/60">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">{st.label}</div>
                  <div className="text-xs sm:text-sm font-bold mt-1" style={{ color: st.color }}>
                    {st.val}
                  </div>
                </div>
              ))}
            </div>

            {/* Stepper Navigation & CTAs */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                disabled={currentStep === 0}
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                className="px-3.5 py-2.5 rounded-xl bg-[#121620] hover:bg-[#1A202C] disabled:opacity-40 disabled:cursor-not-allowed border border-[#232A3B] text-slate-300 font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev Chapter</span>
              </button>

              <button
                disabled={currentStep === 2}
                onClick={() => setCurrentStep((prev) => Math.min(2, prev + 1))}
                className="px-4 py-2.5 rounded-xl bg-[#C89B6D] hover:bg-[#D5A97D] text-[#0B0E14] font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Next Chapter</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={scrollToTwin}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ECC138] hover:bg-white text-[#0B0E14] font-display font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#ECC138]/20"
              >
                <span>Launch Studio</span>
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>
          </div>

          {/* Right Column: The Living Geographical Data Stage (Evolving across Chapters) */}
          <div
            className={`lg:col-span-7 relative transition-all duration-700 transform ${
              isInView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            {/* The SVG Airshed Graphic Canvas Container */}
            <div className="relative rounded-2xl bg-[#121620]/90 backdrop-blur-xl border border-[#232A3B] p-3 sm:p-4 shadow-2xl overflow-hidden">
              
              {/* Stage Top Bar: Contextual Status Evolving Across Chapters */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-2 border-b border-[#232A3B] text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white font-bold">DELHI NCT AIR BASIN</span>
                  <span className="text-slate-500 hidden sm:inline">•</span>
                  <span className="text-[#ECC138] font-semibold">
                    {currentStep === 0
                      ? 'Layer 1: Sensor Mesh & Dispersion'
                      : currentStep === 1
                      ? 'Layer 2: Dynamic A(t) Directed Links'
                      : 'Layer 3: 24h Multi-Horizon Forecast'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px]">
                  <div className="flex items-center gap-1 text-slate-300">
                    <Compass className="w-3 h-3 text-[#ECC138]" />
                    <span>315° NW Wind</span>
                  </div>
                  <span className="text-slate-600 hidden sm:inline">•</span>
                  <div className="flex items-center gap-1 text-slate-300">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{currentFrame.timestamp}</span>
                  </div>
                </div>
              </div>

              {/* Persistent SVG Map Stage with Evolving Visual Layers */}
              <div className="relative w-full aspect-[600/400] bg-[#07090D] rounded-xl overflow-hidden border border-[#232A3B]/60">
                <svg
                  viewBox="0 0 600 520"
                  className="w-full h-full select-none"
                  style={{ background: 'radial-gradient(ellipse at 50% 50%, #10141D 0%, #07090D 100%)' }}
                >
                  <defs>
                    {/* Glowing Filters */}
                    <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="blur-halo" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
                    </filter>

                    {/* Edge Arrow Marker for Directed Couplings */}
                    <marker
                      id="arrowhead-gold"
                      markerWidth="6"
                      markerHeight="6"
                      refX="5"
                      refY="3"
                      orient="auto"
                    >
                      <polygon points="0 0, 6 3, 0 6" fill="#ECC138" opacity="0.9" />
                    </marker>
                  </defs>

                  {/* 1. Atmospheric Ambient Wind Flow Corridors (Smooth crossfade in Chapter 2 & 3) */}
                  <g
                    className="transition-opacity duration-700 pointer-events-none"
                    style={{ opacity: currentStep >= 1 ? 0.35 : 0 }}
                  >
                    {[50, 130, 210, 290, 370, 450, 530].map((offset, i) => (
                      <line
                        key={i}
                        x1={offset - 80}
                        y1="0"
                        x2={offset + 220}
                        y2="520"
                        stroke="#ECC138"
                        strokeWidth="1.2"
                        strokeDasharray="8 16"
                        className="animate-pulse"
                      />
                    ))}
                  </g>

                  {/* 2. Delhi NCT Official Boundary Polygon */}
                  <path
                    d={boundaryPath}
                    fill="rgba(18, 22, 32, 0.55)"
                    stroke="#ECC138"
                    strokeWidth="1.8"
                    strokeDasharray="4 3"
                    strokeOpacity="0.75"
                  />

                  {/* 3. Yamuna River Atmospheric Drainage Corridor */}
                  <path
                    d={yamunaPath}
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="4"
                    strokeOpacity="0.25"
                    filter="url(#glow-cyan)"
                  />
                  <path
                    d={yamunaPath}
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="1.8"
                    strokeOpacity="0.75"
                  />

                  <text
                    x="420"
                    y="320"
                    fill="#38BDF8"
                    fontSize="9"
                    fontFamily="monospace"
                    opacity="0.65"
                    transform="rotate(65 420 320)"
                  >
                    YAMUNA CORRIDOR
                  </text>

                  {/* 4. Chapter 1 Special: Soft Pollution Dispersion Halos */}
                  <g
                    className="transition-opacity duration-700 pointer-events-none"
                    style={{ opacity: currentStep === 0 ? 0.85 : 0.25 }}
                  >
                    {stations.map((s) => {
                      const coord = stationCoordsMap.get(s.id);
                      if (!coord) return null;
                      const f = forecastMap.get(s.id);
                      const pm25 = f ? f.current_pm25 : 150;
                      const color = getAQIColor(getAQICategory(pm25));
                      const radius = Math.min(38, 12 + (pm25 / 14));

                      return (
                        <circle
                          key={`halo-${s.id}`}
                          cx={coord.x}
                          cy={coord.y}
                          r={radius}
                          fill={color}
                          opacity="0.18"
                          filter="url(#blur-halo)"
                        />
                      );
                    })}
                  </g>

                  {/* 5. Chapter 2 & 3: Dynamic Directed Graph Edges A(t) */}
                  <g
                    className="transition-opacity duration-700"
                    style={{ opacity: currentStep >= 1 ? 1 : 0 }}
                  >
                    {activeEdges.map(([u, v], idx) => {
                      const fromCoord = stationCoordsMap.get(u);
                      const toCoord = stationCoordsMap.get(v);
                      if (!fromCoord || !toCoord) return null;

                      const isFocused = u === activeStation.id || v === activeStation.id;

                      return (
                        <g key={`edge-${idx}`}>
                          <line
                            x1={fromCoord.x}
                            y1={fromCoord.y}
                            x2={toCoord.x}
                            y2={toCoord.y}
                            stroke={isFocused ? '#ECC138' : '#C89B6D'}
                            strokeWidth={isFocused ? 2 : 1}
                            strokeOpacity={isFocused ? 0.95 : 0.45}
                            markerEnd="url(#arrowhead-gold)"
                          />
                          {/* Animated Energy Comet Packet along the Link */}
                          {currentStep >= 1 && (
                            <circle r={isFocused ? '2.5' : '1.8'} fill="#FFFDF8">
                              <animateMotion
                                path={`M ${fromCoord.x} ${fromCoord.y} L ${toCoord.x} ${toCoord.y}`}
                                dur={`${2.2 + (idx % 4) * 0.4}s`}
                                repeatCount="indefinite"
                              />
                            </circle>
                          )}
                        </g>
                      );
                    })}
                  </g>

                  {/* 6. 37 Monitoring Station Nodes (Persistent Geographical Anchor) */}
                  <g className="station-nodes">
                    {stations.map((s) => {
                      const coord = stationCoordsMap.get(s.id);
                      if (!coord) return null;

                      const forecast = forecastMap.get(s.id);
                      const pm25 = forecast ? forecast.current_pm25 : 150;
                      const category = getAQICategory(pm25);
                      const color = getAQIColor(category);
                      const isSelected = s.id === activeStation.id;
                      const isHovered = s.id === hoveredStationId;

                      // Forecast trend (rising/falling) for Chapter 3
                      const predicted = forecast?.predicted_24h || [];
                      const isSpikePredicted = predicted.some((v) => v > 250);

                      return (
                        <g
                          key={s.id}
                          className="cursor-pointer"
                          onClick={() => setSelectedStationId(s.id)}
                          onMouseEnter={() => setHoveredStationId(s.id)}
                          onMouseLeave={() => setHoveredStationId(null)}
                        >
                          {/* Concentric Radar Ring for Selected Station */}
                          {isSelected && (
                            <>
                              <circle
                                cx={coord.x}
                                cy={coord.y}
                                r="16"
                                fill="none"
                                stroke="#ECC138"
                                strokeWidth="1.5"
                                strokeDasharray="3 3"
                                className="animate-spin"
                                style={{ transformOrigin: `${coord.x}px ${coord.y}px`, animationDuration: '8s' }}
                              />
                              <circle
                                cx={coord.x}
                                cy={coord.y}
                                r="22"
                                fill="none"
                                stroke="#ECC138"
                                strokeWidth="1"
                                opacity="0.4"
                              />
                            </>
                          )}

                          {/* Outer Node Disc */}
                          <circle
                            cx={coord.x}
                            cy={coord.y}
                            r={isSelected ? '9' : isHovered ? '7' : '5'}
                            fill={color}
                            fillOpacity={isSelected ? 0.95 : 0.8}
                            stroke="#0B0E14"
                            strokeWidth="1.5"
                            className="transition-all duration-300"
                          />

                          {/* Core White Pip */}
                          <circle
                            cx={coord.x}
                            cy={coord.y}
                            r={isSelected ? '3' : '1.8'}
                            fill="#FFFFFF"
                          />

                          {/* Chapter 3 Forecast Trend Pip */}
                          {currentStep === 2 && isSpikePredicted && (
                            <circle
                              cx={coord.x + 6}
                              cy={coord.y - 6}
                              r="2"
                              fill="#EF4444"
                              className="animate-ping"
                            />
                          )}

                          {/* Station Name Label */}
                          {(isSelected || s.id === 0 || s.id === 6 || s.id === 8 || s.id === 4) && (
                            <text
                              x={coord.x + 8}
                              y={coord.y + 4}
                              fill={isSelected ? '#ECC138' : '#CBD5E1'}
                              fontSize={isSelected ? '11' : '9'}
                              fontWeight={isSelected ? 'bold' : 'normal'}
                              fontFamily="monospace"
                              filter="drop-shadow(0 1px 2px rgba(0,0,0,0.9))"
                            >
                              {s.name}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                </svg>

                {/* Selected Node Floating HUD Tooltip */}
                <div className="absolute top-3 left-3 max-w-[240px] p-2.5 rounded-xl bg-[#0B0E14]/90 backdrop-blur-md border border-[#232A3B] shadow-2xl font-mono text-xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>STATION #{activeStation.id}</span>
                    <span 
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                      style={{ 
                        backgroundColor: `${getAQIColor(getAQICategory(activeForecast.current_pm25))}22`,
                        color: getAQIColor(getAQICategory(activeForecast.current_pm25))
                      }}
                    >
                      {activeForecast.current_aqi}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white mt-1 truncate">
                    {activeStation.name}
                  </div>
                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#232A3B] text-[11px]">
                    <span className="text-slate-400">Current PM2.5:</span>
                    <span className="font-extrabold text-[#ECC138]">
                      {activeForecast.current_pm25} µg/m³
                    </span>
                  </div>
                </div>

                {/* Map Bottom Scale & Coordinates Strip */}
                <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-slate-400 pointer-events-none">
                  <span>28.64° N, 77.21° E · Delhi Air Basin</span>
                  <span className="text-[#ECC138]">10 km Scale Bar ━</span>
                </div>
              </div>

              {/* 7. Contextual Telemetry Tray (Smoothly evolving across all 3 chapters) */}
              <div className="mt-3 p-3 rounded-xl bg-[#07090D] border border-[#232A3B] transition-all duration-500">
                
                {/* Chapter 1 Mode: CPCB AQI Scale & Airshed Disparity Bar */}
                {currentStep === 0 && (
                  <div className="space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Radio className="w-3.5 h-3.5 text-[#ECC138]" />
                        <span>CPCB Air Quality Classification Spectrum</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Peak: <b className="text-[#EF4444]">{airshedStats.maxStationObj?.name} ({airshedStats.maxVal} µg/m³)</b>
                      </div>
                    </div>
                    {/* Horizontal CPCB Scale Bar */}
                    <div className="grid grid-cols-6 gap-1 text-center text-[10px] font-mono">
                      <div className="py-1 rounded bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981]">Good (0–30)</div>
                      <div className="py-1 rounded bg-[#84CC16]/15 border border-[#84CC16]/30 text-[#84CC16]">Satisfactory (31–60)</div>
                      <div className="py-1 rounded bg-[#FACC15]/15 border border-[#FACC15]/30 text-[#FACC15]">Moderate (61–90)</div>
                      <div className="py-1 rounded bg-[#FB923C]/15 border border-[#FB923C]/30 text-[#FB923C]">Poor (91–120)</div>
                      <div className="py-1 rounded bg-[#F87171]/15 border border-[#F87171]/30 text-[#F87171]">Very Poor (121–250)</div>
                      <div className="py-1 rounded bg-[#DC2626]/15 border border-[#DC2626]/30 text-[#F87171] font-bold">Severe (&gt;250)</div>
                    </div>
                  </div>
                )}

                {/* Chapter 2 Mode: Wind Advection Flux & Directed Links Telemetry */}
                {currentStep === 1 && (
                  <div className="space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <Network className="w-3.5 h-3.5 text-[#38BDF8]" />
                        <span className="text-slate-200 font-bold">Directed Transport Graph Connectivity A(t)</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="text-[#38BDF8]">Heading: 315° NW</span>
                        <span className="text-slate-600">•</span>
                        <span>Velocity: 2.4 m/s</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1 border-t border-[#232A3B]/60">
                      <div className="text-slate-400">
                        Active Directed Edges: <b className="text-[#FFFDF8]">{activeEdges.length} pairs</b>
                      </div>
                      <div className="text-slate-400">
                        Selected Node Degree: <b className="text-[#ECC138]">
                          {activeEdges.filter(([u, v]) => u === activeStation.id || v === activeStation.id).length} links
                        </b>
                      </div>
                      <div className="text-slate-400 text-right">
                        Advective Regime: <b className="text-cyan-400">Inversion Trapped</b>
                      </div>
                    </div>
                  </div>
                )}

                {/* Chapter 3 Mode: 24h Ahead Neural Prediction Sparkline */}
                {currentStep === 2 && (
                  <div className="space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-[#ECC138]" />
                        <span className="text-slate-200 font-bold">24-Hour Ahead Neural Prediction Trajectory</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-0.5 bg-[#ECC138]" /> Predicted (WA-TGCN)
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-0.5 bg-slate-500" /> Actual Ground Truth
                        </span>
                        <span className="text-amber-400 font-semibold">
                          CPCB: 60 µg/m³
                        </span>
                      </div>
                    </div>

                    {/* SVG Forecast Sparkline */}
                    <div className="w-full h-24 relative">
                      <svg viewBox={`0 0 ${forecastSeries.w} ${forecastSeries.h}`} className="w-full h-full">
                        {/* CPCB Threshold line at 60 µg/m³ */}
                        <line
                          x1="24"
                          y1={forecastSeries.cpcbThresholdY}
                          x2={forecastSeries.w - 24}
                          y2={forecastSeries.cpcbThresholdY}
                          stroke="#F59E0B"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={forecastSeries.w - 24}
                          y={forecastSeries.cpcbThresholdY - 4}
                          fill="#F59E0B"
                          fontSize="9"
                          textAnchor="end"
                          fontFamily="monospace"
                        >
                          CPCB LIMIT 60 µg/m³
                        </text>

                        {/* Actual Curve */}
                        <path
                          d={forecastSeries.actualPath}
                          fill="none"
                          stroke="#64748B"
                          strokeWidth="1.5"
                        />

                        {/* Predicted Curve (Industrial Gold) */}
                        <path
                          d={forecastSeries.predPath}
                          fill="none"
                          stroke="#ECC138"
                          strokeWidth="2.2"
                        />

                        {/* Points along Predicted curve */}
                        {forecastSeries.predPts.map((p, i) => (
                          <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r={i % 6 === 0 ? 3 : 1.5}
                            fill="#ECC138"
                          />
                        ))}

                        {/* Peak Hour Annotation */}
                        <circle
                          cx={forecastSeries.peakPoint.x}
                          cy={forecastSeries.peakPoint.y}
                          r="4"
                          fill="#EF4444"
                          stroke="#FFFFFF"
                          strokeWidth="1"
                        />
                      </svg>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-[#232A3B]">
                      <span>t=0 (Observation)</span>
                      <span>+6h</span>
                      <span>+12h (Early Breach Alert)</span>
                      <span>+18h (Peak Inflow)</span>
                      <span>+24h Horizon</span>
                    </div>
                  </div>
                )}

              </div>

            </div>
          </div>

        </div>
      </div>

      {/* 3. Minimalist Presentation Footer */}
      <div className="relative z-10 max-w-7xl mx-auto w-full pt-3 border-t border-[#232A3B] flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-3 text-slate-400">
          <span className="px-2.5 py-1 rounded bg-[#ECC138]/10 text-[#ECC138] border border-[#ECC138]/30">
            DELHI CAAQMS MESH
          </span>
          <span className="hidden sm:inline">19,921 Hourly Timesteps · 37 Continuous Stations</span>
        </div>

        <button
          onClick={scrollToCrisis}
          className="flex items-center gap-2 text-slate-400 hover:text-[#ECC138] transition-colors group cursor-pointer"
        >
          <span>Continue The Story</span>
          <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform text-[#ECC138]" />
        </button>
      </div>
    </section>
  );
};
