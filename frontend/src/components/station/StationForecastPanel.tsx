import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Station, StationForecast } from '../../types';
import { CPCB_CATEGORIES, HORIZON_UNCERTAINTY_SIGMA, computeBreachProbability } from '../../utils/aqi';
import { AlertTriangle, Clock, TrendingUp, ShieldCheck, MapPin, Gauge } from 'lucide-react';

interface Props {
  station: Station;
  forecast: StationForecast;
  timestamp: string;
  isEmbedded?: boolean;
}

export const StationForecastPanel: React.FC<Props> = ({
  station,
  forecast,
  timestamp,
  isEmbedded = false,
}) => {
  const currentVal = Math.round(forecast.current_pm25);
  const peakVal = Math.round(forecast.peak_predicted);
  const category = forecast.current_aqi;
  const catConfig = CPCB_CATEGORIES[category] || CPCB_CATEGORIES.Moderate;

  // Build 24 hour timestamps
  const baseDate = new Date(timestamp.replace(' ', 'T'));
  const hours = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const d = new Date(baseDate.getTime() + (i + 1) * 3600 * 1000);
      return `${String(d.getHours()).padStart(2, '0')}:00`;
    });
  }, [baseDate]);

  // Compute confidence bands (80% and 95% intervals)
  const confidenceData = useMemo(() => {
    const medians = forecast.predicted_24h;
    const actuals = forecast.actual_24h;

    const lower95: number[] = [];
    const lower80: number[] = [];
    const band80: number[] = [];
    const band95: number[] = [];
    const breachProbabilities: number[] = [];

    medians.forEach((pred, i) => {
      const sigma = HORIZON_UNCERTAINTY_SIGMA[i] || 38;
      const l95 = Math.max(0, pred - 1.96 * sigma);
      const l80 = Math.max(0, pred - 1.28 * sigma);
      const u80 = pred + 1.28 * sigma;
      const u95 = pred + 1.96 * sigma;

      lower95.push(Math.round(l95));
      lower80.push(Math.round(l80));
      band80.push(Math.round(u80 - l80));
      band95.push(Math.round(u95 - l95));

      breachProbabilities.push(computeBreachProbability(pred, i, 60.0));
    });

    return {
      medians: medians.map((v) => Math.round(v)),
      actuals: actuals.map((v) => Math.round(v)),
      lower95,
      lower80,
      band80,
      band95,
      breachProbabilities,
    };
  }, [forecast]);

  // Max breach probability in next 6h
  const next6hMaxProb = Math.max(...confidenceData.breachProbabilities.slice(0, 6));

  // ECharts Option
  const chartOption = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0B0E14',
        borderColor: '#232A3B',
        textStyle: { color: '#FFFDF8', fontFamily: 'Inter', fontSize: 12 },
        formatter: (params: any[]) => {
          const hourLabel = params[0]?.axisValue;
          const idx = hours.indexOf(hourLabel);
          const prob = confidenceData.breachProbabilities[idx] ?? 0;
          let html = `<div class="font-bold border-b border-[#232A3B] pb-1 mb-1 text-[#FFFDF8]">+${idx + 1}h (${hourLabel})</div>`;
          params.forEach((p) => {
            if (p.seriesName === 'Predicted Median' || p.seriesName === 'Actual Observed') {
              html += `<div class="flex items-center justify-between gap-4 py-0.5">
                <span style="color:${p.color}">${p.seriesName}</span>
                <span class="font-mono font-bold">${p.value} µg/m³</span>
              </div>`;
            }
          });
          html += `<div class="mt-1 pt-1 border-t border-[#232A3B] text-[11px] text-[#ECC138] font-mono">
            Breach (>60 µg/m³): ${prob}% probability
          </div>`;
          return html;
        },
      },
      legend: {
        data: ['Actual Observed', 'Predicted Median', '80% Interval', '95% Interval'],
        textStyle: { color: '#94A3B8', fontSize: 11 },
        top: 0,
        right: 10,
      },
      grid: {
        left: '2%',
        right: '4%',
        bottom: '10%',
        top: isEmbedded ? '12%' : '14%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: hours,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#232A3B' } },
        axisLabel: { color: '#94A3B8', fontSize: 10, interval: 3 },
        splitLine: { show: true, lineStyle: { color: '#181E2B', type: 'dashed' } },
      },
      yAxis: {
        type: 'value',
        name: 'PM2.5 (µg/m³)',
        nameTextStyle: { color: '#94A3B8', fontSize: 10 },
        axisLine: { lineStyle: { color: '#232A3B' } },
        axisLabel: { color: '#94A3B8', fontSize: 10 },
        splitLine: { show: true, lineStyle: { color: '#181E2B' } },
      },
      series: [
        // 95% Confidence Band (Lower invisible base)
        {
          name: 'base95',
          type: 'line',
          data: confidenceData.lower95,
          lineStyle: { opacity: 0 },
          stack: 'confidence-95',
          symbol: 'none',
        },
        // 95% Confidence Band Fill
        {
          name: '95% Interval',
          type: 'line',
          data: confidenceData.band95,
          lineStyle: { opacity: 0 },
          areaStyle: { color: 'rgba(236, 193, 56, 0.08)' },
          stack: 'confidence-95',
          symbol: 'none',
        },
        // 80% Confidence Band (Lower invisible base)
        {
          name: 'base80',
          type: 'line',
          data: confidenceData.lower80,
          lineStyle: { opacity: 0 },
          stack: 'confidence-80',
          symbol: 'none',
        },
        // 80% Confidence Band Fill
        {
          name: '80% Interval',
          type: 'line',
          data: confidenceData.band80,
          lineStyle: { opacity: 0 },
          areaStyle: { color: 'rgba(236, 193, 56, 0.18)' },
          stack: 'confidence-80',
          symbol: 'none',
        },
        // Predicted Median
        {
          name: 'Predicted Median',
          type: 'line',
          data: confidenceData.medians,
          lineStyle: { color: '#ECC138', width: 2.5, type: 'solid' },
          itemStyle: { color: '#ECC138' },
          symbol: 'circle',
          symbolSize: 4,
          markLine: {
            silent: true,
            symbol: 'none',
            data: [
              {
                yAxis: 60,
                lineStyle: { color: '#C89B6D', type: 'dotted', width: 1.5 },
                label: {
                  formatter: 'CPCB 24h Threshold (60 µg/m³)',
                  color: '#C89B6D',
                  fontSize: 10,
                  position: 'insideEndTop',
                },
              },
            ],
          },
        },
        // Actual Observed
        {
          name: 'Actual Observed',
          type: 'line',
          data: confidenceData.actuals,
          lineStyle: { color: '#FFFDF8', width: 2.2 },
          itemStyle: { color: '#FFFDF8' },
          symbol: 'circle',
          symbolSize: 4,
        },
      ],
    };
  }, [hours, confidenceData]);

  return (
    <div
      className={
        isEmbedded
          ? 'flex flex-col gap-4 p-0 bg-transparent border-0 shadow-none text-white w-full max-w-full'
          : 'flex flex-col gap-4 p-6 rounded-2xl bg-[#121620] border border-[#232A3B] shadow-xl text-white'
      }
    >
      {/* Header Info */}
      {!isEmbedded ? (
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#ECC138]">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Station #{station.id}</span>
            </div>
            <h2 className="text-2xl font-bold text-[#FFFDF8] tracking-tight mt-0.5 truncate">
              {station.name}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <Clock className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="truncate">Forecast: {timestamp}</span>
            </div>
          </div>

          {/* Current AQI Badge */}
          <div
            className="px-3 py-1 rounded-xl border flex flex-col items-end shadow-sm shrink-0"
            style={{
              backgroundColor: catConfig.bgHex,
              borderColor: catConfig.borderHex,
            }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: catConfig.textHex }}>
              {category}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono font-bold text-white">{currentVal}</span>
              <span className="text-[9px] text-slate-400">µg/m³</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between pb-1 border-b border-[#232A3B] text-xs font-mono">
          <span className="text-[#ECC138] font-bold flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-[#ECC138] shrink-0" />
            <span>24h Multi-Horizon Fan Chart</span>
          </span>
          <span className="text-slate-400">7-Seed Uncertainty Bands</span>
        </div>
      )}

      {/* Fan Chart with Full Prominence */}
      <div className="w-full">
        <div className={`w-full ${isEmbedded ? 'h-[320px] sm:h-[340px]' : 'h-[300px]'}`}>
          <ReactECharts
            option={chartOption}
            style={{ width: '100%', height: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        </div>
      </div>

      {/* Uncertainty & Telemetry Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {forecast.hours_to_breach_cpcb !== null ? (
          <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#ECC138]/40 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#ECC138]/15 text-[#ECC138] shrink-0">
              <AlertTriangle className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#ECC138] truncate">
                CPCB Breach: +{forecast.hours_to_breach_cpcb}h
              </div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                Peak: <span className="font-mono text-[#FFFDF8] font-bold">{peakVal} µg/m³</span> ({next6hMaxProb}% prob)
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#232A3B] flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#C89B6D]/20 text-[#C89B6D] shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#C89B6D] truncate">Safe / Compliant</div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                No breach across all 24 horizons
              </div>
            </div>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#232A3B] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-[#121620] text-[#ECC138] shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">24h Peak Inflow</div>
              <div className="text-sm font-mono font-bold text-white mt-0.5">
                {peakVal} µg/m³
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] text-slate-400 font-mono">Δ from Now</div>
            <div
              className={`text-xs font-mono font-bold mt-0.5 ${
                peakVal >= currentVal ? 'text-[#ECC138]' : 'text-slate-400'
              }`}
            >
              {peakVal >= currentVal ? `+${peakVal - currentVal}` : peakVal - currentVal} µg/m³
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
