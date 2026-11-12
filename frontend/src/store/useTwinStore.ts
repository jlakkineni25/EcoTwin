import { create } from 'zustand';

export type DashboardTab = 
  | 'digital-twin' 
  | 'what-if' 
  | 'health-advisor' 
  | 'credibility' 
  | 'walkthrough';

export type StudioView = 'map' | 'forecast' | 'whatif' | 'why' | 'health';

interface TwinState {
  selectedStationId: number;
  currentWindowIdx: number;
  isPlaying: boolean;
  playbackSpeed: number; // ms per tick
  activeTab: DashboardTab;
  activeStudioView: StudioView;
  
  // Layer toggles
  showAirshedGraph: boolean;
  showWindParticles: boolean;
  
  // What-If scenario states
  scenarioKey: string;
  compassAngle: number; // 0 - 360 degrees
  windSpeedMultiplier: number; // 0.2 to 3.0x
  
  // Walkthrough
  isDemoActive: boolean;
  demoStep: number; // 1 to 5

  // Actions
  setSelectedStationId: (id: number) => void;
  setCurrentWindowIdx: (idx: number) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setActiveTab: (tab: DashboardTab) => void;
  setActiveStudioView: (view: StudioView) => void;
  setShowAirshedGraph: (show: boolean) => void;
  setShowWindParticles: (show: boolean) => void;
  setScenarioKey: (key: string) => void;
  setCompassAngle: (angle: number) => void;
  setWindSpeedMultiplier: (speed: number) => void;
  startDemo: () => void;
  stopDemo: () => void;
  setDemoStep: (step: number) => void;
}

export const useTwinStore = create<TwinState>((set) => ({
  selectedStationId: 0,
  currentWindowIdx: 0,
  isPlaying: false,
  playbackSpeed: 1200,
  activeTab: 'digital-twin',
  activeStudioView: 'map',
  
  showAirshedGraph: true,
  showWindParticles: true,
  
  scenarioKey: 'baseline',
  compassAngle: 315, // NW default (typical stubble smoke direction into Delhi)
  windSpeedMultiplier: 1.0,
  
  isDemoActive: false,
  demoStep: 1,

  setSelectedStationId: (id) => set({ selectedStationId: id }),
  setCurrentWindowIdx: (idx) => set({ currentWindowIdx: idx }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveStudioView: (view) => set({ activeStudioView: view }),
  setShowAirshedGraph: (show) => set({ showAirshedGraph: show }),
  setShowWindParticles: (show) => set({ showWindParticles: show }),
  setScenarioKey: (key) => set({ scenarioKey: key }),
  setCompassAngle: (angle) => set({ compassAngle: angle }),
  setWindSpeedMultiplier: (speed) => set({ windSpeedMultiplier: speed }),
  startDemo: () => set({ isDemoActive: true, demoStep: 1, activeStudioView: 'map' }),
  stopDemo: () => set({ isDemoActive: false }),
  setDemoStep: (step) => set({ demoStep: step }),
}));
