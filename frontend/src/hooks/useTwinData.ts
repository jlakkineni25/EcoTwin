import { useQuery } from '@tanstack/react-query';
import { 
  Station, 
  SummaryData, 
  PlaybackFrame, 
  WhatIfData, 
  WindEdgesMap, 
  BaselinesData 
} from '../types';

export function useStations() {
  return useQuery<Station[]>({
    queryKey: ['stations'],
    queryFn: async () => {
      const res = await fetch('/data/stations.json');
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
      const res = await fetch('/data/summary.json');
      if (!res.ok) throw new Error('Failed to load summary metadata');
      return res.json();
    },
    staleTime: Infinity,
  });
}

export function usePlayback() {
  return useQuery<PlaybackFrame[]>({
    queryKey: ['playback'],
    queryFn: async () => {
      const res = await fetch('/data/playback.json');
      if (!res.ok) throw new Error('Failed to load playback data');
      return res.json();
    },
    staleTime: Infinity,
  });
}

export function useWindEdges() {
  return useQuery<WindEdgesMap>({
    queryKey: ['wind_edges'],
    queryFn: async () => {
      const res = await fetch('/data/wind_edges.json');
      if (!res.ok) throw new Error('Failed to load wind edges graph');
      return res.json();
    },
    staleTime: Infinity,
  });
}

export function useWhatIf() {
  return useQuery<WhatIfData>({
    queryKey: ['whatif'],
    queryFn: async () => {
      const res = await fetch('/data/whatif.json');
      if (!res.ok) throw new Error('Failed to load what-if scenarios');
      return res.json();
    },
    staleTime: Infinity,
  });
}

export function useBaselines() {
  return useQuery<BaselinesData>({
    queryKey: ['baselines'],
    queryFn: async () => {
      const res = await fetch('/data/baselines_metrics.json');
      if (!res.ok) throw new Error('Failed to load baselines data');
      return res.json();
    },
    staleTime: Infinity,
  });
}

