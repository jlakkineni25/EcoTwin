import React, { useState, useMemo, useRef } from 'react';
import { Station, StationForecast, SummaryData } from '../../types';
import { DelhiZone, STATION_ZONE_MAPPING } from '../../utils/citizenZones';
import { CitizenNav } from './CitizenNav';
import { CitizenHero } from './CitizenHero';
import { CitizenStationCard } from './CitizenStationCard';
import { CitizenForecast } from './CitizenForecast';
import { CitizenWindMovement } from './CitizenWindMovement';
import { CitizenHealthAdvice } from './CitizenHealthAdvice';
import { CitizenMap } from './CitizenMap';
import { CitizenResearchCTA } from './CitizenResearchCTA';

interface Props {
  stations: Station[];
  forecasts: StationForecast[];
  summary?: SummaryData;
  timestamp: string;
  selectedStationId: number;
  onSelectStation: (id: number) => void;
  compassAngle: number;
  onExploreResearch: () => void;
}

export const CitizenExperience: React.FC<Props> = ({
  stations,
  forecasts,
  summary,
  timestamp,
  selectedStationId,
  onSelectStation,
  compassAngle,
  onExploreResearch,
}) => {
  const [activeZone, setActiveZone] = useState<DelhiZone>('All');
  const mapSectionRef = useRef<HTMLDivElement>(null);

  // Filter stations by zone if selected
  const filteredStations = useMemo(() => {
    if (activeZone === 'All') return stations;
    return stations.filter((s) => STATION_ZONE_MAPPING[s.id]?.zone === activeZone);
  }, [stations, activeZone]);

  // Current selected station object
  const currentStation = useMemo(() => {
    return stations.find((s) => s.id === selectedStationId) || stations[0];
  }, [stations, selectedStationId]);

  // Current station's forecast data
  const currentForecast = useMemo(() => {
    return (
      forecasts.find((f) => f.station_id === currentStation?.id) ||
      forecasts[0] || {
        station_id: 0,
        current_pm25: 156,
        current_aqi: 'Very Poor' as const,
        actual_24h: [],
        predicted_24h: [],
        peak_predicted: 228,
        hours_to_breach_cpcb: 1,
      }
    );
  }, [forecasts, currentStation]);

  // Citywide average PM2.5 calculation
  const citywideAvg = useMemo(() => {
    if (!forecasts || forecasts.length === 0) return 168;
    const sum = forecasts.reduce((acc, f) => acc + f.current_pm25, 0);
    return Math.round(sum / forecasts.length);
  }, [forecasts]);

  // Handle zone selection: if the currently selected station is outside the new zone, auto-select the first station in the zone
  const handleSelectZone = (zone: DelhiZone) => {
    setActiveZone(zone);
    if (zone !== 'All') {
      const stationsInZone = stations.filter(
        (s) => STATION_ZONE_MAPPING[s.id]?.zone === zone
      );
      if (
        stationsInZone.length > 0 &&
        !stationsInZone.some((s) => s.id === selectedStationId)
      ) {
        onSelectStation(stationsInZone[0].id);
      }
    }
  };

  const scrollToMap = () => {
    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 flex flex-col font-sans selection:bg-[#ECC138]/20 selection:text-[#ECC138]">
      {/* 1. Citizen Navigation Bar */}
      <CitizenNav
        stations={stations}
        selectedStationId={selectedStationId}
        onSelectStation={onSelectStation}
        activeZone={activeZone}
        onSelectZone={handleSelectZone}
        timestamp={timestamp}
        onExploreResearch={onExploreResearch}
      />

      {/* 2. Short Cinematic Introduction & Clear Orientation */}
      <CitizenHero
        stations={stations}
        forecasts={forecasts}
        timestamp={timestamp}
      />

      {/* 3. Main Dashboard Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Row 1: Selected Neighborhood Focal Point & Smoke Movement */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
          <div className="lg:col-span-7">
            {currentStation && (
              <CitizenStationCard
                station={currentStation}
                forecast={currentForecast}
                allStations={filteredStations}
                allForecasts={forecasts}
                onSelectStation={onSelectStation}
                citywideAvg={citywideAvg}
                timestamp={timestamp}
                onScrollToMap={scrollToMap}
              />
            )}
          </div>
          <div className="lg:col-span-5 flex flex-col">
            <CitizenWindMovement
              compassAngle={compassAngle}
              windSpeedKmh={8.4}
            />
          </div>
        </div>

        {/* Row 2: 24-Hour Forecast Strip */}
        <section>
          {currentStation && (
            <CitizenForecast
              forecast={currentForecast}
              timestamp={timestamp}
              stationName={currentStation.name}
            />
          )}
        </section>

        {/* Row 3: Practical Health Advice */}
        <section>
          {currentStation && (
            <CitizenHealthAdvice
              currentPm25={currentForecast.current_pm25}
              stationName={currentStation.name}
            />
          )}
        </section>

        {/* Row 4: Interactive Delhi Monitoring Map */}
        <section ref={mapSectionRef}>
          <CitizenMap
            stations={stations}
            forecasts={forecasts}
            selectedStationId={selectedStationId}
            onSelectStation={onSelectStation}
            compassAngle={compassAngle}
          />
        </section>

        {/* Row 5: Deep Research Gateway CTA */}
        <section className="pt-2">
          <CitizenResearchCTA onExploreResearch={onExploreResearch} />
        </section>
      </main>

      {/* Citizen Footer */}
      <footer className="border-t border-[#232A3B] bg-[#0E121B] py-8 px-4 sm:px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-300">ECOTWIN</span>
            <span>· Citizen Clean Air Companion</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={onExploreResearch}
              className="text-[#ECC138] hover:underline font-mono cursor-pointer"
            >
              Explore the Research Platform →
            </button>
            <span>·</span>
            <span>Data: CPCB India & Open-Meteo</span>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Designed for Delhi NCR Citizens
          </div>
        </div>
      </footer>
    </div>
  );
};

