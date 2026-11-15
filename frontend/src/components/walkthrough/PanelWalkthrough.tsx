import React from 'react';
import { useTwinStore } from '../../store/useTwinStore';
import { useModelCard } from '../../hooks/useTwinData';
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
  const { data: mc } = useModelCard();
  const bench = (k: string) => mc?.benchmarks.find((b) => b.key === k)?.rmse.toFixed(2) ?? '—';

  if (!isDemoActive) return null;

  const steps = [
    {
      step: 1,
      title: '1. Spatial Digital Twin & Dynamic Advection A(t)',
      badge: 'Core Idea (RG6)',
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
        'Many graph-based AQI models use fixed distance graphs. EcoTwin continuously recomputes a dynamic, physics-grounded adjacency matrix A(t) from hourly wind vectors (u, v). Stations only influence downstream neighbours.',
      talkingPoints: [
        'Notice the directed, pulsing advection arrows pointing downwind in luminous gold.',
        'When wind shifts, graph edges dynamically re-wire across Delhi’s 37 CPCB stations.',
        'Preserves station feature integrity via internal self-loops (A + I).',
      ],
    },
    {
      step: 2,
      title: '2. 24-Hour Horizon & Prediction Intervals',
      badge: 'Uncertainty',
      icon: TrendingUp,
      stationId: 0,
      setup: () => {
        document.getElementById('twin')?.scrollIntoView({ behavior: 'smooth' });
        setActiveStudioView('forecast');
      },
      summary:
        'A single number is not enough for health decisions. EcoTwin shows the forecast with 80% and 95% prediction intervals, calibrated on the model\'s own errors on validation data.',
      talkingPoints: [
        'On held-out test data the 80% interval held 82% of the time and the 95% interval 97%.',
        'Each hour shows the chance of exceeding the CPCB limit of 60 µg/m³.',
        'The white line is the observed value of the held-out window (partly filled in where the sensor had gaps).',
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
        'Reasoning behind the forecast from the final model itself: exact Shapley contributions of eight groups of inputs and the temporal attention, turned into a plain-language sentence.',
      talkingPoints: [
        'The sentence names the inputs that push this forecast up and down the most, from exact Shapley values.',
        'The 48-hour attention strip shows where the model looks; it is spread fairly evenly, so it is not the same as importance.',
        'Wind links lists the strongest edges of the hourly wind graph into the station; the Wind graph bar shows how much the graph really contributes.',
      ],
    },
    {
      step: 4,
      title: '4. "What-If" Scenario Lab',
      badge: 'Digital Twin Simulation',
      icon: Compass,
      stationId: 0,
      setup: () => {
        document.getElementById('twin')?.scrollIntoView({ behavior: 'smooth' });
        setActiveStudioView('whatif');
        setScenarioKey('wind_x2');
      },
      summary:
        'Re-run the model with changed conditions. Evaluators can slide the forecast wind speed or pick a scenario (emission cuts, sensor outages, wind graph off).',
      talkingPoints: [
        'Instantaneous split comparison: baseline versus counterfactual scenario.',
        'Shows the change in the 24-hour peak and the first hour above 60 µg/m³ for each scenario (precomputed by the model).',
        'Scenarios include wind speed 0.25x to 2x, wind from the north-west, wind graph off, emission cuts and sensor outages.',
      ],
    },
    {
      step: 5,
      title: '5. Evaluation & Benchmarks',
      badge: 'Evaluation',
      icon: Award,
      stationId: 0,
      setup: () => {
        document.getElementById('evaluations')?.scrollIntoView({ behavior: 'smooth' });
      },
      summary:
        'Tested against baselines on held-out data from Dec 2025 to Apr 2026 across 37 stations, with a chronological split.',
      talkingPoints: [
        `WA-TGCN final model (RMSE ${mc?.overall.rmse.toFixed(2) ?? '—'}, R² ${mc?.overall.r2.toFixed(3) ?? '—'}) is ${mc?.improvement_vs_persistence_pct ?? '—'}% below persistence (${mc?.persistence.rmse.toFixed(2) ?? '—'}). Static-GCN (${bench('static')}) and the graph-free model (${bench('none')}) are within seed noise.`,
        `The volatile third of windows holds most of the error (RMSE ${mc?.rmse_by_regime.Volatile.toFixed(2) ?? '—'} against ${mc?.persistence_by_regime.Volatile.toFixed(2) ?? '—'} for persistence).`,
        `37 stations, gaps in the readings filled by imputation, ${mc?.latency_ms_per_model.toFixed(2) ?? '—'} ms per model per window.`,
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
