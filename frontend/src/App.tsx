import React, { useMemo, useEffect, useState } from 'react';
import { useTwinStore } from './store/useTwinStore';
import {
  useStations,
  useSummary,
  usePlayback,
  useWindEdges,
  useWhatIf,
  useBaselines
} from './hooks/useTwinData';
import { StoryNav } from './components/story/StoryNav';
import { StoryHero } from './components/story/StoryHero';
import { StoryDataHero } from './components/story/StoryDataHero';
import { StoryChallenge } from './components/story/StoryChallenge';
import { StoryDilemma } from './components/story/StoryDilemma';
import { StoryMechanism } from './components/story/StoryMechanism';
import { StoryTwinIntro } from './components/story/StoryTwinIntro';
import { StoryTwinStudio } from './components/story/StoryTwinStudio';
import { StoryEvaluations } from './components/story/StoryEvaluations';
import { PanelWalkthrough } from './components/walkthrough/PanelWalkthrough';
import { AlertCircle, Wind, Command, X } from 'lucide-react';

export const App: React.FC = () => {
  const { data: stations, isLoading: loadingStations, error: errStations } = useStations();
  const { data: summary, isLoading: loadingSummary } = useSummary();
  const { data: playback, isLoading: loadingPlayback, error: errPlayback } = usePlayback();
  const { data: windEdges } = useWindEdges();
  const { data: whatIfData } = useWhatIf();
  const { data: baselines } = useBaselines();

  const {
    selectedStationId,
    currentWindowIdx,
    setCurrentWindowIdx,
    togglePlaying,
    setIsPlaying,
    isDemoActive,
    startDemo,
    stopDemo,
    setActiveStudioView
  } = useTwinStore();

  const isLoading = loadingStations || loadingSummary || loadingPlayback;
  const isError = errStations || errPlayback;

  const totalWindows = playback?.length || 970;

  // Experimental Hero Variant: 'cinematic' (Refokus/Cula) vs 'datastory' (The Pudding)
  const [heroVariant, setHeroVariant] = useState<'cinematic' | 'datastory'>('cinematic');
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Global Keyboard Shortcuts for Evaluation / Panel Day
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in search input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'Escape') {
        setIsShortcutsOpen(false);
        return;
      } else if (e.key === '?' || (e.key === '/' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlaying();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentWindowIdx(Math.min(totalWindows - 1, currentWindowIdx + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentWindowIdx(Math.max(0, currentWindowIdx - 1));
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        if (isDemoActive) {
          stopDemo();
        } else {
          startDemo();
          (document.getElementById('twin-studio') || document.getElementById('twin'))?.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (e.key === '1') {
        setActiveStudioView('map');
        (document.getElementById('twin-studio') || document.getElementById('twin'))?.scrollIntoView({ behavior: 'smooth' });
      } else if (e.key === '2') {
        setActiveStudioView('forecast');
        (document.getElementById('twin-studio') || document.getElementById('twin'))?.scrollIntoView({ behavior: 'smooth' });
      } else if (e.key === '3') {
        setActiveStudioView('whatif');
        (document.getElementById('twin-studio') || document.getElementById('twin'))?.scrollIntoView({ behavior: 'smooth' });
      } else if (e.key === '4') {
        setActiveStudioView('why');
        (document.getElementById('twin-studio') || document.getElementById('twin'))?.scrollIntoView({ behavior: 'smooth' });
      } else if (e.key === '5') {
        setActiveStudioView('health');
        (document.getElementById('twin-studio') || document.getElementById('twin'))?.scrollIntoView({ behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentWindowIdx,
    totalWindows,
    isDemoActive,
    togglePlaying,
    setIsPlaying,
    setCurrentWindowIdx,
    startDemo,
    stopDemo,
    setActiveStudioView,
    isShortcutsOpen
  ]);

  // Current frame data
  const currentFrame = useMemo(() => {
    if (!playback || playback.length === 0) return null;
    const idx = Math.min(Math.max(0, currentWindowIdx), playback.length - 1);
    return playback[idx];
  }, [playback, currentWindowIdx]);

  // Selected station metadata & forecast
  const selectedStation = useMemo(() => {
    if (!stations) return null;
    return stations.find((s) => s.id === selectedStationId) || stations[0];
  }, [stations, selectedStationId]);

  const selectedForecast = useMemo(() => {
    if (!currentFrame || !selectedStation) return null;
    return (
      currentFrame.stations.find((f) => f.station_id === selectedStation.id) ||
      currentFrame.stations[0]
    );
  }, [currentFrame, selectedStation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0E14] text-[#FFFDF8] gap-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-[#ECC138]/20 border-t-[#ECC138] animate-spin"></div>
          <Wind className="w-6 h-6 text-[#ECC138] absolute animate-pulse" />
        </div>
        <div className="text-center">
          <h2 className="text-base font-display font-bold text-[#FFFDF8]">Loading EcoTwin Digital Twin...</h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Hydrating 37 continuous Delhi monitoring stations & 970 evaluation windows
          </p>
        </div>
      </div>
    );
  }

  if (isError || !playback || !stations || !currentFrame || !selectedStation || !selectedForecast) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0E14] text-white p-6">
        <div className="p-6 rounded-2xl bg-[#121620] border border-[#232A3B] max-w-md text-center flex flex-col items-center gap-3">
          <AlertCircle className="w-10 h-10 text-[#ECC138]" />
          <h2 className="text-lg font-bold text-[#FFFDF8]">Data Hydration Error</h2>
          <p className="text-xs text-slate-300">
            Could not load digital twin data exports from <code className="font-mono text-[#ECC138]">/data/</code>. Ensure export files are present in <code className="font-mono text-[#ECC138]">frontend/public/data/</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#FFFDF8] font-sans selection:bg-[#ECC138]/30 selection:text-[#FFFDF8]">
      {/* Top Story Navigation */}
      <StoryNav />

      {/* Chapter 1: The Crisis (Experimental Variant Switcher) */}
      {heroVariant === 'cinematic' ? (
        <StoryHero onSwitchVariant={() => setHeroVariant('datastory')} />
      ) : (
        <StoryDataHero
          stations={stations}
          currentFrame={currentFrame}
          selectedStation={selectedStation}
          selectedForecast={selectedForecast}
          windEdges={windEdges}
          onSwitchVariant={() => setHeroVariant('cinematic')}
        />
      )}

      {/* Chapter 2: The Crisis (Spatial Disparity & Inversion) */}
      <StoryChallenge />

      {/* Chapter 3: The Dilemma (Static Graph vs Dynamic Wind Graph A(t)) */}
      <StoryDilemma />

      {/* Chapter 4: The Innovation (Environmental Interaction matching Reference Slide 2) */}
      <StoryMechanism />

      {/* Chapter 5: The Digital Twin Introduction (Cinematic Climax - SEE THE INVISIBLE) */}
      <StoryTwinIntro
        stations={stations}
        currentFrame={currentFrame}
        windEdges={windEdges}
      />

      {/* The Digital Twin Studio (Dedicated Spacious Interactive Workspace) */}
      <StoryTwinStudio
        stations={stations}
        currentFrame={currentFrame}
        selectedStation={selectedStation}
        selectedForecast={selectedForecast}
        totalWindows={playback.length}
        windEdges={windEdges}
        whatIfData={whatIfData}
      />

      {/* Chapter 6: Operational Rigor & Academic Credibility */}
      <StoryEvaluations summary={summary} baselines={baselines} />

      {/* Examiner Guided Walkthrough Overlay */}
      <PanelWalkthrough />

      {/* Collapsible Keyboard Shortcuts Overlay (Collapsed by default, never covers controls) */}
      <aside aria-label="Keyboard Shortcuts">
        {/* Collapsed Pill Button (Default state across landing page and Studio) */}
        <button
          onClick={() => setIsShortcutsOpen((prev) => !prev)}
          className={`fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border text-[11px] font-mono shadow-xl transition-all cursor-pointer group select-none ${
            isShortcutsOpen
              ? 'bg-[#181E2B] text-white border-[#ECC138]/60 shadow-[#ECC138]/10'
              : 'bg-[#0B0E14]/85 hover:bg-[#121620] text-slate-400 hover:text-[#FFFDF8] border-[#232A3B] hover:border-[#ECC138]/50'
          }`}
          title={isShortcutsOpen ? 'Collapse shortcuts [Esc]' : 'Show keyboard shortcuts [?]'}
          aria-expanded={isShortcutsOpen}
        >
          <Command className="w-3.5 h-3.5 text-[#ECC138] group-hover:scale-110 transition-transform" />
          <span className="font-semibold">Shortcuts</span>
          <kbd className="text-[9px] px-1 py-0.5 rounded bg-[#181E2B] border border-[#232A3B] text-slate-400 font-sans group-hover:text-slate-200">?</kbd>
        </button>

        {/* Focused Presenter Modal (Centered on screen with backdrop, completely prevents overlapping architecture cards) */}
        {isShortcutsOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setIsShortcutsOpen(false)}
            aria-hidden="true"
          >
            <div
              className="w-full max-w-sm p-4 sm:p-5 rounded-2xl bg-[#0B0E14]/98 backdrop-blur-2xl border border-[#ECC138]/50 shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-xs font-mono space-y-3 relative animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Popover Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-[#232A3B]">
                <div className="flex items-center gap-2">
                  <Command className="w-4 h-4 text-[#ECC138]" />
                  <span className="font-bold text-white tracking-wider text-xs">KEYBOARD SHORTCUTS</span>
                </div>
                <button
                  onClick={() => setIsShortcutsOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#181E2B] transition-colors cursor-pointer"
                  title="Close [Esc]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Shortcut Key Mappings */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-[#121620] border border-[#232A3B]/60">
                  <span className="text-slate-300">Play / Pause Replay</span>
                  <kbd className="px-2 py-0.5 rounded bg-[#181E2B] border border-[#232A3B] text-[#ECC138] font-bold text-[10px]">Space</kbd>
                </div>

                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-[#121620] border border-[#232A3B]/60">
                  <span className="text-slate-300">Step Time (-1h / +1h)</span>
                  <kbd className="px-2 py-0.5 rounded bg-[#181E2B] border border-[#232A3B] text-[#38BDF8] font-bold text-[10px]">← / →</kbd>
                </div>

                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-[#121620] border border-[#232A3B]/60">
                  <span className="text-slate-300">Studio Views (1–5)</span>
                  <kbd className="px-2 py-0.5 rounded bg-[#181E2B] border border-[#232A3B] text-[#10B981] font-bold text-[10px]">1 – 5</kbd>
                </div>

                <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-[#121620] border border-[#232A3B]/60">
                  <span className="text-slate-300">Guided Walkthrough</span>
                  <kbd className="px-2 py-0.5 rounded bg-[#181E2B] border border-[#232A3B] text-[#C89B6D] font-bold text-[10px]">D</kbd>
                </div>
              </div>

              {/* Popover Footer Info */}
              <div className="pt-2 border-t border-[#232A3B] flex items-center justify-between text-[11px] text-slate-500">
                <span>Press <kbd className="text-slate-400 font-semibold">[Esc]</kbd> to close</span>
                <span className="text-[#ECC138] font-bold">Presenter Mode</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Cinematic Presentation Footer */}
      <footer className="py-12 px-6 border-t border-[#232A3B] bg-[#07090D] text-center text-xs text-slate-500 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 font-display font-extrabold text-[#FFFDF8] text-sm">
          <span>ECO<span className="text-[#ECC138]">TWIN</span></span>
          <span className="text-slate-600">/</span>
          <span className="text-xs font-mono text-slate-400 font-normal">WA-TGCN Air Quality Digital Twin</span>
        </div>
        <p className="text-slate-400 max-w-xl text-[11px] leading-relaxed">
          Final Year Project · Team 86 · Department of Computer Science & Engineering · Amrita Vishwa Vidyapeetham.
          Guide: Dr. Divya Bharathi P. Evaluated across 37 CPCB CAAQMS stations in Delhi (Jan 2024 – Apr 2026).
        </p>
      </footer>
    </div>
  );
};
