import React, { useState } from 'react';
import { useInView } from '../../hooks/useInView';
import { 
  Network, 
  Wind, 
  Compass, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Layers, 
  Activity,
  Sparkles,
  Zap
} from 'lucide-react';

export const StoryDilemma: React.FC = () => {
  const { ref, isInView } = useInView({ threshold: 0.1 });
  const [activeRegime, setActiveRegime] = useState<'winter-nw' | 'calm' | 'easterly'>('winter-nw');

  const scrollToInnovation = () => {
    document.getElementById('innovation')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Node positions on 400x320 SVG canvas for clean comparison
  const nodes = [
    { id: 'pb', name: 'Punjabi Bagh (Upwind W)', x: 70, y: 150, role: 'upwind', pm25: 294 },
    { id: 'mm', name: 'Mandir Marg (Central)', x: 195, y: 150, role: 'hub', pm25: 262 },
    { id: 'av', name: 'Anand Vihar (Downwind E)', x: 330, y: 150, role: 'downwind', pm25: 388 },
    { id: 'al', name: 'Alipur (North)', x: 195, y: 55, role: 'crosswind', pm25: 215 },
    { id: 'rk', name: 'R K Puram (South)', x: 195, y: 245, role: 'crosswind', pm25: 248 },
  ];

  return (
    <section
      id="dilemma"
      ref={ref}
      className="relative min-h-screen py-20 sm:py-24 px-4 sm:px-8 lg:px-12 bg-[#0B0E14] text-white flex flex-col justify-between border-t border-[#232A3B] overflow-hidden select-none"
    >
      {/* Ambient Atmospheric Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#232A3B12_1px,transparent_1px),linear-gradient(to_bottom,#232A3B12_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />
      <div 
        className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ECC138]/06 via-transparent to-transparent blur-3xl pointer-events-none" 
      />
      <div 
        className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/15 via-transparent to-transparent blur-3xl pointer-events-none" 
      />

      <div className="max-w-7xl mx-auto w-full relative z-10 my-auto space-y-10 sm:space-y-12">
        
        {/* 1. Section Header: The Modeling Dilemma */}
        <div
          className={`space-y-4 transition-all duration-1000 ease-out transform ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Eyebrow Chapter Pill */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#ECC138]/10 border border-[#ECC138]/30 text-[#ECC138] text-[11px] font-mono tracking-wider font-semibold">
              <Network className="w-3.5 h-3.5 text-[#ECC138]" />
              <span className="uppercase">CHAPTER 03 // THE MODELING DILEMMA</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <span className="text-slate-400 font-mono text-xs uppercase tracking-widest hidden sm:inline">
              Static Distance vs. Dynamic Wind Advection A(t)
            </span>
          </div>

          {/* Oversized Headline */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-display font-extrabold uppercase tracking-tight text-[#FFFDF8] leading-[0.92]">
                THE GRAPH <span className="text-[#ECC138]">DILEMMA</span>
              </h2>
              <div className="inline-block px-4 py-1.5 rounded-xl bg-[#C89B6D] text-[#0B0E14] font-bold text-xs sm:text-sm font-mono tracking-wider shadow-lg shadow-[#C89B6D]/20">
                Fixed Euclidean Proximity vs. Meteorological Fluid Transport
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-300 font-light max-w-xl leading-relaxed">
              Graph Neural Networks assume spatial neighbors correlate. But atmosphere is not a static solid. When a deep learning model assumes physical proximity equals pollution coupling, it exchanges false signals across calm sectors and fails during weather transitions.
            </p>
          </div>
        </div>

        {/* 2. Interactive Wind Regime Simulator Controls */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#121620]/90 backdrop-blur-md border border-[#232A3B] transition-all duration-700 ease-out transform ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
          style={{ transitionDelay: '150ms' }}
        >
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Compass className="w-4 h-4 text-[#ECC138]" />
            <span className="font-bold uppercase tracking-wider text-white">SIMULATE AIRSHED WIND REGIME:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <button
              onClick={() => setActiveRegime('winter-nw')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeRegime === 'winter-nw'
                  ? 'bg-[#C89B6D] text-[#0B0E14] font-bold shadow'
                  : 'bg-[#181E2B] text-slate-400 hover:text-white border border-[#232A3B]'
              }`}
            >
              <span>315° NW Winter <span className="hidden sm:inline">Advection (Prevailing)</span></span>
            </button>

            <button
              onClick={() => setActiveRegime('calm')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeRegime === 'calm'
                  ? 'bg-[#C89B6D] text-[#0B0E14] font-bold shadow'
                  : 'bg-[#181E2B] text-slate-400 hover:text-white border border-[#232A3B]'
              }`}
            >
              <span>Calm Inversion <span className="hidden sm:inline">(&lt;1.0 m/s Stagnant)</span></span>
            </button>

            <button
              onClick={() => setActiveRegime('easterly')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeRegime === 'easterly'
                  ? 'bg-[#C89B6D] text-[#0B0E14] font-bold shadow'
                  : 'bg-[#181E2B] text-slate-400 hover:text-white border border-[#232A3B]'
              }`}
            >
              <span>90° E Front Shift <span className="hidden sm:inline">(Sudden Transition)</span></span>
            </button>
          </div>
        </div>

        {/* 3. The Cinematic Visual Comparison (Contrasting Dual-Engine Showcase) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* LEFT PARADIGM: Conventional Static Euclidean Distance Graph */}
          <div
            className={`p-6 sm:p-8 rounded-3xl bg-[#121620]/90 backdrop-blur-xl border border-red-500/30 shadow-2xl flex flex-col justify-between transition-all duration-700 ease-out transform ${
              isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '250ms' }}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-1.5 text-red-400 font-bold uppercase tracking-wider">
                  <XCircle className="w-4 h-4" />
                  <span>CONVENTIONAL STATIC GCN</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30">
                  Fixed Euclidean Matrix
                </span>
              </div>

              {/* Mathematical Formulation */}
              <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#232A3B] font-mono text-xs flex items-center justify-between">
                <span className="text-slate-400">Adjacency Formulation:</span>
                <span className="text-red-300 font-bold">A_ij = exp(-d_ij² / σ²)</span>
              </div>

              {/* SVG Visual Stage: Static Symmetrical Graph */}
              <div className="relative w-full aspect-[400/280] sm:aspect-[400/270] bg-[#07090D] rounded-2xl overflow-hidden border border-[#232A3B] p-2">
                <svg viewBox="0 0 400 300" className="w-full h-full select-none">
                  {/* Static Symmetrical Edges (Rigid, Bidirectional) */}
                  <g className="static-edges">
                    {/* PB <-> MM */}
                    <line x1="70" y1="150" x2="195" y2="150" stroke="#EF4444" strokeWidth="2" strokeOpacity="0.6" strokeDasharray="4 4" />
                    {/* MM <-> AV */}
                    <line x1="195" y1="150" x2="330" y2="150" stroke="#EF4444" strokeWidth="2" strokeOpacity="0.6" strokeDasharray="4 4" />
                    {/* AL <-> MM */}
                    <line x1="195" y1="55" x2="195" y2="150" stroke="#EF4444" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="4 4" />
                    {/* RK <-> MM */}
                    <line x1="195" y1="245" x2="195" y2="150" stroke="#EF4444" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="4 4" />
                    {/* PB <-> AL */}
                    <line x1="70" y1="150" x2="195" y2="55" stroke="#64748B" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="2 4" />
                    {/* AV <-> RK */}
                    <line x1="330" y1="150" x2="195" y2="245" stroke="#64748B" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="2 4" />

                    {/* Bidirectional False Flow Arrows */}
                    <polygon points="120,147 130,144 130,150" fill="#EF4444" />
                    <polygon points="145,153 135,150 135,156" fill="#EF4444" />
                    <polygon points="250,147 260,144 260,150" fill="#EF4444" />
                    <polygon points="275,153 265,150 265,156" fill="#EF4444" />
                  </g>

                  {/* Nodes */}
                  {nodes.map((n) => (
                    <g key={n.id}>
                      <circle cx={n.x} cy={n.y} r="8" fill="#1E293B" stroke="#EF4444" strokeWidth="2" />
                      <circle cx={n.x} cy={n.y} r="3" fill="#FFFFFF" />
                      <text x={n.x} y={n.y + 20} fill="#CBD5E1" fontSize="10" fontFamily="monospace" textAnchor="middle">
                        {n.name.split(' ')[0]}
                      </text>
                    </g>
                  ))}
                </svg>

                {/* The Algorithmic Flaw Banner */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 p-2 rounded-xl bg-red-950/80 backdrop-blur-md border border-red-500/40 text-[10px] font-mono text-red-200 flex items-center justify-between">
                  <span className="flex items-center gap-1 font-bold">
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    <span>FALSE BIDIRECTIONAL BORROWING</span>
                  </span>
                  <span>Blind to Wind Direction</span>
                </div>
              </div>

              {/* Research Flaw Summary */}
              <div className="space-y-2 text-xs font-mono text-slate-300">
                <div className="flex items-center justify-between py-1 border-b border-[#232A3B]">
                  <span className="text-slate-400">Error Concentration:</span>
                  <span className="text-red-400 font-bold">77.9% during weather fronts</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#232A3B]">
                  <span className="text-slate-400">Baseline Evaluation:</span>
                  <span className="text-slate-200 font-bold">RMSE 61.73 µg/m³</span>
                </div>
                <p className="text-[11px] text-slate-400 font-light leading-relaxed pt-1">
                  Downwind stations (Anand Vihar) are forced to send pollution *backwards* into upwind stations against the wind vector. Crosswind stations exchange features despite zero physical connectivity.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT PARADIGM: EcoTwin Dynamic Wind-Aware Directed Graph */}
          <div
            className={`p-6 sm:p-8 rounded-3xl bg-[#121620]/90 backdrop-blur-xl border border-[#ECC138]/50 shadow-[0_0_60px_-15px_rgba(236,193,56,0.25)] flex flex-col justify-between transition-all duration-700 ease-out transform ${
              isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '400ms' }}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-1.5 text-[#ECC138] font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>WA-TGCN (ECOTWIN INNOVATION)</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-[#ECC138]/10 text-[#ECC138] border border-[#ECC138]/30">
                  Dynamic Directed A(t)
                </span>
              </div>

              {/* Mathematical Formulation */}
              <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#232A3B] font-mono text-xs flex items-center justify-between">
                <span className="text-slate-400">Adjacency Formulation:</span>
                <span className="text-[#ECC138] font-bold">A_ij(t) = f(u(t), v(t), θ_ij, d_ij)</span>
              </div>

              {/* SVG Visual Stage: Dynamic Directed Physics Graph */}
              <div className="relative w-full aspect-[400/280] sm:aspect-[400/270] bg-[#07090D] rounded-2xl overflow-hidden border border-[#232A3B] p-2">
                <svg viewBox="0 0 400 300" className="w-full h-full select-none">
                  <defs>
                    <marker id="arrow-gold" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <polygon points="0 0, 6 3, 0 6" fill="#ECC138" />
                    </marker>
                    <linearGradient id="laser-link" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ECC138" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.4" />
                    </linearGradient>
                  </defs>

                  {/* Ambient Wind Streamlines based on active regime */}
                  <g className="opacity-25 pointer-events-none">
                    {activeRegime === 'winter-nw' && (
                      <>
                        <line x1="20" y1="20" x2="380" y2="280" stroke="#ECC138" strokeWidth="1" strokeDasharray="6 12" className="animate-pulse" />
                        <line x1="0" y1="100" x2="320" y2="300" stroke="#ECC138" strokeWidth="1" strokeDasharray="6 12" className="animate-pulse" />
                      </>
                    )}
                    {activeRegime === 'easterly' && (
                      <line x1="380" y1="150" x2="20" y2="150" stroke="#38BDF8" strokeWidth="1.2" strokeDasharray="6 12" className="animate-pulse" />
                    )}
                  </g>

                  {/* Dynamic Directed Edges */}
                  <g className="directed-edges">
                    {activeRegime === 'winter-nw' && (
                      <>
                        {/* PB -> MM (Directed downwind) */}
                        <line x1="70" y1="150" x2="183" y2="150" stroke="#ECC138" strokeWidth="2.5" markerEnd="url(#arrow-gold)" />
                        {/* MM -> AV (Directed downwind) */}
                        <line x1="195" y1="150" x2="318" y2="150" stroke="#ECC138" strokeWidth="2.5" markerEnd="url(#arrow-gold)" />
                        
                        {/* Animated traveling mass comets */}
                        <circle r="2.5" fill="#FFFDF8">
                          <animateMotion path="M 70 150 L 195 150" dur="1.8s" repeatCount="indefinite" />
                        </circle>
                        <circle r="2.5" fill="#FFFDF8">
                          <animateMotion path="M 195 150 L 330 150" dur="1.8s" repeatCount="indefinite" />
                        </circle>
                      </>
                    )}

                    {activeRegime === 'easterly' && (
                      <>
                        {/* Inversion: AV -> MM -> PB (Wind shifted from East) */}
                        <line x1="330" y1="150" x2="207" y2="150" stroke="#38BDF8" strokeWidth="2.5" markerEnd="url(#arrow-gold)" />
                        <line x1="195" y1="150" x2="82" y2="150" stroke="#38BDF8" strokeWidth="2.5" markerEnd="url(#arrow-gold)" />
                      </>
                    )}

                    {activeRegime === 'calm' && (
                      /* Calm: All links severed, local diffusion only */
                      <g className="opacity-40">
                        <circle cx="195" cy="150" r="28" fill="none" stroke="#ECC138" strokeWidth="1" strokeDasharray="3 3" />
                      </g>
                    )}
                  </g>

                  {/* Nodes */}
                  {nodes.map((n) => (
                    <g key={n.id}>
                      <circle cx={n.x} cy={n.y} r="8" fill="#0B0E14" stroke="#ECC138" strokeWidth="2" />
                      <circle cx={n.x} cy={n.y} r="3" fill="#ECC138" />
                      <text x={n.x} y={n.y + 20} fill="#ECC138" fontSize="10" fontFamily="monospace" textAnchor="middle">
                        {n.name.split(' ')[0]}
                      </text>
                    </g>
                  ))}
                </svg>

                {/* Physics Grounded Banner */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 p-2 rounded-xl bg-[#0B0E14]/90 backdrop-blur-md border border-[#ECC138]/40 text-[10px] font-mono text-[#ECC138] flex items-center justify-between">
                  <span className="flex items-center gap-1 font-bold">
                    <Zap className="w-3 h-3 text-[#ECC138]" />
                    <span>PHYSICS-INFORMED DIRECTED FLUX</span>
                  </span>
                  <span>∂c/∂t = -u·∇c</span>
                </div>
              </div>

              {/* Research Advantage Summary */}
              <div className="space-y-2 text-xs font-mono text-slate-300">
                <div className="flex items-center justify-between py-1 border-b border-[#232A3B]">
                  <span className="text-slate-400">Advection Alignment:</span>
                  <span className="text-[#ECC138] font-bold">Only upwind stations pollute downwind</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#232A3B]">
                  <span className="text-slate-400">Held-Out Evaluation:</span>
                  <span className="text-[#10B981] font-bold">RMSE 60.92 µg/m³ (Superior)</span>
                </div>
                <p className="text-[11px] text-slate-400 font-light leading-relaxed pt-1">
                  Opposing backward links are strictly pruned. When calm conditions prevail, spatial borrowing drops to zero, preventing false pollution smoothing and preserving localized spike alerts.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* 4. The 3 Core Mathematical Contrasts (Comparative Matrix Strip) */}
        <div
          className={`grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 transition-all duration-1000 ease-out transform ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '550ms' }}
        >
          <div className="p-4 rounded-2xl bg-[#121620]/80 border border-[#232A3B] space-y-2 font-mono">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">01 // Graph Directionality</div>
            <div className="text-sm font-bold text-white">Asymmetric Directed Flux</div>
            <p className="text-xs text-slate-400 font-light">
              Static GCNs force A_ij = A_ji (symmetric diffusion). WA-TGCN enforces A_ij ≠ A_ji, mirroring true atmospheric advection.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#121620]/80 border border-[#232A3B] space-y-2 font-mono">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">02 // Temporal Dynamic Reconfiguration</div>
            <div className="text-sm font-bold text-[#ECC138]">Hourly Dynamic A(t)</div>
            <p className="text-xs text-slate-400 font-light">
              Static graphs stay constant for 2 years. EcoTwin re-computes adjacency every single hour directly from real-time (u, v) wind vectors.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#121620]/80 border border-[#232A3B] space-y-2 font-mono">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">03 // Calm Inversion Resilience</div>
            <div className="text-sm font-bold text-[#10B981]">Zero False Borrowing</div>
            <p className="text-xs text-slate-400 font-light">
              Under stagnant nocturnal inversions (&lt;1.5 m/s), WA-TGCN automatically cuts inter-station edges, isolating point-source spikes.
            </p>
          </div>
        </div>

        {/* 5. Section Footer with Navigation Cue */}
        <div className="pt-6 border-t border-[#232A3B] flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div>Theoretical Gap Solved: Novelty RG6 (Wind-Aware Dynamic Graph Adjacency)</div>
          
          <button
            onClick={scrollToInnovation}
            className="flex items-center gap-2 text-slate-400 hover:text-[#ECC138] transition-colors cursor-pointer group"
          >
            <span className="uppercase tracking-wider">Next: Chapter 04 (The Innovation)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#ECC138]" />
          </button>
        </div>

      </div>
    </section>
  );
};

