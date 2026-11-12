import React, { useEffect, useRef, useState, useMemo } from 'react';
import maplibregl, { Map as MapLibreMap, Marker } from 'maplibre-gl';
import { useTwinStore } from '../../store/useTwinStore';
import { Station, StationForecast, WindEdgesMap } from '../../types';
import { CPCB_CATEGORIES, getAQICategory } from '../../utils/aqi';
import {
  Wind,
  Network,
  Layers,
  ZoomIn,
  ZoomOut,
  Compass,
  Search,
  AlertTriangle,
  X,
  Maximize2,
  Minimize2,
  Sparkles,
  Crosshair,
  MapPin,
  Navigation,
} from 'lucide-react';

interface Props {
  stations: Station[];
  forecasts: StationForecast[];
  windEdgesMap?: WindEdgesMap;
  windowIdx: number;
  className?: string;
  onToggleExpand?: () => void;
  isExpanded?: boolean;
}

export const DigitalTwinMap: React.FC<Props> = ({
  stations,
  forecasts,
  windEdgesMap,
  windowIdx,
  className,
  onToggleExpand,
  isExpanded,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const {
    selectedStationId,
    setSelectedStationId,
    showAirshedGraph,
    setShowAirshedGraph,
    showWindParticles,
    setShowWindParticles,
    compassAngle,
    windSpeedMultiplier,
    scenarioKey,
  } = useTwinStore();

  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [basemapMode, setBasemapMode] = useState<'satellite' | 'hybrid' | 'vector'>('satellite');
  const [satelliteOpacity, setSatelliteOpacity] = useState<number>(0.92);

  // Live cursor telemetry state (lat, lon, zoom, airshed sector)
  const [cursorTelemetry, setCursorTelemetry] = useState<{
    lat: string;
    lon: string;
    zoom: string;
    sector: string;
  }>({
    lat: '28.6400',
    lon: '77.2100',
    zoom: '10.2',
    sector: 'Central NCT / Lutyens Airshed',
  });

  // Map station ID to station object
  const stationMap = useMemo(() => new Map(stations.map((s) => [s.id, s])), [stations]);

  // Map station ID to forecast object
  const forecastMap = useMemo(
    () => new Map(forecasts.map((f) => [f.station_id, f])),
    [forecasts]
  );

  // Filtered stations for search (matches name or ID)
  const filteredStations = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return stations.filter((s) => s.name.toLowerCase().includes(q) || String(s.id) === q).slice(0, 6);
  }, [stations, searchQuery]);

  // Active breach alerts sorted by lead time
  const breachAlerts = useMemo(() => {
    return forecasts
      .filter((f) => f.hours_to_breach_cpcb !== null)
      .sort((a, b) => (a.hours_to_breach_cpcb || 0) - (b.hours_to_breach_cpcb || 0))
      .slice(0, 3)
      .map((f) => ({
        id: f.station_id,
        name: stationMap.get(f.station_id)?.name || `Station #${f.station_id}`,
        leadHours: f.hours_to_breach_cpcb,
        peakVal: Math.round(f.peak_predicted),
      }));
  }, [forecasts, stationMap]);

  const flyToStation = (stationId: number) => {
    const s = stationMap.get(stationId);
    if (s && mapRef.current) {
      mapRef.current.flyTo({ center: [s.lon, s.lat], zoom: 12.4, duration: 1200 });
      setSelectedStationId(stationId);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Active edges for this time window
  const activeEdges = useMemo(() => {
    if (!windEdgesMap) return [];
    return windEdgesMap[String(windowIdx)] || [];
  }, [windEdgesMap, windowIdx]);

  // Helper to categorize sector by coordinates
  const getAirshedSector = (lat: number, lon: number) => {
    if (lat > 28.74) return 'North NCT / Alipur Air Basin';
    if (lat < 28.52) return 'South NCT / Okhla-Faridabad Basin';
    if (lon > 77.30) return 'East NCT / Trans-Yamuna Corridor';
    if (lon < 77.10) return 'West NCT / Najafgarh Airshed';
    return 'Central NCT / Lutyens Airshed';
  };

  // Initialize MapLibre with Esri World Dark Gray Canvas (Watermark-free, high-contrast GIS)
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Delhi center coordinates
    const delhiCenter: [number, number] = [77.21, 28.64];

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          // Esri Dark Gray Base: High-contrast, clean dark GIS cartography with zero API key requirement/watermarks
          'esri-dark-base': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            attribution: 'Tiles © Esri — DeLorme, NAVTEQ',
          },
          // Esri Dark Reference: High-contrast street names, highways, and district boundaries
          'esri-dark-reference': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'esri-dark-base-layer',
            type: 'raster',
            source: 'esri-dark-base',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: delhiCenter,
      zoom: 10.2,
      maxZoom: 15,
      minZoom: 8.5,
      attributionControl: false,
    });

    map.on('load', () => {
      // 1. Add Delhi Nocturnal Satellite Overlay Layer (exact georeferenced bounding box)
      if (!map.getSource('delhi-satellite-source')) {
        map.addSource('delhi-satellite-source', {
          type: 'image',
          url: '/images/delhi-satellite-night.jpg',
          coordinates: [
            [76.84, 28.92], // NW Top-Left
            [77.46, 28.92], // NE Top-Right
            [77.46, 28.36], // SE Bottom-Right
            [76.84, 28.36], // SW Bottom-Left
          ],
        });

        map.addLayer({
          id: 'delhi-satellite-layer',
          type: 'raster',
          source: 'delhi-satellite-source',
          paint: {
            'raster-opacity': 0.92,
            'raster-fade-duration': 300,
          },
        });
      }

      // 2. Add Esri Dark Reference Layer on top of satellite so street names & arterial labels remain readable
      if (!map.getLayer('esri-dark-reference-layer')) {
        map.addLayer({
          id: 'esri-dark-reference-layer',
          type: 'raster',
          source: 'esri-dark-reference',
          paint: {
            'raster-opacity': 0.55,
            'raster-fade-duration': 300,
          },
        });
      }

      // 3. Add Delhi NCT Official Airshed Boundary perimeter (high geographical orientation)
      if (!map.getSource('delhi-boundary-source')) {
        map.addSource('delhi-boundary-source', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
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
              ]],
            },
            properties: { name: 'Delhi NCT Official Airshed Perimeter' },
          },
        });

        map.addLayer({
          id: 'delhi-boundary-outline',
          type: 'line',
          source: 'delhi-boundary-source',
          paint: {
            'line-color': '#ECC138',
            'line-width': 1.6,
            'line-dasharray': [4, 3],
            'line-opacity': 0.7,
          },
        });
      }

      // 4. Add Yamuna River Airshed Advection Spine (Delhi's primary wind advection channel)
      if (!map.getSource('yamuna-spine-source')) {
        map.addSource('yamuna-spine-source', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [77.23, 28.88],
                [77.22, 28.80],
                [77.23, 28.72],
                [77.24, 28.67],
                [77.26, 28.62],
                [77.28, 28.58],
                [77.31, 28.53],
                [77.33, 28.45],
              ],
            },
            properties: { name: 'Yamuna River Atmospheric Drainage Corridor' },
          },
        });

        map.addLayer({
          id: 'yamuna-spine-glow',
          type: 'line',
          source: 'yamuna-spine-source',
          paint: {
            'line-color': '#38BDF8',
            'line-width': 4.0,
            'line-opacity': 0.3,
          },
        });

        map.addLayer({
          id: 'yamuna-spine-core',
          type: 'line',
          source: 'yamuna-spine-source',
          paint: {
            'line-color': '#7DD3FC',
            'line-width': 1.4,
            'line-opacity': 0.75,
            'line-dasharray': [4, 2],
          },
        });
      }

      setMapLoaded(true);
    });

    // Real-time cursor coordinates tracking
    map.on('mousemove', (e) => {
      const lat = e.lngLat.lat;
      const lon = e.lngLat.lng;
      setCursorTelemetry({
        lat: lat.toFixed(4),
        lon: lon.toFixed(4),
        zoom: map.getZoom().toFixed(1),
        sector: getAirshedSector(lat, lon),
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Synchronize Satellite raster layer & Reference layer opacity with active Basemap mode
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;
    const satLayer = map.getLayer('delhi-satellite-layer');
    const refLayer = map.getLayer('esri-dark-reference-layer');
    if (!satLayer) return;

    if (basemapMode === 'vector') {
      map.setPaintProperty('delhi-satellite-layer', 'raster-opacity', 0);
      if (refLayer) map.setPaintProperty('esri-dark-reference-layer', 'raster-opacity', 1.0);
    } else if (basemapMode === 'hybrid') {
      map.setPaintProperty('delhi-satellite-layer', 'raster-opacity', 0.55);
      if (refLayer) map.setPaintProperty('esri-dark-reference-layer', 'raster-opacity', 0.85);
    } else {
      // Satellite mode
      map.setPaintProperty('delhi-satellite-layer', 'raster-opacity', satelliteOpacity);
      if (refLayer) map.setPaintProperty('esri-dark-reference-layer', 'raster-opacity', 0.45);
    }
  }, [basemapMode, satelliteOpacity, mapLoaded]);

  // High-Visibility Station Markers & Selected-Node Highlighting
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    stations.forEach((station) => {
      const f = forecastMap.get(station.id);
      const pm25 = f ? Math.round(f.current_pm25) : 0;
      const category = f ? f.current_aqi : getAQICategory(pm25);
      const catConfig = CPCB_CATEGORIES[category] || CPCB_CATEGORIES.Moderate;
      const isSelected = station.id === selectedStationId;

      // Text color inside the node for 100% legibility on any category background
      const textColor = category === 'Moderate' || category === 'Satisfactory' ? '#0B0E14' : '#FFFDF8';

      // Custom HTML element for station node styled in high-visibility cyber/GIS aesthetics
      const el = document.createElement('div');
      el.className = `group relative cursor-pointer flex flex-col items-center transition-all ${
        isSelected ? 'z-50' : 'z-20 hover:z-40'
      }`;
      el.onclick = (e) => {
        e.stopPropagation();
        setSelectedStationId(station.id);
      };

      el.innerHTML = `
        <div class="relative flex flex-col items-center">
          ${
            isSelected
              ? `
                <!-- Selected Station Expanded Target Telemetry Badge -->
                <div class="absolute bottom-full mb-3 px-3 py-1.5 rounded-xl bg-[#0B0E14]/95 backdrop-blur-xl border-2 border-[#ECC138] shadow-[0_0_24px_rgba(236,193,56,0.6)] flex flex-col items-center whitespace-nowrap z-50 pointer-events-none animate-in fade-in duration-200">
                  <div class="flex items-center gap-1.5 text-[9px] font-mono font-black uppercase text-[#ECC138] tracking-widest">
                    <span class="w-2 h-2 rounded-full bg-[#ECC138] animate-ping"></span>
                    <span>TARGET NODE · NODE #${station.id}</span>
                  </div>
                  <div class="text-xs font-display font-extrabold text-[#FFFDF8] mt-0.5 tracking-tight">${station.name}</div>
                  <div class="flex items-center gap-2 mt-1 text-[10px] font-mono">
                    <span class="px-1.5 py-0.5 rounded font-black text-[#0B0E14]" style="background-color: ${catConfig.color};">${pm25} µg/m³</span>
                    <span class="text-slate-300 font-semibold">${category}</span>
                    ${f?.hours_to_breach_cpcb !== null ? `<span class="text-[#ECC138] font-bold">⚠️ Breach: +${f?.hours_to_breach_cpcb}h</span>` : ''}
                  </div>
                </div>

                <!-- Dual Concentric Animated Radar Ping Halo -->
                <div class="absolute -inset-4 rounded-full border-2 border-[#ECC138] animate-ping opacity-60"></div>
                <div class="absolute -inset-2.5 rounded-full border border-[#FFFDF8] animate-pulse opacity-80"></div>

                <!-- Military/NASA HUD Target Bracket Reticles -->
                <div class="absolute -top-3 -left-3 w-2.5 h-2.5 border-t-2 border-l-2 border-[#ECC138]"></div>
                <div class="absolute -top-3 -right-3 w-2.5 h-2.5 border-t-2 border-r-2 border-[#ECC138]"></div>
                <div class="absolute -bottom-3 -left-3 w-2.5 h-2.5 border-b-2 border-l-2 border-[#ECC138]"></div>
                <div class="absolute -bottom-3 -right-3 w-2.5 h-2.5 border-b-2 border-r-2 border-[#ECC138]"></div>
              `
              : `
                <!-- Hover Pulse -->
                <div class="absolute -inset-2 rounded-full opacity-0 group-hover:opacity-60 transition-opacity blur-[2px]" style="background-color: ${catConfig.color};"></div>
              `
          }

          <!-- Main Station Cyber Marker Dial -->
          <div class="relative w-9 h-9 rounded-full bg-[#0B0E14] flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.8)] transition-all duration-200 group-hover:scale-115 ${
            isSelected
              ? 'border-2 border-[#FFFDF8] scale-125 ring-4 ring-[#ECC138]/50 shadow-[0_0_20px_rgba(236,193,56,0.8)]'
              : 'border-2'
          }" style="border-color: ${isSelected ? '#ECC138' : catConfig.color};">
            <!-- Concentric Inner Pill holding PM2.5 -->
            <div class="w-7 h-7 rounded-full flex items-center justify-center font-mono font-black text-[10px] tracking-tighter"
                 style="background-color: ${catConfig.color}; color: ${textColor}; text-shadow: 0 1px 2px rgba(0,0,0,0.4);">
              ${pm25}
            </div>
          </div>

          <!-- Downward Geocoded Pointer Pip -->
          <div class="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] -mt-[1px]"
               style="border-top-color: ${isSelected ? '#ECC138' : catConfig.color};"></div>
        </div>

        <!-- Normal Hover Station Name Pill (hidden when selected since it has the big telemetry badge) -->
        ${
          !isSelected
            ? `
              <div class="mt-1 px-2.5 py-0.5 rounded-xl bg-[#0B0E14]/90 backdrop-blur-md border border-[#232A3B] text-[10px] font-medium text-[#FFFDF8] whitespace-nowrap shadow-xl pointer-events-none opacity-85 group-hover:opacity-100 group-hover:border-[#C89B6D] transition-all flex items-center gap-1.5 z-20">
                <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${catConfig.color}"></span>
                <span class="font-medium">${station.name}</span>
                <span class="font-mono text-[9px] font-bold text-[#ECC138]">${pm25}</span>
              </div>
            `
            : ''
        }
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([station.lon, station.lat])
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [stations, forecastMap, selectedStationId, mapLoaded, setSelectedStationId]);

  // High-Contrast Canvas: Dynamic A(t) Graph Edge Conduits & Wind-Flow Particles
  useEffect(() => {
    const canvas = canvasRef.current;
    const map = mapRef.current;
    if (!canvas || !map || !mapLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to match map container
    const updateCanvasSize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    updateCanvasSize();
    const handleResize = () => updateCanvasSize();
    window.addEventListener('resize', handleResize);

    // Uniformly distributed atmospheric wind streamlines across Delhi NCR bounding box
    const PARTICLE_COUNT = 240;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => {
      return {
        x: 76.84 + Math.random() * (77.46 - 76.84),
        y: 28.36 + Math.random() * (28.92 - 28.36),
        age: Math.random() * 100,
        maxAge: 70 + Math.random() * 60,
        speed: 0.00075 * (0.8 + Math.random() * 0.4),
      };
    });

    let pulsePhase = 0;

    const render = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      pulsePhase += 0.032;

      // 1. Draw High-Contrast Dynamic A(t) Graph Corridors (dual-pass neon glow & directional pulses)
      if (showAirshedGraph && activeEdges.length > 0) {
        const maxW = Math.max(...activeEdges.map((e) => e[2]), 1.0);

        activeEdges.forEach(([srcId, tgtId, weight]) => {
          const srcStation = stationMap.get(srcId);
          const tgtStation = stationMap.get(tgtId);
          if (!srcStation || !tgtStation) return;

          const p1 = map.project([srcStation.lon, srcStation.lat]);
          const p2 = map.project([tgtStation.lon, tgtStation.lat]);

          const relW = weight / maxW;
          const isConnectedToSelected =
            srcId === selectedStationId || tgtId === selectedStationId;

          // Curvature perpendicular to direction of flow
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const curveFactor = Math.min(0.18, 20 / Math.max(dist, 1));
          const midX = (p1.x + p2.x) / 2 - dy * curveFactor;
          const midY = (p1.y + p2.y) / 2 + dx * curveFactor;

          // Pass 1: Broad Ambient Conduit Glow (High contrast on dark basemaps)
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);

          if (isConnectedToSelected) {
            ctx.strokeStyle = `rgba(236, 193, 56, ${0.45 + relW * 0.45})`;
            ctx.lineWidth = 6.5 + relW * 4.5;
            ctx.shadowColor = '#ECC138';
            ctx.shadowBlur = 14;
          } else {
            ctx.strokeStyle = `rgba(200, 155, 109, ${0.22 + relW * 0.28})`;
            ctx.lineWidth = 3.0 + relW * 2.5;
            ctx.shadowColor = '#C89B6D';
            ctx.shadowBlur = 6;
          }
          ctx.stroke();

          // Pass 2: Laser Vector Core Beam
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
          ctx.shadowBlur = 0;

          if (isConnectedToSelected) {
            ctx.strokeStyle = `rgba(254, 240, 138, 0.95)`;
            ctx.lineWidth = 2.6 + relW * 2.0;
          } else {
            ctx.strokeStyle = `rgba(224, 185, 140, 0.72)`;
            ctx.lineWidth = 1.3 + relW * 1.3;
          }
          ctx.stroke();

          // Pass 3: Traveling Energy Comet Packets (showing advection flow direction)
          const pulseCount = isConnectedToSelected ? 2 : 1;
          for (let i = 0; i < pulseCount; i++) {
            const t = ((pulsePhase * (0.8 + relW * 0.5) + i * 0.5) % 1.0);
            const px = (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * midX + t * t * p2.x;
            const py = (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * midY + t * t * p2.y;

            ctx.beginPath();
            ctx.arc(px, py, isConnectedToSelected ? 3.6 : 2.2, 0, Math.PI * 2);
            ctx.fillStyle = isConnectedToSelected ? '#FFFDF8' : '#ECC138';
            ctx.shadowColor = '#ECC138';
            ctx.shadowBlur = isConnectedToSelected ? 8 : 4;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });
      }

      // 2. Draw Aerodynamic Atmospheric Wind Streamlines (Luminous Gold Streamlines)
      if (showWindParticles) {
        let angleRad = (compassAngle * Math.PI) / 180;
        let speedMult = windSpeedMultiplier;

        if (scenarioKey === 'wind_x2') speedMult *= 2.0;
        if (scenarioKey === 'wind_nw') angleRad = (315 * Math.PI) / 180;
        if (scenarioKey === 'wind_rev') angleRad = ((compassAngle + 180) * Math.PI) / 180;

        // Downwind flow vector: wind FROM direction blows TO (angle + 180)
        const flowAngle = angleRad + Math.PI;
        const dx = Math.cos(flowAngle);
        const dy = Math.sin(flowAngle);

        const trailBaseLen = 16 * speedMult;

        particles.forEach((p) => {
          p.age += 1;
          if (p.age >= p.maxAge) {
            p.x = 76.84 + Math.random() * (77.46 - 76.84);
            p.y = 28.36 + Math.random() * (28.92 - 28.36);
            p.age = 0;
          }

          // Advance along wind vector
          p.x += dx * p.speed * speedMult;
          p.y -= dy * p.speed * speedMult * 0.85;

          const screenPt = map.project([p.x, p.y]);
          if (
            screenPt.x >= -30 &&
            screenPt.x <= width + 30 &&
            screenPt.y >= -30 &&
            screenPt.y <= height + 30
          ) {
            const progress = p.age / p.maxAge;
            const alpha = Math.sin(progress * Math.PI) * 0.75;
            const trailLen = trailBaseLen * (0.8 + Math.sin(progress * Math.PI) * 0.4);

            // Tapered luminous gradient streak
            const grad = ctx.createLinearGradient(
              screenPt.x,
              screenPt.y,
              screenPt.x - dx * trailLen,
              screenPt.y + dy * trailLen
            );
            grad.addColorStop(0, `rgba(254, 240, 138, ${alpha})`);
            grad.addColorStop(0.35, `rgba(236, 193, 56, ${alpha * 0.75})`);
            grad.addColorStop(1, `rgba(200, 155, 109, 0)`);

            ctx.beginPath();
            ctx.moveTo(screenPt.x, screenPt.y);
            ctx.lineTo(screenPt.x - dx * trailLen, screenPt.y + dy * trailLen);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2.0;
            ctx.stroke();

            // Glowing tracer tip at leading edge
            ctx.beginPath();
            ctx.arc(screenPt.x, screenPt.y, 1.2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 253, 248, ${alpha * 0.95})`;
            ctx.fill();
          }
        });
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [
    mapLoaded,
    showAirshedGraph,
    showWindParticles,
    activeEdges,
    stationMap,
    selectedStationId,
    compassAngle,
    windSpeedMultiplier,
    scenarioKey,
  ]);

  // Re-fit MapLibre viewport when cockpit expands or collapses
  useEffect(() => {
    if (!mapRef.current) return;
    const timer = setTimeout(() => {
      mapRef.current?.resize();
    }, 200);
    return () => clearTimeout(timer);
  }, [isExpanded]);

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-[#232A3B] bg-[#0B0E14] shadow-2xl ${className || 'h-[640px]'}`}>
      {/* MapLibre DOM container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Cinematic Map Edge Vignette for visual depth & focus */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(11,14,20,0.85)] z-[5]" />

      {/* Synchronized canvas for fluid 60fps graph & wind advection */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none w-full h-full z-[8]"
      />

      {/* Floating Map Controls & Overlays */}
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10 flex flex-col gap-2 max-w-[calc(100%-56px)] sm:max-w-[85%]">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#0B0E14]/90 backdrop-blur-md border border-[#232A3B] shadow-xl">
          {/* Basemap Mode Switcher */}
          <div className="flex items-center gap-0.5 bg-[#121620] p-0.5 rounded-lg border border-[#232A3B] text-[10px] sm:text-[11px] font-mono">
            <button
              onClick={() => setBasemapMode('satellite')}
              className={`px-1.5 sm:px-2 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
                basemapMode === 'satellite'
                  ? 'bg-[#C89B6D] text-[#0B0E14] shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Delhi Night Satellite Airshed Map (Golden Arterial Satellite Imagery)"
            >
              <span>🛰️</span>
              <span className="hidden sm:inline">Satellite</span>
            </button>
            <button
              onClick={() => setBasemapMode('hybrid')}
              className={`px-1.5 sm:px-2 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
                basemapMode === 'hybrid'
                  ? 'bg-[#C89B6D] text-[#0B0E14] shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Hybrid (Satellite Glow + Street Grid & Geographic Labels)"
            >
              <span>🌌</span>
              <span className="hidden sm:inline">Hybrid</span>
            </button>
            <button
              onClick={() => setBasemapMode('vector')}
              className={`px-1.5 sm:px-2 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
                basemapMode === 'vector'
                  ? 'bg-[#C89B6D] text-[#0B0E14] shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Dark GIS Vector Map (High-Contrast Cartography)"
            >
              <span>🗺️</span>
              <span className="hidden sm:inline">GIS Dark</span>
            </button>
          </div>

          <button
            onClick={() => setShowAirshedGraph(!showAirshedGraph)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
              showAirshedGraph
                ? 'bg-[#C89B6D] text-[#0B0E14] shadow-md shadow-[#C89B6D]/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle Dynamic Wind Advection Graph A(t)"
          >
            <Network className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">A(t)</span>
          </button>

          <button
            onClick={() => setShowWindParticles(!showWindParticles)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
              showWindParticles
                ? 'bg-[#C89B6D] text-[#0B0E14] shadow-md shadow-[#C89B6D]/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle Animated Wind Advection Particles"
          >
            <Wind className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Wind</span>
          </button>

          {/* Quick Opacity Adjuster when in Satellite/Hybrid mode */}
          {basemapMode !== 'vector' && (
            <button
              onClick={() => {
                setSatelliteOpacity(satelliteOpacity >= 0.9 ? 0.6 : satelliteOpacity >= 0.5 ? 0.35 : 0.95);
              }}
              className="px-2 py-1 rounded-lg bg-[#121620] hover:bg-[#181E2B] border border-[#232A3B] text-[10px] font-mono text-[#ECC138] font-bold transition-colors"
              title="Click to cycle satellite glow opacity (100% / 60% / 35%)"
            >
              Glow: {Math.round(satelliteOpacity * 100)}%
            </button>
          )}

          {/* Station Quick Search */}
          <div className="relative">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#121620] border border-[#232A3B] text-xs">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Find station..."
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                className="bg-transparent border-none outline-none text-[#FFFDF8] text-xs w-20 sm:w-28 md:w-32 placeholder:text-slate-500 font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Search Dropdown */}
            {isSearchOpen && filteredStations.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-56 p-1.5 rounded-xl bg-[#0B0E14]/95 backdrop-blur-xl border border-[#232A3B] shadow-2xl z-30 flex flex-col gap-1">
                {filteredStations.map((s) => {
                  const f = forecastMap.get(s.id);
                  const aqi = f ? f.current_aqi : 'Moderate';
                  const color = CPCB_CATEGORIES[aqi]?.color || '#ECC138';
                  return (
                    <button
                      key={s.id}
                      onClick={() => flyToStation(s.id)}
                      className="flex items-center justify-between p-2 rounded-lg text-left text-xs hover:bg-[#121620] transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-slate-200 group-hover:text-white font-medium">{s.name}</span>
                      </div>
                      <span className="font-mono text-[10px] text-[#ECC138]">{f ? `${Math.round(f.current_pm25)}` : ''}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Edge count badge & Impending Breach Ticker */}
        <div className="flex flex-wrap items-center gap-2">
          {showAirshedGraph && (
            <div className="px-2.5 py-1 rounded-lg bg-[#0B0E14]/90 backdrop-blur border border-[#232A3B] text-[11px] font-mono text-slate-300 w-fit flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#ECC138] animate-pulse"></span>
              <span>{activeEdges.length} Active Wind Links</span>
            </div>
          )}

          {breachAlerts.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0B0E14]/90 backdrop-blur border border-[#C89B6D]/50 text-[11px] text-[#ECC138]">
              <AlertTriangle className="w-3.5 h-3.5 text-[#ECC138] animate-pulse" />
              <span className="font-bold mr-1 font-mono uppercase">Impending:</span>
              <div className="flex items-center gap-2">
                {breachAlerts.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => flyToStation(a.id)}
                    className="underline decoration-[#ECC138]/50 hover:text-white font-mono transition-colors"
                    title={`Click to inspect ${a.name}`}
                  >
                    {a.name} (+{a.leadHours}h)
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top-Right: Zoom / Navigation & Geographic Spatial Telemetry */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
        <div className="flex flex-col gap-1.5 p-1 rounded-xl bg-[#0B0E14]/90 backdrop-blur-md border border-[#232A3B] shadow-xl">
          <button
            onClick={() => mapRef.current?.zoomIn()}
            className="p-2 rounded-lg text-slate-400 hover:text-[#ECC138] hover:bg-[#121620] transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapRef.current?.zoomOut()}
            className="p-2 rounded-lg text-slate-400 hover:text-[#ECC138] hover:bg-[#121620] transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapRef.current?.flyTo({ center: [77.21, 28.64], zoom: 10.2 })}
            className="p-2 rounded-lg text-slate-400 hover:text-[#ECC138] hover:bg-[#121620] transition-colors"
            title="Center Delhi Airshed"
          >
            <Compass className="w-4 h-4" />
          </button>
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="p-2 rounded-lg text-slate-400 hover:text-[#ECC138] hover:bg-[#121620] transition-colors border-t border-[#232A3B]"
              title={isExpanded ? "Restore Cockpit Split View" : "Expand Map to Full Width"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4 text-[#ECC138]" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Live Spatial Telemetry HUD (Cursor Coords + Sector) */}
        <div className="hidden md:flex flex-col items-end p-2 rounded-xl bg-[#0B0E14]/90 backdrop-blur-md border border-[#232A3B] text-[10px] font-mono text-slate-300 shadow-xl">
          <div className="flex items-center gap-1.5 text-[#ECC138] font-bold">
            <Crosshair className="w-3 h-3" />
            <span>{cursorTelemetry.lat}°N, {cursorTelemetry.lon}°E</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">Z: {cursorTelemetry.zoom}</span>
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5 truncate max-w-[210px]">
            {cursorTelemetry.sector}
          </div>
        </div>
      </div>

      {/* Bottom Geographic Context Strip: CPCB Scale, Scale Bar & Attribution */}
      <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-4 right-2 sm:right-4 z-10 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-xl bg-[#0B0E14]/90 backdrop-blur-md border border-[#232A3B] shadow-2xl">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-300">
            <Layers className="w-3.5 h-3.5 text-[#ECC138]" />
            <span className="hidden xs:inline">CPCB Scale</span>
          </div>

          {/* Metric Spatial Scale Bar */}
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-slate-400 pl-2 border-l border-[#232A3B]">
            <span className="text-[#C89B6D] font-bold">SCALE:</span>
            <div className="flex items-center">
              <span className="w-8 h-1 bg-[#ECC138] rounded-l"></span>
              <span className="w-8 h-1 bg-[#C89B6D] rounded-r"></span>
            </div>
            <span>10 km</span>
          </div>

          {basemapMode !== 'vector' && (
            <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#ECC138]/10 border border-[#ECC138]/30 text-[10px] font-mono text-[#ECC138]">
              <Sparkles className="w-2.5 h-2.5 text-[#ECC138]" />
              <span>Delhi Satellite Night Arterials</span>
            </span>
          )}
        </div>

        {/* CPCB AQI Category Counts */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
          {Object.entries(CPCB_CATEGORIES).map(([cat, cfg]) => {
            const count = forecasts.filter((f) => f.current_aqi === cat).length;
            return (
              <div key={cat} className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] text-slate-300">
                <span
                  className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm shadow-sm shrink-0"
                  style={{ backgroundColor: cfg.color }}
                />
                <span className="hidden md:inline">{cat}</span>
                <span className="font-mono text-[9px] sm:text-[10px] text-slate-400">({count})</span>
              </div>
            );
          })}
        </div>

        {/* Clean, Official Map Attribution (No watermarks) */}
        <div className="hidden xl:flex items-center text-[9px] font-mono text-slate-500 pl-2 border-l border-[#232A3B]">
          <span>© Esri · © OpenStreetMap</span>
        </div>
      </div>
    </div>
  );
};
