import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Station, StationForecast, WindEdgesMap } from '../../types';
import { generateStationAttribution } from '../../utils/explainability';
import { BrainCircuit, Sparkles, Clock, ArrowDownRight, Info } from 'lucide-react';

interface Props {
  station: Station;
  forecast: StationForecast;
  allStations: Station[];
  windEdgesMap?: WindEdgesMap;
  windowIdx: number;
  isEmbedded?: boolean;
}

export const WhyForecastTab: React.FC<Props> = ({
  station,
  forecast,
  allStations,
  windEdgesMap,
  windowIdx,
  isEmbedded = false,
}) => {
  const activeEdges = windEdgesMap ? windEdgesMap[String(windowIdx)] : undefined;

  const attribution = useMemo(() => {
    return generateStationAttribution(forecast, station, allStations, activeEdges);
  }, [forecast, station, allStations, activeEdges]);

  // Attention strip hours labels (-48h to -1h)
  const attentionLabels = useMemo(() => {
    return Array.from({ length: 48 }, (_, i) => `-${48 - i}h`);
  }, []);

  // Temporal Attention Chart Option
  const attentionChartOption = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0B0E14',
        borderColor: '#232A3B',
        textStyle: { color: '#FFFDF8', fontSize: 11 },
        formatter: (params: any[]) => {
          const p = params[0];
          return `<div class="font-mono text-xs"><b>${p.name} ago</b>: ${(p.value * 100).toFixed(1)}% temporal weight</div>`;
        },
      },
      grid: { left: '2%', right: '2%', bottom: '15%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: attentionLabels,
        axisLine: { lineStyle: { color: '#232A3B' } },
        axisLabel: { color: '#94A3B8', fontSize: 9, interval: 5 },
      },
      yAxis: {
        type: 'value',
        show: false,
      },
      series: [
        {
          name: 'Attention Weight',
          type: 'bar',
          data: attribution.attentionWeights,
          itemStyle: {
            color: (params: any) => {
              const val = params.value;
              if (val > 0.4) return '#ECC138';
              if (val > 0.2) return '#C89B6D';
              return '#232A3B';
            },
            borderRadius: [2, 2, 0, 0],
          },
        },
      ],
    };
  }, [attentionLabels, attribution.attentionWeights]);

  // Grouped SHAP Bars Option
  const shapChartOption = useMemo(() => {
    const factors = [...attribution.shapFactors].reverse();
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#0B0E14',
        borderColor: '#232A3B',
        textStyle: { color: '#FFFDF8', fontSize: 11 },
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          const factor = factors[p?.dataIndex ?? 0];
          return `
            <div class="font-bold text-xs text-[#FFFDF8]">${factor.name}</div>
            <div class="text-[11px] text-slate-400 mt-0.5">${factor.description}</div>
            <div class="mt-1 font-mono font-bold ${factor.impact >= 0 ? 'text-[#ECC138]' : 'text-[#C89B6D]'}">
              Impact: ${factor.impact >= 0 ? '+' : ''}${factor.impact.toFixed(1)} µg/m³
            </div>
          `;
        },
      },
      grid: { left: '3%', right: '8%', bottom: '5%', top: '5%', containLabel: true },
      xAxis: {
        type: 'value',
        name: 'Impact (µg/m³)',
        nameTextStyle: { color: '#94A3B8', fontSize: 10 },
        axisLine: { lineStyle: { color: '#232A3B' } },
        axisLabel: { color: '#94A3B8', fontSize: 10 },
        splitLine: { lineStyle: { color: '#181E2B' } },
      },
      yAxis: {
        type: 'category',
        data: factors.map((f) => f.name),
        axisLine: { lineStyle: { color: '#232A3B' } },
        axisLabel: {
          color: '#FFFDF8',
          fontSize: 10,
          formatter: (val: string) => {
            return val.length > 15 ? val.slice(0, 15) + '…' : val;
          },
        },
      },
      series: [
        {
          name: 'Impact',
          type: 'bar',
          data: factors.map((f) => ({
            value: Math.round(f.impact * 10) / 10,
            itemStyle: {
              color: f.impact >= 0 ? '#ECC138' : '#C89B6D',
              borderRadius: f.impact >= 0 ? [0, 4, 4, 0] : [4, 0, 0, 4],
            },
          })),
        },
      ],
    };
  }, [attribution.shapFactors]);

  return (
    <div
      className={
        isEmbedded
          ? 'flex flex-col gap-4 p-0 bg-transparent border-0 shadow-none text-white w-full max-w-full min-w-0'
          : 'flex flex-col gap-4 p-6 rounded-2xl bg-[#121620] border border-[#232A3B] shadow-xl text-white'
      }
    >
      {/* Tab Header */}
      {!isEmbedded ? (
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#232A3B]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-[#ECC138]/15 text-[#ECC138] border border-[#ECC138]/30 shrink-0">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-[#FFFDF8] truncate">
                XAI Spatio-Temporal Attribution
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                Multi-head attention & dynamic A(t) graph convolution
              </p>
            </div>
          </div>
          <div className="px-2.5 py-0.5 rounded-lg bg-[#C89B6D] text-[#0B0E14] text-[10px] font-mono font-bold shrink-0">
            Attribution
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between pb-1 border-b border-[#232A3B] text-xs font-mono">
          <span className="text-[#ECC138] font-bold flex items-center gap-1.5">
            <BrainCircuit className="w-3.5 h-3.5 text-[#ECC138] shrink-0" />
            <span>XAI Spatio-Temporal Attribution</span>
          </span>
          <span className="text-slate-400">Multi-Head GNN Attention</span>
        </div>
      )}

      {/* Plain Language "Why" Card */}
      <div className="p-4 rounded-xl bg-[#0B0E14] border-l-4 border-l-[#ECC138] border border-[#232A3B] shadow-lg relative overflow-hidden">
        <div className="flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-[#ECC138] shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#ECC138] font-bold mb-1 flex items-center gap-1.5">
              <span>Plain-Language Synthesis</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C89B6D]"></span>
              <span className="text-[9px] text-slate-400 lowercase font-normal">faithful template</span>
            </div>
            <p className="text-xs font-medium text-slate-100 leading-relaxed font-sans">
              "{attribution.summarySentence}"
            </p>
          </div>
        </div>
      </div>

      {/* Upwind Stations & Advective Inflow */}
      {attribution.topUpwindStations.length > 0 && (
        <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#232A3B]">
          <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
            <ArrowDownRight className="w-3.5 h-3.5 text-[#ECC138] shrink-0" />
            <span className="truncate">Top Dynamic Inflow Links Feeding Station #{station.id}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {attribution.topUpwindStations.map((u) => (
              <div
                key={u.id}
                className="px-3 py-1.5 rounded-lg bg-[#121620] border border-[#232A3B] flex items-center gap-2 text-xs font-mono"
              >
                <span className="text-slate-200 font-medium">{u.name}</span>
                <span className="px-1.5 py-0.5 rounded bg-[#ECC138]/15 border border-[#ECC138]/30 text-[#ECC138] text-[11px] font-bold">
                  w={u.weight}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Temporal Attention Strip + Grouped SHAP Factors */}
      <div className={isEmbedded ? 'flex flex-col gap-3.5' : 'grid grid-cols-1 lg:grid-cols-2 gap-4'}>
        {/* Temporal Attention */}
        <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#232A3B] flex flex-col">
          <div className="flex items-center justify-between mb-1.5 text-xs font-mono">
            <div className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#ECC138] shrink-0" />
              <span>48h Historical Attention Weights</span>
            </div>
            <span className="text-[10px] text-slate-500">GNN Strip</span>
          </div>
          <div className={`w-full ${isEmbedded ? 'h-[160px]' : 'h-[180px]'}`}>
            <ReactECharts
              option={attentionChartOption}
              style={{ width: '100%', height: '100%' }}
              opts={{ renderer: 'canvas' }}
            />
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="truncate">Taller bars = strongest influence on 24h forecast.</span>
          </div>
        </div>

        {/* Grouped SHAP Bars */}
        <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#232A3B] flex flex-col">
          <div className="flex items-center justify-between mb-1.5 text-xs font-mono">
            <div className="text-slate-300 font-semibold flex items-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5 text-[#ECC138]" />
              <span>SHAP Feature Contributions</span>
            </div>
            <span className="text-[10px] text-slate-500">± µg/m³</span>
          </div>
          <div className={`w-full ${isEmbedded ? 'h-[160px]' : 'h-[180px]'}`}>
            <ReactECharts
              option={shapChartOption}
              style={{ width: '100%', height: '100%' }}
              opts={{ renderer: 'canvas' }}
            />
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="truncate">Gold increases PM2.5; Camel indicates atmospheric dispersion.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
