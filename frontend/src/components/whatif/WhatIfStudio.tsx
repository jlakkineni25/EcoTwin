import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTwinStore } from '../../store/useTwinStore';
import { Station, StationForecast } from '../../types';
import { useWhatIfIndex, useWhatIfWindow, useLiveMeta, useLiveWhatIf } from '../../hooks/useTwinData';
import { WIND_SPEED_LEVELS, GROUP_TITLES, SCENARIO_LABELS, SCENARIO_NOTES } from '../../utils/scenarios';
import { Compass, Wind, Sparkles, RefreshCw, Info } from 'lucide-react';

interface Props {
  station: Station;
  baselineForecast: StationForecast;
  windowIdx: number;
  isEmbedded?: boolean;
}

export const WhatIfStudio: React.FC<Props> = ({
  station,
  baselineForecast,
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
    realWind,
    dataMode,
  } = useTwinStore();

  const { data: whatIfIndex } = useWhatIfIndex();
  const isLive = dataMode === 'live';
  const { data: liveMeta } = useLiveMeta();
  const { data: replayWin } = useWhatIfWindow(isLive ? undefined : windowIdx); // one small file for this window
  const { data: liveWhatIf } = useLiveWhatIf(isLive, liveMeta?.generated_at);
  const whatIfWin = isLive ? liveWhatIf?.windows['0'] : replayWin;
  const scenarios = whatIfIndex?.scenarios || [];
  const activeMeta = scenarios.find((s) => s.key === scenarioKey);

  // Precomputed scenario forecast for this station & window
  const scenarioForecast = useMemo(() => {
    if (!whatIfWin || scenarioKey === 'baseline') return null;
    const scen = whatIfWin[scenarioKey];
    if (!scen) return null;

    const stationSeries = scen.predicted_24h[station.id];
    const breachH = scen.breach_h[station.id];
    return {
      series: stationSeries || baselineForecast.predicted_24h,
      breachH,
      peak: Math.max(...(stationSeries || [baselineForecast.peak_predicted])),
    };
  }, [whatIfWin, scenarioKey, station.id, baselineForecast]);

  // Metric comparisons
  const baselinePeak = Math.round(baselineForecast.peak_predicted);
  const scenPeak = scenarioForecast ? Math.round(scenarioForecast.peak) : baselinePeak;
  const deltaPeak = scenPeak - baselinePeak;
  // first hour above 60 ug/m3 (0 / null = never): scenario if one is active, otherwise the baseline forecast
  const breachHour = scenarioForecast ? scenarioForecast.breachH : baselineForecast.hours_to_breach_cpcb;

  // Speed slider: five steps that map to the computed wind-speed scenarios
  const levelIdx = (() => {
    const i = WIND_SPEED_LEVELS.findIndex((l) => l.key === scenarioKey);
    return i >= 0 ? i : WIND_SPEED_LEVELS.findIndex((l) => l.key === 'baseline');
  })();

  const observedDeg = realWind ? realWind.fromDeg : compassAngle;
  const resetToObserved = () => {
    setScenarioKey('baseline');
    setWindSpeedMultiplier(1.0);
    if (realWind) setCompassAngle(realWind.fromDeg);
  };
  const pickScenario = (key: string) => {
    setScenarioKey(key);
    setWindSpeedMultiplier(1.0);
    if (key === 'wind_nw') setCompassAngle(315);
    else if (realWind) setCompassAngle(realWind.fromDeg);
  };

  // Direction labels (where the wind blows FROM)
  const getDirectionName = (deg: number) => {
    if (deg >= 337.5 || deg < 22.5) return 'N (Northerly)';
    if (deg >= 22.5 && deg < 67.5) return 'NE (North-Easterly)';
    if (deg >= 67.5 && deg < 112.5) return 'E (Easterly)';
    if (deg >= 112.5 && deg < 157.5) return 'SE (South-Easterly)';
    if (deg >= 157.5 && deg < 202.5) return 'S (Southerly)';
    if (deg >= 202.5 && deg < 247.5) return 'SW (South-Western)';
    if (deg >= 247.5 && deg < 292.5) return 'W (Westerly)';
    return 'NW (North-Western)';
  };

  // Scenario buttons that are not on the speed slider, grouped
  const groupedButtons = (['wind', 'graph', 'emission', 'outage'] as const)
    .map((g) => ({
      group: g,
      items: scenarios.filter((s) => s.group === g && !WIND_SPEED_LEVELS.some((l) => l.key === s.key)),
    }))
    .filter((g) => g.items.length > 0);

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
        data: ['Baseline (forecast)', 'What-If scenario'],
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
          name: 'Baseline (forecast)',
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
          name: 'What-If scenario',
          type: 'line',
          data: scenData,
          lineStyle: { color: '#ECC138', width: 2.8, type: 'solid' },
          itemStyle: { color: '#ECC138' },
          symbol: 'circle',
          symbolSize: 5,
        },
      ],
    };
  }, [baselineForecast, scenarioForecast, isEmbedded]);

  const btnClass = (active: boolean) =>
    `px-2.5 py-1.5 rounded-lg text-center text-xs font-mono font-semibold transition-all border ${
      active
        ? 'bg-[#C89B6D] border-[#C89B6D] text-[#0B0E14] font-bold shadow-sm'
        : 'bg-[#121620] border-[#232A3B] text-slate-300 hover:border-slate-600'
    }`;

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
              <h3 className="text-base font-bold text-[#FFFDF8] truncate">What-If Scenario Lab</h3>
              <p className="text-[11px] text-slate-400 truncate">
                Re-run the final model with changed wind, emissions or sensors
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
            <span>What-If Scenario Lab</span>
          </span>
          <span className="text-slate-400">Model sensitivity</span>
        </div>
      )}

      {/* Control deck */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-[#0B0E14] border border-[#232A3B] flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
          {/* Observed wind direction (display only) */}
          <div className="sm:col-span-5 flex flex-col items-center justify-center p-2 rounded-xl bg-[#121620]/60 border border-[#232A3B]">
            <div className="text-[10px] font-mono uppercase text-[#ECC138] font-bold mb-1 flex items-center gap-1">
              <Compass className="w-3 h-3" />
              <span>Observed wind</span>
            </div>

            <div className="relative w-28 h-28 flex items-center justify-center select-none" title="Direction the wind is blowing toward, from the wind data of this window">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#232A3B] flex items-center justify-center">
                <span className="absolute top-0.5 text-[9px] font-mono font-bold text-[#ECC138]">N</span>
                <span className="absolute right-1 text-[9px] font-mono font-bold text-slate-400">E</span>
                <span className="absolute bottom-0.5 text-[9px] font-mono font-bold text-slate-400">S</span>
                <span className="absolute left-1 text-[9px] font-mono font-bold text-slate-400">W</span>
              </div>

              {/* Needle points the way the air moves (from + 180) */}
              <div
                className="relative w-20 h-20 flex items-center justify-center transition-transform duration-200"
                style={{ transform: `rotate(${(observedDeg + 180) % 360}deg)` }}
              >
                <div className="w-1.5 h-10 bg-gradient-to-t from-transparent via-[#C89B6D] to-[#ECC138] rounded-full shadow-lg shadow-[#ECC138]/40"></div>
                <div className="absolute -top-1 w-2.5 h-2.5 bg-[#ECC138] rotate-45 transform"></div>
              </div>

              <div className="absolute w-5 h-5 rounded-full bg-[#0B0E14] border-2 border-[#ECC138] flex items-center justify-center shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ECC138]"></span>
              </div>
            </div>

            <div className="mt-1 text-center">
              <span className="text-xs font-mono font-bold text-[#ECC138]">from {observedDeg}°</span>
              <span className="text-slate-400 text-[10px] font-medium ml-1.5">
                {getDirectionName(observedDeg).split(' ')[0]}
                {realWind ? ` · ${realWind.speedMs.toFixed(1)} m/s` : ''}
              </span>
            </div>
          </div>

          {/* Forecast wind speed slider and impact */}
          <div className="sm:col-span-7 flex flex-col justify-between gap-2.5">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-[#ECC138]" />
                  <span>Forecast wind speed</span>
                </span>
                <span className="font-mono text-[#ECC138] font-bold text-xs">{WIND_SPEED_LEVELS[levelIdx].mult}x</span>
              </div>
              <input
                type="range"
                min={0}
                max={WIND_SPEED_LEVELS.length - 1}
                step={1}
                value={levelIdx}
                onChange={(e) => {
                  const lvl = WIND_SPEED_LEVELS[parseInt(e.target.value, 10)];
                  setScenarioKey(lvl.key);
                  setWindSpeedMultiplier(lvl.mult);
                  if (realWind) setCompassAngle(realWind.fromDeg);
                }}
                className="w-full accent-[#ECC138] h-2 bg-[#121620] rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                {WIND_SPEED_LEVELS.map((l) => (
                  <span key={l.key}>{l.mult === 1 ? '1x (forecast)' : `${l.mult}x`}</span>
                ))}
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
                  {deltaPeak < 0
                    ? `${deltaPeak} µg/m³ on the 24h peak`
                    : deltaPeak > 0
                    ? `+${deltaPeak} µg/m³ on the 24h peak`
                    : 'Same as the baseline'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-mono uppercase">First hour above 60</div>
                <div className="text-xs font-mono font-bold text-[#FFFDF8] mt-0.5">
                  {breachHour ? `+${breachHour}h` : 'No breach'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Other scenarios, grouped */}
        <div className="pt-2 border-t border-[#232A3B]/60 flex flex-col gap-2">
          {groupedButtons.map(({ group, items }) => (
            <div key={group} className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase text-slate-500 w-full sm:w-28 shrink-0">{GROUP_TITLES[group]}</span>
              {items.map((scen) => (
                <button key={scen.key} onClick={() => pickScenario(scen.key)} className={btnClass(scenarioKey === scen.key)}>
                  {SCENARIO_LABELS[scen.key] ?? scen.label}
                </button>
              ))}
            </div>
          ))}
          <div className="flex justify-end">
            <button
              onClick={resetToObserved}
              className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#121620] border border-[#232A3B] hover:border-[#C89B6D] text-slate-300 text-xs font-mono transition-colors shrink-0"
              title="Back to the unchanged forecast"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset to baseline</span>
            </button>
          </div>
        </div>

        {/* What the active scenario does, and how it was validated */}
        <div className="p-2.5 rounded-lg bg-[#121620] border border-[#232A3B] text-[11px] text-slate-300 leading-relaxed flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-[#ECC138] shrink-0 mt-0.5" />
          <div>
            {scenarioKey === 'baseline' ? (
              <span>
                Baseline: the unchanged forecast of the final model. Move the speed slider or pick a scenario to re-run it. Each scenario is a model-sensitivity test, not a causal prediction.
              </span>
            ) : (
              <>
                <span>{SCENARIO_NOTES[scenarioKey] ?? activeMeta?.label ?? ''}</span>
                {activeMeta && (
                  <span className="text-slate-400">
                    {' '}
                    Average effect over {whatIfIndex ? whatIfIndex.windows.length : 970} test windows: {activeMeta.mean_change >= 0 ? '+' : ''}
                    {activeMeta.mean_change} µg/m³ on the mean forecast
                    {activeMeta.share_windows_as_expected !== null && activeMeta.share_windows_as_expected !== undefined
                      ? `; it moves the expected way in ${Math.round(activeMeta.share_windows_as_expected * 100)}% of them`
                      : ''}
                    . Model-sensitivity test, not a causal prediction.
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Side-by-side comparison chart */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-1 text-xs font-mono">
          <div className="text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#ECC138]" />
            <span className="font-semibold text-slate-300">Baseline vs What-If PM2.5 Trajectory</span>
          </div>
          <div className="text-[#C89B6D]">Station #{station.id}</div>
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
