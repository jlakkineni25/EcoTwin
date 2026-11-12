import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTwinStore } from '../../store/useTwinStore';
import { Station, StationForecast, WhatIfData } from '../../types';
import { Compass, Wind, ArrowRight, Sparkles, RefreshCw, Layers } from 'lucide-react';

interface Props {
  station: Station;
  baselineForecast: StationForecast;
  whatIfData?: WhatIfData;
  windowIdx: number;
  isEmbedded?: boolean;
}

export const WhatIfStudio: React.FC<Props> = ({
  station,
  baselineForecast,
  whatIfData,
  windowIdx,
  isEmbedded = false,
}) => {
  const {
    scenarioKey,
    setScenarioKey,
    compassAngle,
    setCompassAngle,
    windSpeedMultiplier,
    setWindSpeedMultiplier,
  } = useTwinStore();

  const scenarios = whatIfData?.scenarios || [
    { key: 'wind_x2', label: 'Wind doubled (High Dispersion)' },
    { key: 'wind_nw', label: 'NW inflow (Stubble Smoke)' },
    { key: 'wind_rev', label: 'Wind reversed (Easterly Shift)' },
  ];

  // Get precomputed scenario forecast for this station & window
  const scenarioForecast = useMemo(() => {
    if (!whatIfData || scenarioKey === 'baseline') return null;
    const windowData = whatIfData.windows[String(windowIdx)];
    if (!windowData) return null;
    const scen = windowData[scenarioKey];
    if (!scen) return null;

    const stationSeries = scen.predicted_24h[station.id];
    const breachH = scen.breach_h[station.id];
    return {
      series: stationSeries || baselineForecast.predicted_24h,
      breachH,
      peak: Math.max(...(stationSeries || [baselineForecast.peak_predicted])),
    };
  }, [whatIfData, scenarioKey, windowIdx, station.id, baselineForecast]);

  // Metric comparisons
  const baselinePeak = Math.round(baselineForecast.peak_predicted);
  const scenPeak = scenarioForecast ? Math.round(scenarioForecast.peak) : baselinePeak;
  const deltaPeak = scenPeak - baselinePeak;

  // Interactive compass pointer handler
  const handleCompassPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    // Meteorological angle: 0deg is North (top), 90 East, 180 South, 270 West
    let angle = Math.round((Math.atan2(dx, -dy) * 180) / Math.PI);
    if (angle < 0) angle += 360;
    setCompassAngle(angle);

    // Auto-map to closest scenario for visual response
    if (angle >= 285 && angle <= 345) {
      setScenarioKey('wind_nw');
    } else if (angle >= 105 && angle <= 165) {
      setScenarioKey('wind_rev');
    } else {
      setScenarioKey('baseline');
    }
  };

  // Directions labels
  const getDirectionName = (deg: number) => {
    if (deg >= 337.5 || deg < 22.5) return 'N (Northerly)';
    if (deg >= 22.5 && deg < 67.5) return 'NE (North-Easterly)';
    if (deg >= 67.5 && deg < 112.5) return 'E (Easterly)';
    if (deg >= 112.5 && deg < 157.5) return 'SE (South-Easterly)';
    if (deg >= 157.5 && deg < 202.5) return 'S (Southerly)';
    if (deg >= 202.5 && deg < 247.5) return 'SW (South-Western)';
    if (deg >= 247.5 && deg < 292.5) return 'W (Westerly)';
    return 'NW (North-Western Stubble Corridor)';
  };

  // ECharts Comparison Graph
  const chartOption = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => `+${i + 1}h`);
    const baseData = baselineForecast.predicted_24h.map((v) => Math.round(v));
    const scenData = scenarioForecast
      ? scenarioForecast.series.map((v) => Math.round(v))
      : baseData;

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0B0E14',
        borderColor: '#232A3B',
        textStyle: { color: '#FFFDF8', fontSize: 12 },
        formatter: (params: any[]) => {
          let html = `<div class="font-bold border-b border-[#232A3B] pb-1 mb-1 text-[#FFFDF8]">${params[0]?.axisValue}</div>`;
          params.forEach((p) => {
            html += `<div class="flex items-center justify-between gap-4 py-0.5">
              <span style="color:${p.color}">${p.seriesName}</span>
              <span class="font-mono font-bold">${p.value} µg/m³</span>
            </div>`;
          });
          if (params.length > 1) {
            const diff = params[1].value - params[0].value;
            html += `<div class="mt-1 pt-1 border-t border-[#232A3B] text-[11px] font-mono ${
              diff > 0 ? 'text-[#ECC138]' : 'text-[#C89B6D]'
            }">
              Δ Impact: ${diff > 0 ? '+' : ''}${diff} µg/m³
            </div>`;
          }
          return html;
        },
      },
      legend: {
        data: ['Baseline (Observed Wind)', 'Counterfactual What-If'],
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
        axisLabel: { color: '#94A3B8', fontSize: 10, interval: 2 },
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
        {
          name: 'Baseline (Observed Wind)',
          type: 'line',
          data: baseData,
          lineStyle: { color: '#FFFDF8', width: 2.2 },
          itemStyle: { color: '#FFFDF8' },
          symbol: 'circle',
          symbolSize: 4,
          markLine: {
            silent: true,
            symbol: 'none',
            data: [
              {
                yAxis: 60,
                lineStyle: { color: '#C89B6D', type: 'dotted', width: 1.5 },
                label: { formatter: 'CPCB 24h Threshold', color: '#C89B6D', fontSize: 10 },
              },
            ],
          },
        },
        {
          name: 'Counterfactual What-If',
          type: 'line',
          data: scenData,
          lineStyle: { color: '#ECC138', width: 2.8, type: 'solid' },
          itemStyle: { color: '#ECC138' },
          symbol: 'circle',
          symbolSize: 5,
        },
      ],
    };
  }, [baselineForecast, scenarioForecast]);

  return (
    <div
      className={
        isEmbedded
          ? 'flex flex-col gap-4 p-0 bg-transparent border-0 shadow-none text-white w-full max-w-full min-w-0'
          : 'flex flex-col gap-4 p-6 rounded-2xl bg-[#121620] border border-[#232A3B] shadow-xl text-white'
      }
    >
      {/* Subheader */}
      {!isEmbedded ? (
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#232A3B]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-[#ECC138]/15 text-[#ECC138] border border-[#ECC138]/30 shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-[#FFFDF8] truncate">
                What-If Counterfactual Wind Engine
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                Simulate dynamic atmospheric ventilation & stubble inflow
              </p>
            </div>
          </div>
          <div className="px-2.5 py-0.5 rounded-lg bg-[#C89B6D] text-[#0B0E14] text-[10px] font-mono font-bold shrink-0">
            Twin Sim
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between pb-1 border-b border-[#232A3B] text-xs font-mono">
          <span className="text-[#ECC138] font-bold flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#ECC138] shrink-0" />
            <span>Counterfactual Wind Simulator</span>
          </span>
          <span className="text-slate-400">Dynamic Atmospheric Dispersion</span>
        </div>
      )}

      {/* Unified Interactive Control Deck */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-[#0B0E14] border border-[#232A3B] flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
          {/* Compass Dial Column (Left 5 cols) */}
          <div className="sm:col-span-5 flex flex-col items-center justify-center p-2 rounded-xl bg-[#121620]/60 border border-[#232A3B]">
            <div className="text-[10px] font-mono uppercase text-[#ECC138] font-bold mb-1 flex items-center gap-1">
              <Compass className="w-3 h-3" />
              <span>Wind Heading</span>
            </div>

            <div 
              className="relative w-28 h-28 flex items-center justify-center cursor-crosshair select-none touch-none group"
              onPointerDown={handleCompassPointer}
              onPointerMove={(e) => {
                if (e.buttons === 1) handleCompassPointer(e);
              }}
              title="Click or drag to rotate wind advection compass"
            >
              {/* Compass Outer Ring */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#232A3B] flex items-center justify-center">
                <span className="absolute top-0.5 text-[9px] font-mono font-bold text-[#ECC138]">N</span>
                <span className="absolute right-1 text-[9px] font-mono font-bold text-slate-400">E</span>
                <span className="absolute bottom-0.5 text-[9px] font-mono font-bold text-slate-400">S</span>
                <span className="absolute left-1 text-[9px] font-mono font-bold text-slate-400">W</span>
              </div>

              {/* Rotating Arrow Needle */}
              <div
                className="relative w-20 h-20 flex items-center justify-center transition-transform duration-200"
                style={{ transform: `rotate(${compassAngle}deg)` }}
              >
                <div className="w-1.5 h-10 bg-gradient-to-t from-transparent via-[#C89B6D] to-[#ECC138] rounded-full shadow-lg shadow-[#ECC138]/40"></div>
                <div className="absolute -top-1 w-2.5 h-2.5 bg-[#ECC138] rotate-45 transform"></div>
              </div>

              {/* Center Core */}
              <div className="absolute w-5 h-5 rounded-full bg-[#0B0E14] border-2 border-[#ECC138] flex items-center justify-center shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ECC138]"></span>
              </div>
            </div>

            <div className="mt-1 text-center">
              <span className="text-xs font-mono font-bold text-[#ECC138]">{compassAngle}°</span>
              <span className="text-slate-400 text-[10px] font-medium ml-1.5">
                {getDirectionName(compassAngle).split(' ')[0]}
              </span>
            </div>
          </div>

          {/* Velocity Slider & Delta Impact (Right 7 cols) */}
          <div className="sm:col-span-7 flex flex-col justify-between gap-2.5">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-[#ECC138]" />
                  <span>Velocity Multiplier</span>
                </span>
                <span className="font-mono text-[#ECC138] font-bold text-xs">{windSpeedMultiplier.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={windSpeedMultiplier}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setWindSpeedMultiplier(val);
                  if (val >= 1.8) setScenarioKey('wind_x2');
                  else if (scenarioKey === 'wind_x2') setScenarioKey('baseline');
                }}
                className="w-full accent-[#ECC138] h-2 bg-[#121620] rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                <span>0.2x Stagnant</span>
                <span>1.0x Normal</span>
                <span>3.0x Gale</span>
              </div>
            </div>

            {/* Impact Metric Strip */}
            <div className="p-2.5 rounded-lg bg-[#121620] border border-[#232A3B] flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 font-mono uppercase">Simulation Impact</div>
                <div
                  className={`text-xs font-mono font-bold mt-0.5 ${
                    deltaPeak < 0 ? 'text-[#C89B6D]' : deltaPeak > 0 ? 'text-[#ECC138]' : 'text-slate-300'
                  }`}
                >
                  {deltaPeak < 0 ? `${deltaPeak} µg/m³ (Ventilation)` : deltaPeak > 0 ? `+${deltaPeak} µg/m³ (Inflow Surge)` : 'Baseline Identical'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-mono uppercase">Breach Shift</div>
                <div className="text-xs font-mono font-bold text-[#FFFDF8] mt-0.5">
                  {scenarioForecast?.breachH
                    ? `Breach in +${scenarioForecast.breachH}h`
                    : 'Compliant'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preset Scenarios Selector Bar */}
        <div className="pt-2 border-t border-[#232A3B]/60 flex flex-wrap items-center gap-2">
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              onClick={() => {
                setScenarioKey('baseline');
                setWindSpeedMultiplier(1.0);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-center text-xs font-mono font-semibold transition-all border ${
                scenarioKey === 'baseline'
                  ? 'bg-[#C89B6D] border-[#C89B6D] text-[#0B0E14] font-bold shadow-sm'
                  : 'bg-[#121620] border-[#232A3B] text-slate-300 hover:border-slate-600'
              }`}
            >
              Baseline (1.0x)
            </button>

            {scenarios.map((scen) => (
              <button
                key={scen.key}
                onClick={() => {
                  setScenarioKey(scen.key);
                  if (scen.key === 'wind_x2') setWindSpeedMultiplier(2.0);
                  if (scen.key === 'wind_nw') setCompassAngle(315);
                  if (scen.key === 'wind_rev') setCompassAngle((compassAngle + 180) % 360);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-center text-xs font-mono font-semibold transition-all border ${
                  scenarioKey === scen.key
                    ? 'bg-[#C89B6D] border-[#C89B6D] text-[#0B0E14] font-bold shadow-sm'
                    : 'bg-[#121620] border-[#232A3B] text-slate-300 hover:border-slate-600'
                }`}
              >
                {scen.key === 'wind_x2' && '2x Dispersion'}
                {scen.key === 'wind_nw' && 'NW Stubble'}
                {scen.key === 'wind_rev' && '180° Reversal'}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setScenarioKey('baseline');
              setCompassAngle(315);
              setWindSpeedMultiplier(1.0);
            }}
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#121620] border border-[#232A3B] hover:border-[#C89B6D] text-slate-300 text-xs font-mono transition-colors shrink-0"
            title="Reset to default NW 315° at 1.0x"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Prominent Side-by-Side Comparison Chart */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-1 text-xs font-mono">
          <div className="text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#ECC138]" />
            <span className="font-semibold text-slate-300">Baseline vs Counterfactual PM2.5 Trajectory</span>
          </div>
          <div className="text-[#C89B6D]">
            Station #{station.id}
          </div>
        </div>
        <div className={`w-full ${isEmbedded ? 'h-[270px] sm:h-[300px]' : 'h-[280px]'}`}>
          <ReactECharts
            option={chartOption}
            style={{ width: '100%', height: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        </div>
      </div>
    </div>
  );
};
