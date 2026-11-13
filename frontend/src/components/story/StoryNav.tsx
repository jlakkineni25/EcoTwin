import React, { useState, useEffect } from 'react';
import { useTwinStore } from '../../store/useTwinStore';
import { Wind, PlayCircle, Menu, X } from 'lucide-react';

interface Props {
  onSwitchToCitizen?: () => void;
}

export const StoryNav: React.FC<Props> = ({ onSwitchToCitizen }) => {
  const [activeSection, setActiveSection] = useState('crisis');
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { startDemo, isDemoActive } = useTwinStore();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);

      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalScroll > 0 ? (window.scrollY / totalScroll) * 100 : 0;
      setScrollProgress(progress);

      const sections = ['crisis', 'dilemma', 'innovation', 'twin', 'evaluations'];
      const scrollPos = window.scrollY + 250;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navItems = [
    { id: 'crisis', label: 'THE CRISIS' },
    { id: 'dilemma', label: 'THE DILEMMA' },
    { id: 'innovation', label: 'THE INNOVATION' },
    { id: 'twin', label: 'DIGITAL TWIN' },
    { id: 'evaluations', label: 'EVALUATION' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0B0E14]/95 backdrop-blur-md border-b border-[#232A3B] py-3.5 shadow-2xl'
          : 'bg-transparent py-5'
      }`}
    >
      {/* Golden Scroll Progress Bar */}
      <div 
        className="absolute top-0 left-0 h-[2.5px] bg-[#ECC138] transition-all duration-100 ease-out z-50"
        style={{ width: `${scrollProgress}%` }}
      />
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => scrollTo('hero')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-8 h-8 rounded-lg bg-[#ECC138] flex items-center justify-center text-[#0B0E14] font-bold shadow-md shadow-[#ECC138]/20 group-hover:scale-105 transition-transform">
            <Wind className="w-4 h-4 text-[#0B0E14]" />
          </div>
          <div>
            <span className="font-display font-extrabold tracking-wider text-white text-base">
              ECO<span className="text-[#ECC138]">TWIN</span>
            </span>
            <span className="text-[10px] text-slate-400 ml-2 font-mono uppercase tracking-widest hidden sm:inline">
              WA-TGCN Air Quality Twin
            </span>
          </div>
        </div>

        {/* Desktop Minimalist Pill Navigation */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-[#121620]/80 border border-[#232A3B] backdrop-blur-md shadow-lg">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`px-3 lg:px-3.5 py-1.5 rounded-full text-[10.5px] lg:text-[11px] font-mono tracking-wider font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#C89B6D] text-[#0B0E14] shadow-md shadow-[#C89B6D]/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Top Right Actions: Citizen View, Guided Demo Trigger & Mobile Menu Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onSwitchToCitizen && (
            <button
              onClick={onSwitchToCitizen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer shadow-sm shadow-emerald-500/10"
              title="Return to Citizen Air Quality Companion"
            >
              <span>🌱</span>
              <span className="hidden sm:inline">Citizen View</span>
            </button>
          )}

          <button
            onClick={() => {
              startDemo();
              scrollTo('twin');
            }}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase transition-all shadow-md cursor-pointer ${
              isDemoActive
                ? 'bg-[#C89B6D] text-[#0B0E14]'
                : 'bg-[#ECC138] hover:bg-[#f6ce4e] text-[#0B0E14] shadow-[#ECC138]/20'
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isDemoActive ? 'Demo Active' : 'Start Demo'}</span>
          </button>

          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ECC138] animate-pulse"></span>
            <span>37 Nodes</span>
          </div>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-[#121620] border border-[#232A3B] text-slate-300 hover:text-white cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4 text-[#ECC138]" /> : <Menu className="w-4 h-4 text-slate-300" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-3 pb-4 bg-[#0B0E14]/98 border-b border-[#232A3B] backdrop-blur-xl animate-fade-in shadow-2xl">
          <div className="flex flex-col gap-1.5">
            {onSwitchToCitizen && (
              <button
                onClick={() => {
                  onSwitchToCitizen();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-mono tracking-wider font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-1 cursor-pointer"
              >
                <span>🌱 Citizen Air Dashboard</span>
                <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">
                  Switch
                </span>
              </button>
            )}
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    scrollTo(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-mono tracking-wider font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#C89B6D] text-[#0B0E14] font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-[#181E2B]'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#0B0E14]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
