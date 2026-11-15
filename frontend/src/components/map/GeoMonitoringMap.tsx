import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import maplibregl, { Map as MapLibreMap, Marker } from 'maplibre-gl';
import { useTwinStore } from '../../store/useTwinStore';
import { Station, StationForecast, WindEdgesMap, AQICategory } from '../../types';
import { CPCB_CATEGORIES, getAQICategory } from '../../utils/aqi';
import {
  CITIES_DATA,
  CityMeta,
  GeoStation,
  ALL_STATIONS_DATA,
  getAllCities,
  getCityById,
  getStationsForCity,
  getAllStations,
} from '../../data/citiesData';
import { compassWord, degToCompass, windSpeedWord } from '../../utils/wind';
import {
  Layers,
  ZoomIn,
  ZoomOut,
  Compass,
  Search,
  X,
  Maximize2,
  Minimize2,
  Crosshair,
  MapPin,
  Wind,
  Network,
  Globe,
  Check,
  ChevronDown,
  ChevronUp,
  Navigation,
  Activity,
  ArrowUpRight,
  Info,
} from 'lucide-react';

export type BasemapMode = 'dark' | 'satellite' | 'streets';

export interface GeoMonitoringMapProps {
  // Optional station override (defaults to city/all stations from registry)
  stations?: Station[];
  forecasts?: StationForecast[];
  windEdgesMap?: WindEdgesMap;
  windowIdx?: number;
  className?: string;

  // Selection
  selectedStationId?: number;
  onSelectStation?: (id: number) => void;
  selectedCityId?: string;
  onSelectCity?: (cityId: string) => void;

  // View style & mode
  variant?: 'citizen' | 'research';
  isExpanded?: boolean;
  onToggleExpand?: () => void;

  // Wind & Advection
  compassAngle?: number;
  wind?: { fromDeg: number; speedKmh: number } | null;
  links?: [number, number, number][]; // [srcId, tgtId, weight][]

  // Custom UI toggles
  showSearch?: boolean;
  showCitySelector?: boolean;
  showBasemapToggle?: boolean;
  showTelemetryHUD?: boolean;
  showWindOverlay?: boolean;
  showAirshedLinks?: boolean;
  showLegend?: boolean;
}

export const GeoMonitoringMap: React.FC<GeoMonitoringMapProps> = ({
  stations: inputStations,
  forecasts = [],
  windEdgesMap,
  windowIdx = 0,
  className = '',
  selectedStationId: propSelectedStationId,
  onSelectStation: propOnSelectStation,
  selectedCityId: propSelectedCityId,
  onSelectCity: propOnSelectCity,
  variant = 'research',
  isExpanded = false,
  onToggleExpand,
  compassAngle: propCompassAngle,
  wind: propWind,
  links: propLinks,
  showSearch = true,
  showCitySelector = true,
  showBasemapToggle = true,
  showTelemetryHUD = true,
  showWindOverlay = true,
  showAirshedLinks = true,
  showLegend = true,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const clusterMarkersRef = useRef<Marker[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const linksCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isUserInteractingRef = useRef(false);

  // Global store states
  const {
    selectedStationId: storeSelectedStationId,
    setSelectedStationId: storeSetSelectedStationId,
    selectedCityId: storeSelectedCityId,
    setSelectedCityId: storeSetSelectedCityId,
    realWind: storeRealWind,
    compassAngle: storeCompassAngle,
  } = useTwinStore();

  const activeStationId = propSelectedStationId !== undefined ? propSelectedStationId : storeSelectedStationId;
  const activeCityId = propSelectedCityId || storeSelectedCityId || 'delhi';

  const handleSelectStation = useCallback(
    (id: number) => {
      if (propOnSelectStation) propOnSelectStation(id);
      storeSetSelectedStationId(id);
    },
    [propOnSelectStation, storeSetSelectedStationId]
  );

  const handleSelectCity = useCallback(
    (cityId: string) => {
      if (propOnSelectCity) propOnSelectCity(cityId);
      storeSetSelectedCityId(cityId);
    },
    [propOnSelectCity, storeSetSelectedCityId]
  );

  // Basemap & Layer controls
  const [mapLoaded, setMapLoaded] = useState(false);
  const [basemapMode, setBasemapMode] = useState<BasemapMode>('dark');
  const [currentZoom, setCurrentZoom] = useState(10.3);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [showWind, setShowWind] = useState(true);
  const [showLinks, setShowLinks] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredStation, setHoveredStation] = useState<GeoStation | null>(null);

  // Collapsible Information Panel state
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // Collapsible Legend state
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);

  // Live Telemetry
  const [telemetry, setTelemetry] = useState({
    lat: '28.6286',
    lon: '77.2411',
    zoom: '10.3',
    city: 'Delhi (NCT)',
    region: 'Central NCT Airshed',
  });

  // Current active city metadata
  const currentCity = useMemo(() => getCityById(activeCityId), [activeCityId]);
  const allCities = useMemo(() => getAllCities(), []);

  // Map station ID to forecast object
  const forecastMap = useMemo(() => {
    return new Map(forecasts.map((f) => [f.station_id, f]));
  }, [forecasts]);

  // Unified stations list for the currently selected city (or all cities)
  const cityStations = useMemo(() => {
    const rawStations = getStationsForCity(activeCityId);
    // If inputStations passed from props and we are in Delhi, align coordinates with inputStations
    if (activeCityId === 'delhi' && inputStations && inputStations.length > 0) {
      const inputMap = new Map(inputStations.map((s) => [s.id, s]));
      return rawStations.map((st) => {
        const inp = inputMap.get(st.id);
        if (inp) {
          return {
            ...st,
            lat: inp.lat,
            lon: inp.lon,
            name: inp.name,
          };
        }
        return st;
      });
    }
    return rawStations;
  }, [activeCityId, inputStations]);

  // Selected station object
  const selectedStation = useMemo(() => {
    const found = ALL_STATIONS_DATA.find((s) => s.id === activeStationId);
    if (found) return found;
    return cityStations[0] || ALL_STATIONS_DATA[0];
  }, [activeStationId, cityStations]);

  const selectedForecast = selectedStation ? forecastMap.get(selectedStation.id) : null;

  // Active wind edges for Delhi
  const activeEdges = useMemo(() => {
    if (propLinks) return propLinks;
    if (windEdgesMap) return windEdgesMap[String(windowIdx)] || [];
    return [];
  }, [propLinks, windEdgesMap, windowIdx]);

  // Top incoming upwind stations for selected station
  const incomingUpwindNames = useMemo(() => {
    if (!selectedStation || activeEdges.length === 0) return [];
    const nameMap = new Map(ALL_STATIONS_DATA.map((s) => [s.id, s.name]));
    return activeEdges
      .filter(([, tgt]) => tgt === selectedStation.id)
      .sort((a, b) => b[2] - a[2])
      .slice(0, 3)
      .map(([src]) => nameMap.get(src) || `Station #${src}`);
  }, [selectedStation, activeEdges]);

  // Search filter
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return ALL_STATIONS_DATA.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.cityName.toLowerCase().includes(q) ||
        String(s.id) === q ||
        s.provider.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery]);

  // Wind speed & compass for on-screen animations
  const windInfo = useMemo(() => {
    if (propWind) return propWind;
    if (storeRealWind) return { fromDeg: storeRealWind.fromDeg, speedKmh: storeRealWind.speedMs * 3.6 };
    if (propCompassAngle !== undefined) return { fromDeg: propCompassAngle, speedKmh: 12 };
    if (storeCompassAngle !== undefined) return { fromDeg: storeCompassAngle, speedKmh: 12 };
    return { fromDeg: 315, speedKmh: 10 };
  }, [propWind, storeRealWind, propCompassAngle, storeCompassAngle]);

  // -------------------------------------------------------------
  // MapLibre Initialization with 100% Watermark-Free Reliable Tiles
  // -------------------------------------------------------------
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const initialCenter: [number, number] = currentCity ? currentCity.center : [77.215, 28.635];
    const initialZoom = currentCity ? currentCity.zoom : 10.3;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          // 1. Dark Navigation Base (Esri Dark Gray Base + Reference + Transportation)
          // 100% free, zero watermarks, no API key required, high-contrast dark palette
          'esri-dark-base': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            attribution: 'Tiles © Esri — DeLorme, NAVTEQ',
            maxzoom: 19,
          },
          'esri-dark-reference': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
            maxzoom: 19,
          },
          'esri-dark-transportation': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 19,
          },

          // 2. High-resolution Satellite Imagery + Road & Boundary Reference
          'esri-satellite': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            attribution: '© Esri, Maxar, Earthstar Geographics',
            maxzoom: 19,
          },
          'esri-satellite-roads': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 19,
          },
          'esri-satellite-places': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            attribution: '© Esri',
            maxzoom: 19,
          },

          // 3. Daytime Streets (Esri World Street Map) - 100% reliable, zero watermarks
          'esri-streets': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            attribution: '© Esri, HERE, Garmin, USGS, NGA',
            maxzoom: 19,
          },
        },
        layers: [
          // Dark Navigation Layers
          {
            id: 'esri-dark-base-layer',
            type: 'raster',
            source: 'esri-dark-base',
            minzoom: 0,
            maxzoom: 20,
            layout: { visibility: 'visible' },
          },
          {
            id: 'esri-dark-transportation-layer',
            type: 'raster',
            source: 'esri-dark-transportation',
            minzoom: 0,
            maxzoom: 20,
            paint: { 'raster-opacity': 0.65 },
            layout: { visibility: 'visible' },
          },
          {
            id: 'esri-dark-reference-layer',
            type: 'raster',
            source: 'esri-dark-reference',
            minzoom: 0,
            maxzoom: 20,
            paint: { 'raster-opacity': 0.95 },
            layout: { visibility: 'visible' },
          },

          // Satellite + Arterials Layers
          {
            id: 'esri-satellite-layer',
            type: 'raster',
            source: 'esri-satellite',
            minzoom: 0,
            maxzoom: 20,
            layout: { visibility: 'none' },
          },
          {
            id: 'esri-satellite-roads-layer',
            type: 'raster',
            source: 'esri-satellite-roads',
            minzoom: 0,
            maxzoom: 20,
            paint: { 'raster-opacity': 0.8 },
            layout: { visibility: 'none' },
          },
          {
            id: 'esri-satellite-places-layer',
            type: 'raster',
            source: 'esri-satellite-places',
            minzoom: 0,
            maxzoom: 20,
            paint: { 'raster-opacity': 0.95 },
            layout: { visibility: 'none' },
          },

          // Daylight Streets Layer
          {
            id: 'esri-streets-layer',
            type: 'raster',
            source: 'esri-streets',
            minzoom: 0,
            maxzoom: 20,
            layout: { visibility: 'none' },
          },
        ],
      },
      center: initialCenter,
      zoom: initialZoom,
      minZoom: 4.2,
      maxZoom: 18,
      attributionControl: false,
      cooperativeGestures: variant === 'citizen',
    });

    map.on('load', () => {
      mapRef.current = map;
      setMapLoaded(true);
      setCurrentZoom(map.getZoom());
    });

    map.on('zoom', () => {
      setCurrentZoom(map.getZoom());
    });

    map.on('mousemove', (e) => {
      const lat = e.lngLat.lat.toFixed(4);
      const lon = e.lngLat.lng.toFixed(4);
      const zoom = map.getZoom().toFixed(1);
      setTelemetry((prev) => ({
        ...prev,
        lat,
        lon,
        zoom,
      }));
    });

    map.on('dragstart', () => {
      isUserInteractingRef.current = true;
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      clusterMarkersRef.current.forEach((m) => m.remove());
      clusterMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // -------------------------------------------------------------
  // Basemap Switching Logic
  // -------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const setVisibility = (layerId: string, visible: boolean) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    };

    if (basemapMode === 'dark') {
      setVisibility('esri-dark-base-layer', true);
      setVisibility('esri-dark-transportation-layer', true);
      setVisibility('esri-dark-reference-layer', true);
      setVisibility('esri-satellite-layer', false);
      setVisibility('esri-satellite-roads-layer', false);
      setVisibility('esri-satellite-places-layer', false);
      setVisibility('esri-streets-layer', false);
    } else if (basemapMode === 'satellite') {
      setVisibility('esri-dark-base-layer', false);
      setVisibility('esri-dark-transportation-layer', false);
      setVisibility('esri-dark-reference-layer', false);
      setVisibility('esri-satellite-layer', true);
      setVisibility('esri-satellite-roads-layer', true);
      setVisibility('esri-satellite-places-layer', true);
      setVisibility('esri-streets-layer', false);
    } else if (basemapMode === 'streets') {
      setVisibility('esri-dark-base-layer', false);
      setVisibility('esri-dark-transportation-layer', false);
      setVisibility('esri-dark-reference-layer', false);
      setVisibility('esri-satellite-layer', false);
      setVisibility('esri-satellite-roads-layer', false);
      setVisibility('esri-satellite-places-layer', false);
      setVisibility('esri-streets-layer', true);
    }
  }, [basemapMode, mapLoaded]);

  // -------------------------------------------------------------
  // City Transition Logic: Automatically reposition map to city extent
  // -------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (activeCityId === 'all') {
      map.fitBounds(
        [
          [68.2, 8.1],
          [89.9, 31.9],
        ],
        { padding: 40, duration: 1200 }
      );
    } else if (currentCity) {
      map.fitBounds(currentCity.bounds, {
        padding: 50,
        duration: 1200,
        maxZoom: 12.6,
      });
    }

    setTelemetry((prev) => ({
      ...prev,
      city: currentCity ? currentCity.name : 'All India',
      region: currentCity ? currentCity.state : 'National Air Quality Grid',
    }));
  }, [activeCityId, currentCity, mapLoaded]);

  // -------------------------------------------------------------
  // Station Marker & Cluster Rendering (Strictly NO "ACTIVE" bouncing label)
  // -------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    clusterMarkersRef.current.forEach((m) => m.remove());
    clusterMarkersRef.current = [];

    const isZoomedOutNational = activeCityId === 'all' && currentZoom < 7.8;

    // 1. Zoomed-out National View: Render City Cluster Badges
    if (isZoomedOutNational) {
      allCities
        .filter((c) => c.id !== 'all')
        .forEach((c) => {
          const el = document.createElement('div');
          el.className =
            'cursor-pointer group flex flex-col items-center select-none transition-transform hover:scale-110';
          el.innerHTML = `
            <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#121620]/95 border border-[#ECC138]/70 shadow-[0_4px_20px_rgba(0,0,0,0.8)] backdrop-blur-md">
              <div class="w-2.5 h-2.5 rounded-full bg-[#ECC138] animate-pulse"></div>
              <span class="text-xs font-bold font-display text-white tracking-wide">${c.name}</span>
              <span class="px-1.5 py-0.2 rounded-full bg-[#ECC138]/20 text-[#ECC138] text-[10px] font-mono font-bold">${c.stationCount}</span>
            </div>
          `;

          el.addEventListener('click', (e) => {
            e.stopPropagation();
            handleSelectCity(c.id);
          });

          const marker = new maplibregl.Marker({ element: el }).setLngLat(c.center).addTo(map);
          clusterMarkersRef.current.push(marker);
        });
      return;
    }

    // 2. City or Zoomed-in View: Render Individual Station Markers
    cityStations.forEach((st) => {
      const forecast = forecastMap.get(st.id);
      const isSelected = st.id === activeStationId;

      // Determine PM2.5 value and AQI category
      let pm25Val = Math.round(st.medianPm25 || 45);
      let aqiCat: AQICategory = getAQICategory(pm25Val);

      if (forecast) {
        pm25Val = Math.round(forecast.current_pm25);
        aqiCat = forecast.current_aqi || getAQICategory(pm25Val);
      }

      const catCfg = CPCB_CATEGORIES[aqiCat] || CPCB_CATEGORIES.Moderate;
      const markerColor = catCfg.color;

      const el = document.createElement('div');
      el.className = 'cursor-pointer group flex flex-col items-center select-none relative';

      // NOTE: Strictly NO "ACTIVE" bouncing badge as per instructions.
      // Clean selected highlight: double glowing ring and elevation.
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          ${
            isSelected
              ? `<div class="absolute -inset-3 rounded-full border-2 border-white/90 animate-pulse" style="box-shadow: 0 0 25px ${markerColor};"></div>
                 <div class="absolute -inset-1.5 rounded-full border border-amber-300"></div>`
              : pm25Val > 250
              ? `<div class="absolute -inset-1.5 rounded-full animate-ping opacity-30" style="background-color: ${markerColor}"></div>`
              : ''
          }
          <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-mono font-black text-white shadow-2xl transition-all duration-200 group-hover:scale-125 border-2 ${
            isSelected
              ? 'border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.7)]'
              : 'border-white/80 group-hover:border-white'
          }" style="background-color: ${markerColor}">
            ${pm25Val}
          </div>
        </div>
        <div class="marker-label mt-1 px-2 py-0.5 rounded-md bg-[#0B0E14]/95 border text-[10px] font-semibold text-slate-100 whitespace-nowrap shadow-md pointer-events-none transition-all ${
          isSelected
            ? 'border-[#ECC138] text-[#ECC138] font-bold shadow-[#ECC138]/20'
            : 'border-[#232A3B] group-hover:border-slate-400 group-hover:text-white'
        }">
          ${st.name}
        </div>
      `;

      // Hover interaction: update hovered station
      el.addEventListener('mouseenter', () => {
        setHoveredStation(st);
      });
      el.addEventListener('mouseleave', () => {
        setHoveredStation((prev) => (prev?.id === st.id ? null : prev));
      });

      // Click interaction: select station & center
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        handleSelectStation(st.id);
        map.flyTo({ center: [st.lon, st.lat], zoom: Math.max(map.getZoom(), 12.0), duration: 900 });
      });

      const marker = new maplibregl.Marker({ element: el }).setLngLat([st.lon, st.lat]).addTo(map);

      markersRef.current.push(marker);
    });
  }, [
    cityStations,
    allCities,
    activeCityId,
    activeStationId,
    forecastMap,
    currentZoom,
    mapLoaded,
    handleSelectStation,
    handleSelectCity,
  ]);

  // -------------------------------------------------------------
  // Yellow Wind Vector Particle Stream with Directional Arrows & Glow
  // -------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    const canvas = canvasRef.current;
    if (!map || !canvas || !mapLoaded || !showWindOverlay || !showWind) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const resizeCanvas = () => {
      const rect = map.getContainer().getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();

    // Particle field
    const numParticles = 75;
    const particles = Array.from({ length: numParticles }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      life: Math.random() * 100,
      maxLife: 70 + Math.random() * 50,
      speed: 1.4 + Math.random() * 1.8,
    }));

    const fromAngleRad = ((windInfo.fromDeg % 360) * Math.PI) / 180;
    // Wind blows TOWARD fromDeg + 180 degrees
    const flowAngle = fromAngleRad + Math.PI;
    const dx = Math.sin(flowAngle); // East component
    const dy = -Math.cos(flowAngle); // South component
    const arrowAngle = Math.atan2(dy, dx);

    let active = true;

    const render = () => {
      if (!active) return;
      ctx.clearRect(0, 0, width, height);

      const speedFactor = Math.min(3.2, Math.max(0.7, windInfo.speedKmh / 9));

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life += 1;
        if (p.life > p.maxLife) {
          p.x = Math.random() * width;
          p.y = Math.random() * height;
          p.life = 0;
        }

        p.x += dx * p.speed * speedFactor;
        p.y += dy * p.speed * speedFactor;

        // Wrap around screen boundaries
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const lifeRatio = p.life / p.maxLife;
        const alpha = lifeRatio < 0.2 ? lifeRatio * 5 : lifeRatio > 0.8 ? (1 - lifeRatio) * 5 : 1;
        const trailLen = 18 * speedFactor;

        // Glowing streak gradient
        const grad = ctx.createLinearGradient(p.x, p.y, p.x - dx * trailLen, p.y - dy * trailLen);
        grad.addColorStop(0, `rgba(254, 240, 138, ${alpha * 0.95})`);
        grad.addColorStop(0.4, `rgba(236, 193, 56, ${alpha * 0.75})`);
        grad.addColorStop(1, `rgba(236, 193, 56, 0)`);

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - dx * trailLen, p.y - dy * trailLen);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 3.0;
        ctx.shadowColor = 'rgba(251, 191, 36, 0.75)';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Directional arrow head at particle front
        if (alpha > 0.4) {
          const arrowLen = 6.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - arrowLen * Math.cos(arrowAngle - 0.45), p.y - arrowLen * Math.sin(arrowAngle - 0.45));
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - arrowLen * Math.cos(arrowAngle + 0.45), p.y - arrowLen * Math.sin(arrowAngle + 0.45));
          ctx.strokeStyle = `rgba(254, 240, 138, ${Math.min(1, alpha * 0.95)})`;
          ctx.lineWidth = 2.4;
          ctx.stroke();
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      active = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [mapLoaded, showWindOverlay, showWind, windInfo]);

  // -------------------------------------------------------------
  // Blue Dynamic Airshed Connections (A(t)) with High Contrast & Arrows
  // -------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    const canvas = linksCanvasRef.current;
    if (!map || !canvas || !mapLoaded || !showAirshedLinks || !showLinks || activeEdges.length === 0) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = map.getContainer().getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const stationLookup = new Map(ALL_STATIONS_DATA.map((s) => [s.id, s]));
    let raf = 0;
    let phase = 0;

    const drawLinks = () => {
      ctx.clearRect(0, 0, width, height);
      phase = (phase + 0.04) % (Math.PI * 2);

      const topEdges = [...activeEdges].sort((a, b) => b[2] - a[2]).slice(0, 48);

      for (let k = 0; k < topEdges.length; k++) {
        const [srcId, tgtId] = topEdges[k];
        const src = stationLookup.get(srcId);
        const tgt = stationLookup.get(tgtId);
        if (!src || !tgt) continue;

        const p1 = map.project([src.lon, src.lat]);
        const p2 = map.project([tgt.lon, tgt.lat]);

        // Cull edges outside screen viewport
        if (
          (p1.x < 0 && p2.x < 0) ||
          (p1.x > width && p2.x > width) ||
          (p1.y < 0 && p2.y < 0) ||
          (p1.y > height && p2.y > height)
        ) {
          continue;
        }

        const isConnectedToSelected = srcId === activeStationId || tgtId === activeStationId;

        // Vivid cyan for selected, electric sky blue for other active graph edges
        const strokeColor = isConnectedToSelected
          ? 'rgba(0, 245, 255, 0.95)'
          : 'rgba(14, 165, 233, 0.75)';
        const lineWidth = isConnectedToSelected ? 3.6 : 2.2;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.shadowColor = isConnectedToSelected ? '#00F5FF' : '#0EA5E9';
        ctx.shadowBlur = isConnectedToSelected ? 10 : 5;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Midpoint directional chevron indicating pollutant flux direction
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const edgeAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const arrowSize = isConnectedToSelected ? 7 : 5.5;

        ctx.beginPath();
        ctx.moveTo(midX, midY);
        ctx.lineTo(midX - arrowSize * Math.cos(edgeAngle - 0.48), midY - arrowSize * Math.sin(edgeAngle - 0.48));
        ctx.moveTo(midX, midY);
        ctx.lineTo(midX - arrowSize * Math.cos(edgeAngle + 0.48), midY - arrowSize * Math.sin(edgeAngle + 0.48));
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = isConnectedToSelected ? 2.6 : 1.8;
        ctx.stroke();

        // Animated pulse packet flowing along edge
        const t = (Math.sin(phase + k * 0.7) + 1) / 2;
        const px = p1.x + (p2.x - p1.x) * t;
        const py = p1.y + (p2.y - p1.y) * t;

        ctx.beginPath();
        ctx.arc(px, py, isConnectedToSelected ? 3.8 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#00F5FF';
        ctx.shadowColor = '#00F5FF';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      raf = requestAnimationFrame(drawLinks);
    };

    drawLinks();

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [mapLoaded, showAirshedLinks, showLinks, activeEdges, activeStationId]);

  // -------------------------------------------------------------
  // Resize Observer for Split Panes / Fullscreen
  // -------------------------------------------------------------
  useEffect(() => {
    const el = mapContainer.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    let timeout: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.resize();
        }
      }, 100);
    });

    ro.observe(el);
    return () => {
      clearTimeout(timeout);
      ro.disconnect();
    };
  }, []);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    const container = mapContainer.current?.parentElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Fly to Station from Search or Card
  const flyToStation = (station: GeoStation) => {
    if (mapRef.current) {
      if (station.cityId !== activeCityId && activeCityId !== 'all') {
        handleSelectCity(station.cityId);
      }
      handleSelectStation(station.id);
      mapRef.current.flyTo({ center: [station.lon, station.lat], zoom: 12.8, duration: 1200 });
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <div
      className={`relative w-full h-full min-h-[360px] sm:min-h-[420px] lg:min-h-[480px] bg-[#07090D] overflow-hidden rounded-2xl border border-[#232A3B] select-none ${className}`}
    >
      {/* MapLibre DOM Node */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full z-0" />

      {/* Wind Flow Particles Canvas Overlay */}
      {showWindOverlay && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />
      )}

      {/* Directed Airshed Coupling Links Canvas Overlay */}
      {showAirshedLinks && (
        <canvas
          ref={linksCanvasRef}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />
      )}

      {/* -------------------------------------------------------------
          TOP BAR: City Selector, Search Box, Quick Actions
          ------------------------------------------------------------- */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-none">
        {/* City Selector Pill */}
        {showCitySelector && (
          <div className="relative pointer-events-auto">
            <button
              onClick={() => setIsCityDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0B0E14]/90 backdrop-blur-xl border border-[#232A3B] hover:border-[#ECC138]/60 text-white shadow-2xl transition-all cursor-pointer group"
              title="Switch Monitoring City or Airshed"
              aria-expanded={isCityDropdownOpen}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#ECC138] group-hover:scale-125 transition-transform" />
              <div className="text-left">
                <div className="text-[10px] font-mono uppercase text-slate-400 leading-none">
                  Monitoring Airshed
                </div>
                <div className="text-xs font-display font-bold text-[#FFFDF8] flex items-center gap-1.5 mt-0.5">
                  <span>{currentCity.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#181E2B] border border-[#232A3B] text-[#ECC138]">
                    {currentCity.stationCount} Stns
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform ${
                  isCityDropdownOpen ? 'rotate-180 text-[#ECC138]' : ''
                }`}
              />
            </button>

            {/* City Selector Dropdown Menu */}
            {isCityDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-[#0B0E14]/98 backdrop-blur-2xl border border-[#232A3B] shadow-[0_20px_50px_rgba(0,0,0,0.95)] p-2 z-50 text-xs font-mono animate-scale-in">
                <div className="px-3 py-2 border-b border-[#232A3B] flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wider text-slate-300 uppercase">
                    Select Airshed Network
                  </span>
                  <button
                    onClick={() => setIsCityDropdownOpen(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#181E2B]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-1.5 p-1 mt-1">
                  {/* National Overview Option */}
                  <button
                    onClick={() => {
                      handleSelectCity('all');
                      setIsCityDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      activeCityId === 'all'
                        ? 'bg-[#181E2B] border border-[#ECC138]/60 text-white'
                        : 'hover:bg-[#121620] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Globe className="w-4 h-4 text-[#ECC138]" />
                      <div>
                        <div className="font-bold text-[#FFFDF8]">All Cities (National Grid)</div>
                        <div className="text-[10px] text-slate-400">175 Verified CAAQMS Monitors</div>
                      </div>
                    </div>
                    {activeCityId === 'all' && <Check className="w-4 h-4 text-[#ECC138]" />}
                  </button>

                  {/* Section: Primary Digital Twin */}
                  <div className="px-2 pt-2 pb-1 text-[10px] font-bold text-[#ECC138] uppercase tracking-wider">
                    Primary 24h Digital Twin
                  </div>
                  {allCities
                    .filter((c) => c.category === 'Primary Digital Twin')
                    .map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          handleSelectCity(c.id);
                          setIsCityDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                          activeCityId === c.id
                            ? 'bg-[#181E2B] border border-[#ECC138]/60 text-white'
                            : 'hover:bg-[#121620] text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <MapPin className="w-4 h-4 text-[#ECC138]" />
                          <div>
                            <div className="font-bold text-[#FFFDF8]">{c.name}</div>
                            <div className="text-[10px] text-slate-400">{c.description}</div>
                          </div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0B0E14] text-[#ECC138] font-bold">
                          {c.stationCount}
                        </span>
                      </button>
                    ))}

                  {/* Section: Cross-City Generalisation Evaluated */}
                  <div className="px-2 pt-2.5 pb-1 text-[10px] font-bold text-[#38BDF8] uppercase tracking-wider flex items-center justify-between">
                    <span>Evaluated Generalisation Cities</span>
                    <span className="text-[9px] lowercase text-slate-400">zero/few-shot</span>
                  </div>
                  {allCities
                    .filter((c) => c.category === 'Generalisation Evaluated')
                    .map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          handleSelectCity(c.id);
                          setIsCityDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                          activeCityId === c.id
                            ? 'bg-[#181E2B] border border-[#38BDF8]/60 text-white'
                            : 'hover:bg-[#121620] text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-[#FFFDF8] flex items-center gap-1.5">
                            <span>{c.name}</span>
                            <span className="text-[9px] text-slate-400">({c.state})</span>
                          </div>
                          {c.generalisationMetrics && (
                            <div className="text-[9px] text-[#38BDF8] mt-0.5">
                              Zero-Shot RMSE: {c.generalisationMetrics.zeroShotRmse} µg/m³
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0B0E14] text-slate-300 font-bold">
                          {c.stationCount}
                        </span>
                      </button>
                    ))}

                  {/* Section: Active CAAQMS Networks */}
                  <div className="px-2 pt-2.5 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Active Regional CAAQMS Hubs
                  </div>
                  {allCities
                    .filter((c) => c.category === 'CAAQMS Monitored' || c.category === 'Regional Airshed')
                    .map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          handleSelectCity(c.id);
                          setIsCityDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all cursor-pointer ${
                          activeCityId === c.id
                            ? 'bg-[#181E2B] border border-slate-500 text-white'
                            : 'hover:bg-[#121620] text-slate-300'
                        }`}
                      >
                        <span className="font-medium text-slate-200">
                          {c.name}{' '}
                          <span className="text-[10px] text-slate-500">({c.state})</span>
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0B0E14] text-slate-400">
                          {c.stationCount}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search Bar / Trigger */}
        {showSearch && (
          <div className="relative pointer-events-auto flex items-center gap-2">
            {!isSearchOpen ? (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2.5 rounded-xl bg-[#0B0E14]/90 backdrop-blur-xl border border-[#232A3B] hover:border-[#ECC138]/60 text-slate-300 hover:text-white shadow-xl transition-all cursor-pointer"
                title="Search 175 Stations Across India"
              >
                <Search className="w-4 h-4" />
              </button>
            ) : (
              <div className="relative flex items-center w-64 sm:w-80 rounded-xl bg-[#0B0E14]/98 backdrop-blur-2xl border border-[#ECC138]/70 shadow-2xl p-1 animate-scale-in">
                <Search className="w-4 h-4 text-[#ECC138] ml-2 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search station or city..."
                  className="w-full bg-transparent px-2.5 py-1 text-xs text-white placeholder-slate-500 font-sans focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#181E2B]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-[#0B0E14]/98 backdrop-blur-2xl border border-[#232A3B] shadow-2xl p-1.5 z-50 text-xs font-mono max-h-64 overflow-y-auto">
                    {searchResults.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => flyToStation(st)}
                        className="w-full p-2 rounded-lg text-left hover:bg-[#181E2B] text-slate-200 transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <div className="font-semibold text-white group-hover:text-[#ECC138] transition-colors">
                            {st.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {st.cityName} · {st.provider}
                          </div>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#ECC138]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------
          FLOATING CONTROLS (Right side): Zoom, Fullscreen, Reset, Layers
          ------------------------------------------------------------- */}
      <div className="absolute top-16 right-3 z-30 flex flex-col gap-2">
        {/* Navigation / Zoom Controls */}
        <div className="flex flex-col rounded-xl bg-[#0B0E14]/90 backdrop-blur-xl border border-[#232A3B] shadow-xl overflow-hidden divide-y divide-[#232A3B]">
          <button
            onClick={() => mapRef.current?.zoomIn()}
            className="p-2 text-slate-300 hover:text-white hover:bg-[#181E2B] transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapRef.current?.zoomOut()}
            className="p-2 text-slate-300 hover:text-white hover:bg-[#181E2B] transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (currentCity && mapRef.current) {
                mapRef.current.fitBounds(currentCity.bounds, { padding: 48, duration: 1000 });
              }
            }}
            className="p-2 text-slate-300 hover:text-[#ECC138] hover:bg-[#181E2B] transition-colors cursor-pointer"
            title="Fit Selected City Extent"
          >
            <Crosshair className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              mapRef.current?.resetNorthPitch({ duration: 800 });
            }}
            className="p-2 text-slate-300 hover:text-[#ECC138] hover:bg-[#181E2B] transition-colors cursor-pointer"
            title="Reset North Orientation"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>

        {/* Basemap Switcher Toggle */}
        {showBasemapToggle && (
          <div className="relative">
            <button
              onClick={() => setIsLayersOpen((prev) => !prev)}
              className={`p-2.5 rounded-xl backdrop-blur-xl border shadow-xl transition-all cursor-pointer ${
                isLayersOpen
                  ? 'bg-[#181E2B] text-[#ECC138] border-[#ECC138]'
                  : 'bg-[#0B0E14]/90 text-slate-300 hover:text-white border-[#232A3B] hover:border-slate-500'
              }`}
              title="Map Layers & Basemap Styles"
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Basemap & Layer Options Panel (100% Watermark-Free) */}
            {isLayersOpen && (
              <div className="absolute right-0 top-0 mr-12 w-64 rounded-2xl bg-[#0B0E14]/98 backdrop-blur-2xl border border-[#232A3B] shadow-[0_20px_50px_rgba(0,0,0,0.95)] p-3 text-xs font-mono space-y-3 animate-scale-in">
                <div className="flex items-center justify-between pb-2 border-b border-[#232A3B]">
                  <span className="font-bold text-white text-[11px] uppercase tracking-wider">
                    Geographic Basemap
                  </span>
                  <button
                    onClick={() => setIsLayersOpen(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#181E2B]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Reliable Basemap Options */}
                <div className="space-y-1.5">
                  <button
                    onClick={() => setBasemapMode('dark')}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                      basemapMode === 'dark'
                        ? 'bg-[#181E2B] text-white border border-[#ECC138]/60 shadow-md'
                        : 'hover:bg-[#121620] text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-[#FFFDF8]">Dark Navigation</div>
                      <div className="text-[10px] text-slate-400">High-contrast streets & rivers</div>
                    </div>
                    {basemapMode === 'dark' && <Check className="w-4 h-4 text-[#ECC138]" />}
                  </button>

                  <button
                    onClick={() => setBasemapMode('satellite')}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                      basemapMode === 'satellite'
                        ? 'bg-[#181E2B] text-white border border-[#ECC138]/60 shadow-md'
                        : 'hover:bg-[#121620] text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-[#FFFDF8]">Satellite + Roads</div>
                      <div className="text-[10px] text-slate-400">High-res Earth observation</div>
                    </div>
                    {basemapMode === 'satellite' && <Check className="w-4 h-4 text-[#ECC138]" />}
                  </button>

                  <button
                    onClick={() => setBasemapMode('streets')}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                      basemapMode === 'streets'
                        ? 'bg-[#181E2B] text-white border border-[#ECC138]/60 shadow-md'
                        : 'hover:bg-[#121620] text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-[#FFFDF8]">Daylight Streets</div>
                      <div className="text-[10px] text-slate-400">Detailed daytime arterial map</div>
                    </div>
                    {basemapMode === 'streets' && <Check className="w-4 h-4 text-[#ECC138]" />}
                  </button>
                </div>

                {/* Dynamic Atmospheric Overlays */}
                <div className="pt-2 border-t border-[#232A3B] space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Atmospheric Overlays
                  </div>
                  <label className="flex items-center justify-between text-slate-300 cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-[#FDE047]" />
                      <span>Wind Flow Vectors</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showWind}
                      onChange={(e) => setShowWind(e.target.checked)}
                      className="accent-[#ECC138] rounded cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between text-slate-300 cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <Network className="w-3.5 h-3.5 text-[#00F5FF]" />
                      <span>Dynamic Airshed Links</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showLinks}
                      onChange={(e) => setShowLinks(e.target.checked)}
                      className="accent-[#00F5FF] rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-2.5 rounded-xl bg-[#0B0E14]/90 backdrop-blur-xl border border-[#232A3B] hover:border-slate-500 text-slate-300 hover:text-white shadow-xl transition-all cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map View'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* -------------------------------------------------------------
          STATION INFORMATION PANEL (Collapsible, Bottom Left)
          ------------------------------------------------------------- */}
      {selectedStation && (
        <>
          {!isPanelCollapsed ? (
            /* EXPANDED PANEL */
            <div className="absolute bottom-10 left-3 z-30 w-[calc(100%-24px)] max-w-xs sm:max-w-sm rounded-2xl bg-[#0B0E14]/95 backdrop-blur-2xl border border-[#232A3B] shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-3.5 sm:p-4 text-xs font-mono pointer-events-auto animate-scale-in">
              {/* Header with Title and Minimize Button */}
              <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#232A3B]">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[#ECC138] uppercase">
                      {selectedStation.cityName}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-[10px] text-slate-400">{selectedStation.provider}</span>
                  </div>
                  <h4 className="text-sm font-display font-bold text-white mt-0.5 truncate">
                    {selectedStation.name}
                  </h4>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* CPCB Category Pill */}
                  {(() => {
                    const val = selectedForecast
                      ? Math.round(selectedForecast.current_pm25)
                      : Math.round(selectedStation.medianPm25 || 45);
                    const cat = selectedForecast
                      ? selectedForecast.current_aqi || getAQICategory(val)
                      : getAQICategory(val);
                    const catCfg = CPCB_CATEGORIES[cat] || CPCB_CATEGORIES.Moderate;
                    return (
                      <div
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white whitespace-nowrap shadow-md"
                        style={{ backgroundColor: catCfg.color }}
                      >
                        {cat} · {val}
                      </div>
                    );
                  })()}

                  {/* Collapse Button */}
                  <button
                    onClick={() => setIsPanelCollapsed(true)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#181E2B] transition-colors cursor-pointer"
                    title="Minimize Station Panel"
                    aria-label="Minimize Station Panel"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Coordinates & Physical Telemetry */}
              <div className="grid grid-cols-2 gap-2 py-2 text-[11px] border-b border-[#232A3B]/60 text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Latitude</span>
                  <span className="font-semibold text-white">{selectedStation.lat.toFixed(5)}° N</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Longitude</span>
                  <span className="font-semibold text-white">{selectedStation.lon.toFixed(5)}° E</span>
                </div>
              </div>

              {/* Forecast details for primary twin stations (Delhi) */}
              {selectedForecast ? (
                <div className="pt-2 text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">24h Peak Predicted:</span>
                    <span className="font-bold text-[#ECC138]">
                      {Math.round(selectedForecast.peak_predicted)} µg/m³
                    </span>
                  </div>
                  {selectedForecast.hours_to_breach_cpcb !== null && (
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">CPCB Breach (60 µg):</span>
                      <span className="font-bold text-rose-400">
                        +{selectedForecast.hours_to_breach_cpcb}h lead time
                      </span>
                    </div>
                  )}
                  {incomingUpwindNames.length > 0 && (
                    <div className="pt-1.5 border-t border-[#232A3B]/50 text-[10px] text-slate-400">
                      <span className="text-[#00F5FF] font-semibold">Incoming Air Transport:</span>{' '}
                      {incomingUpwindNames.join(', ')}
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-2 text-[10px] text-slate-400 space-y-1">
                  <div>
                    <span className="text-slate-300 font-semibold">CAAQMS Network:</span> Verified station in{' '}
                    {selectedStation.cityName}
                  </div>
                  {selectedStation.coverage && (
                    <div>
                      <span className="text-slate-300 font-semibold">Data Availability:</span>{' '}
                      {(selectedStation.coverage * 100).toFixed(0)}% valid observations
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* COLLAPSED PILL INDICATOR */
            <div
              onClick={() => setIsPanelCollapsed(false)}
              className="absolute bottom-10 left-3 z-30 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#0B0E14]/95 backdrop-blur-xl border border-[#232A3B] hover:border-[#ECC138]/60 text-white shadow-2xl transition-all cursor-pointer group pointer-events-auto animate-scale-in"
              title="Click to expand station details"
            >
              {(() => {
                const val = selectedForecast
                  ? Math.round(selectedForecast.current_pm25)
                  : Math.round(selectedStation.medianPm25 || 45);
                const cat = selectedForecast
                  ? selectedForecast.current_aqi || getAQICategory(val)
                  : getAQICategory(val);
                const catCfg = CPCB_CATEGORIES[cat] || CPCB_CATEGORIES.Moderate;
                return (
                  <>
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: catCfg.color }}
                    />
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-white group-hover:text-[#ECC138] transition-colors truncate max-w-[130px] sm:max-w-[190px]">
                        {selectedStation.name}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {selectedStation.cityName} · {val} µg/m³
                      </span>
                    </div>
                    <span
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white font-mono shrink-0"
                      style={{ backgroundColor: catCfg.color }}
                    >
                      {cat}
                    </span>
                    <button className="p-0.5 rounded text-slate-400 group-hover:text-white transition-colors">
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                  </>
                );
              })()}
            </div>
          )}
        </>
      )}

      {/* -------------------------------------------------------------
          COMPACT MAP LEGEND (Bottom Right)
          ------------------------------------------------------------- */}
      {showLegend && (
        <div className="absolute bottom-10 right-3 z-30 pointer-events-auto">
          {!isLegendExpanded ? (
            <button
              onClick={() => setIsLegendExpanded(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0B0E14]/90 backdrop-blur-xl border border-[#232A3B] hover:border-[#ECC138]/60 text-slate-300 hover:text-white shadow-xl transition-all cursor-pointer text-[10.5px] font-mono group"
              title="View Map Legend & Symbols"
            >
              <Info className="w-3.5 h-3.5 text-[#ECC138] group-hover:scale-110 transition-transform" />
              <span>Legend</span>
              <div className="flex items-center gap-1 ml-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FDE047]" title="Wind Flow" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F5FF]" title="Airshed Links" />
              </div>
            </button>
          ) : (
            <div className="w-72 sm:w-80 rounded-2xl bg-[#0B0E14]/98 backdrop-blur-2xl border border-[#232A3B] shadow-[0_20px_50px_rgba(0,0,0,0.95)] p-3.5 text-xs font-mono space-y-3 animate-scale-in">
              <div className="flex items-center justify-between pb-2 border-b border-[#232A3B]">
                <span className="font-bold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#ECC138]" />
                  Map Legend & Symbols
                </span>
                <button
                  onClick={() => setIsLegendExpanded(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#181E2B] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Overlays Legend */}
              <div className="space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Atmospheric Overlays
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-3 rounded flex items-center justify-center bg-[#FDE047]/20 border border-[#FDE047] text-[#FDE047] text-[10px] font-bold mt-0.5 shrink-0">
                    ➔
                  </div>
                  <div>
                    <div className="font-bold text-[#FDE047] text-[11px]">Yellow Streaks & Arrows</div>
                    <div className="text-[10px] text-slate-400 leading-tight">
                      Wind flow vector & direction from Open-Meteo NWP observations.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-3 rounded flex items-center justify-center bg-[#00F5FF]/20 border border-[#00F5FF] text-[#00F5FF] text-[10px] font-bold mt-0.5 shrink-0">
                    —
                  </div>
                  <div>
                    <div className="font-bold text-[#00F5FF] text-[11px]">Blue / Cyan Connection Lines</div>
                    <div className="text-[10px] text-slate-400 leading-tight">
                      Dynamic wind-aware graph A(t) linking upwind sources to downwind stations.
                    </div>
                  </div>
                </div>
              </div>

              {/* Station Selection */}
              <div className="pt-2 border-t border-[#232A3B] space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Station Marker
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full border-2 border-white ring-2 ring-[#ECC138] bg-[#ECC138] shrink-0" />
                  <div className="text-[10px] text-slate-300">
                    Selected station with amber halo. Details in collapsible panel.
                  </div>
                </div>
              </div>

              {/* CPCB PM2.5 Concentration Scale */}
              <div className="pt-2 border-t border-[#232A3B] space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <span className="uppercase tracking-wider">CPCB PM2.5 Tiers</span>
                  <span className="text-[9px] lowercase text-slate-500">µg/m³</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                    <span>Good (0–30)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#84CC16]" />
                    <span>Satisfactory (31–60)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#ECC138]" />
                    <span>Moderate (61–90)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#F97316]" />
                    <span>Poor (91–120)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                    <span>Very Poor (121–250)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#7F1D1D]" />
                    <span>Severe (250+)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          BOTTOM TELEMETRY HUD BAR
          ------------------------------------------------------------- */}
      {showTelemetryHUD && (
        <div className="absolute bottom-2 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-[#0B0E14]/85 backdrop-blur-md border border-[#232A3B] text-[10px] font-mono text-slate-400 pointer-events-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-200">
              <Navigation className="w-3 h-3 text-[#ECC138]" />
              <span>
                {telemetry.lat}° N, {telemetry.lon}° E
              </span>
            </span>
            <span className="text-slate-600">|</span>
            <span>Zoom {telemetry.zoom}</span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-[#ECC138] hidden sm:inline font-semibold">{telemetry.city}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 hidden md:inline">EcoTwin Airshed Grid</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
};
