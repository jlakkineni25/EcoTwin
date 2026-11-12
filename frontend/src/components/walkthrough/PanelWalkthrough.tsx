import React from 'react';
import { useTwinStore } from '../../store/useTwinStore';
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Map, 
  TrendingUp, 
  BrainCircuit, 
  Compass, 
  Award, 
  CheckCircle2, 
  Volume2 
} from 'lucide-react';

export const PanelWalkthrough: React.FC = () => {
  const {
    isDemoActive,
    demoStep,
    setDemoStep,
    stopDemo,
    setActiveStudioView,
    setShowAirshedGraph,
    setShowWindParticles,
    setScenarioKey,
    setSelectedStationId,
  } = useTwinStore();

  if (!isDemoActive) return null;

  const steps = [
    {
      step: 1,
      title: '1. Spatial Digital Twin & Dynamic Advection A(t)',
      badge: 'Core Novelty (RG6)',
      icon: Map,
      stationId: 0,
      setup: () => {
        document.getElementById('twin')?.scrollIntoView({ behavior: 'smooth' });
        setActiveStudioView('map');
        setShowAirshedGraph(true);
        setShowWindParticles(true);
        setScenarioKey('baseline');
      },
      summary:
        'Traditional AQI models use static Euclidean distance graphs. EcoTwin continuously recomputes a dynamic, physics-grounded adjacency matrix A(t) from hourly wind vectors (u, v). Stations only influence downstream neighbours.',
      talkingPoints: [
        'Notice the directed, pulsing advection arrows pointing downwind in luminous gold.',
        'When wind shifts, graph edges dynamically re-wire across Delhi’s 37 CPCB stations.',
        'Preserves station feature integrity via internal self-loops (A + I).',
      ],
    },
    {
      step: 2,
      title: '2. 24-Hour Horizon & Confidence Fan Chart',
      badge: 'Uncertainty Quantification',
      icon: TrendingUp,
      stationId: 0,
      setup: () => {
        document.getElementById('twin')?.scrollIntoView({ behavior: 'smooth' });
        setActiveStudioView('forecast');
      },
      summary:
        'Point forecasts are insufficient for public health decisions. EcoTwin displays median forecasts alongside 80% and 95% confidence intervals generated from our 7-seed WA-TGCN ensemble.',
      talkingPoints: [
        'Uncertainty band naturally expands over longer horizons (+1h: ±24 µg/m³ to +24h: ±40 µg/m³).',
        'Direct threshold breach probability (e.g., "78% probability of exceeding CPCB limit by 19:00").',
        'Includes real ground truth comparison overlay for held-out test data.',
      ],
    },
    {
      step: 3,
      title: '3. Explainable AI: "Why This Forecast"',
      badge: 'Interpretability (XAI)',
      icon: BrainCircuit,
      stationId: 0,
      setup: () => {
        document.getElementById('twin')?.scrollIntoView({ behavior: 'smooth' });
        setActiveStudioView('why');
      },
      summary:
        'Transparent reasoning behind neural network outputs. We extract temporal attention weights and feature SHAP attributions into a faithful deterministic template without AI hallucination.',
      talkingPoints: [
        'Plain-language synthesis tells evaluators exactly which factors pushed the forecast up or down.',
        '48-hour attention strip highlights crucial historical accumulation windows.',
        'Identifies the top upwind monitoring station feeding particulate matter.',
      ],
    },
    {
      step: 4,
      title: '4. Counterfactual "What-If" Wind Engine',
      badge: 'Digital Twin Simulation',
      icon: Compass,
      stationId: 0,
      setup: () => {
        document.getElementById('twin')?.scrollIntoView({ behavior: 'smooth' });
        setActiveStudioView('whatif');
        setScenarioKey('wind_x2');
      },
      summary:
        'Simulate atmospheric meteorological interventions. Evaluators can turn the compass dial or slide wind speed to inspect network-wide dispersion responses.',
      talkingPoints: [
        'Instantaneous split comparison: baseline versus counterfactual scenario.',
        'Calculates Δ Peak Concentration and shifts in CPCB breach lead times in real time.',
        'Test cases include "Wind Doubled", "NW Stubble Smoke Inflow", and "Wind Reversal".',
      ],
    },
    {
      step: 5,
      title: '5. Academic Credibility & Benchmarks',
      badge: 'Scientific Rigor',
      icon: Award,
      stationId: 0,
      setup: () => {
        document.getElementById('evaluations')?.scrollIntoView({ behavior: 'smooth' });
      },
      summary:
        'Empirical validation against rigorous academic baselines on held-out test data from Jan 2024 to Apr 2026 across 37 stations with zero data leakage.',
      talkingPoints: [
        'WA-TGCN (RMSE 60.92, R² 0.634) systematically outperforms Static-GCN (61.73), No-Graph (62.18), and Persistence (83.87).',
        'Largest gains observed during volatile weather transitions (RMSE 90.87 vs 97.76+).',
        'Full pipeline audit: 37/37 stations verified, 0% residual NaN, 0.31 ms inference latency.',
      ],
    },
  ];

  const currentStep = steps[demoStep - 1] || steps[0];
  const StepIcon = currentStep.icon;

  const goToStep = (stepNumber: number) => {
    setDemoStep(stepNumber);
    const target = steps[stepNumber - 1];
    if (target) {
      target.setup();
      setSelectedStationId(target.stationId);
    }
  };

  return (
    <div className="fixed bottom-2 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-3 sm:px-4 animate-fade-in max-h-[92vh] overflow-y-auto">
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0B0E14]/95 backdrop-blur-xl border border-[#232A3B] shadow-2xl text-white">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#232A3B]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1.5 rounded-lg bg-[#ECC138]/20 text-[#ECC138] border border-[#ECC138]/40 shrink-0">
              <StepIcon className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] sm:text-xs font-mono uppercase text-[#ECC138] font-bold tracking-wider flex items-center gap-1.5 sm:gap-2 truncate">
                <span>Examiner Demo</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">Step {demoStep}/5</span>
              </div>
              <h4 className="text-xs sm:text-sm font-display font-bold text-[#FFFDF8] truncate">{currentStep.title}</h4>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-[#C89B6D]/20 text-[#C89B6D] border border-[#C89B6D]/40 text-[10px] font-mono font-bold">
              {currentStep.badge}
            </span>
            <button
              onClick={stopDemo}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#121620] transition-colors"
              title="Close Walkthrough"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="py-3">
          <p className="text-xs text-slate-300 leading-relaxed font-medium mb-3">
            {currentStep.summary}
          </p>

          <div className="p-3.5 rounded-xl bg-[#121620] border border-[#232A3B] flex flex-col gap-1.5">
            <div className="text-[10px] font-mono uppercase text-[#ECC138] font-bold flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-[#ECC138]" />
              <span>Key Presentation Talking Points</span>
            </div>
            <ul className="flex flex-col gap-1.5 text-xs text-slate-300">
              {currentStep.talkingPoints.map((pt, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#ECC138] shrink-0 mt-0.5" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 pt-2 border-t border-[#232A3B] text-xs">
          {/* Step Dots */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {steps.map((s) => (
              <button
                key={s.step}
                onClick={() => goToStep(s.step)}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all ${
                  s.step === demoStep
                    ? 'bg-[#C89B6D] text-[#0B0E14] shadow-md shadow-[#C89B6D]/30 scale-105'
                    : 'bg-[#121620] text-slate-400 hover:bg-[#181E2B] hover:text-white'
                }`}
              >
                {s.step}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              disabled={demoStep === 1}
              onClick={() => goToStep(demoStep - 1)}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#121620] hover:bg-[#181E2B] text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors border border-[#232A3B] text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Prev</span>
            </button>

            {demoStep < 5 ? (
              <button
                onClick={() => goToStep(demoStep + 1)}
                className="flex items-center gap-1 px-3 sm:px-4 py-1.5 rounded-lg bg-[#C89B6D] text-[#0B0E14] font-mono text-xs font-bold hover:bg-[#d8a879] transition-all shadow-md shadow-[#C89B6D]/20"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            ) : (
              <button
                onClick={stopDemo}
                className="flex items-center gap-1 px-3 sm:px-4 py-1.5 rounded-lg bg-[#ECC138] text-[#0B0E14] font-mono text-xs font-bold hover:bg-[#f6ce4e] transition-all shadow-md shadow-[#ECC138]/20"
              >
                <span>Finish</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
