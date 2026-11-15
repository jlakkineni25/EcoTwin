import React, { useState } from 'react';
import { useInView } from '../../hooks/useInView';
import { SummaryData, ModelCard, BenchmarkRow } from '../../types';
import { useTwinStore } from '../../store/useTwinStore';
import { 
  Award, 
  CheckCircle2, 
  BarChart3, 
  Zap, 
  Clock, 
  Database, 
  Cpu, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight, 
  Activity, 
  Compass, 
  Layers,
  ChevronDown,
  Sparkles,
  Server
} from 'lucide-react';
import { asset } from '../../utils/paths';

interface Props {
  summary?: SummaryData;
  modelCard?: ModelCard;
}

export const StoryEvaluations: React.FC<Props> = ({ summary, modelCard }) => {
  const { ref, isInView } = useInView({ threshold: 0.1 });
  const { startDemo } = useTwinStore();
  const [showTable, setShowTable] = useState<boolean>(true);

  const scrollToTwin = () => {
    (document.getElementById('twin-studio') || document.getElementById('twin'))?.scrollIntoView({ behavior: 'smooth' });
  };

  // Every number on this page comes from /data/model_card.json (written by v2_clean/make_frontend_data.py from the saved result files).
  const mc = modelCard;
  if (!mc) return null;

  const verifiedStats = {
    mae: mc.overall.mae,
    rmse: mc.overall.rmse,
    r2: mc.overall.r2,
    seeds: mc.seeds,
    testWindows: summary?.test_windows_total || mc.test_windows,
    stations: summary?.n_stations || mc.stations,
  };
  const benchmarkRows: BenchmarkRow[] = mc.benchmarks;
  const fmt = (v: number | null, d = 2) => (v === null || v === undefined ? '—' : v.toFixed(d));

  // Error-by-horizon curve (RMSE of the final model at +1h ... +24h), drawn from the data
  const hz = Array.from({ length: 24 }, (_, i) => mc.rmse_by_horizon[`+${i + 1}h`]);
  const Y_LO = 30;
  const Y_HI = 75;
  const xOf = (i: number) => 50 + (325 * i) / 23;
  const yOf = (v: number) => 160 - ((v - Y_LO) / (Y_HI - Y_LO)) * 130;
  const linePath = hz.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xOf(i).toFixed(1)} ${yOf(v).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${xOf(23).toFixed(1)} 160 L ${xOf(0).toFixed(1)} 160 Z`;
  const marks = [0, 5, 11, 23];

  const regimes = [
    { key: 'Stable', label: 'Stable Regime', tag: 'Smallest swings', desc: 'PM2.5 changes little over the 24 forecast hours.', color: '#10B981' },
    { key: 'Moderate', label: 'Moderate Regime', tag: 'Typical swings', desc: 'The usual daily rise and fall.', color: '#38BDF8' },
    { key: 'Volatile', label: 'Volatile Regime', tag: 'Largest swings', desc: 'Large changes within 24 hours: the hardest third of windows, holding most of the total error.', color: '#ECC138' },
  ] as const;
  const pick = (rowKey: string, regime: 'Stable' | 'Moderate' | 'Volatile'): number => {
    const row = mc.benchmarks.find((b) => b.key === rowKey);
    const v = row ? (row[regime.toLowerCase() as 'stable' | 'moderate' | 'volatile'] as number | null) : null;
    return v ?? 0;
  };

  return (
    <section
      id="evaluations"
      ref={ref}
      className="relative min-h-screen py-20 sm:py-24 px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-24 bg-[#0B0E14] text-white flex flex-col justify-between border-t border-[#232A3B] overflow-hidden select-none"
    >
      {/* 1. Atmospheric Ambient Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10 mix-blend-luminosity scale-105 pointer-events-none transition-transform duration-1000"
        style={{ backgroundImage: `url('${asset('/images/industrial_aerial.jpg')}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0E14] via-[#0B0E14]/90 to-[#0B0E14] pointer-events-none" />

      {/* Atmospheric Neural Glows */}
      <div 
        className="absolute top-1/4 right-1/4 w-[700px] h-[700px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ECC138]/06 via-transparent to-transparent blur-3xl pointer-events-none"
      />
      <div 
        className="absolute bottom-10 left-10 w-[550px] h-[550px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/20 via-transparent to-transparent blur-3xl pointer-events-none"
      />

      <div className="max-w-[1720px] mx-auto w-full relative z-10 my-auto space-y-12 sm:space-y-14">
        
        {/* 2. Heroic Editorial Masthead */}
        <div
          className={`space-y-4 transition-all duration-1000 ease-out transform ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Eyebrow Pill */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#ECC138]/10 border border-[#ECC138]/30 text-[#ECC138] text-[11px] font-mono tracking-wider font-semibold">
              <Award className="w-3.5 h-3.5 text-[#ECC138]" />
              <span className="uppercase">CHAPTER 06 // EMPIRICAL VALIDATION</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <span className="text-slate-400 font-mono text-xs uppercase tracking-widest hidden sm:inline">
              Held-Out CAAQMS Test Benchmark Protocol
            </span>
          </div>

          {/* Oversized Headline */}
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 lg:gap-10">
            <div className="space-y-3">
              <h2 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-display font-extrabold uppercase tracking-tight text-[#FFFDF8] leading-[0.88] drop-shadow-2xl">
                OPERATIONAL <span className="text-[#ECC138]">RIGOR.</span>
              </h2>
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-xl bg-[#C89B6D] text-[#0B0E14] font-bold text-xs sm:text-sm font-mono tracking-wider shadow-lg shadow-[#C89B6D]/20">
                <CheckCircle2 className="w-4 h-4 text-[#0B0E14]" />
                <span>Chronological, Held-Out Evaluation Across 37 Delhi Stations</span>
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-300 font-light max-w-xl leading-relaxed">
              The model was tested on {verifiedStats.testWindows.toLocaleString()} windows in strict time order, with a {mc.seeds}-seed ensemble and a breakdown by how much PM2.5 swings over the forecast horizon.
            </p>
          </div>
        </div>

        {/* 3. SECTION A: OVERALL TEST PERFORMANCE SHOWCASE (Asymmetrical Heroic Numbers) */}
        <div
          className={`space-y-6 transition-all duration-700 ease-out transform ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '150ms' }}
        >
          {/* Section Section Header Pill */}
          <div className="flex items-center justify-between pb-3 border-b border-[#232A3B]">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
              <TrendingUp className="w-4 h-4 text-[#ECC138]" />
              <span className="font-bold text-white">PILLAR 1: OVERALL TEST PERFORMANCE (ALL 24 HORIZONS)</span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Evaluated on {verifiedStats.testWindows.toLocaleString()} held-out windows
            </span>
          </div>

          {/* Asymmetrical 3-Metric Heroic Display + Horizon Error Growth Canvas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left 7 Cols: The 3 Massive Verified Test Numbers */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Metric 1: Ensemble RMSE */}
              <div className="p-5 sm:p-6 lg:p-7 rounded-3xl bg-[#121620]/90 backdrop-blur-md border border-[#ECC138]/40 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-[#ECC138] transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#ECC138]/10 rounded-full blur-2xl pointer-events-none" />
                <div className="space-y-1">
                  <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
                    Overall Test RMSE
                  </div>
                  <div className="text-4xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-display font-black text-[#ECC138] tracking-tight">
                    {verifiedStats.rmse.toFixed(2)}
                  </div>
                  <div className="text-xs font-mono text-slate-300">
                    µg/m³ Root Mean Squared
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#232A3B] text-[11px] text-slate-400 font-light leading-snug">
                  Evaluated across all 24 future horizons with a real day-old forecast wind. <span className="text-[#ECC138] font-bold">{mc.improvement_vs_persistence_pct}%</span> lower RMSE than persistence; within <span className="text-[#ECC138] font-bold">{Math.abs(mc.gap_vs_static_ugm3).toFixed(2)} µg/m³</span> of the static-graph baseline, which is inside seed noise.
                </div>
              </div>

              {/* Metric 2: Mean Absolute Error (MAE) */}
              <div className="p-5 sm:p-6 lg:p-7 rounded-3xl bg-[#121620]/90 backdrop-blur-md border border-[#232A3B] shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-[#38BDF8]/60 transition-all">
                <div className="space-y-1">
                  <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
                    Test MAE
                  </div>
                  <div className="text-4xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-display font-black text-[#38BDF8] tracking-tight">
                    {verifiedStats.mae.toFixed(2)}
                  </div>
                  <div className="text-xs font-mono text-slate-300">
                    µg/m³ Mean Absolute Error
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#232A3B] text-[11px] text-slate-400 font-light leading-snug">
                  Robust median error scale. Measures average deviation from true sensor readings across Delhi’s severe winter episodic fluctuations.
                </div>
              </div>

              {/* Metric 3: R² Coefficient */}
              <div className="p-5 sm:p-6 lg:p-7 rounded-3xl bg-[#121620]/90 backdrop-blur-md border border-[#232A3B] shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-[#10B981]/60 transition-all">
                <div className="space-y-1">
                  <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
                    Variance Explained (R²)
                  </div>
                  <div className="text-4xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-display font-black text-[#10B981] tracking-tight">
                    {verifiedStats.r2.toFixed(4)}
                  </div>
                  <div className="text-xs font-mono text-slate-300">
                    Coefficient of Determination
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#232A3B] text-[11px] text-slate-400 font-light leading-snug">
                  Explains <span className="text-[#10B981] font-bold">{(verifiedStats.r2 * 100).toFixed(1)}%</span> of the variance in PM2.5 across the held-out winter test period.
                </div>
              </div>

            </div>

            {/* Right 5 Cols: Verified 24-Hour Horizon Multi-Scale Curve */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-[#0E121A] border border-[#232A3B] flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#ECC138]" />
                  <span>ERROR TRAJECTORY BY FORECAST HORIZON</span>
                </span>
                <span className="text-slate-400">+1h to +24h Continuous</span>
              </div>

              {/* SVG curve drawn from model_card.json */}
              <div className="relative w-full aspect-[400/180] bg-[#07090D] rounded-2xl p-4 border border-[#232A3B] flex items-center justify-center">
                <svg viewBox="0 0 400 180" className="w-full h-full select-none">
                  {[40, 50, 60, 70].map((g) => (
                    <g key={g}>
                      <line x1="40" y1={yOf(g)} x2="380" y2={yOf(g)} stroke="#1A202C" strokeWidth="1" strokeDasharray="3 3" />
                      <text x="32" y={yOf(g) + 3} fill="#64748B" fontSize="8" fontFamily="monospace" textAnchor="end">{g}</text>
                    </g>
                  ))}
                  <path d={areaPath} fill="rgba(236,193,56,0.12)" />
                  <path d={linePath} fill="none" stroke="#ECC138" strokeWidth="3" />
                  {marks.map((i) => (
                    <g key={i}>
                      <circle cx={xOf(i)} cy={yOf(hz[i])} r="4" fill="#FFFDF8" stroke="#ECC138" strokeWidth="2" />
                      <text
                        x={xOf(i)}
                        y={i === 0 ? yOf(hz[i]) + 14 : yOf(hz[i]) - 8}
                        fill="#FFFDF8"
                        fontSize="8.5"
                        fontFamily="monospace"
                        textAnchor={i === 23 ? 'end' : i === 0 ? 'start' : 'middle'}
                        fontWeight="bold"
                      >
                        {`+${i + 1}h: ${hz[i].toFixed(1)}`}
                      </text>
                    </g>
                  ))}
                  <line x1="40" y1="160" x2="380" y2="160" stroke="#232A3B" strokeWidth="1" />
                  <text x="50" y="174" fill="#64748B" fontSize="8" fontFamily="monospace">+1h</text>
                  <text x={xOf(5)} y="174" fill="#64748B" fontSize="8" fontFamily="monospace" textAnchor="middle">+6h</text>
                  <text x={xOf(11)} y="174" fill="#64748B" fontSize="8" fontFamily="monospace" textAnchor="middle">+12h</text>
                  <text x="375" y="174" fill="#64748B" fontSize="8" fontFamily="monospace" textAnchor="end">+24h Horizon</text>
                </svg>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                <span className="text-[#10B981] font-semibold">Error grows, then flattens</span>
                <span>+1h: {hz[0].toFixed(1)} µg/m³ · +24h: {hz[23].toFixed(1)} µg/m³</span>
              </div>
            </div>

          </div>
        </div>

        {/* 4. SECTION B: REGIME-SPECIFIC RMSE BREAKDOWN (Physical Proof of RG6 Novelty) */}
        <div
          className={`space-y-6 transition-all duration-700 ease-out transform ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '250ms' }}
        >
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#232A3B]">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
              <Zap className="w-4 h-4 text-[#ECC138]" />
              <span className="font-bold text-white">PILLAR 2: REGIME-SPECIFIC RMSE COMPARISON</span>
            </div>
            <span className="text-xs font-mono text-[#ECC138] font-bold">
              Final model against the baselines, by regime
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 max-w-4xl font-light leading-relaxed">
            Overall metrics average across all conditions. The test windows were split into three equal groups by how much PM2.5 swings over the next 24 hours. The volatile third holds most of the total error. In every regime the graph variants stay within about 3 µg/m³ of each other, so the regime view shows where the error is, not a graph advantage.
          </p>

          {/* The 3 volatility regimes: final model against the baselines, all from model_card.json */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {regimes.map((rg) => {
              const ours = mc.rmse_by_regime[rg.key];
              const persV = mc.persistence_by_regime[rg.key];
              const lines = [
                { label: 'Static graph', v: pick('static', rg.key) },
                { label: 'Graph-free', v: pick('none', rg.key) },
                { label: 'Persistence', v: persV },
              ];
              return (
                <div
                  key={rg.key}
                  className={`p-6 sm:p-7 rounded-3xl bg-[#121620]/90 backdrop-blur-md border flex flex-col justify-between space-y-4 transition-all ${
                    rg.key === 'Volatile' ? 'border-[#ECC138]/60 shadow-[0_0_50px_-15px_rgba(236,193,56,0.2)]' : 'border-[#232A3B]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="px-2.5 py-0.5 rounded-full font-bold" style={{ background: `${rg.color}26`, color: rg.color }}>
                        {mc.regime_share[rg.key]} of windows
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">{rg.tag}</span>
                    </div>
                    <h3 className="text-xl font-display font-extrabold text-[#FFFDF8]">{rg.label}</h3>
                    <p className="text-xs text-slate-400 font-light leading-relaxed">{rg.desc}</p>
                  </div>

                  <div className="pt-4 border-t border-[#232A3B] space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-mono text-slate-400">Final model RMSE:</span>
                      <span className="text-3xl font-display font-black" style={{ color: rg.color }}>
                        {ours.toFixed(2)} <span className="text-xs font-mono text-slate-400 font-normal">µg/m³</span>
                      </span>
                    </div>
                    <div className="space-y-2 text-[11px] font-mono text-slate-400">
                      {lines.map((ln) => (
                        <div key={ln.label} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span>{ln.label}</span>
                            <span>{ln.v.toFixed(2)} µg/m³</span>
                          </div>
                          <div className="w-full bg-[#181E2B] h-1.5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (ln.v / persV) * 100)}%`, background: ln.label === 'Persistence' ? '#475569' : rg.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. SECTION C: MODEL EVALUATION METHODOLOGY (Rigorous Academic Protocol) */}
        <div
          className={`space-y-6 transition-all duration-700 ease-out transform ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '350ms' }}
        >
          {/* Section Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#232A3B]">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
              <Database className="w-4 h-4 text-[#ECC138]" />
              <span className="font-bold text-white">PILLAR 3: EVALUATION PROTOCOL & ENGINEERING INTEGRITY</span>
            </div>
            <span className="text-xs font-mono text-[#10B981] font-bold">
              19,921 hourly records per station · gaps filled by imputation (PM2.5: 94.6% original readings)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-2xl bg-[#121620]/80 border border-[#232A3B] space-y-2">
              <div className="flex items-center gap-2 text-[#ECC138]">
                <Cpu className="w-4 h-4" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider">{mc.seeds}-Seed Ensemble</span>
              </div>
              <div className="text-2xl font-display font-extrabold text-[#FFFDF8]">
                {mc.seeds} Seeds
              </div>
              <p className="text-xs sm:text-[13px] text-slate-300 font-normal leading-relaxed">
                Trained across independent random initializations (42, 7, 123, 2024, 999) to rule out stochastic flukes.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#121620]/80 border border-[#232A3B] space-y-2">
              <div className="flex items-center gap-2 text-[#C89B6D]">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider">Chronological Split</span>
              </div>
              <div className="text-2xl font-display font-extrabold text-[#FFFDF8]">
                70 / 15 / 15 %
              </div>
              <p className="text-xs sm:text-[13px] text-slate-300 font-normal leading-relaxed">
                Strict time order (70 / 15 / 15). Scalers and calibration are fit on training or validation data only.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#121620]/80 border border-[#232A3B] space-y-2">
              <div className="flex items-center gap-2 text-[#38BDF8]">
                <Database className="w-4 h-4" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider">Coverage Scope</span>
              </div>
              <div className="text-2xl font-display font-extrabold text-[#FFFDF8]">
                37 Stations
              </div>
              <p className="text-xs sm:text-[13px] text-slate-300 font-normal leading-relaxed">
                37 CAAQMS monitors with usable data from Jan 2024 to Apr 2026 (dead stations were removed).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#121620]/80 border border-[#232A3B] space-y-2">
              <div className="flex items-center gap-2 text-[#10B981]">
                <Activity className="w-4 h-4" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider">Inference Speed</span>
              </div>
              <div className="text-2xl font-display font-extrabold text-[#FFFDF8]">
                {mc.latency_ms_per_model.toFixed(2)} ms
              </div>
              <p className="text-xs sm:text-[13px] text-slate-300 font-normal leading-relaxed">
                About {mc.latency_ms_per_model.toFixed(2)} ms per model per window on a laptop GPU; a forecast for all 37 stations takes a few milliseconds.
              </p>
            </div>

          </div>
        </div>

        {/* 6. SECTION D: FORMAL BENCHMARK COMPARISON LEADERBOARD */}
        <div
          className={`space-y-4 transition-all duration-700 ease-out transform ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '450ms' }}
        >
          <div className="flex items-center justify-between pb-2 border-b border-[#232A3B]">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
              <BarChart3 className="w-4 h-4 text-[#ECC138]" />
              <span className="font-bold text-white">FORMAL BENCHMARK COMPARISON LEADERBOARD</span>
            </div>
            <button
              onClick={() => setShowTable(!showTable)}
              className="text-xs font-mono text-[#ECC138] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{showTable ? 'Collapse Table' : 'Expand Table'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTable ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showTable && (
            <div className="overflow-x-auto rounded-2xl border border-[#232A3B] bg-[#0E121A] shadow-xl animate-fade-in">
              <table className="min-w-[720px] w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#232A3B] bg-[#121620] text-slate-300 font-mono uppercase text-[11.5px]">
                    <th className="py-4 px-4 font-bold">Architecture</th>
                    <th className="py-4 px-3 font-bold text-[#ECC138]">Test RMSE</th>
                    <th className="py-4 px-3 font-bold">Test MAE</th>
                    <th className="py-4 px-3 font-bold">R² Score</th>
                    <th className="py-4 px-3 font-bold text-[#10B981]">Stable RMSE</th>
                    <th className="py-4 px-3 font-bold text-[#ECC138]">Volatile RMSE</th>
                    <th className="py-4 px-3 font-bold">Forward Pass</th>
                    <th className="py-4 px-4 font-bold">Key Mechanism</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232A3B] font-mono">
                  {benchmarkRows.map((row) => (
                    <tr
                      key={row.key}
                      className={`transition-colors ${
                        row.isOurs
                          ? 'bg-[#C89B6D]/15 text-white font-medium border-l-4 border-[#ECC138]'
                          : 'text-slate-300 hover:bg-[#121620]/60'
                      }`}
                    >
                      <td className="py-4 px-4 font-sans font-semibold flex items-center gap-2">
                        {row.isOurs && <span className="w-2 h-2 rounded-full bg-[#ECC138] animate-pulse"></span>}
                        <span className={row.isOurs ? 'text-white font-bold text-xs sm:text-sm' : 'text-slate-200 text-xs sm:text-[13px]'}>{row.model}</span>
                      </td>
                      <td className="py-4 px-3 font-bold text-[#ECC138] text-xs sm:text-[13px]">{fmt(row.rmse)}</td>
                      <td className="py-4 px-3 text-xs sm:text-[13px]">{fmt(row.mae)}</td>
                      <td className="py-4 px-3 font-bold text-white text-xs sm:text-[13px]">{fmt(row.r2, 4)}</td>
                      <td className="py-4 px-3 text-[#10B981] font-bold text-xs sm:text-[13px]">{fmt(row.stable)}</td>
                      <td className="py-4 px-3 text-[#ECC138] font-bold text-xs sm:text-[13px]">{fmt(row.volatile)}</td>
                      <td className="py-4 px-3 text-slate-400 text-xs sm:text-[13px]">{row.latency}</td>
                      <td className="py-4 px-4 font-sans text-xs text-slate-300 leading-snug">{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 7. Section Footer: Academic Credentials & Return Action */}
        <div className="pt-8 border-t border-[#232A3B] flex flex-wrap items-center justify-between gap-6 text-xs font-mono text-slate-500">
          <div className="space-y-1">
            <div className="text-slate-400 font-semibold">
              Department of Computer Science & Engineering · Amrita Vishwa Vidyapeetham · Team 86
            </div>
            <div>
              Project Guide: Dr. Divya Bharathi P. · Continuous CAAQMS Delhi Airshed Dataset (Jan 2024 – Apr 2026)
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                startDemo();
                scrollToTwin();
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#181E2B] hover:bg-[#232A3B] text-slate-300 hover:text-white border border-[#232A3B] font-mono text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#ECC138]" />
              <span>Launch Guided Walkthrough [D]</span>
            </button>

            <button
              onClick={scrollToTwin}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ECC138] hover:bg-white text-[#0B0E14] font-display font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#ECC138]/20"
            >
              <span>Explore the Digital Twin</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
