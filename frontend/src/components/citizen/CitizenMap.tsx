import React, { useEffect, useRef, useState, useMemo } from 'react';
import maplibregl, { Map as MapLibreMap, Marker } from 'maplibre-gl';
import { Station, StationForecast } from '../../types';
import { CPCB_CATEGORIES, getAQICategory } from '../../utils/aqi';
import { STATION_ZONE_MAPPING } from '../../utils/citizenZones';
import { compassWord, windSpeedWord } from '../../utils/wind';
import {
  MapPin,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Wind,
  Navigation,
  Compass,
} from 'lucide-react';

interface Props {
  stations: Station[];
  forecasts: StationForecast[];
  selectedStationId: number;
  onSelectStation: (id: number) => void;
  compassAngle?: number;
  // real wind of the moment on screen: direction it blows FROM (degrees, 0 = north) and speed (km/h)
  wind?: { fromDeg: number; speedKmh: number } | null;
  // wind links of the moment on screen: [upwind station id, downwind station id, strength]
  links?: [number, number, number][];
}

export const CitizenMap: React.FC<Props> = ({
  stations,
  forecasts,
  selectedStationId,
  onSelectStation,
  compassAngle,
  wind,
  links,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [basemapMode, setBasemapMode] = useState<'street' | 'satellite'>('street');
  const [showWind, setShowWind] = useState(false);
  // the animation reads the latest links and selection without restarting
  const linksRef = useRef(links);
  linksRef.current = links;
  const selectedRef = useRef(selectedStationId);
  selectedRef.current = selectedStationId;
  const stationsRef = useRef(stations);
  stationsRef.current = stations;

  // Map forecast data by station ID
  const forecastMap = useMemo(() => {
    return new Map(forecasts.map((f) => [f.station_id, f]));
  }, [forecasts]);

  // Selected station object
  const selectedStation = useMemo(() => {
    return stations.find((s) => s.id === selectedStationId) || stations[0];
  }, [stations, selectedStationId]);

  const selectedForecast = selectedStation
    ? forecastMap.get(selectedStation.id)
    : null;

  // the three strongest wind links that reach the selected station (names of the upwind stations)
  const incomingNames = useMemo(() => {
    if (!selectedStation || !links) return [] as string[];
    const nameOf = new Map(stations.map((s) => [s.id, s.name]));
    return links
      .filter(([, tgt]) => tgt === selectedStation.id)
      .sort((a, b) => b[2] - a[2])
      .slice(0, 3)
      .map(([src]) => nameOf.get(src) || `Station ${src}`);
  }, [links, selectedStation, stations]);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const delhiCenter: [number, number] = [77.215, 28.635];

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'esri-dark-base': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            attribution: '© Esri',
          },
          'delhi-satellite': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            attribution: '© Esri',
          },
        },
        layers: [
          {
            id: 'esri-dark-base-layer',
            type: 'raster',
            source: 'esri-dark-base',
            minzoom: 0,
            maxzoom: 18,
          },
        ],
      },
      center: delhiCenter,
      zoom: 10.1,
      maxZoom: 14,
      minZoom: 8.5,
      attributionControl: false,
      cooperativeGestures: true, // Prevents scroll hijacking on mobile touchscreens!
    });

    map.on('load', () => {
      // Add Delhi NCT perimeter outline
      map.addSource('delhi-perimeter', {
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
          properties: { name: 'Delhi NCR Border' },
        },
      });

      map.addLayer({
        id: 'delhi-perimeter-line',
        type: 'line',
        source: 'delhi-perimeter',
        paint: {
          'line-color': '#ECC138',
          'line-width': 1.6,
          'line-dasharray': [3, 2],
          'line-opacity': 0.7,
        },
      });

      // (no hand-drawn river line: the basemap already shows the Yamuna accurately)
      mapRef.current = map;
      setMapLoaded(true);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update basemap layer (street vs satellite)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (basemapMode === 'satellite') {
      if (!map.getLayer('satellite-layer')) {
        map.addLayer(
          {
            id: 'satellite-layer',
            type: 'raster',
            source: 'delhi-satellite',
            paint: { 'raster-opacity': 0.85 },
          },
          'delhi-perimeter-line'
        );
      }
    } else {
      if (map.getLayer('satellite-layer')) {
        map.removeLayer('satellite-layer');
      }
    }
  }, [basemapMode, mapLoaded]);

  // Render HTML station markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || stations.length === 0) return;

    // Remove existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    stations.forEach((st) => {
      const forecast = forecastMap.get(st.id);
      if (!forecast) return; // no forecast for this station in this window: no marker
      const pm25 = Math.round(forecast.current_pm25);
      const cat = forecast?.current_aqi || getAQICategory(pm25);
      const catCfg = CPCB_CATEGORIES[cat] || CPCB_CATEGORIES.Moderate;
      const isSelected = st.id === selectedStationId;

      // Marker container
      const el = document.createElement('div');
      el.className = 'cursor-pointer group flex flex-col items-center select-none';

      // Inner dot HTML with high readability and beacon for selected station
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          ${
            isSelected
              ? `<div class="absolute -inset-3.5 rounded-full animate-ping opacity-70" style="background-color: ${catCfg.color}"></div>
                 <div class="absolute -inset-2 rounded-full border-2 border-white shadow-2xl" style="background-color: ${catCfg.color}"></div>
                 <div class="absolute -top-7 px-2 py-0.5 rounded-md bg-[#ECC138] text-[#0B0E14] text-[10px] font-mono font-black shadow-lg uppercase whitespace-nowrap animate-bounce">
                   Active
                 </div>`
              : pm25 > 200
              ? `<div class="absolute -inset-1 rounded-full animate-pulse opacity-40" style="background-color: ${catCfg.color}"></div>`
              : ''
          }
          <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-mono font-black text-white shadow-xl transition-transform group-hover:scale-125 border-2 ${
            isSelected ? 'border-white scale-110' : 'border-white/70'
          }" style="background-color: ${catCfg.color}">
            ${pm25}
          </div>
        </div>
        <div class="mt-1 px-2 py-0.5 rounded-md bg-[#0B0E14]/95 border text-[10px] font-semibold text-slate-100 whitespace-nowrap shadow-md pointer-events-none transition-all ${
          isSelected
            ? 'border-emerald-400 font-bold text-white shadow-emerald-500/30'
            : 'border-[#232A3B] group-hover:border-slate-400 group-hover:text-white'
        }">
          ${st.name}
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectStation(st.id);
        map.flyTo({ center: [st.lon, st.lat], zoom: 12.0, duration: 1000 });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([st.lon, st.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [stations, forecastMap, selectedStationId, mapLoaded, onSelectStation]);

  // Wind links layer: curved arrows from the upwind station to the station the air reaches (drawn under the station markers).
  // Brighter = links into the selected station; thicker = stronger link. Same links the forecast model uses.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !showWind) return;
    const holder = map.getCanvasContainer();
    const base = holder.querySelector('canvas');
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;';   // sized in px below (the canvas container itself has no height)
    holder.insertBefore(canvas, base ? base.nextSibling : holder.firstChild);
    const ctx = canvas.getContext('2d');
    if (!ctx) { canvas.remove(); return; }

    let w = 0, h = 0;
    const fit = () => {
      const r = map.getContainer().getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      w = r.width; h = r.height;
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(map.getContainer());

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let phase = 0;
    let raf = 0;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const sel = selectedRef.current;
      const byId = new Map(stationsRef.current.map((s) => [s.id, s]));
      const all = [...(linksRef.current || [])].sort((x, y) => y[2] - x[2]);
      // the 40 strongest links, plus every link that touches the selected station
      const shown = all.filter((l, i) => i < 40 || l[0] === sel || l[1] === sel);
      const maxW = Math.max(...shown.map((l) => l[2]), 0.0001);
      phase += reduced ? 0 : 0.006;

      for (const [src, tgt, weight] of shown) {
        const a = byId.get(src), b = byId.get(tgt);
        if (!a || !b) continue;
        const p1 = map.project([a.lon, a.lat]), p2 = map.project([b.lon, b.lat]);
        const dx = p2.x - p1.x, dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 4) continue;
        const rel = weight / maxW;
        const touches = src === sel || tgt === sel;
        const k = Math.min(0.16, 18 / dist);
        const cx = (p1.x + p2.x) / 2 - dy * k, cy = (p1.y + p2.y) / 2 + dx * k;      // slight bend so opposite links do not overlap
        const at = (t: number) => ({
          x: (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * cx + t * t * p2.x,
          y: (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * cy + t * t * p2.y,
        });

        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.quadraticCurveTo(cx, cy, p2.x, p2.y);
        ctx.strokeStyle = touches ? `rgba(254, 240, 138, ${0.55 + rel * 0.4})` : `rgba(236, 193, 56, ${0.18 + rel * 0.3})`;
        ctx.lineWidth = (touches ? 2.2 : 1.2) + rel * (touches ? 2.6 : 1.8);
        ctx.lineCap = 'round'; ctx.stroke();

        // arrow head near the downwind end: shows the direction even when nothing moves
        const tip = at(0.86), back = at(0.78);
        const ang = Math.atan2(tip.y - back.y, tip.x - back.x), sz = touches ? 8 : 6;
        ctx.beginPath();
        ctx.moveTo(tip.x, tip.y);
        ctx.lineTo(tip.x - sz * Math.cos(ang - 0.45), tip.y - sz * Math.sin(ang - 0.45));
        ctx.lineTo(tip.x - sz * Math.cos(ang + 0.45), tip.y - sz * Math.sin(ang + 0.45));
        ctx.closePath();
        ctx.fillStyle = touches ? 'rgba(255, 253, 248, 0.95)' : 'rgba(236, 193, 56, 0.7)';
        ctx.fill();

        // a dot travels from the upwind station to the downwind one
        if (!reduced) {
          const t = (phase * (0.8 + rel * 0.6) + (src * 0.137)) % 1;
          const d = at(t);
          ctx.beginPath(); ctx.arc(d.x, d.y, touches ? 3 : 2, 0, Math.PI * 2);
          ctx.fillStyle = touches ? 'rgba(255, 253, 248, 0.95)' : 'rgba(255, 220, 120, 0.8)';
          ctx.fill();
        }
      }
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    draw();
    if (reduced) map.on('move', draw);   // still picture: redraw when the map moves

    return () => { cancelAnimationFrame(raf); map.off('move', draw); ro.disconnect(); canvas.remove(); };
  }, [mapLoaded, showWind]);

  // Fly to selected station if changed from outside
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !selectedStation) return;
    mapRef.current.flyTo({
      center: [selectedStation.lon, selectedStation.lat],
      zoom: 12.0,
      duration: 1000,
    });
  }, [selectedStationId, mapLoaded]);

  const resetView = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [77.215, 28.635], zoom: 10.1, duration: 1000 });
    }
  };

  const zoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn({ duration: 300 });
  };

  const zoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut({ duration: 300 });
  };

  return (
    <div className="bg-[#121620] border-2 border-[#232A3B] rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              Delhi Monitoring Stations Map
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Tap or click any station to view its readings and 24-hour forecast
          </p>
        </div>

        {/* Map Control Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {/* Wind direction toggle */}
          <button
            onClick={() => setShowWind((v) => !v)}
            disabled={!links?.length}
            aria-pressed={showWind}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all ${
              !wind
                ? 'bg-[#181E2B] border-[#232A3B] text-slate-600 cursor-not-allowed'
                : showWind
                ? 'bg-[#ECC138]/20 border-[#ECC138]/60 text-[#ECC138] cursor-pointer'
                : 'bg-[#181E2B] hover:bg-[#1E2638] border-[#232A3B] text-slate-300 cursor-pointer'
            }`}
            title={links?.length ? 'Show how the wind links the stations: which station the air reaches next' : 'Wind links are not available for this moment'}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Wind links</span>
          </button>

          {/* Basemap Toggle */}
          <button
            onClick={() => setBasemapMode(basemapMode === 'street' ? 'satellite' : 'street')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181E2B] hover:bg-[#1E2638] border border-[#232A3B] text-xs text-slate-300 transition-all cursor-pointer"
            title="Toggle Street or Satellite View"
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>{basemapMode === 'street' ? 'Street View' : 'Satellite'}</span>
          </button>

          {/* Reset View */}
          <button
            onClick={resetView}
            className="p-2 rounded-xl bg-[#181E2B] hover:bg-[#1E2638] border border-[#232A3B] text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Center Delhi View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Zoom controls */}
          <button
            onClick={zoomIn}
            className="p-2 rounded-xl bg-[#181E2B] hover:bg-[#1E2638] border border-[#232A3B] text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={zoomOut}
            className="p-2 rounded-xl bg-[#181E2B] hover:bg-[#1E2638] border border-[#232A3B] text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Map Canvas Container */}
      <div className="relative w-full h-[420px] sm:h-[490px] lg:h-[530px] rounded-2xl overflow-hidden border border-[#232A3B]">
        <div ref={mapContainer} className="w-full h-full" />

        {/* Floating Active Station Summary Pill (Top Left) */}
        {selectedStation && selectedForecast && (
          <div className="absolute top-3 left-3 bg-[#0B0E14]/95 backdrop-blur-md border border-[#232A3B] p-3 rounded-2xl shadow-2xl max-w-xs z-10 animate-in fade-in">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block font-bold">
              Active Station
            </span>
            <div className="flex items-center justify-between gap-3 mt-1">
              <div>
                <span className="text-sm font-bold text-white block truncate">
                  {selectedStation.name}
                </span>
                <span className="text-[11px] text-slate-400">
                  {STATION_ZONE_MAPPING[selectedStation.id]?.zone || 'Central'} Delhi
                </span>
              </div>
              <div className="text-right">
                <span
                  className="text-lg font-black font-mono"
                  style={{
                    color:
                      CPCB_CATEGORIES[
                        selectedForecast.current_aqi ||
                          getAQICategory(selectedForecast.current_pm25)
                      ]?.textHex,
                  }}
                >
                  {Math.round(selectedForecast.current_pm25)}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  µg/m³
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Wind links note: what the arrows mean, in words */}
        {showWind && !!links?.length && (
          <div className="absolute bottom-3 left-3 z-10 max-w-[82%] bg-[#0B0E14]/92 backdrop-blur-md border border-[#ECC138]/40 rounded-xl px-3 py-2 shadow-xl pointer-events-none">
            <div className="flex items-start gap-2 text-xs text-white">
              <Wind className="w-4 h-4 text-[#ECC138] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div>
                  {incomingNames.length > 0
                    ? <>The strongest wind links into <b>{selectedStation?.name}</b> come from <b>{incomingNames.join(', ')}</b>.</>
                    : <>No strong wind link reaches <b>{selectedStation?.name}</b> right now.</>}
                </div>
                <p className="text-[10px] text-slate-400">
                  Arrows run from a station upwind to the station the air reaches. Thicker means a stronger link.
                  {wind ? ` Wind now: ${windSpeedWord(wind.speedKmh) === 'calm' ? 'calm air' : `${windSpeedWord(wind.speedKmh)} wind`} from the ${compassWord(wind.fromDeg)} (${Math.round(wind.speedKmh)} km/h).` : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Floating Mobile Scroll Hint (Bottom Right on Mobile) */}
        <div className="sm:hidden absolute bottom-2 right-2 bg-[#0B0E14]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#232A3B] text-[10px] text-slate-400 pointer-events-none">
          Use 2 fingers to move map
        </div>
      </div>

      {/* Quick Station Tap Strip (Essential for easy station selection on Mobile/Tablet) */}
      <div className="mt-3 pt-3 border-t border-[#232A3B]/60">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
          Quick Jump to Neighborhood:
        </span>
        <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="flex items-center gap-2 min-w-max">
            {stations.map((st) => {
              const forecast = forecastMap.get(st.id);
              if (!forecast) return null;
              const pm25 = Math.round(forecast.current_pm25);
              const cat = forecast?.current_aqi || getAQICategory(pm25);
              const catCfg = CPCB_CATEGORIES[cat] || CPCB_CATEGORIES.Moderate;
              const isSelected = st.id === selectedStationId;

              return (
                <button
                  key={st.id}
                  onClick={() => onSelectStation(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-emerald-500/25 text-white font-bold border border-emerald-500/50 shadow-md'
                      : 'bg-[#0E121B] text-slate-300 hover:text-white hover:bg-[#181E2B] border border-[#232A3B]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: catCfg.color }}
                  />
                  <span>{st.name}</span>
                  <span className="font-mono text-[10px] opacity-75">
                    {pm25}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CPCB Color Scale Legend (Plain Language) */}
      <div className="mt-3 pt-3 border-t border-[#232A3B] flex flex-col gap-2">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
          National Air Quality Categories:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {Object.entries(CPCB_CATEGORIES).map(([catName, cfg]) => (
            <div
              key={catName}
              className="p-2.5 rounded-xl bg-[#0D111A] border border-[#232A3B] flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cfg.color }}
                />
                <span className="text-xs font-bold text-white truncate">
                  {catName}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {cfg.min}–{cfg.max === 999 ? '500+' : cfg.max} µg/m³
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                {cfg.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
