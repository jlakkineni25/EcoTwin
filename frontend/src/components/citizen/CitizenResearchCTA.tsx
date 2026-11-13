import React from 'react';
import { ArrowRight, Cpu, Layers, GitBranch, ShieldCheck } from 'lucide-react';

interface Props {
  onExploreResearch: () => void;
}

export const CitizenResearchCTA: React.FC<Props> = ({ onExploreResearch }) => {
  return (
    <section className="bg-gradient-to-br from-[#121826] via-[#101420] to-[#0A0D14] border border-[#ECC138]/30 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl relative overflow-hidden">
      {/* Decorative ambient gradient backdrop */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-b from-[#ECC138]/10 to-amber-500/0 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-gradient-to-t from-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECC138]/10 border border-[#ECC138]/30 text-xs font-mono text-[#ECC138] mb-3">
            <span>🔬 FOR RESEARCHERS, PLANNERS & DATA SCIENTISTS</span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-snug">
            Curious about the Atmospheric AI behind these predictions?
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
            EcoTwin is powered by a Wind-Aware Temporal Graph Convolutional Network (WA-TGCN) that models chemical advection, nocturnal temperature inversions, and multi-hop transport across Delhi NCR.
          </p>

          {/* Research feature pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0B0E14]/70 border border-[#232A3B] text-slate-300">
              <Cpu className="w-4 h-4 text-[#ECC138] shrink-0" />
              <span>WA-TGCN Architecture</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0B0E14]/70 border border-[#232A3B] text-slate-300">
              <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>37-Station Graph Twin</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0B0E14]/70 border border-[#232A3B] text-slate-300">
              <GitBranch className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Interactive What-If Studio</span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
          <button
            onClick={onExploreResearch}
            className="group flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#ECC138] to-[#C89B6D] hover:from-[#f6ce4e] hover:to-[#dfaf7f] text-[#0B0E14] font-mono text-xs sm:text-sm font-black tracking-wide shadow-xl shadow-[#ECC138]/20 transition-all transform hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
          >
            <span>EXPLORE THE RESEARCH</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <span className="text-[11px] text-slate-400 font-mono">
            Full technical storytelling & benchmark metrics
          </span>
        </div>
      </div>

      {/* Data Integrity Transparency Bar */}
      <div className="mt-8 pt-5 border-t border-[#232A3B] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Data Integrity: Station readings originate from CPCB 37-node monitoring network and Open-Meteo reanalysis (Jan 2024 – Apr 2026 test split).
          </span>
        </div>
        <span className="font-mono text-slate-400 shrink-0">
          Open Scientific Companion
        </span>
      </div>
    </section>
  );
};

