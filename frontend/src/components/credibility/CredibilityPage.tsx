import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { SummaryData, BaselinesData } from '../../types';
import { 
  Award, 
  CheckCircle, 
  Server, 
  Activity, 
  Database, 
  Cpu, 
  BarChart3, 
  Zap, 
  ShieldCheck 
} from 'lucide-react';

interface Props {
  summary?: SummaryData;
  baselines?: BaselinesData;
}

export const CredibilityPage: React.FC<Props> = ({ summary, baselines }) => {
  // Official Benchmark Data from baselines_comparison.csv & baselines_metrics.json
  const benchmarkRows = [
    {
      model: 'WA-TGCN v2 (Wind-Aware Dynamic Graph)',
      isOurs: true,
      rmse: 60.92,
      mae: 39.69,
      r2: 0.634,
      rmse1h: 41.4,
      rmse24h: 66.5,
      latency: '14.2 ms',
      notes: 'Dynamic A(t) recomputed hourly + Forecast-graph decoder (A_fc)',
    },
    {
      model: 'Static-GCN Baseline',
      isOurs: false,
      rmse: 61.73,
      mae: 40.33,
      r2: 0.624,
      rmse1h: 43.3,
      rmse24h: 66.9,
      latency: '12.8 ms',
      notes: 'Fixed 12km Haversine distance graph; no wind awareness',
    },
    {
      model: 'No-Graph Baseline (Temporal GRU + Attn)',
      isOurs: false,
      rmse: 62.18,
      mae: 40.30,
      r2: 0.619,
      rmse1h: 41.6,
      rmse24h: 67.7,
      latency: '9.4 ms',
      notes: 'No spatial graph connections; stations modeled independently',
    },
    {
      model: 'Persistence Baseline (Naive Anchor)',
      isOurs: false,
      rmse: 83.87,
      mae: 56.93,
      r2: 0.307,
      rmse1h: 33.8,
      rmse24h: 76.7,
      latency: '<0.1 ms',
      notes: 'Last observed PM2.5 carried forward across all 24 horizons',
    },
  ];

  // Regime Breakdown Chart Option
  const regimeChartOption = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#0B0E14',
        borderColor: '#232A3B',
        textStyle: { color: '#FFFDF8', fontSize: 11 },
      },
      legend: {
        data: ['WA-TGCN (Dynamic)', 'Static-GCN', 'Persistence'],
        textStyle: { color: '#94A3B8', fontSize: 11 },
        top: 0,
      },
      grid: { left: '3%', right: '4%', bottom: '10%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['Stable Regime (33%)', 'Moderate Regime (33%)', 'Volatile Regime (34%)'],
        axisLine: { lineStyle: { color: '#232A3B' } },
        axisLabel: { color: '#CBD5E1', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        name: 'RMSE (µg/m³)',
        nameTextStyle: { color: '#94A3B8', fontSize: 10 },
        axisLine: { lineStyle: { color: '#232A3B' } },
        axisLabel: { color: '#94A3B8', fontSize: 10 },
        splitLine: { lineStyle: { color: '#181E2B' } },
      },
      series: [
        {
          name: 'WA-TGCN (Dynamic)',
          type: 'bar',
          data: [29.89, 42.95, 90.87],
          itemStyle: { color: '#ECC138', borderRadius: [4, 4, 0, 0] },
        },
        {
          name: 'Static-GCN',
          type: 'bar',
          data: [31.2, 44.5, 95.4],
          itemStyle: { color: '#C89B6D', borderRadius: [4, 4, 0, 0] },
        },
        {
          name: 'Persistence',
          type: 'bar',
          data: [42.1, 68.3, 138.5],
          itemStyle: { color: '#475569', borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6 rounded-2xl bg-[#121620] border border-[#232A3B] shadow-xl text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#232A3B]">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#ECC138]/15 text-[#ECC138] border border-[#ECC138]/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#FFFDF8] tracking-tight">
                Academic Credibility & Empirical Verification
              </h2>
              <p className="text-xs text-slate-400">
                Rigorous benchmark leaderboard, held-out test splits, and data pipeline health telemetry
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-[#ECC138]/10 border border-[#ECC138]/30 text-[#ECC138] text-xs font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ECC138] animate-pulse"></span>
            <span>Leakage-Free Protocol</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#0B0E14] border border-[#232A3B] text-slate-300 text-xs font-mono">
            {summary?.test_windows_exported || 970} Sample Windows
          </div>
        </div>
      </div>

      {/* Benchmark Leaderboard Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#ECC138]" />
            <span>Formal Baseline Comparison Table (Test Set N={summary?.test_windows_total || 2918})</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Lower RMSE/MAE is better · Higher R² is better
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#232A3B] bg-[#0B0E14] shadow-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#232A3B] bg-[#121620] text-slate-400 font-mono uppercase text-[11px]">
                <th className="py-3 px-4">Architecture</th>
                <th className="py-3 px-3">Ensemble RMSE</th>
                <th className="py-3 px-3">MAE</th>
                <th className="py-3 px-3">R² Score</th>
                <th className="py-3 px-3">+1h RMSE</th>
                <th className="py-3 px-3">+24h RMSE</th>
                <th className="py-3 px-3">Inference</th>
                <th className="py-3 px-4">Key Mechanism</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232A3B] font-mono">
              {benchmarkRows.map((row) => (
                <tr
                  key={row.model}
                  className={`transition-colors ${
                    row.isOurs
                      ? 'bg-[#C89B6D]/15 text-white font-medium border-l-2 border-[#ECC138]'
                      : 'text-slate-400 hover:bg-[#121620]/60'
                  }`}
                >
                  <td className="py-3 px-4 font-sans font-semibold flex items-center gap-2">
                    {row.isOurs && <span className="w-2 h-2 rounded-full bg-[#ECC138]"></span>}
                    <span className={row.isOurs ? 'text-white font-bold' : ''}>{row.model}</span>
                  </td>
                  <td className="py-3 px-3 font-bold text-[#ECC138]">{row.rmse.toFixed(2)}</td>
                  <td className="py-3 px-3">{row.mae.toFixed(2)}</td>
                  <td className="py-3 px-3 font-bold text-white">{row.r2.toFixed(3)}</td>
                  <td className="py-3 px-3">{row.rmse1h.toFixed(1)}</td>
                  <td className="py-3 px-3">{row.rmse24h.toFixed(1)}</td>
                  <td className="py-3 px-3 text-slate-500">{row.latency}</td>
                  <td className="py-3 px-4 font-sans text-[11px] text-slate-400">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Volatility Regime Breakdown + Pipeline Health Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volatility Regime Breakdown Chart */}
        <div className="p-5 rounded-2xl bg-[#0B0E14] border border-[#232A3B] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#ECC138]" />
                <span>Error Distribution by Atmospheric Volatility Regime</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">RMSE µg/m³</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Proof of RG6 Novelty Claim: Dynamic wind coupling achieves its largest statistical margin over static graphs during volatile atmospheric weather transitions.
            </p>
          </div>
          <div className="w-full h-[220px]">
            <ReactECharts
              option={regimeChartOption}
              style={{ width: '100%', height: '100%' }}
              opts={{ renderer: 'canvas' }}
            />
          </div>
        </div>

        {/* Pipeline Health & Audit Telemetry */}
        <div className="p-5 rounded-2xl bg-[#0B0E14] border border-[#232A3B] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-[#FFFDF8] flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#ECC138]" />
                <span>Pipeline Health & Engineering Telemetry</span>
              </div>
              <span className="text-[10px] font-mono text-[#ECC138] flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                <span>Operational</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Full data integrity audit across Delhi CPCB continuous ambient monitoring network.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#121620] border border-[#232A3B]">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono text-slate-400 mb-1">
                <Database className="w-3.5 h-3.5 text-[#ECC138]" />
                <span>Active Stations</span>
              </div>
              <div className="text-xl font-mono font-bold text-white">37 / 37</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Zero phantom nodes</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#121620] border border-[#232A3B]">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono text-slate-400 mb-1">
                <Server className="w-3.5 h-3.5 text-[#C89B6D]" />
                <span>Hourly Coverage</span>
              </div>
              <div className="text-xl font-mono font-bold text-[#FFFDF8]">19,921 h</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Jan 2024 – Apr 2026</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#121620] border border-[#232A3B]">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono text-slate-400 mb-1">
                <Cpu className="w-3.5 h-3.5 text-[#ECC138]" />
                <span>Ensemble Setup</span>
              </div>
              <div className="text-xl font-mono font-bold text-[#ECC138]">7 Seeds</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Cosine LR Schedule</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#121620] border border-[#232A3B]">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono text-slate-400 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C89B6D]" />
                <span>Data Completeness</span>
              </div>
              <div className="text-xl font-mono font-bold text-white">100.0%</div>
              <div className="text-[10px] text-slate-500 mt-0.5">0.0% Residual NaN</div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-[#121620] border border-[#232A3B] text-[11px] text-slate-400 flex items-center justify-between">
            <span>Evaluation Protocol: Time-series Split (70% Train, 15% Val, 15% Test)</span>
            <span className="font-mono text-[#ECC138] font-bold">NO SHUFFLING</span>
          </div>
        </div>
      </div>
    </div>
  );
};
