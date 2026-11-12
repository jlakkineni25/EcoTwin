import React from 'react';
import { useInView } from '../../hooks/useInView';
import { 
  AlertTriangle, 
  Wind, 
  Compass, 
  TrendingDown, 
  ArrowRight, 
  Activity, 
  ShieldAlert, 
  Layers, 
  CheckCircle2, 
  XCircle,
  Sparkles
} from 'lucide-react';

export const StoryChallenge: React.FC = () => {
  const { ref, isInView } = useInView({ threshold: 0.12 });

  const scrollToDilemma = () => {
    document.getElementById('dilemma')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scientificPillars = [
    {
      num: '01',
      title: 'Advective Mass Transport',
      tag: 'Fluid Dynamics',
      desc: 'Fine particulate matter (PM2.5) does not remain stationary or diffuse symmetrically. Surface wind vectors transport heavy aerosols across tens of kilometers in directed plume corridors.',
    },
    {
      num: '02',
      title: 'The Static Distance Flaw',
      tag: 'Algorithmic Blindspot',
      desc: 'Conventional Graph Convolutional Networks (GCNs) rely on fixed Euclidean distances. They continuously exchange features between adjacent stations even when wind blows in the opposite direction.',
    },
    {
      num: '03',
      title: 'Directed Physical Coupling',
      tag: 'Asymmetric Edges',
      desc: 'When winter winds blow from 315° NW, only upwind stations pollute downwind ones. Wind physics alone must govern graph connectivity—creating a time-varying directed adjacency matrix A(t).',
    },
    {
      num: '04',
      title: 'Nocturnal Inversion Trap',
      tag: 'Meteorological Trigger',
      desc: 'Low surface wind velocity (<2.0 m/s) combined with nocturnal atmospheric boundary layer compression traps hazardous aerosol mass directly within the urban breathing zone.',
    },
  ];

  return (
    <section
      id="crisis"
      ref={ref}
      className="relative min-h-screen py-20 sm:py-24 px-4 sm:px-8 lg:px-12 bg-[#0B0E14] text-white flex flex-col justify-between border-t border-[#232A3B] overflow-hidden select-none"
    >
      {/* 1. Dramatic Ambient Background Layers */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-luminosity scale-105 pointer-events-none transition-transform duration-1000"
        style={{ backgroundImage: `url('/images/city_haze.jpg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0E14] via-[#0B0E14]/90 to-[#0B0E14] pointer-events-none" />
      
      {/* Thermal Inversion Glow Aura */}
      <div 
        className="absolute top-1/3 -left-32 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-600/10 via-[#C89B6D]/5 to-transparent blur-3xl pointer-events-none animate-pulse"
        style={{ animationDuration: '10s' }}
      />
      <div 
        className="absolute bottom-10 right-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/20 via-transparent to-transparent blur-3xl pointer-events-none"
      />

      <div className="max-w-7xl mx-auto w-full relative z-10 my-auto space-y-10 sm:space-y-12">
        
        {/* 2. Editorial Header: Oversized Typography & Story Context */}
        <div
          className={`space-y-4 transition-all duration-1000 ease-out transform ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Eyebrow Chapter Pill */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#ECC138]/10 border border-[#ECC138]/30 text-[#ECC138] text-[11px] font-mono tracking-wider font-semibold">
              <ShieldAlert className="w-3.5 h-3.5 text-[#ECC138]" />
              <span className="uppercase">CHAPTER 02 // THE AIR POLLUTION CRISIS</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <span className="text-slate-400 font-mono text-xs uppercase tracking-widest hidden sm:inline">
              Meteorological Inversion &amp; Spatial Exposure
            </span>
          </div>

          {/* Oversized Headline */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-display font-extrabold uppercase tracking-tight text-[#FFFDF8] leading-[0.92]">
                THE INVISIBLE <span className="text-[#ECC138]">CRISIS</span>
              </h2>
              <div className="inline-block px-4 py-1.5 rounded-xl bg-[#C89B6D] text-[#0B0E14] font-bold text-xs sm:text-sm font-mono tracking-wider shadow-lg shadow-[#C89B6D]/20">
                Spatial Inequality &amp; The Static Modeling Dilemma
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-300 font-light max-w-xl leading-relaxed">
              Across Delhi&apos;s 1,484 km² airshed, fine particulate matter (<strong className="text-white font-semibold">PM2.5</strong>) does not stay still. Driven by winter meteorology, toxic plumes drift across 37 continuous monitoring zones. Yet existing deep learning forecasters rely on static Euclidean distance graphs that fail during rapid weather transitions.
            </p>
          </div>
        </div>

        {/* 3. Asymmetrical Editorial Spread: Spatial Disparity vs The Mathematical Blindspot */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Block (7 Cols): Spatial Disparity & Severe Inversion Exposure */}
          <div
            className={`lg:col-span-7 relative p-6 sm:p-8 rounded-3xl bg-[#121620]/90 backdrop-blur-xl border border-[#232A3B] shadow-2xl flex flex-col justify-between overflow-hidden group hover:border-[#ECC138]/40 transition-all duration-700 ease-out transform ${
              isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '200ms' }}
          >
            {/* Background Environmental Aerial Silhouette */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-10 mix-blend-luminosity group-hover:scale-105 transition-transform duration-1000 pointer-events-none"
              style={{ backgroundImage: `url('/images/air_pollution_threat.png')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121620] via-[#121620]/80 to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5 text-[#ECC138]">
                  <Activity className="w-3.5 h-3.5" />
                  <span>MEASURED EXPOSURE ASYMMETRY</span>
                </span>
                <span>NCT SENSOR NETWORK</span>
              </div>

              {/* Large Statistic Callout */}
              <div className="space-y-1">
                <div className="text-5xl sm:text-6xl lg:text-7xl font-display font-black tracking-tight text-[#FFFDF8]">
                  2.4<span className="text-[#ECC138]">×</span>
                </div>
                <div className="text-sm sm:text-base font-mono uppercase tracking-wider text-[#C89B6D] font-bold">
                  Spatial Exposure Gradient Across 25 km
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed max-w-xl">
                At peak winter inversion hours, eastern industrial basins like <strong className="text-white">Anand Vihar</strong> record PM2.5 levels exceeding <span className="text-[#EF4444] font-semibold">388 µg/m³</span> (Severe), while upwind western gateways like <strong className="text-white">IGI Airport</strong> register <span className="text-amber-400 font-semibold">162 µg/m³</span>. A single citywide average masks localized health emergencies.
              </p>
            </div>

            {/* Micro-Telemetry Comparison Strip */}
            <div className="relative z-10 mt-6 pt-4 border-t border-[#232A3B] grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#0B0E14]/80 border border-[#232A3B]">
                <div className="text-[10px] text-slate-400 uppercase truncate">Upwind Gateway (IGI T3)</div>
                <div className="text-base sm:text-lg font-bold text-amber-400 mt-0.5">162 µg/m³</div>
                <div className="text-[10px] text-slate-500 mt-1">Background Air Corridor</div>
              </div>

              <div className="p-3 rounded-xl bg-[#0B0E14]/80 border border-red-500/30">
                <div className="text-[10px] text-slate-400 uppercase truncate">Downwind Sink (Anand Vihar)</div>
                <div className="text-base sm:text-lg font-bold text-[#EF4444] mt-0.5">388 µg/m³</div>
                <div className="text-[10px] text-red-400/80 mt-1">Severe Inversion Trap</div>
              </div>
            </div>
          </div>

          {/* Right Block (5 Cols): The Mathematical Blindspot of Static Models */}
          <div
            className={`lg:col-span-5 relative p-6 sm:p-8 rounded-3xl bg-[#121620]/90 backdrop-blur-xl border border-[#232A3B] shadow-2xl flex flex-col justify-between hover:border-[#C89B6D]/50 transition-all duration-700 ease-out transform ${
              isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '350ms' }}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5 text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>THE ALGORITHMIC FAILURE</span>
                </span>
                <span>WEATHER FRONTS</span>
              </div>

              {/* Massive 77.9% Stat */}
              <div className="space-y-1">
                <div className="text-5xl sm:text-6xl lg:text-7xl font-display font-black tracking-tight text-[#EF4444]">
                  77.9<span className="text-[#FFFDF8]">%</span>
                </div>
                <div className="text-sm font-mono uppercase tracking-wider text-slate-200 font-bold">
                  Error Concentration in Static Models
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
                Conventional Graph Neural Networks suffer <strong className="text-white">77.9% of their total prediction errors</strong> specifically during weather transitions and wind shifts. Because fixed Euclidean graphs cannot sever calm links or align with downwind plumes, they propagate false spatial features.
              </p>
            </div>

            {/* Model Benchmark Card: Static vs WA-TGCN */}
            <div className="mt-6 pt-4 border-t border-[#232A3B] space-y-2.5 font-mono text-xs">
              <div className="p-3 rounded-xl bg-[#0B0E14] border border-red-500/30 flex items-center justify-between">
                <div>
                  <div className="text-red-400 font-bold flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Static Euclidean GCN</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Fixed distance adjacency</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">RMSE 61.73</div>
                  <div className="text-[10px] text-slate-500">µg/m³ error</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#ECC138]/50 flex items-center justify-between shadow-lg shadow-[#ECC138]/10">
                <div>
                  <div className="text-[#ECC138] font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>WA-TGCN (EcoTwin)</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Dynamic wind graph A(t)</div>
                </div>
                <div className="text-right">
                  <div className="text-[#ECC138] font-bold">RMSE 60.92</div>
                  <div className="text-[10px] text-slate-400">µg/m³ (Lowest error)</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* 4. The 4 Scientific Realities: Asymmetrical Dossier Ribbon */}
        <div
          className={`space-y-4 transition-all duration-1000 ease-out transform ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '500ms' }}
        >
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-2 border-b border-[#232A3B]">
            <span className="text-[#C89B6D] uppercase font-bold tracking-wider">
              CORE SCIENTIFIC TENETS // WHY WIND PHYSICS MATTERS
            </span>
            <span className="hidden sm:inline">19,921 Continuous Observations Analyzed</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {scientificPillars.map((p, idx) => (
              <div
                key={p.num}
                className="p-5 rounded-2xl bg-[#121620]/80 backdrop-blur-md border border-[#232A3B] hover:border-[#ECC138]/50 transition-all duration-300 flex flex-col justify-between group shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl sm:text-3xl font-display font-black text-[#ECC138] group-hover:scale-105 transition-transform">
                      {p.num}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181E2B] text-slate-400 border border-[#232A3B]">
                      {p.tag}
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-white mt-3 tracking-tight group-hover:text-[#ECC138] transition-colors">
                    {p.title}
                  </h4>

                  <p className="text-xs text-slate-400 mt-2 leading-relaxed font-light">
                    {p.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#232A3B]/60 text-[10px] font-mono text-slate-500 group-hover:text-[#C89B6D] transition-colors flex items-center justify-between">
                  <span>Airshed Physics</span>
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Section Footer with Navigation Cue */}
        <div className="pt-6 border-t border-[#232A3B] flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div>Continuous CAAQMS Winter Evaluation (Jan 2024 – Apr 2026)</div>
          
          <button
            onClick={scrollToDilemma}
            className="flex items-center gap-2 text-slate-400 hover:text-[#ECC138] transition-colors cursor-pointer group"
          >
            <span className="uppercase tracking-wider">Next: Chapter 03 (The Dilemma)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#ECC138]" />
          </button>
        </div>

      </div>
    </section>
  );
};
