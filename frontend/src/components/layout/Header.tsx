import React from 'react';
import { useTwinStore, DashboardTab } from '../../store/useTwinStore';
import { SummaryData } from '../../types';
import { 
  Map, 
  Compass, 
  HeartPulse, 
  Award, 
  PlayCircle, 
  Wind 
} from 'lucide-react';

interface Props {
  summary?: SummaryData;
}

export const Header: React.FC<Props> = ({ summary }) => {
  const { activeTab, setActiveTab, startDemo, isDemoActive } = useTwinStore();

  const tabs: Array<{ id: DashboardTab; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'digital-twin', label: 'Live Digital Twin', icon: Map },
    { id: 'what-if', label: 'What-If Lab', icon: Compass },
    { id: 'health-advisor', label: 'Health & Commute', icon: HeartPulse },
    { id: 'credibility', label: 'Credibility & Trust', icon: Award },
  ];

  return (
    <header className="flex flex-col gap-4">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#121620] border border-[#232A3B] shadow-xl text-white">
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-[#ECC138]/20 border border-[#ECC138]/40 shadow-lg shadow-[#ECC138]/10">
            <Wind className="w-6 h-6 text-[#ECC138]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#ECC138]"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-display font-bold text-[#FFFDF8] tracking-tight">
                EcoTwin
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-[#ECC138]/15 border border-[#ECC138]/30 text-[#ECC138] font-mono text-[11px] font-bold">
                WA-TGCN v2
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Wind-Aware Air Quality Digital Twin · Delhi CPCB Network
            </p>
          </div>
        </div>

        {/* Action Controls & Walkthrough trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={startDemo}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all shadow-lg ${
              isDemoActive
                ? 'bg-[#C89B6D] text-[#0B0E14] shadow-[#C89B6D]/30'
                : 'bg-[#ECC138] text-[#0B0E14] hover:bg-[#f6ce4e] shadow-[#ECC138]/20'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            <span>{isDemoActive ? 'Walkthrough Active' : 'Start Panel Demo'}</span>
          </button>
        </div>
      </div>

      {/* Model Stats Bar */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3.5 rounded-xl bg-[#121620] border border-[#232A3B] flex flex-col justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Test Ensemble RMSE</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-mono font-bold text-[#ECC138]">{summary.rmse.toFixed(1)}</span>
              <span className="text-[10px] text-slate-500">µg/m³</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5">24h average error</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#121620] border border-[#232A3B] flex flex-col justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Variance Explained (R²)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-mono font-bold text-[#FFFDF8]">{summary.r2.toFixed(3)}</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5">vs persistence 0.307</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#121620] border border-[#232A3B] flex flex-col justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Stable-Day Accuracy</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-mono font-bold text-[#C89B6D]">
                {summary.rmse_by_regime?.Stable?.toFixed(1) || '29.9'}
              </span>
              <span className="text-[10px] text-slate-500">µg/m³</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5">typical weather</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#121620] border border-[#232A3B] flex flex-col justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Continuous Network</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-mono font-bold text-white">{summary.n_stations}</span>
              <span className="text-[10px] text-slate-500">stations</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5">100% verified coords</span>
          </div>
        </div>
      )}

      {/* Main Tab Navigation */}
      <nav className="flex items-center gap-1.5 p-1 rounded-xl bg-[#121620] border border-[#232A3B]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                isActive
                  ? 'bg-[#C89B6D] text-[#0B0E14] shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0B0E14]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
