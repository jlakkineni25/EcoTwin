import React, { useState, useMemo } from 'react';
import { useInView } from '../../hooks/useInView';
import { Station, StationForecast, WindEdgesMap } from '../../types';
import { useTwinStore } from '../../store/useTwinStore';
import { CPCB_CATEGORIES, getAQICategory } from '../../utils/aqi';
import { 
  Compass, 
  Wind, 
  ArrowDown, 
  Radio, 
  Network, 
  Activity, 
  Sparkles, 
  MapPin, 
  ShieldAlert, 
  Clock,
  Layers,
  CheckCircle2
} from 'lucide-react';

interface StoryTwinIntroProps {
  stations: Station[];
  currentFrame: { window_idx: number; timestamp: string; stations: StationForecast[] };
  windEdges?: WindEdgesMap;
}

export const StoryTwinIntro: React.FC<StoryTwinIntroProps> = ({
  stations,
  currentFrame,
  windEdges,
}) => {
  const { ref, isInView } = useInView({ threshold: 0.1 });
  const { 
    selectedStationId, 
    setSelectedStationId, 
    compassAngle, 
    windSpeedMultiplier 
  } = useTwinStore();

  // Clean layer toggles
  const [showEdges, setShowEdges] = useState<boolean>(true);
  const [showHalos, setShowHalos] = useState<boolean>(true);
  const [hoveredStationId, setHoveredStationId] = useState<number | null>(null);

  // Smooth scroll to the interactive Studio cockpit
  const scrollToStudio = () => {
    document.getElementById('twin-studio')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Map station ID to forecast object
  const forecastMap = useMemo(() => {
    return new Map(currentFrame.stations.map((f) => [f.station_id, f]));
  }, [currentFrame]);

  // Airshed statistics
  const airshedStats = useMemo(() => {
    if (!currentFrame.stations || currentFrame.stations.length === 0) {
      return { mean: 148, maxVal: 280, minVal: 65, maxStation: null, minStation: null };
    }
    const values = currentFrame.stations.map((f) => f.current_pm25);
    const mean = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const maxStationForecast = currentFrame.stations.find((f) => f.current_pm25 === maxVal);
    const minStationForecast = currentFrame.stations.find((f) => f.current_pm25 === minVal);
    const maxStation = stations.find((s) => s.id === maxStationForecast?.station_id) || stations[0];
    const minStation = stations.find((s) => s.id === minStationForecast?.station_id) || stations[stations.length - 1];

    return { mean, maxVal: Math.round(maxVal), minVal: Math.round(minVal), maxStation, minStation };
  }, [currentFrame, stations]);

  // Active station (selected or hovered)
  const activeStation = useMemo(() => {
    const idToFind = hoveredStationId ?? selectedStationId ?? stations[0]?.id;
    return stations.find((s) => s.id === idToFind) || stations[0];
  }, [hoveredStationId, selectedStationId, stations]);

  const activeForecast = useMemo(() => {
    return forecastMap.get(activeStation.id) || currentFrame.stations[0];
  }, [forecastMap, activeStation, currentFrame]);

  // Active directed graph links for this window
  const activeEdges = useMemo(() => {
    if (!windEdges) return [];
    const frameEdges = windEdges[String(currentFrame.window_idx)] || [];
    return frameEdges;
  }, [windEdges, currentFrame.window_idx]);

  // Wide-screen proportional projection for Delhi (960 x 540 viewBox)
  // Bounding box: Lon [76.84, 77.36], Lat [28.40, 28.88]
  const project = (lon: number, lat: number) => {
    const minLon = 76.84, maxLon = 77.36;
    const minLat = 28.40, maxLat = 28.88;
    const mapW = 560;
    const mapH = 480;
    const startX = (960 - mapW) / 2; // 200
    const startY = (540 - mapH) / 2; // 30
    const x = startX + ((lon - minLon) / (maxLon - minLon)) * mapW;
    const y = startY + ((maxLat - lat) / (maxLat - minLat)) * mapH;
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

  // Station coordinate mapping
  const stationCoordsMap = useMemo(() => {
    const map = new Map<number, { x: number; y: number }>();
    stations.forEach((s) => {
      map.set(s.id, project(s.lon, s.lat));
    });
    return map;
  }, [stations]);

  // Edges connected to the active station
  const focusedStationEdges = useMemo(() => {
    if (!activeStation) return { incoming: [], outgoing: [] };
    const incoming: number[] = [];
    const outgoing: number[] = [];
    activeEdges.forEach(([u, v]) => {
      if (u === activeStation.id) outgoing.push(v);
      if (v === activeStation.id) incoming.push(u);
    });
    return { incoming, outgoing };
  }, [activeStation, activeEdges]);

  const activeCategory = getAQICategory(activeForecast.current_pm25);
  const activeCatCfg = CPCB_CATEGORIES[activeCategory] || CPCB_CATEGORIES.Moderate;

  return (
    <section
      id="twin"
      ref={ref}
      className="relative min-h-screen py-16 sm:py-20 px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 bg-[#0B0E14] text-white flex flex-col justify-between border-t border-[#232A3B] overflow-hidden select-none"
    >
      {/* 1. Subtle Atmospheric Neural Glows */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ECC138]/06 via-[#ECC138]/02 to-transparent blur-3xl pointer-events-none"
      />
      <div 
        className="absolute bottom-10 right-10 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/20 via-transparent to-transparent blur-3xl pointer-events-none"
      />

      <div className="max-w-[1720px] mx-auto w-full relative z-10 my-auto space-y-10 sm:space-y-12">
        
        {/* 2. Strong, Wide-Screen Editorial Masthead */}
        <div
          className={`space-y-4 transition-all duration-1000 ease-out transform ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Eyebrow Pill */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#ECC138]/10 border border-[#ECC138]/30 text-[#ECC138] text-[11px] font-mono tracking-wider font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ECC138] animate-ping" />
              <span className="uppercase">CHAPTER 05 // THE DIGITAL TWIN</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <span className="text-slate-400 font-mono text-xs uppercase tracking-widest hidden sm:inline">
              Continuous Delhi NCT Airshed Intelligence
            </span>
          </div>

          {/* Oversized Typographic Focus: SEE THE INVISIBLE. */}
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 lg:gap-10">
            <div className="space-y-2">
              <h2 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-display font-extrabold uppercase tracking-tight text-[#FFFDF8] leading-[0.88] drop-shadow-2xl">
                SEE THE <span className="text-[#ECC138]">INVISIBLE.</span>
              </h2>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-lg bg-[#C89B6D] text-[#0B0E14] font-bold text-xs sm:text-sm font-mono tracking-wider shadow-md shadow-[#C89B6D]/20">
                <Compass className="w-3.5 h-3.5 text-[#0B0E14]" />
                <span>Delhi NCT Dynamic Airshed Digital Twin</span>
              </div>
            </div>

            <div className="xl:max-w-xl space-y-3">
              <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
                Air pollution is not a static number—it is a continuous fluid network. EcoTwin binds 37 continuous CAAQMS monitoring stations with live meteorological wind advection into a wind-aware neural twin, revealing hazardous nocturnal inversion plumes up to 18 hours before ground-level impact.
              </p>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#ECC138]" />
                  <span>37 CAAQMS Stations</span>
                </span>
                <span className="text-slate-600">·</span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Network className="w-3.5 h-3.5 text-[#C89B6D]" />
                  <span>{activeEdges.length} Dynamic Links A(t)</span>
                </span>
                <span className="text-slate-600">·</span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>14.5h Warning Lead</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. The Visual Hero: Expansive Wide-Screen Delhi Geographical Canvas */}
        <div
          className={`relative rounded-3xl bg-[#07090D] border border-[#232A3B] shadow-[0_0_80px_-20px_rgba(236,193,56,0.12)] overflow-hidden transition-all duration-700 ease-out transform ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '200ms' }}
        >
          {/* Geographical Canvas Container (Wide Aspect Ratio) */}
          <div className="relative w-full h-[520px] sm:h-[600px] lg:h-[680px] xl:h-[740px] flex items-center justify-center overflow-hidden">
            
            {/* SVG Visual Stage (960 x 540 viewBox) */}
            <svg
              viewBox="0 0 960 540"
              className="w-full h-full select-none"
              style={{ background: 'radial-gradient(ellipse at 50% 50%, #0D111A 0%, #07090D 100%)' }}
            >
              <defs>
                {/* Glowing Laser Filters */}
                <filter id="twin-wide-gold" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="twin-wide-cyan" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="twin-wide-halo" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="12" />
                </filter>

                {/* Edge Arrowhead for Wind Couplings A(t) */}
                <marker
                  id="twin-arrow-gold"
                  markerWidth="6"
                  markerHeight="6"
                  refX="5"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 6 3, 0 6" fill="#ECC138" />
                </marker>
              </defs>

              {/* 1. Ambient Fluid Wind Streamlines (Flowing North-West to South-East) */}
              <g opacity="0.18" className="pointer-events-none">
                {[60, 180, 300, 420, 540, 660, 780, 900].map((offset, i) => (
                  <line
                    key={i}
                    x1={offset - 160}
                    y1="0"
                    x2={offset + 220}
                    y2="540"
                    stroke="#ECC138"
                    strokeWidth="1.2"
                    strokeDasharray="8 18"
                    className="animate-pulse"
                  />
                ))}
              </g>

              {/* 2. Official Delhi NCT Boundary Polygon */}
              <path
                d={boundaryPath}
                fill="rgba(18, 22, 32, 0.45)"
                stroke="#ECC138"
                strokeWidth="1.8"
                strokeDasharray="5 4"
                strokeOpacity="0.75"
              />

              {/* Geographical Sector Labels */}
              <text x="350" y="55" fill="#94A3B8" fontSize="9" fontFamily="monospace" opacity="0.6">
                NORTH AIRSHED (BAWANA / NARELA)
              </text>
              <text x="130" y="320" fill="#94A3B8" fontSize="9" fontFamily="monospace" opacity="0.6">
                WEST INDUSTRIAL (MUNDKA / PUNJABI BAGH)
              </text>
              <text x="680" y="160" fill="#94A3B8" fontSize="9" fontFamily="monospace" opacity="0.6">
                EAST (ANAND VIHAR)
              </text>
              <text x="440" y="515" fill="#94A3B8" fontSize="9" fontFamily="monospace" opacity="0.6">
                SOUTH AIRSHED (OKHLA / AYA NAGAR)
              </text>

              {/* 3. Yamuna River Atmospheric Drainage Corridor */}
              <path
                d={yamunaPath}
                fill="none"
                stroke="#38BDF8"
                strokeWidth="6"
                strokeOpacity="0.25"
                filter="url(#twin-wide-cyan)"
              />
              <path
                d={yamunaPath}
                fill="none"
                stroke="#38BDF8"
                strokeWidth="2.2"
                strokeOpacity="0.85"
              />
              <text
                x="640"
                y="300"
                fill="#38BDF8"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
                opacity="0.85"
                transform="rotate(65 640 300)"
              >
                YAMUNA VENTILATION CORRIDOR
              </text>

              {/* 4. PM2.5 Dispersion Halos */}
              {showHalos && (
                <g className="pointer-events-none">
                  {stations.map((s) => {
                    const coord = stationCoordsMap.get(s.id);
                    if (!coord) return null;
                    const f = forecastMap.get(s.id);
                    const pm25 = f ? f.current_pm25 : 150;
                    const cat = getAQICategory(pm25);
                    const catCfg = CPCB_CATEGORIES[cat] || CPCB_CATEGORIES.Moderate;
                    const radius = Math.min(48, 14 + (pm25 / 10));

                    return (
                      <circle
                        key={`halo-${s.id}`}
                        cx={coord.x}
                        cy={coord.y}
                        r={radius}
                        fill={catCfg.color}
                        opacity="0.22"
                        filter="url(#twin-wide-halo)"
                      />
                    );
                  })}
                </g>
              )}

              {/* 5. Animated Wind-Aware Directed Graph Connections A(t) */}
              {showEdges && (
                <g>
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
                          strokeWidth={isFocused ? 2.5 : 1.2}
                          strokeOpacity={isFocused ? 0.95 : 0.45}
                          markerEnd="url(#twin-arrow-gold)"
                        />
                        {/* Animated Energy Comet Packet along each Wind Couplings */}
                        <circle r={isFocused ? '2.8' : '1.8'} fill="#FFFDF8">
                          <animateMotion
                            path={`M ${fromCoord.x} ${fromCoord.y} L ${toCoord.x} ${toCoord.y}`}
                            dur={`${2.0 + (idx % 5) * 0.4}s`}
                            repeatCount="indefinite"
                          />
                        </circle>
                      </g>
                    );
                  })}
                </g>
              )}

              {/* 6. 37 Continuous CAAQMS Monitoring Station Nodes */}
              <g className="station-nodes">
                {stations.map((s) => {
                  const coord = stationCoordsMap.get(s.id);
                  if (!coord) return null;

                  const forecast = forecastMap.get(s.id);
                  const pm25 = forecast ? Math.round(forecast.current_pm25) : 150;
                  const cat = getAQICategory(pm25);
                  const catCfg = CPCB_CATEGORIES[cat] || CPCB_CATEGORIES.Moderate;
                  const isSelected = s.id === activeStation.id;
                  const isSevere = pm25 >= 250;

                  return (
                    <g
                      key={`node-${s.id}`}
                      className="cursor-pointer transition-all duration-200"
                      onClick={() => setSelectedStationId(s.id)}
                      onMouseEnter={() => setHoveredStationId(s.id)}
                      onMouseLeave={() => setHoveredStationId(null)}
                    >
                      {/* Severe Pulsing Aura */}
                      {isSevere && (
                        <circle
                          cx={coord.x}
                          cy={coord.y}
                          r="18"
                          fill={catCfg.color}
                          opacity="0.25"
                          className="animate-ping"
                        />
                      )}

                      {/* Selection Ring */}
                      {isSelected && (
                        <circle
                          cx={coord.x}
                          cy={coord.y}
                          r="14"
                          fill="none"
                          stroke="#FFFDF8"
                          strokeWidth="2"
                          strokeDasharray="3 3"
                        />
                      )}

                      {/* Node Core */}
                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r={isSelected ? '8' : isSevere ? '6.5' : '5'}
                        fill={catCfg.color}
                        stroke="#0B0E14"
                        strokeWidth="1.8"
                        filter="url(#twin-wide-gold)"
                      />

                      {/* Station Label with high-contrast outline halo */}
                      <text
                        x={coord.x}
                        y={coord.y - 10}
                        fill={isSelected ? '#FFFDF8' : isSevere ? '#FCA5A5' : '#E2E8F0'}
                        fontSize={isSelected ? '10.5' : isSevere ? '9' : '8.5'}
                        fontFamily="monospace"
                        fontWeight={isSelected || isSevere ? 'bold' : '600'}
                        textAnchor="middle"
                        stroke="#07090D"
                        strokeWidth="2.5"
                        paintOrder="stroke fill"
                      >
                        {s.name.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* MINIMAL OVERLAY 1: Top-Left Prevailing Wind Telemetry */}
            <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#0B0E14]/85 backdrop-blur-md border border-[#232A3B] text-[11px] sm:text-xs font-mono">
              <Compass className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#ECC138]" />
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-slate-400 hidden sm:inline">Surface Wind:</span>
                <span className="text-[#FFFDF8] font-bold">{compassAngle}° NW @ {windSpeedMultiplier.toFixed(1)}x</span>
                <span className="text-slate-600 hidden md:inline">·</span>
                <span className="text-cyan-400 font-semibold hidden md:inline">Advection Active</span>
              </div>
            </div>

            {/* MINIMAL OVERLAY 2: Top-Right Minimal Layer Toggles */}
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-[#0B0E14]/85 backdrop-blur-md border border-[#232A3B] text-[11px] sm:text-xs font-mono">
              <button
                onClick={() => setShowEdges(!showEdges)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg transition-all ${
                  showEdges
                    ? 'bg-[#C89B6D] text-[#0B0E14] font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Toggle Wind-Aware Directed Edges A(t)"
              >
                <Network className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                <span>A(t) Mesh</span>
              </button>

              <button
                onClick={() => setShowHalos(!showHalos)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg transition-all ${
                  showHalos
                    ? 'bg-[#C89B6D] text-[#0B0E14] font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Toggle PM2.5 Dispersion Halos"
              >
                <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                <span>Halos</span>
              </button>
            </div>

            {/* MINIMAL OVERLAY 3: Bottom-Left Station Telemetry Card */}
            <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 z-20 p-3 sm:p-4 rounded-2xl bg-[#0B0E14]/90 backdrop-blur-md border border-[#232A3B] shadow-2xl max-w-[270px] sm:max-w-xs text-xs font-mono">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#232A3B]">
                <div className="flex items-center gap-1.5 text-[#ECC138] font-bold">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Station #{activeStation.id}</span>
                </div>
                <span 
                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: activeCatCfg.bgHex,
                    color: activeCatCfg.textHex,
                    border: `1px solid ${activeCatCfg.borderHex}`
                  }}
                >
                  {activeCategory}
                </span>
              </div>

              <div className="pt-2 space-y-1">
                <div className="text-sm font-display font-extrabold text-[#FFFDF8] truncate">
                  {activeStation.name}
                </div>
                <div className="flex items-baseline justify-between pt-0.5">
                  <span className="text-slate-400">Live PM2.5:</span>
                  <span className="text-lg font-display font-extrabold text-[#FFFDF8]">
                    {Math.round(activeForecast.current_pm25)} <span className="text-xs font-mono text-[#ECC138]">µg/m³</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <span>Plume Links:</span>
                  <span className="text-cyan-300 font-semibold">
                    {focusedStationEdges.incoming.length} Inflow · {focusedStationEdges.outgoing.length} Outflow
                  </span>
                </div>
              </div>
            </div>

            {/* MINIMAL OVERLAY 4: Bottom-Right CPCB Category Legend */}
            <div className="absolute bottom-4 right-4 z-20 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0B0E14]/85 backdrop-blur-md border border-[#232A3B] text-[10px] font-mono">
              <span className="text-slate-500 uppercase tracking-wider">CPCB Scale:</span>
              <span className="flex items-center gap-1 text-[#10B981]">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Good
              </span>
              <span className="flex items-center gap-1 text-[#FACC15]">
                <span className="w-2 h-2 rounded-full bg-[#FACC15]" /> Mod
              </span>
              <span className="flex items-center gap-1 text-[#FB923C]">
                <span className="w-2 h-2 rounded-full bg-[#FB923C]" /> Poor
              </span>
              <span className="flex items-center gap-1 text-[#EF4444]">
                <span className="w-2 h-2 rounded-full bg-[#EF4444]" /> Severe
              </span>
            </div>

          </div>

          {/* 4. Naturally Integrated Command & Launch CTA Bar Directly Beneath Map */}
          <div className="p-4 sm:p-6 bg-[#0B0E14] border-t border-[#232A3B] flex flex-col lg:flex-row items-center justify-between gap-6">
            
            {/* Left: Key Airshed Telemetry in Clean Editorial Typography */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 text-xs font-mono w-full lg:w-auto">
              <div>
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-[#ECC138]" />
                  <span>Airshed Mean</span>
                </div>
                <div className="text-xl sm:text-2xl font-display font-extrabold text-[#ECC138] mt-0.5">
                  {airshedStats.mean} <span className="text-xs font-mono text-slate-400 font-normal">µg/m³</span>
                </div>
                <div className="text-[10px] text-slate-400">37 Nodes Average</div>
              </div>

              <div>
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3 h-3 text-[#EF4444]" />
                  <span>Severe Hotspot</span>
                </div>
                <div className="text-xl sm:text-2xl font-display font-extrabold text-[#EF4444] mt-0.5 truncate">
                  {airshedStats.maxVal} <span className="text-xs font-mono text-slate-400 font-normal">µg/m³</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">{airshedStats.maxStation?.name}</div>
              </div>

              <div className="hidden sm:block">
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[#38BDF8]" />
                  <span>Breach Early Warning</span>
                </div>
                <div className="text-xl sm:text-2xl font-display font-extrabold text-[#38BDF8] mt-0.5">
                  14.5 <span className="text-xs font-mono text-slate-400 font-normal">Hours Lead</span>
                </div>
                <div className="text-[10px] text-slate-400">Prior to CPCB 60 Breach</div>
              </div>
            </div>

            {/* Right: Prominent Launch Action Button */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto justify-end">
              <button
                onClick={scrollToStudio}
                className="group relative inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-4.5 rounded-2xl bg-[#ECC138] text-[#0B0E14] font-display font-extrabold text-sm sm:text-base uppercase tracking-wider shadow-[0_0_40px_-5px_rgba(236,193,56,0.5)] hover:bg-[#FFFDF8] hover:shadow-[0_0_50px_0_rgba(255,253,248,0.6)] transition-all cursor-pointer transform hover:-translate-y-0.5 shrink-0"
              >
                <Compass className="w-5 h-5 text-[#0B0E14]" />
                <span>LAUNCH DIGITAL TWIN STUDIO</span>
                <ArrowDown className="w-4 h-4 stroke-[3] group-hover:translate-y-1 transition-transform" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};