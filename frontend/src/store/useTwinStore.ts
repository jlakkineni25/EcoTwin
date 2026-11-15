import { create } from 'zustand';

export type StudioView = 'map' | 'forecast' | 'whatif' | 'why' | 'health';

interface TwinState {
  selectedStationId: number;
  selectedCityId: string;
  currentWindowIdx: number;
  isPlaying: boolean;
  playbackSpeed: number; // ms per tick
  activeStudioView: StudioView;
  
  // Layer toggles
  showAirshedGraph: boolean;
  showWindParticles: boolean;
  
  // What-If scenario states
  scenarioKey: string;
  compassAngle: number; // 0 - 360 degrees
  windSpeedMultiplier: number; // 0.2 to 3.0x

  // Real wind of the current window (from /data/wind_now.json); null when unavailable
  realWind: { speedMs: number; fromDeg: number } | null;

  // Where the data on screen comes from: a stored test window ('replay') or the latest station data ('live')
  dataMode: 'replay' | 'live';
  
  // Walkthrough
  isDemoActive: boolean;
  demoStep: number; // 1 to 5

  // Actions
  setSelectedStationId: (id: number) => void;
  setSelectedCityId: (cityId: string) => void;
  setCurrentWindowIdx: (idx: number) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setActiveStudioView: (view: StudioView) => void;
  setShowAirshedGraph: (show: boolean) => void;
  setShowWindParticles: (show: boolean) => void;
  setScenarioKey: (key: string) => void;
  setCompassAngle: (angle: number) => void;
  setWindSpeedMultiplier: (speed: number) => void;
  setRealWind: (w: { speedMs: number; fromDeg: number } | null) => void;
  setDataMode: (m: 'replay' | 'live') => void;
  startDemo: () => void;
  stopDemo: () => void;
  setDemoStep: (step: number) => void;
}

export const useTwinStore = create<TwinState>((set) => ({
  selectedStationId: 0,
  selectedCityId: 'delhi',
  currentWindowIdx: 0,
  isPlaying: false,
  playbackSpeed: 1200,
  activeStudioView: 'map',
  
  showAirshedGraph: true,
  showWindParticles: true,
  
  scenarioKey: 'baseline',
  compassAngle: 315, // NW default (typical stubble smoke direction into Delhi)
  windSpeedMultiplier: 1.0,
  realWind: null,
  dataMode: 'replay',
  
  isDemoActive: false,
  demoStep: 1,

  setSelectedStationId: (id) => set({ selectedStationId: id }),
  setSelectedCityId: (cityId) => set({ selectedCityId: cityId }),
  setCurrentWindowIdx: (idx) => set({ currentWindowIdx: idx }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setActiveStudioView: (view) => set({ activeStudioView: view }),
  setShowAirshedGraph: (show) => set({ showAirshedGraph: show }),
  setShowWindParticles: (show) => set({ showWindParticles: show }),
  setScenarioKey: (key) => set({ scenarioKey: key }),
  setCompassAngle: (angle) => set({ compassAngle: angle }),
  setWindSpeedMultiplier: (speed) => set({ windSpeedMultiplier: speed }),
  setRealWind: (w) => set({ realWind: w }),
  setDataMode: (m) => set({ dataMode: m }),
  startDemo: () => set({ isDemoActive: true, demoStep: 1, activeStudioView: 'map' }),
  stopDemo: () => set({ isDemoActive: false }),
  setDemoStep: (step) => set({ demoStep: step }),
}));
