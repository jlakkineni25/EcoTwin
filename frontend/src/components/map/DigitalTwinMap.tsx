import React, { useMemo } from 'react';
import { Station, StationForecast, WindEdgesMap } from '../../types';
import { GeoMonitoringMap } from './GeoMonitoringMap';
import { useTwinStore } from '../../store/useTwinStore';
import { AlertTriangle, Maximize2, Minimize2 } from 'lucide-react';

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
  className = '',
  onToggleExpand,
  isExpanded = false,
}) => {
  const {
    selectedStationId,
    setSelectedStationId,
    selectedCityId,
    setSelectedCityId,
    compassAngle,
    realWind,
  } = useTwinStore();

  const stationMap = useMemo(() => new Map(stations.map((s) => [s.id, s])), [stations]);

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

  return (
    <div className={`relative w-full h-full min-h-[360px] sm:min-h-[420px] flex flex-col ${className}`}>
      {/* Top Banner: Breach Alert Pill if any */}
      {breachAlerts.length > 0 && selectedCityId === 'delhi' && (
        <div className="absolute top-14 left-3 z-20 flex items-center gap-2 p-1.5 px-3 rounded-xl bg-rose-950/80 backdrop-blur-md border border-rose-800/60 text-[11px] font-mono text-rose-200 pointer-events-none shadow-xl animate-fade-in">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="truncate">
            <span className="font-bold text-rose-300">CPCB Breach Warning:</span>{' '}
            {breachAlerts.map((b) => `${b.name} (+${b.leadHours}h)`).join(' · ')}
          </span>
        </div>
      )}

      {/* Expand / Collapse Control Button for Studio */}
      {onToggleExpand && (
        <button
          onClick={onToggleExpand}
          className="absolute top-3 right-14 z-30 p-2.5 rounded-xl bg-[#0B0E14]/90 backdrop-blur-xl border border-[#232A3B] hover:border-slate-500 text-slate-300 hover:text-white shadow-xl transition-all cursor-pointer"
          title={isExpanded ? 'Collapse Map View' : 'Expand Map View'}
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      )}

      {/* Main Unified Interactive Geo Map */}
      <GeoMonitoringMap
        variant="research"
        stations={stations}
        forecasts={forecasts}
        windEdgesMap={windEdgesMap}
        windowIdx={windowIdx}
        selectedStationId={selectedStationId}
        onSelectStation={(id) => setSelectedStationId(id)}
        selectedCityId={selectedCityId}
        onSelectCity={(cid) => setSelectedCityId(cid)}
        compassAngle={compassAngle}
        wind={realWind ? { fromDeg: realWind.fromDeg, speedKmh: realWind.speedMs * 3.6 } : null}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        showSearch={true}
        showCitySelector={true}
        showBasemapToggle={true}
        showTelemetryHUD={true}
        showWindOverlay={true}
        showAirshedLinks={true}
        showLegend={true}
        className="flex-1 w-full h-full"
      />
    </div>
  );
};
