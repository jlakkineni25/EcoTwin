import React, { useEffect, useRef, useState, useMemo } from 'react';
import maplibregl, { Map as MapLibreMap, Marker } from 'maplibre-gl';
import { Station, StationForecast } from '../../types';
import { CPCB_CATEGORIES, getAQICategory } from '../../utils/aqi';
import { STATION_ZONE_MAPPING } from '../../utils/citizenZones';
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
  compassAngle: number;
}

export const CitizenMap: React.FC<Props> = ({
  stations,
  forecasts,
  selectedStationId,
  onSelectStation,
  compassAngle,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [basemapMode, setBasemapMode] = useState<'street' | 'satellite'>('street');

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

      // Add Yamuna River Line
      map.addSource('yamuna-river', {
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
          properties: { name: 'Yamuna River' },
        },
      });

      map.addLayer({
        id: 'yamuna-river-line',
        type: 'line',
        source: 'yamuna-river',
        paint: {
          'line-color': '#38BDF8',
          'line-width': 2.2,
          'line-opacity': 0.55,
        },
      });

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
      const pm25 = forecast ? Math.round(forecast.current_pm25) : 120;
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
              const pm25 = forecast ? Math.round(forecast.current_pm25) : 120;
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
