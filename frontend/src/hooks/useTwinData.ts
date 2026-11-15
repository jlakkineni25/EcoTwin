import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { 
  Station, 
  SummaryData, 
  PlaybackFrame, 
  PlaybackIndex,
  LiveMeta,
  LiveWhatIf,
  WhatIfIndex,
  WhatIfWindow,
  WindEdgesMap, 
  WindNowMap,
  Calibration,
  ExplainIndex,
  ExplainWindow,
  ModelCard 
} from '../types';
import { asset, LIVE_BASE } from '../utils/paths';

export function useStations() {
  return useQuery<Station[]>({
    queryKey: ['stations'],
    queryFn: async () => {
      const res = await fetch(asset('/data/stations.json'));
      if (!res.ok) throw new Error('Failed to load stations data');
      return res.json();
    },
    staleTime: Infinity,
  });
}

export function useSummary() {
  return useQuery<SummaryData>({
    queryKey: ['summary'],
    queryFn: async () => {
      const res = await fetch(asset('/data/summary.json'));
      if (!res.ok) throw new Error('Failed to load summary metadata');
      return res.json();
    },
    staleTime: Infinity,
  });
}

// Playback is one small file per window (about 20 KB), so a browser only downloads the windows it shows
export function usePlaybackIndex() {
  return useQuery<PlaybackIndex>({
    queryKey: ['playback_index'],
    queryFn: async () => {
      const res = await fetch(asset('/data/playback/index.json'));
      if (!res.ok) throw new Error('Failed to load playback index');
      return res.json();
    },
    staleTime: Infinity,
  });
}

export function usePlaybackFrame(windowId: number | undefined) {
  return useQuery<PlaybackFrame>({
    queryKey: ['playback_frame', windowId],
    queryFn: async () => {
      const res = await fetch(asset(`/data/playback/${windowId}.json`));
      if (!res.ok) throw new Error('Failed to load playback window');
      return res.json();
    },
    enabled: windowId !== undefined,
    staleTime: Infinity,
    placeholderData: keepPreviousData, // keep the previous window on screen while the next one loads
  });
}

// One small file per window (about 1.5 KB) with the wind links of that hour: [source, target, weight]
export function useWindEdgesWindow(windowId: number | undefined) {
  return useQuery<[number, number, number][]>({
    queryKey: ['wind_edges', windowId],
    queryFn: async () => {
      const res = await fetch(asset(`/data/wind_edges/${windowId}.json`));
      if (!res.ok) throw new Error('Failed to load wind links for this window');
      return res.json();
    },
    enabled: windowId !== undefined,
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  });
}

export function useWhatIfIndex() {
  return useQuery<WhatIfIndex>({
    queryKey: ['whatif_index'],
    queryFn: async () => {
      const res = await fetch(asset('/data/whatif/index.json'));
      if (!res.ok) throw new Error('Failed to load what-if scenarios');
      return res.json();
    },
    staleTime: Infinity,
  });
}

// One small file per window (about 35 KB), fetched only for the window on screen
export function useWhatIfWindow(windowId: number | undefined) {
  return useQuery<WhatIfWindow>({
    queryKey: ['whatif_window', windowId],
    queryFn: async () => {
      const res = await fetch(asset(`/data/whatif/${windowId}.json`));
      if (!res.ok) throw new Error('No what-if data for this window');
      return res.json();
    },
    enabled: windowId !== undefined,
    retry: false,
    staleTime: Infinity,
  });
}

export function useWindNow() {
  return useQuery<WindNowMap>({
    queryKey: ['wind_now'],
    queryFn: async () => {
      const res = await fetch(asset('/data/wind_now.json'));
      if (!res.ok) throw new Error('Failed to load wind data');
      return res.json();
    },
    staleTime: Infinity,
  });
}

export function useCalibration() {
  return useQuery<Calibration>({
    queryKey: ['calibration'],
    queryFn: async () => {
      const res = await fetch(asset('/data/calibration.json'));
      if (!res.ok) throw new Error('Failed to load calibration');
      return res.json();
    },
    staleTime: Infinity,
  });
}

export function useExplainIndex() {
  return useQuery<ExplainIndex>({
    queryKey: ['explain_index'],
    queryFn: async () => {
      const res = await fetch(asset('/data/explain/index.json'));
      if (!res.ok) throw new Error('Failed to load explanation index');
      return res.json();
    },
    staleTime: Infinity,
  });
}

// One small file per window (about 9 KB), fetched only for the window on screen
export function useExplainWindow(windowIdx: number | undefined) {
  return useQuery<ExplainWindow>({
    queryKey: ['explain', windowIdx],
    queryFn: async () => {
      const res = await fetch(asset(`/data/explain/${windowIdx}.json`));
      if (!res.ok) throw new Error('No explanation for this window');
      return res.json();
    },
    enabled: windowIdx !== undefined,
    retry: false,
    staleTime: Infinity,
  });
}

// ---- live data (public/data/live, written by notebook 41). Without these files the page simply stays in replay.
const LIVE = LIVE_BASE;
async function getLive<T>(name: string): Promise<T> {
  const res = await fetch(`${LIVE}/${name}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`No ${name}`);
  return res.json();
}

export function useLiveMeta() {
  return useQuery<LiveMeta>({
    queryKey: ['live_meta'],
    queryFn: () => getLive<LiveMeta>('live_meta.json'),
    retry: false,
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // pick up a new run of the notebook
  });
}

// the other live files are keyed by the run (generated_at) so a new run replaces them
export function useLiveFrame(enabled: boolean, run?: string) {
  return useQuery<PlaybackFrame>({
    queryKey: ['live_frame', run],
    queryFn: () => getLive<PlaybackFrame>('live_frame.json'),
    enabled: enabled && !!run,
    retry: false,
    staleTime: Infinity,
  });
}

export function useLiveWind(enabled: boolean, run?: string) {
  return useQuery<WindNowMap>({
    queryKey: ['live_wind', run],
    queryFn: () => getLive<WindNowMap>('live_wind_now.json'),
    enabled: enabled && !!run,
    retry: false,
    staleTime: Infinity,
  });
}

export function useLiveEdges(enabled: boolean, run?: string) {
  return useQuery<WindEdgesMap>({
    queryKey: ['live_edges', run],
    queryFn: () => getLive<WindEdgesMap>('live_wind_edges.json'),
    enabled: enabled && !!run,
    retry: false,
    staleTime: Infinity,
  });
}

export function useLiveWhatIf(enabled: boolean, run?: string) {
  return useQuery<LiveWhatIf>({
    queryKey: ['live_whatif', run],
    queryFn: () => getLive<LiveWhatIf>('live_whatif.json'),
    enabled: enabled && !!run,
    retry: false,
    staleTime: Infinity,
  });
}

export function useModelCard() {
  return useQuery<ModelCard>({
    queryKey: ['model_card'],
    queryFn: async () => {
      const res = await fetch(asset('/data/model_card.json'));
      if (!res.ok) throw new Error('Failed to load model card');
      return res.json();
    },
    staleTime: Infinity,
  });
}

