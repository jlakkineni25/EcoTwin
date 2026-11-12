import React, { useEffect, useRef, useState } from 'react';
import { useInView } from '../../hooks/useInView';
import { 
  Wind, 
  Compass, 
  Radio, 
  ArrowDown, 
  ArrowUpRight, 
  ChevronsRight, 
  Activity, 
  Layers,
  Sparkles
} from 'lucide-react';

interface StoryHeroProps {
  onSwitchVariant?: () => void;
}

export const StoryHero: React.FC<StoryHeroProps> = ({ onSwitchVariant }) => {
  const { ref, isInView } = useInView({ threshold: 0.1 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  const scrollToCrisis = () => {
    document.getElementById('crisis')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTwin = () => {
    document.getElementById('twin')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Track mouse coordinates for subtle parallax tilt & particle interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePos({ x, y });
  };

  // Atmospheric Particle Canvas (sophisticated multi-plane wind streamlines & dust motes)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Multi-plane particle system: foreground streaks, midground streamlines, deep background dust
    const PARTICLE_COUNT = 48;
    const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const isForeground = i % 4 === 0;
      const isDust = i % 3 === 0;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        length: isDust ? Math.random() * 6 + 2 : Math.random() * 24 + 10,
        speed: isForeground ? Math.random() * 0.9 + 0.7 : Math.random() * 0.6 + 0.35,
        baseOpacity: isForeground ? 0.35 : isDust ? 0.2 : 0.18,
        opacity: 0.25,
        width: isForeground ? 1.4 : isDust ? 0.8 : 1.0,
        oscillation: Math.random() * Math.PI * 2,
        oscSpeed: Math.random() * 0.015 + 0.008,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.18, // 315° NW to 135° SE
        isGold: Math.random() > 0.6,
      };
    });

    const render = () => {
      if (!isInView) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.oscillation += p.oscSpeed;
        const drift = Math.sin(p.oscillation) * 0.4;

        // Vector calculation with subtle mouse easing
        const vx = Math.cos(p.angle) * p.speed + mousePos.x * 0.15;
        const vy = Math.sin(p.angle) * p.speed + drift + mousePos.y * 0.15;

        p.x += vx;
        p.y += vy;

        // Wrap around boundaries
        if (p.x > width + 60) p.x = -60;
        if (p.y > height + 60) p.y = -60;
        if (p.x < -60) p.x = width + 60;
        if (p.y < -60) p.y = height + 60;

        // Gentle breathing opacity
        const currentOpacity = p.baseOpacity + Math.sin(p.oscillation) * 0.08;

        // Draw streamlined filament
        const tailX = p.x - Math.cos(p.angle) * p.length;
        const tailY = p.y - Math.sin(p.angle) * p.length;

        const grad = ctx.createLinearGradient(tailX, tailY, p.x, p.y);
        if (p.isGold) {
          grad.addColorStop(0, `rgba(236, 193, 56, 0)`);
          grad.addColorStop(0.7, `rgba(236, 193, 56, ${currentOpacity * 0.6})`);
          grad.addColorStop(1, `rgba(236, 193, 56, ${currentOpacity})`);
        } else {
          grad.addColorStop(0, `rgba(148, 163, 184, 0)`);
          grad.addColorStop(0.7, `rgba(180, 205, 230, ${currentOpacity * 0.5})`);
          grad.addColorStop(1, `rgba(220, 235, 255, ${currentOpacity * 0.8})`);
        }

        ctx.strokeStyle = grad;
        ctx.lineWidth = p.width;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        // Glowing tracer head
        ctx.fillStyle = p.isGold 
          ? `rgba(255, 253, 248, ${currentOpacity * 0.9})` 
          : `rgba(226, 232, 240, ${currentOpacity * 0.85})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.width * 0.85, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isInView, mousePos]);

  // Key monitoring hotspots pinned to satellite map with staggered radar pulse timing
  const hotspots = [
    {
      id: 'anand-vihar',
      name: 'Anand Vihar',
      aqi: '388 µg/m³',
      status: 'Severe Inversion',
      top: '38%',
      left: '68%',
      color: '#EF4444',
      tag: 'East Delhi Hotspot',
      pulseDelay: '0s',
      pulseDur: '3.6s',
    },
    {
      id: 'punjabi-bagh',
      name: 'Punjabi Bagh',
      aqi: '294 µg/m³',
      status: 'Very Poor',
      top: '46%',
      left: '32%',
      color: '#F97316',
      tag: 'West Industrial Corridor',
      pulseDelay: '0.9s',
      pulseDur: '4.0s',
    },
    {
      id: 'rk-puram',
      name: 'R K Puram',
      aqi: '248 µg/m³',
      status: 'Very Poor',
      top: '64%',
      left: '46%',
      color: '#ECC138',
      tag: 'South Airshed Core',
      pulseDelay: '1.8s',
      pulseDur: '4.2s',
    },
    {
      id: 'igi-airport',
      name: 'IGI Airport T3',
      aqi: '198 µg/m³',
      status: 'Poor',
      top: '72%',
      left: '24%',
      color: '#ECC138',
      tag: 'Upwind Gateway',
      pulseDelay: '2.7s',
      pulseDur: '3.8s',
    }
  ];

  return (
    <section
      id="hero"
      ref={ref}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex flex-col justify-between pt-24 sm:pt-28 pb-8 sm:pb-10 px-4 sm:px-8 lg:px-12 bg-[#0B0E14] overflow-hidden select-none"
    >
      {/* 1. Dramatic Atmospheric Background Layers */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-luminosity scale-105 pointer-events-none transition-transform duration-1000"
        style={{ backgroundImage: `url('/images/air_pollution_hero.jpg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0E14]/90 via-[#0B0E14]/75 to-[#0B0E14] pointer-events-none" />
      
      {/* Breathing Thermal Inversion Glow (Radial amber & gold thermal haze) */}
      <div 
        className="absolute -top-32 right-0 w-[600px] sm:w-[900px] h-[600px] sm:h-[900px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ECC138]/12 via-[#C89B6D]/5 to-transparent blur-3xl pointer-events-none animate-pulse"
        style={{ animationDuration: '9s' }}
      />
      <div 
        className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/20 via-transparent to-transparent blur-3xl pointer-events-none animate-pulse"
        style={{ animationDuration: '12s' }}
      />

      {/* 2. Live Atmospheric Particles Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
      />

      {/* 3. Top University & Thesis Metadata Header Bar */}
      <div className="relative z-10 max-w-7xl mx-auto w-full pt-2 pb-4 border-b border-[#232A3B]/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono uppercase tracking-widest text-slate-400">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#ECC138] animate-ping" />
          <span className="text-[#FFFDF8] font-bold">Amrita Vishwa Vidyapeetham</span>
          <span className="text-slate-600 hidden sm:inline">/</span>
          <span className="text-slate-400 hidden sm:inline">Dept. of Computer Science & Engineering</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400">B.Tech Thesis 2026 · Team 86</span>
          <span className="text-slate-600 hidden md:inline">/</span>
          <span className="text-[#ECC138] hidden md:inline">Guide: Dr. Divya Bharathi P</span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#ECC138]/10 border border-[#ECC138]/30 text-[#ECC138] text-[10px] font-semibold">
            <Radio className="w-3 h-3 text-[#ECC138]" />
            <span>37 SENSORS</span>
          </span>
          {onSwitchVariant && (
            <button
              onClick={onSwitchVariant}
              className="px-2.5 py-1 rounded-lg bg-[#121620] hover:bg-[#1A202C] border border-[#232A3B] text-slate-300 hover:text-[#ECC138] text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Switch to Interactive Data Storytelling variant (The Pudding)"
            >
              <Activity className="w-3.5 h-3.5 text-[#ECC138]" />
              <span className="hidden sm:inline">Data Story Hero</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Cinematic Main Stage: Editorial Typography + Atmospheric Focal Portal */}
      <div className="relative z-10 max-w-7xl mx-auto w-full my-auto py-6 sm:py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          
          {/* Left Column: Oversized Editorial Typography with Refined Staggered Entrance */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            
            {/* Story Eyebrow Kicker (Step 1 Entrance) */}
            <div
              className={`transition-all duration-700 ease-out transform ${
                isInView ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
              }`}
              style={{ transitionDelay: '100ms' }}
            >
              <div className="inline-flex items-center gap-2.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-[#121620]/90 backdrop-blur-md border border-[#232A3B] text-[10.5px] sm:text-[11px] font-mono tracking-wider text-[#C89B6D]">
                <Sparkles className="w-3.5 h-3.5 text-[#ECC138]" />
                <span className="uppercase font-semibold">CHAPTER 01 // CRITICAL AIRSHED TELEMETRY</span>
              </div>
            </div>

            {/* Oversized Editorial Typography Stack (Step 2 & 3 Entrance) */}
            <div className="space-y-0">
              <h1
                className={`text-5xl sm:text-7xl md:text-8xl lg:text-[7.2rem] xl:text-[8.5rem] font-display font-extrabold tracking-tight leading-[0.88] text-[#ECC138] drop-shadow-2xl transition-all duration-1000 ease-out transform ${
                  isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
                style={{ transitionDelay: '200ms' }}
              >
                AIR
              </h1>
              <h2
                className={`text-4xl sm:text-6xl md:text-7xl lg:text-[6.5rem] xl:text-[7.8rem] font-display font-extrabold tracking-tight leading-[0.88] text-[#FFFDF8] transition-all duration-1000 ease-out transform ${
                  isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
                style={{ transitionDelay: '300ms' }}
              >
                POLLUTION
              </h2>
            </div>

            {/* Cinematic Narrative Lead (Step 4 Entrance) */}
            <div
              className={`space-y-2.5 transition-all duration-700 ease-out transform ${
                isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: '450ms' }}
            >
              <p className="text-base sm:text-lg lg:text-xl font-light text-slate-300 max-w-2xl leading-relaxed">
                Every winter, regional surface wind vectors and nocturnal boundary layer compression trap 30 million citizens under hazardous aerosol smog. Static models fail to see the wind.
              </p>

              <p className="text-xs sm:text-sm font-mono text-[#C89B6D] max-w-2xl leading-relaxed">
                <span className="text-white font-semibold">EcoTwin</span> reconstructs the invisible advective corridors in real time—pairing wind physics with dynamic graph neural convolutions across Delhi&apos;s continuous monitoring grid.
              </p>
            </div>

            {/* Interactive Action Hub (Step 5 Entrance) */}
            <div
              className={`pt-2 flex flex-wrap items-center gap-4 transition-all duration-700 ease-out transform ${
                isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: '600ms' }}
            >
              <button
                onClick={scrollToTwin}
                className="group relative inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-[#ECC138] text-[#0B0E14] font-display font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-[#ECC138]/25 hover:bg-[#FFFDF8] hover:shadow-[#ECC138]/40 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer overflow-hidden"
              >
                {/* Subtle light sweep reflection */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
                <span>Launch Digital Twin Studio</span>
                <ArrowUpRight className="w-4 h-4 stroke-[3] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>

              <button
                onClick={scrollToCrisis}
                className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-xl bg-[#121620]/90 hover:bg-[#1A202C] border border-[#232A3B] text-slate-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer group"
              >
                <span>Explore The Crisis</span>
                <ArrowDown className="w-3.5 h-3.5 text-[#ECC138] group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>

            {/* Quick Metrics Triad (Step 6 Entrance) */}
            <div
              className={`pt-4 grid grid-cols-3 gap-3 max-w-lg border-t border-[#232A3B]/80 font-mono transition-all duration-700 ease-out transform ${
                isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: '700ms' }}
            >
              <div className="p-2.5 rounded-lg bg-[#121620]/60 border border-[#232A3B]/60 hover:border-[#ECC138]/40 transition-colors">
                <div className="text-lg sm:text-xl font-extrabold text-[#FFFDF8]">37</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">CAAQMS Nodes</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#121620]/60 border border-[#232A3B]/60 hover:border-[#ECC138]/40 transition-colors">
                <div className="text-lg sm:text-xl font-extrabold text-[#ECC138]">19.9k</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Hourly Timesteps</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#121620]/60 border border-[#232A3B]/60 hover:border-[#C89B6D]/40 transition-colors">
                <div className="text-lg sm:text-xl font-extrabold text-[#C89B6D]">WA-TGCN</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Dynamic Graph A(t)</div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Focal Centerpiece — "The Delhi Air Basin Portal" */}
          <div
            className={`lg:col-span-5 relative transition-all duration-1000 ease-out transform ${
              isInView ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'
            }`}
            style={{
              transitionDelay: '300ms',
              transform: `perspective(1000px) rotateY(${mousePos.x * 3.2}deg) rotateX(${-mousePos.y * 3.2}deg)`,
              transition: 'transform 0.15s ease-out'
            }}
          >
            {/* Ambient Halos radiating from the Portal */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-[#ECC138]/20 via-[#C89B6D]/10 to-transparent blur-2xl pointer-events-none" />

            {/* Outer Architectural Frame */}
            <div className="relative rounded-3xl p-2 sm:p-2.5 bg-[#121620]/90 backdrop-blur-xl border border-[#232A3B] shadow-[0_0_60px_-15px_rgba(236,193,56,0.25)] overflow-hidden group">
              
              {/* Telemetry Header Bar */}
              <div className="px-3 py-2 bg-[#0B0E14]/80 rounded-t-2xl border-b border-[#232A3B] flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-300 font-bold uppercase tracking-wider">DELHI NCT AIR BASIN</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Compass className="w-3.5 h-3.5 text-[#ECC138]" />
                  <span>315° NW · 2.4 m/s</span>
                </div>
              </div>

              {/* High-Resolution Night Satellite Focal Canvas */}
              <div className="relative h-[280px] sm:h-[350px] lg:h-[380px] xl:h-[400px] w-full rounded-b-2xl overflow-hidden bg-[#07090D]">
                <img
                  src="/images/delhi-satellite-night.jpg"
                  alt="Delhi Satellite Night View - EcoTwin Digital Twin"
                  className="w-full h-full object-cover object-center scale-105 group-hover:scale-110 transition-transform duration-1000"
                />

                {/* Vignette Gradients for Atmospheric Depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-transparent to-[#0B0E14]/40 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E14]/30 via-transparent to-[#0B0E14]/30 pointer-events-none" />

                {/* Sophisticated Animated Wind-Flow Corridors (315° NW to 135° SE) */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="wind-laser-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ECC138" stopOpacity="0.85" />
                        <stop offset="50%" stopColor="#FFFDF8" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.2" />
                      </linearGradient>
                    </defs>

                    {/* Wind Streamline 1 (North-Western Flank) */}
                    <line
                      x1="10%"
                      y1="2%"
                      x2="90%"
                      y2="82%"
                      stroke="rgba(236,193,56,0.25)"
                      strokeWidth="1"
                      strokeDasharray="6 14"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to="-40"
                        dur="3.2s"
                        repeatCount="indefinite"
                      />
                    </line>

                    {/* Wind Streamline 2: Primary Central Core Laser Vector */}
                    <line
                      x1="18%"
                      y1="18%"
                      x2="82%"
                      y2="82%"
                      stroke="url(#wind-laser-grad)"
                      strokeWidth="1.8"
                      strokeDasharray="10 16"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to="-52"
                        dur="2.4s"
                        repeatCount="indefinite"
                      />
                    </line>

                    {/* Traveling Energy Packet on Streamline 2 */}
                    <circle r="2.5" fill="#FFFDF8">
                      <animateMotion
                        path="M 72 72 L 328 328"
                        dur="2.4s"
                        repeatCount="indefinite"
                      />
                    </circle>

                    {/* Wind Streamline 3 (South-Eastern Flank) */}
                    <line
                      x1="2%"
                      y1="24%"
                      x2="80%"
                      y2="102%"
                      stroke="rgba(56,189,248,0.25)"
                      strokeWidth="1"
                      strokeDasharray="8 16"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to="-48"
                        dur="3.8s"
                        repeatCount="indefinite"
                      />
                    </line>
                  </svg>
                </div>

                {/* Softly Pulsing Monitoring Station Beacons with Staggered Radar Halo Rings */}
                {hotspots.map((spot) => (
                  <div
                    key={spot.id}
                    className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group/pin z-20"
                    style={{ top: spot.top, left: spot.left }}
                    onMouseEnter={() => setActiveHotspot(spot.id)}
                    onMouseLeave={() => setActiveHotspot(null)}
                    onClick={scrollToTwin}
                  >
                    {/* Outer Breathing Radar Halo with Staggered Phase Timing */}
                    <span 
                      className="absolute -inset-3 rounded-full opacity-60 animate-ping"
                      style={{ 
                        backgroundColor: spot.color,
                        animationDuration: spot.pulseDur,
                        animationDelay: spot.pulseDelay
                      }}
                    />
                    
                    {/* Secondary Soft Ambient Aura */}
                    <span 
                      className="absolute -inset-1.5 rounded-full opacity-40 transition-transform duration-700 group-hover/pin:scale-150"
                      style={{ backgroundColor: spot.color }}
                    />

                    {/* Core High-Contrast Beacon */}
                    <span 
                      className="relative flex items-center justify-center w-4 h-4 rounded-full border border-white/90 shadow-lg transition-transform duration-300 group-hover/pin:scale-125"
                      style={{ backgroundColor: spot.color }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    </span>

                    {/* Pop-up Micro-Telemetry Tooltip */}
                    <div
                      className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2 rounded-lg bg-[#0B0E14]/95 backdrop-blur-md border border-[#232A3B] shadow-2xl transition-all duration-200 pointer-events-none z-30 ${
                        activeHotspot === spot.id || spot.id === 'anand-vihar'
                          ? 'opacity-100 scale-100 translate-y-0'
                          : 'opacity-0 scale-95 translate-y-1'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>{spot.tag}</span>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: spot.color }} />
                      </div>
                      <div className="text-xs font-bold text-white mt-0.5">{spot.name}</div>
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#232A3B] text-[11px] font-mono">
                        <span className="text-slate-300">PM2.5:</span>
                        <span className="font-bold text-[#ECC138]">{spot.aqi}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Bottom HUD Metadata Banner */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 px-3 py-2 rounded-xl bg-[#0B0E14]/85 backdrop-blur-md border border-[#232A3B]/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-[#ECC138]" />
                    <span>28.6139° N, 77.2090° E</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#ECC138]">
                    <Layers className="w-3 h-3" />
                    <span>NCT Footprint: 1,484 km²</span>
                  </div>
                </div>

                {/* HUD Corner Reticle Brackets */}
                <div className="absolute top-2 left-2 text-[#ECC138]/50 text-xs font-mono pointer-events-none">⌜</div>
                <div className="absolute top-2 right-2 text-[#ECC138]/50 text-xs font-mono pointer-events-none">⌝</div>
                <div className="absolute bottom-2 left-2 text-[#ECC138]/50 text-xs font-mono pointer-events-none">⌞</div>
                <div className="absolute bottom-2 right-2 text-[#ECC138]/50 text-xs font-mono pointer-events-none">⌟</div>
              </div>

              {/* Bottom Caption */}
              <div className="p-2.5 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="text-slate-300">Target Airshed Visualisation</span>
                <span className="text-[#C89B6D] flex items-center gap-1">
                  <span>Interactive Telemetry</span>
                  <ChevronsRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 5. Minimalist Narrative Story Footer Bar */}
      <div className="relative z-10 max-w-7xl mx-auto w-full pt-4 border-t border-[#232A3B]/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-3 text-slate-400">
          <span className="px-2.5 py-1 rounded-md bg-[#ECC138]/10 text-[#ECC138] border border-[#ECC138]/30 font-semibold">
            DELHI CAAQMS NETWORK
          </span>
          <span className="hidden sm:inline text-slate-400">
            Evaluating 19,921 Hourly Inversion Cycles Across 37 Stations
          </span>
        </div>

        <button
          onClick={scrollToCrisis}
          className="flex items-center gap-2 text-slate-400 hover:text-[#ECC138] transition-colors group cursor-pointer"
        >
          <span className="tracking-wider uppercase">Begin The Story</span>
          <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform text-[#ECC138]" />
        </button>
      </div>
    </section>
  );
};
