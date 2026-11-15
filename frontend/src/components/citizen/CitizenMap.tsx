import React, { useMemo } from 'react';
import { Station, StationForecast } from '../../types';
import { CPCB_CATEGORIES, getAQICategory } from '../../utils/aqi';
import { GeoMonitoringMap } from '../map/GeoMonitoringMap';
import { MapPin, Globe, Sparkles } from 'lucide-react';
import { useTwinStore } from '../../store/useTwinStore';
import { getCityById } from '../../data/citiesData';

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
  const { selectedCityId, setSelectedCityId } = useTwinStore();
  const currentCity = useMemo(() => getCityById(selectedCityId || 'delhi'), [selectedCityId]);

  // Map forecast data by station ID
  const forecastMap = useMemo(() => {
    return new Map(forecasts.map((f) => [f.station_id, f]));
  }, [forecasts]);

  return (
    <div className="w-full bg-[#121620] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#232A3B] shadow-2xl relative overflow-hidden">
      {/* Header section with Multi-City Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#ECC138]" />
            <h2 className="text-base sm:text-lg font-bold text-white font-display flex items-center gap-2">
              <span>Geographic Air Quality Monitoring Map</span>
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#181E2B] border border-[#232A3B] text-slate-300 font-normal">
                <Globe className="w-3 h-3 text-[#38BDF8]" />
                {currentCity.name}
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Geographically accurate multi-city monitoring map. Select any station to view live observations and 24-hour predictions.
          </p>
        </div>
      </div>

      {/* Main Unified Interactive Geo Map */}
      <GeoMonitoringMap
        variant="citizen"
        stations={stations}
        forecasts={forecasts}
        selectedStationId={selectedStationId}
        onSelectStation={onSelectStation}
        selectedCityId={selectedCityId}
        onSelectCity={(cid) => setSelectedCityId(cid)}
        compassAngle={compassAngle}
        wind={wind}
        links={links}
        showCitySelector={true}
        showSearch={true}
        showBasemapToggle={true}
        showTelemetryHUD={true}
        showWindOverlay={true}
        showAirshedLinks={true}
        showLegend={true}
        className="h-[460px] sm:h-[530px] lg:h-[580px]"
      />

      {/* Quick Station Tap Strip (For currently active city stations) */}
      <div className="mt-4 pt-3 border-t border-[#232A3B]/60">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
            Quick Jump to Station ({currentCity.name}):
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            Hover marker on map for coordinates & details
          </span>
        </div>
        <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="flex items-center gap-2 min-w-max">
            {stations.map((st) => {
              const forecast = forecastMap.get(st.id);
              const pm25 = forecast ? Math.round(forecast.current_pm25) : 45;
              const cat = forecast?.current_aqi || getAQICategory(pm25);
              const catCfg = CPCB_CATEGORIES[cat] || CPCB_CATEGORIES.Moderate;
              const isSelected = st.id === selectedStationId;

              return (
                <button
                  key={st.id}
                  onClick={() => onSelectStation(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#ECC138]/20 text-[#ECC138] font-bold border border-[#ECC138] shadow-lg scale-105'
                      : 'bg-[#0E121B] text-slate-300 hover:text-white hover:bg-[#181E2B] border border-[#232A3B]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: catCfg.color }}
                  />
                  <span>{st.name}</span>
                  {forecast && (
                    <span className="font-mono text-[10px] opacity-80 text-white">
                      {pm25}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CPCB Color Scale Legend Cards */}
      <div className="mt-3 pt-3 border-t border-[#232A3B] flex flex-col gap-2">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
          National Air Quality Standard Categories (CPCB):
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
