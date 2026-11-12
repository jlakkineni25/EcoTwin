import React, { useState } from 'react';
import { useInView } from '../../hooks/useInView';
import { 
  Network, 
  GitBranch, 
  Compass, 
  Activity, 
  ArrowRight, 
  BrainCircuit, 
  Clock, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  Zap,
  TrendingUp,
  Cpu,
  BarChart3,
  Anchor,
  Flame
} from 'lucide-react';

export const StoryMechanism: React.FC = () => {
  const { ref, isInView } = useInView({ threshold: 0.1 });
  const [activeStage, setActiveStage] = useState<number>(0);

  const scrollToTwin = () => {
    document.getElementById('twin')?.scrollIntoView({ behavior: 'smooth' });
  };

  // The 4 Core Architectural Stages of WA-TGCN v2 (Verified Implementation)
  const architectureStages = [
    {
      step: '01',
      id: 'spatial',
      title: 'Dynamic Spatial Graph Construction',
      badge: 'SPATIAL BACKBONE',
      headline: 'Wind-Aligned Dynamic A(t) & 2-Hop Graph Convolutions',
      formula: 'A_ij(t) = max(0, w_i · r̂_ij) / (d_ij + ε) · [d_ij ≤ 12km]',
      lead: 'Standard spatial GCNs rely on static distance matrices that ignore atmospheric fluid transport. WA-TGCN constructs a directed adjacency matrix A(t) dynamically recomputed every hour from surface wind vectors (u, v). Edges are formed only when wind blows toward a downwind neighbor within a 12 km airshed threshold. In-model self-loops (A + I) and a 2-hop graph convolution with residual skip connections propagate regional plumes across all 37 sensor stations without oversmoothing.',
      features: [
        'Wind-aligned dot projection (w_i · r̂_ij)',
        '12 km physical airshed cutoff distance',
        'In-model self-loops (A + I) row-normalized',
        '2-Hop GCN with LayerNorm & residual skip (+h)'
      ]
    },
    {
      step: '02',
      id: 'temporal',
      title: 'Recurrent Temporal Learning',
      badge: 'TEMPORAL MEMORY',
      headline: '1-Layer GRU Encoding 48-Hour Multi-Variate Sequences',
      formula: 'g_t = GRU(x_t, g_{t-1})  [H = 32, T_in = 48, 26 features]',
      lead: 'Aerosol accumulation in the Indo-Gangetic Plain is strongly non-Markovian: severe winter pollution episodes depend on preceding multi-day stagnation, secondary aerosol chemistry, and nocturnal boundary layer trapping. EcoTwin feeds 48 consecutive hours of 26 multi-variate features (meteorology, criteria pollutants, rolling 6h/24h statistics, 3h deltas, and cyclical time) through a 32-hidden-unit GRU with Dropout(0.2), capturing diurnal rhythm and physical inertia.',
      features: [
        '48-Hour continuous historical lookback (T_in = 48)',
        '26 Multi-variate chemical & meteorological features',
        '1-Layer GRU (H = 32 hidden units, Dropout = 0.2)',
        'Captures nocturnal boundary layer trapping'
      ]
    },
    {
      step: '03',
      id: 'attention',
      title: 'Multi-Head Self-Attention',
      badge: 'ATTENTION CORE',
      headline: '4-Head Self-Attention with Residual Normalization',
      formula: 'c_temp = LayerNorm(MHA(Q, K, V) + g)_{[:, -1, :]}  [4 heads, d_k = 8]',
      lead: 'Not all 48 historical hours exert equal influence on future particulate dispersion. Rather than using simple pooling or RNN hidden state flattening, EcoTwin deploys a 4-head Multihead Self-Attention layer (embed_dim=32, num_heads=4). Attention heads attend across the entire 48-hour sequence, dynamically capturing immediate physical inertia (-1h to -6h), 24h diurnal cycles, and 48h synoptic background trends before residual addition and LayerNorm extraction.',
      features: [
        '4 Parallel attention heads (num_heads = 4, d_k = 8)',
        'Full 48-hour sequence self-attention (Q = K = V = g)',
        'Residual skip connection & LayerNorm extraction',
        'Captures inertia (-1h to -6h) & diurnal cycles (-24h)'
      ]
    },
    {
      step: '04',
      id: 'forecast',
      title: 'Tri-Representation Decoder & Gated Anchor',
      badge: 'FORECAST DECODER',
      headline: 'Climatology A_fc Fusion, Gated Anchor & Volatility Huber Loss',
      formula: 'ŷ = MLP([c_temp, c_spatial^A_fc, e_time]) + α_anchor · y_0',
      lead: 'At test inference time, future hourly wind fields are unavailable. EcoTwin resolves this bottleneck by concatenating temporal context (32d) with spatial wind climatology (A_fc, 32d) and future cyclical time embeddings (32d) into a 96-dimensional MLP decoder (96 → 32 → 1). A learned Gated Anchor (α_anchor · y_0, initialized decaying 1.0 → 0.3) tethers near-term predictions to the live ground truth, while a volatility-weighted Huber loss (0.56× to 1.87×) tames rapid winter smog surges.',
      features: [
        'Tri-representation context fusion (96-dim MLP decoder)',
        'Wind climatology graph A_fc for future horizons',
        'Learned Gated Anchor (α decaying 1.0 → 0.3 · y_0)',
        'Volatility Huber loss (0.56× to 1.87× swing weighting)'
      ]
    }
  ];

  const currentStage = architectureStages[activeStage];

  return (
    <section
      id="innovation"
      ref={ref}
      className="relative min-h-screen py-20 sm:py-24 pb-28 sm:pb-32 px-4 sm:px-8 lg:px-12 xl:px-16 bg-[#0B0E14] text-white flex flex-col justify-between border-t border-[#232A3B] overflow-hidden select-none"
    >
      {/* 1. Dramatic Ambient Background Layers */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-luminosity scale-105 pointer-events-none transition-transform duration-1000"
        style={{ backgroundImage: `url('/images/environmental_interaction.jpg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0E14] via-[#0B0E14]/90 to-[#0B0E14] pointer-events-none" />
      
      {/* Ambient Neural Gold Glow */}
      <div 
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ECC138]/08 via-transparent to-transparent blur-3xl pointer-events-none"
      />
      <div 
        className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/20 via-transparent to-transparent blur-3xl pointer-events-none"
      />

      <div className="max-w-7xl mx-auto w-full relative z-10 my-auto space-y-10 sm:space-y-12">
        
        {/* 2. Editorial Header: Oversized Typography & Context */}
        <div
          className={`space-y-4 transition-all duration-1000 ease-out transform ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Eyebrow Chapter Pill */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#ECC138]/10 border border-[#ECC138]/30 text-[#ECC138] text-[11px] font-mono tracking-wider font-semibold">
              <BrainCircuit className="w-3.5 h-3.5 text-[#ECC138]" />
              <span className="uppercase">CHAPTER 04 // THE ARCHITECTURAL INNOVATION</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <span className="text-slate-400 font-mono text-xs uppercase tracking-widest hidden sm:inline">
              Physics-Informed WA-TGCN v2 Neural Pipeline
            </span>
          </div>

          {/* Oversized Headline */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-display font-extrabold uppercase tracking-tight text-[#FFFDF8] leading-[0.92]">
                THE NEURAL <span className="text-[#ECC138]">TWIN</span>
              </h2>
              <div className="inline-block px-4 py-1.5 rounded-xl bg-[#C89B6D] text-[#0B0E14] font-bold text-xs sm:text-sm font-mono tracking-wider shadow-lg shadow-[#C89B6D]/20">
                Wind-Aware Spatio-Temporal Graph Convolutional Architecture
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-300 font-light max-w-xl leading-relaxed">
              How EcoTwin solves the static graph dilemma: pairing hourly meteorological advection vectors with gated temporal recurrence, multi-head self-attention, and a gated-anchor decoder to model cross-city particulate dispersion without numerical simulation overhead.
            </p>
          </div>
        </div>

        {/* 3. Connected 4-Stage Architectural Pipeline Ribbon */}
        <div
          className={`grid grid-cols-2 md:grid-cols-4 gap-3 p-2 rounded-2xl bg-[#121620]/90 backdrop-blur-md border border-[#232A3B] transition-all duration-700 ease-out transform ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
          style={{ transitionDelay: '150ms' }}
        >
          {architectureStages.map((stage, idx) => {
            const isActive = activeStage === idx;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStage(idx)}
                className={`p-3.5 sm:p-4 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isActive
                    ? 'bg-[#C89B6D] text-[#0B0E14] font-bold shadow-xl shadow-[#C89B6D]/20'
                    : 'bg-[#181E2B]/60 hover:bg-[#1A202C] text-slate-300 border border-[#232A3B]/60 hover:border-[#ECC138]/40'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className={`text-base font-display font-black ${isActive ? 'text-[#0B0E14]' : 'text-[#ECC138]'}`}>
                    {stage.step}
                  </span>
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${isActive ? 'text-[#0B0E14]/80' : 'text-slate-400'}`}>
                    {stage.badge}
                  </span>
                </div>
                <div className={`text-xs sm:text-sm font-bold tracking-tight line-clamp-2 leading-snug ${isActive ? 'text-[#0B0E14]' : 'text-white'}`}>
                  {stage.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* 4. Active Stage Visual Stage: Scientific Graphic + Engineering Details */}
        <div
          className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch transition-all duration-700 ease-out transform ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '300ms' }}
        >
          {/* Left Column (6 Cols): Architectural Narrative & Mathematical Formulation */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-[#121620]/90 backdrop-blur-xl border border-[#232A3B] shadow-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-1.5 text-[#ECC138] font-bold">
                  <Cpu className="w-4 h-4" />
                  <span>COMPONENT {currentStage.step} OF 04</span>
                </span>
                <span className="px-2.5 py-0.5 rounded bg-[#181E2B] text-slate-300 border border-[#232A3B]">
                  {currentStage.badge}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-[#FFFDF8] tracking-tight">
                  {currentStage.headline}
                </h3>
                <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#232A3B] font-mono text-xs text-[#ECC138] flex flex-wrap items-center justify-between gap-2 shadow-inner">
                  <span className="text-slate-300 font-semibold shrink-0">Core Formulation:</span>
                  <span className="font-bold text-xs sm:text-[13px] text-[#ECC138] break-words sm:break-normal">{currentStage.formula}</span>
                </div>
              </div>

              <p className="text-sm sm:text-[14.5px] text-slate-200 font-normal leading-relaxed">
                {currentStage.lead}
              </p>
            </div>

            {/* Feature Checklist with Natural Wrapping */}
            <div className="pt-4 border-t border-[#232A3B] grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
              {currentStage.features.map((feat, i) => (
                <div key={i} className="flex items-start gap-2.5 text-slate-200 text-xs sm:text-[13px]">
                  <CheckCircle2 className="w-4 h-4 text-[#ECC138] shrink-0 mt-0.5" />
                  <span className="leading-snug">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column (6 Cols): Living Interactive Visualisation of Active Stage */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-3xl bg-[#121620]/90 backdrop-blur-xl border border-[#ECC138]/40 shadow-[0_0_50px_-15px_rgba(236,193,56,0.2)] flex flex-col justify-between overflow-hidden relative z-10">
            
            {/* Stage Graphic Header */}
            <div className="flex items-center justify-between text-xs font-mono pb-3 border-b border-[#232A3B]">
              <span className="text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#ECC138]" />
                <span>ARCHITECTURAL MECHANISM PREVIEW</span>
              </span>
              <span className="text-[#ECC138] font-bold">STAGE {currentStage.step} / 04</span>
            </div>

            {/* Dynamic Interactive Schematic Canvas (Responsive Height & Zero Squishing) */}
            <div className="relative w-full min-h-[340px] xs:min-h-[360px] sm:min-h-[380px] lg:min-h-[390px] bg-[#07090D] rounded-2xl overflow-hidden border border-[#232A3B] my-4 p-2.5 sm:p-4 flex items-center justify-center">
              
              {/* STAGE 1 VISUAL: Dynamic 2-Hop Graph Convolutions with In-Model Self-Loops */}
              {activeStage === 0 && (
                <svg viewBox="0 0 420 270" className="w-full h-auto max-h-[380px] sm:max-h-[420px] select-none animate-fade-in">
                  <defs>
                    <marker id="arrow-gold" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <polygon points="0 0, 6 3, 0 6" fill="#ECC138" />
                    </marker>
                    <marker id="arrow-cyan" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <polygon points="0 0, 6 3, 0 6" fill="#38BDF8" />
                    </marker>
                  </defs>

                  {/* Ambient Wind Flow Streamlines (Direction: NW to SE) */}
                  <g opacity="0.22">
                    <line x1="20" y1="40" x2="400" y2="190" stroke="#ECC138" strokeWidth="1.2" strokeDasharray="6 12" className="animate-pulse" />
                    <line x1="10" y1="90" x2="390" y2="230" stroke="#38BDF8" strokeWidth="1.2" strokeDasharray="6 12" className="animate-pulse" />
                    <line x1="40" y1="10" x2="410" y2="150" stroke="#ECC138" strokeWidth="1.2" strokeDasharray="6 12" className="animate-pulse" />
                  </g>

                  {/* 2-Hop Arch (Plume Advection W^(2)(A · h^(1)) + h^(1)) */}
                  <path d="M 65 106 Q 210 20 355 106" fill="none" stroke="#38BDF8" strokeWidth="2.2" strokeDasharray="4 4" opacity="0.9" />
                  <rect x="95" y="14" width="230" height="20" rx="4" fill="#0B0E14" stroke="#38BDF8" strokeWidth="1" />
                  <text x="210" y="28" fill="#38BDF8" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    2-Hop Plume Advection [W⁽²⁾(A · h⁽¹⁾) + h⁽¹⁾]
                  </text>

                  {/* 1-Hop Directed Edges (A_ij > 0 when projected downwind) */}
                  <line x1="84" y1="118" x2="188" y2="118" stroke="#ECC138" strokeWidth="2.5" markerEnd="url(#arrow-gold)" />
                  <line x1="232" y1="118" x2="336" y2="118" stroke="#ECC138" strokeWidth="2.5" markerEnd="url(#arrow-gold)" />

                  {/* Energy comets along the edges */}
                  <circle r="3.5" fill="#FFFDF8">
                    <animateMotion path="M 84 118 L 190 118" dur="1.7s" repeatCount="indefinite" />
                  </circle>
                  <circle r="3.5" fill="#FFFDF8">
                    <animateMotion path="M 232 118 L 338 118" dur="1.7s" repeatCount="indefinite" />
                  </circle>
                  <circle r="3" fill="#38BDF8">
                    <animateMotion path="M 65 106 Q 210 20 355 106" dur="2.7s" repeatCount="indefinite" />
                  </circle>

                  {/* Self-Loop on S_j: In-model (A + I) row-normalization */}
                  <path d="M 200 100 C 182 66, 238 66, 220 100" fill="none" stroke="#ECC138" strokeWidth="2" markerEnd="url(#arrow-gold)" />
                  <rect x="160" y="58" width="100" height="17" rx="3" fill="#0B0E14" stroke="#ECC138" strokeWidth="0.8" />
                  <text x="210" y="70" fill="#ECC138" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    Self-Loop (A+I)
                  </text>

                  {/* Distance Threshold Labels */}
                  <text x="136" y="136" fill="#CBD5E1" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    d_ij ≤ 12 km
                  </text>
                  <text x="284" y="136" fill="#CBD5E1" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    d_jk ≤ 12 km
                  </text>

                  {/* Nodes S_i, S_j, S_k */}
                  <g>
                    {/* S_i Upwind */}
                    <circle cx="65" cy="118" r="18" fill="#121620" stroke="#ECC138" strokeWidth="2" />
                    <text x="65" y="122" fill="#ECC138" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">S_i</text>
                    <text x="65" y="150" fill="#FFFDF8" fontSize="9.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">Upwind Node</text>
                    <text x="65" y="163" fill="#CBD5E1" fontSize="8" fontFamily="monospace" textAnchor="middle">Input h⁽⁰⁾</text>

                    {/* S_j 1-Hop Intermediate */}
                    <circle cx="210" cy="118" r="18" fill="#121620" stroke="#ECC138" strokeWidth="2.5" />
                    <text x="210" y="122" fill="#ECC138" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">S_j</text>
                    <text x="210" y="150" fill="#FFFDF8" fontSize="9.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">1-Hop Node</text>
                    <text x="210" y="163" fill="#CBD5E1" fontSize="8" fontFamily="monospace" textAnchor="middle">GCN₁ h⁽¹⁾ + skip</text>

                    {/* S_k 2-Hop Plume Sink */}
                    <circle cx="355" cy="118" r="18" fill="#121620" stroke="#38BDF8" strokeWidth="2.5" />
                    <text x="355" y="122" fill="#38BDF8" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">S_k</text>
                    <text x="355" y="150" fill="#38BDF8" fontSize="9.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">2-Hop Plume Sink</text>
                    <text x="355" y="163" fill="#CBD5E1" fontSize="8" fontFamily="monospace" textAnchor="middle">GCN₂ h⁽²⁾ + skip</text>
                  </g>

                  {/* Mathematical Summary Footer Strip inside SVG */}
                  <rect x="15" y="186" width="390" height="72" rx="8" fill="#121620" stroke="#232A3B" strokeWidth="1" />
                  <text x="25" y="206" fill="#CBD5E1" fontSize="8.5" fontFamily="monospace">
                    ADJACENCY: <tspan fill="#ECC138" fontWeight="bold">A_ij(t) = max(0, w_i · r̂_ij) / (d_ij + ε)</tspan> for d ≤ 12km
                  </text>
                  <text x="25" y="225" fill="#CBD5E1" fontSize="8.5" fontFamily="monospace">
                    CONVOLUTION: <tspan fill="#38BDF8" fontWeight="bold">h⁽ˡ⁾ = ReLU(LayerNorm(W⁽ˡ⁾(A_norm · h⁽ˡ⁻¹⁾))) + h⁽ˡ⁻¹⁾</tspan>
                  </text>
                  <text x="25" y="244" fill="#94A3B8" fontSize="8" fontFamily="monospace">
                    ROW-NORMALIZATION: <tspan fill="#ECC138" fontWeight="bold">Â = A + I_N</tspan> with dynamic in-model self-loops
                  </text>
                </svg>
              )}

              {/* STAGE 2 VISUAL: Recurrent 48-Hour GRU Sequence Encoding 26 Features */}
              {activeStage === 1 && (
                <svg viewBox="0 0 420 280" className="w-full h-auto max-h-[380px] sm:max-h-[420px] select-none animate-fade-in">
                  <defs>
                    <marker id="gru-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <polygon points="0 0, 6 3, 0 6" fill="#ECC138" />
                    </marker>
                    <marker id="in-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <polygon points="0 0, 6 3, 0 6" fill="#38BDF8" />
                    </marker>
                  </defs>

                  {/* Horizontal Recurrent Pathway */}
                  <line x1="25" y1="88" x2="395" y2="88" stroke="#232A3B" strokeWidth="2" strokeDasharray="4 4" />

                  {/* Recurrent Connectors between GRU cells */}
                  <line x1="116" y1="88" x2="164" y2="88" stroke="#ECC138" strokeWidth="2.5" markerEnd="url(#gru-arrow)" />
                  <line x1="252" y1="88" x2="300" y2="88" stroke="#ECC138" strokeWidth="2.5" markerEnd="url(#gru-arrow)" />

                  {/* Recurrent flow particle */}
                  <circle r="3.5" fill="#FFFDF8">
                    <animateMotion path="M 116 88 L 305 88" dur="2s" repeatCount="indefinite" />
                  </circle>

                  {/* Top Output Tensor Label */}
                  <rect x="25" y="12" width="370" height="22" rx="4" fill="#0B0E14" stroke="#ECC138" strokeWidth="0.8" />
                  <text x="210" y="26" fill="#ECC138" fontSize="9.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    SEQUENTIAL TEMPORAL TENSOR: g ∈ ℝ^{'(B·N) × 48 × 32'}
                  </text>

                  {/* 3 Prominent GRU Timestep Blocks */}
                  {[
                    { label: 't - 48h', sub: 'Synoptic Stagnation', x: 74, feat: 'x_{t-48}' },
                    { label: 't - 24h', sub: 'Diurnal Inversion', x: 208, feat: 'x_{t-24}' },
                    { label: 't = 0 (Now)', sub: 'Current State', x: 342, feat: 'x_{0}' }
                  ].map((cell, i) => (
                    <g key={i}>
                      {/* GRU Cell Block */}
                      <rect 
                        x={cell.x - 42} 
                        y="56" 
                        width="84" 
                        height="64" 
                        rx="10" 
                        fill="#121620" 
                        stroke="#ECC138" 
                        strokeWidth="1.8" 
                      />
                      <text x={cell.x} y="75" fill="#FFFDF8" fontSize="10.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                        {cell.label}
                      </text>
                      <rect x={cell.x - 32} y="83" width="64" height="17" rx="4" fill="#181E2B" />
                      <text x={cell.x} y="95" fill="#ECC138" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                        GRU (H=32)
                      </text>
                      <text x={cell.x} y="113" fill="#CBD5E1" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
                        g_t ∈ ℝ³²
                      </text>

                      {/* Input Vector Arrow from bottom */}
                      <line x1={cell.x} y1="158" x2={cell.x} y2="124" stroke="#38BDF8" strokeWidth="2" markerEnd="url(#in-arrow)" />
                      <text x={cell.x} y="172" fill="#38BDF8" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                        {cell.feat}
                      </text>
                      <text x={cell.x} y="185" fill="#E2E8F0" fontSize="8" fontFamily="monospace" textAnchor="middle">
                        {cell.sub}
                      </text>
                    </g>
                  ))}

                  {/* Feature Stack Description Box with 2-Line Natural Wrap (No Clipping!) */}
                  <rect x="15" y="200" width="390" height="68" rx="8" fill="#121620" stroke="#232A3B" strokeWidth="1" />
                  <g>
                    <text x="25" y="218" fill="#ECC138" fontSize="9" fontFamily="monospace" fontWeight="bold">
                      26 MULTI-VARIATE INPUT FEATURES (T_in = 48h continuous sequence):
                    </text>
                    <text x="25" y="236" fill="#E2E8F0" fontSize="8.2" fontFamily="monospace">
                      • <tspan fill="#FFFDF8" fontWeight="bold">Chemical & Met:</tspan> PM2.5, NO₂, CO, SO₂, O₃ · Wind (u,v,spd) · Temp, RH
                    </text>
                    <text x="25" y="254" fill="#94A3B8" fontSize="8.2" fontFamily="monospace">
                      • <tspan fill="#CBD5E1" fontWeight="bold">Dynamics & Time:</tspan> Rolling 6h & 24h Means · 3h Deltas · Sin/Cos Cyclical Time
                    </text>
                  </g>
                </svg>
              )}

              {/* STAGE 3 VISUAL: 4-Head Multihead Self-Attention with Residual & LayerNorm */}
              {activeStage === 2 && (
                <svg viewBox="0 0 500 290" className="w-full h-auto max-h-[380px] sm:max-h-[420px] select-none animate-fade-in">
                  <defs>
                    <marker id="mha-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <polygon points="0 0, 6 3, 0 6" fill="#ECC138" />
                    </marker>
                    <marker id="mha-cyan" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <polygon points="0 0, 6 3, 0 6" fill="#38BDF8" />
                    </marker>
                  </defs>

                  {/* Elevated Residual Skip Line from input g directly over the top into Concat */}
                  <path d="M 46 58 L 46 16 L 378 16 L 378 70" fill="none" stroke="#ECC138" strokeWidth="1.8" strokeDasharray="4 3" markerEnd="url(#mha-arrow)" />
                  <rect x="170" y="7" width="160" height="18" rx="4" fill="#0B0E14" stroke="#ECC138" strokeWidth="1" />
                  <text x="250" y="19" fill="#ECC138" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    Residual Skip (+ g)
                  </text>

                  {/* Left: Input Tensor g */}
                  <g>
                    <rect x="16" y="58" width="60" height="136" rx="8" fill="#121620" stroke="#ECC138" strokeWidth="1.8" />
                    <text x="46" y="82" fill="#ECC138" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      g ∈ ℝ⁴⁸ˣ³²
                    </text>
                    <text x="46" y="99" fill="#CBD5E1" fontSize="8" fontFamily="monospace" textAnchor="middle">
                      GRU States
                    </text>
                    <rect x="23" y="112" width="46" height="20" rx="4" fill="#181E2B" stroke="#232A3B" strokeWidth="0.8" />
                    <text x="46" y="125" fill="#FFFDF8" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      Q, K, V
                    </text>
                    <text x="46" y="152" fill="#94A3B8" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
                      T_in = 48
                    </text>
                    <text x="46" y="168" fill="#94A3B8" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
                      d_model=32
                    </text>
                  </g>

                  {/* Connecting Fan from g into 4 Parallel Attention Heads */}
                  <path d="M 76 78 L 112 51" stroke="#ECC138" strokeWidth="1.5" />
                  <path d="M 76 102 L 112 95" stroke="#ECC138" strokeWidth="1.5" />
                  <path d="M 76 126 L 112 139" stroke="#ECC138" strokeWidth="1.5" />
                  <path d="M 76 150 L 112 183" stroke="#ECC138" strokeWidth="1.5" />

                  {/* 4 Parallel Heads: Two-Line Clean Hierarchy, Generous Space, Zero Overlap! */}
                  {[
                    { head: 'HEAD 1 (d_k=8)', focus: 'Recent Inertia (-1h to -6h)', y: 34, col: '#ECC138' },
                    { head: 'HEAD 2 (d_k=8)', focus: '24h Diurnal Winter Rhythm', y: 78, col: '#38BDF8' },
                    { head: 'HEAD 3 (d_k=8)', focus: '48h Synoptic Airshed Trend', y: 122, col: '#C89B6D' },
                    { head: 'HEAD 4 (d_k=8)', focus: 'Cross-Scale Episodic Trapping', y: 166, col: '#10B981' }
                  ].map((h, i) => (
                    <g key={i}>
                      {/* Head Container (Width = 212px!) */}
                      <rect x="112" y={h.y} width="212" height="34" rx="6" fill="#121620" stroke={h.col} strokeWidth="1.4" />
                      {/* Line 1: Head Label */}
                      <text x="122" y={h.y + 14} fill={h.col} fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                        {h.head}
                      </text>
                      {/* Line 2: Focus Description */}
                      <text x="122" y={h.y + 26} fill="#E2E8F0" fontSize="8" fontFamily="monospace" fontWeight="500">
                        {h.focus}
                      </text>

                      {/* Convergence line to concat block */}
                      <line x1="324" y1={h.y + 17} x2="352" y2={100 + i * 8} stroke={h.col} strokeWidth="1.4" />
                    </g>
                  ))}

                  {/* Concat & Residual Add Block */}
                  <rect x="352" y="74" width="54" height="88" rx="8" fill="#121620" stroke="#ECC138" strokeWidth="1.6" />
                  <text x="379" y="96" fill="#FFFDF8" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    Concat
                  </text>
                  <text x="379" y="112" fill="#ECC138" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    Wᴼ + g
                  </text>
                  <rect x="360" y="122" width="38" height="17" rx="3" fill="#181E2B" />
                  <text x="379" y="134" fill="#CBD5E1" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
                    32 dims
                  </text>
                  <text x="379" y="152" fill="#94A3B8" fontSize="7" fontFamily="monospace" textAnchor="middle">
                    Residual
                  </text>

                  {/* Arrow from Concat to LayerNorm */}
                  <line x1="406" y1="118" x2="426" y2="118" stroke="#ECC138" strokeWidth="2" markerEnd="url(#mha-arrow)" />

                  {/* LayerNorm & Final Slice Output Box */}
                  <rect x="428" y="66" width="60" height="104" rx="8" fill="#121620" stroke="#38BDF8" strokeWidth="1.8" />
                  <text x="458" y="87" fill="#FFFDF8" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    LayerNorm
                  </text>
                  <line x1="434" y1="96" x2="482" y2="96" stroke="#232A3B" strokeWidth="1" />
                  <text x="458" y="112" fill="#38BDF8" fontSize="9.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    c_temp
                  </text>
                  <text x="458" y="128" fill="#CBD5E1" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
                    Slice [:, -1, :]
                  </text>
                  <rect x="436" y="138" width="44" height="18" rx="3" fill="#181E2B" />
                  <text x="458" y="150" fill="#10B981" fontSize="7.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    32 dims
                  </text>

                  {/* Bottom Footer Details */}
                  <rect x="16" y="216" width="472" height="60" rx="8" fill="#121620" stroke="#232A3B" strokeWidth="1" />
                  <text x="26" y="235" fill="#ECC138" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                    ATTENTION EXTRACTION: c_temp = LayerNorm(MultiheadAttention(Q, K, V) + g){'_{[:, -1, :]}' }
                  </text>
                  <text x="26" y="254" fill="#E2E8F0" fontSize="8" fontFamily="monospace">
                    • 4 Parallel Attention Heads (num_heads=4, d_k=8) · Dropout(0.2) · Sequence Lookback T_in=48h
                  </text>
                  <text x="26" y="268" fill="#94A3B8" fontSize="7.5" fontFamily="monospace">
                    • Isolates short-term inertia from 24h diurnal rhythm before temporal slicing into tri-representation decoder
                  </text>
                </svg>
              )}

              {/* STAGE 4 VISUAL: Tri-Representation Decoder + Learned Gated Anchor & Volatility Huber Loss */}
              {activeStage === 3 && (
                <svg viewBox="0 0 460 300" className="w-full h-auto max-h-[380px] sm:max-h-[420px] select-none animate-fade-in">
                  <defs>
                    <marker id="fc-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <polygon points="0 0, 6 3, 0 6" fill="#ECC138" />
                    </marker>
                    <marker id="anchor-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <polygon points="0 0, 6 3, 0 6" fill="#10B981" />
                    </marker>
                  </defs>

                  {/* Upper Section: Tri-Representation Concatenation (32 + 32 + 32 = 96 dims) */}
                  <g>
                    {/* Channel 1: c_temp (32d) */}
                    <rect x="16" y="18" width="94" height="24" rx="4" fill="#121620" stroke="#ECC138" strokeWidth="1.3" />
                    <text x="63" y="34" fill="#ECC138" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      c_temp (32d)
                    </text>

                    {/* Channel 2: c_spatial^A_fc (32d) */}
                    <rect x="16" y="47" width="94" height="24" rx="4" fill="#121620" stroke="#38BDF8" strokeWidth="1.3" />
                    <text x="63" y="63" fill="#38BDF8" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      A_fc · c (32d)
                    </text>

                    {/* Channel 3: e_time (32d) */}
                    <rect x="16" y="76" width="94" height="24" rx="4" fill="#121620" stroke="#C89B6D" strokeWidth="1.3" />
                    <text x="63" y="92" fill="#C89B6D" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      e_time (32d)
                    </text>

                    {/* Concat Bracket & Lines */}
                    <path d="M 114 30 L 132 59 L 114 88" fill="none" stroke="#94A3B8" strokeWidth="1.6" />
                    <line x1="132" y1="59" x2="152" y2="59" stroke="#ECC138" strokeWidth="2" markerEnd="url(#fc-arrow)" />

                    {/* MLP Decoder Block (96 -> 32 -> 1) */}
                    <rect x="154" y="38" width="94" height="44" rx="6" fill="#121620" stroke="#ECC138" strokeWidth="1.6" />
                    <text x="201" y="55" fill="#FFFDF8" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      MLP DECODER
                    </text>
                    <text x="201" y="70" fill="#ECC138" fontSize="7.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      96 → 32 → 1 (x24)
                    </text>

                    {/* Arrow to Gated Anchor Addition */}
                    <line x1="248" y1="60" x2="276" y2="60" stroke="#ECC138" strokeWidth="2" markerEnd="url(#fc-arrow)" />

                    {/* Gated Anchor Addition Node */}
                    <circle cx="288" cy="60" r="11" fill="#121620" stroke="#10B981" strokeWidth="2" />
                    <text x="288" y="64" fill="#10B981" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">+</text>

                    {/* Gated Anchor Branch directly above the + node */}
                    <rect x="238" y="10" width="100" height="26" rx="4" fill="#121620" stroke="#10B981" strokeWidth="1" />
                    <text x="288" y="22" fill="#10B981" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      α_anchor · y₀
                    </text>
                    <text x="288" y="32" fill="#CBD5E1" fontSize="7" fontFamily="monospace" textAnchor="middle">
                      Decay: 1.0 → 0.3
                    </text>
                    <path d="M 288 36 L 288 47" stroke="#10B981" strokeWidth="1.8" markerEnd="url(#anchor-arrow)" />

                    {/* Final Output Arrow */}
                    <line x1="300" y1="60" x2="336" y2="60" stroke="#FFFDF8" strokeWidth="2" markerEnd="url(#fc-arrow)" />
                    <rect x="338" y="46" width="106" height="30" rx="4" fill="#181E2B" stroke="#FFFDF8" strokeWidth="1.4" />
                    <text x="391" y="60" fill="#FFFDF8" fontSize="8.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      ŷ₁...₂₄ FORECAST
                    </text>
                    <text x="391" y="71" fill="#ECC138" fontSize="7.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      24 Continuous Hours
                    </text>
                  </g>

                  {/* Lower Section: 24-Hour Horizon Trajectory Preview */}
                  <g>
                    {/* Horizon Chart Background */}
                    <rect x="16" y="112" width="428" height="114" rx="8" fill="#121620" stroke="#232A3B" strokeWidth="1" />

                    {/* CPCB 60 Threshold Line */}
                    <line x1="26" y1="168" x2="434" y2="168" stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.8" />
                    <text x="430" y="163" fill="#F59E0B" fontSize="7.5" fontFamily="monospace" textAnchor="end" fontWeight="bold">
                      CPCB 60 µg/m³ Standard
                    </text>

                    {/* Uncertainty Shaded Envelope */}
                    <path
                      d="M 38 180 C 95 160, 165 140, 235 130 C 305 122, 365 130, 420 146 L 420 166 C 365 154, 305 146, 235 153 C 165 161, 95 175, 38 185 Z"
                      fill="rgba(236,193,56,0.12)"
                    />

                    {/* Multi-Horizon Predicted Trajectory Curve */}
                    <path
                      d="M 38 182 C 95 165, 165 148, 235 139 C 305 132, 365 139, 420 152"
                      fill="none"
                      stroke="#ECC138"
                      strokeWidth="2.5"
                    />

                    {/* Anchor Near-Term Stiffening Band (t+1 to t+6) */}
                    <rect x="38" y="122" width="95" height="88" fill="rgba(16,185,129,0.08)" rx="4" stroke="#10B981" strokeWidth="0.8" strokeDasharray="2 2" />
                    <text x="85" y="135" fill="#10B981" fontSize="7.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      Gated Anchor (t+1..6)
                    </text>

                    {/* Inflow Peak Indicator (+14h) */}
                    <circle cx="295" cy="135" r="4.5" fill="#EF4444" stroke="#FFFDF8" strokeWidth="1.5" />
                    <text x="295" y="125" fill="#EF4444" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      Peak Inflow (+14h)
                    </text>

                    {/* X-Axis Horizon Labels */}
                    <line x1="26" y1="196" x2="434" y2="196" stroke="#232A3B" strokeWidth="1" />
                    <text x="38" y="208" fill="#CBD5E1" fontSize="7.5" fontFamily="monospace">Now (y₀)</text>
                    <text x="130" y="208" fill="#CBD5E1" fontSize="7.5" fontFamily="monospace">+6h Alert</text>
                    <text x="245" y="208" fill="#CBD5E1" fontSize="7.5" fontFamily="monospace">+12h Horizon</text>
                    <text x="380" y="208" fill="#CBD5E1" fontSize="7.5" fontFamily="monospace">+24h Full Cycle</text>
                  </g>

                  {/* Volatility Huber Loss Strip at Bottom */}
                  <rect x="16" y="238" width="428" height="50" rx="6" fill="#0B0E14" stroke="#232A3B" strokeWidth="1" />
                  <text x="26" y="256" fill="#ECC138" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                    VOLATILITY HUBER LOSS: w_vol · Huber(y - ŷ, δ=1.0) with w_vol ∈ [0.56, 1.87]
                  </text>
                  <text x="26" y="274" fill="#CBD5E1" fontSize="8" fontFamily="monospace">
                    • Upweights sudden rapid plume shifts · Verified Volatile Regime RMSE: <tspan fill="#10B981" fontWeight="bold">90.87 µg/m³</tspan> vs 97.76+ baselines
                  </text>
                </svg>
              )}

            </div>

            {/* Bottom Verified Performance Strip */}
            <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#232A3B] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Verified Test Metrics:</span>
              </span>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs">
                <span className="px-2 py-0.5 rounded bg-[#181E2B] text-[#ECC138] font-bold border border-[#232A3B]">
                  MAE: 39.69 µg/m³
                </span>
                <span className="px-2 py-0.5 rounded bg-[#181E2B] text-[#38BDF8] font-bold border border-[#232A3B]">
                  RMSE: 60.92 µg/m³
                </span>
                <span className="px-2 py-0.5 rounded bg-[#181E2B] text-[#10B981] font-bold border border-[#232A3B]">
                  R²: 0.6341
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* 5. Section Footer with Direct Link into Digital Twin Studio */}
        <div className="pt-6 border-t border-[#232A3B] flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-semibold">WA-TGCN v2 Architecture</span>
            <span>·</span>
            <span>7-Seed Checked Ensemble</span>
            <span>·</span>
            <span>37 CPCB Stations</span>
            <span>·</span>
            <span>2,918 Test Windows</span>
          </div>
          
          <button
            onClick={scrollToTwin}
            className="group inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-[#ECC138] text-[#0B0E14] font-display font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#ECC138]/20 hover:bg-white transition-all cursor-pointer"
          >
            <span>Launch Digital Twin Studio</span>
            <ArrowRight className="w-4 h-4 stroke-[3] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </section>
  );
};
