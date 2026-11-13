import React, { useMemo, useState } from 'react';
import { StationForecast } from '../../types';
import { getAQICategory, CPCB_CATEGORIES } from '../../utils/aqi';
import { computeDailyWindowHighlights } from '../../utils/citizenZones';
import {
  Clock,
  Sun,
  Moon,
  Sunset,
  Sunrise,
  Sparkles,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Calendar,
  AlertCircle,
  Shield,
  Activity,
  ArrowRight,
} from 'lucide-react';

interface Props {
  forecast: StationForecast;
  timestamp: string;
  stationName: string;
}

export const CitizenForecast: React.FC<Props> = ({
  forecast,
  timestamp,
  stationName,
}) => {
  const [viewMode, setViewMode] = useState<'immediate' | 'all24'>('immediate');
  const [hoveredHourIdx, setHoveredHourIdx] = useState<number | null>(null);

  const baseDate = useMemo(() => new Date(timestamp.replace(' ', 'T')), [timestamp]);

  // Compute hourly forecast array (24 hours)
  const hourlyItems = useMemo(() => {
    if (!forecast || !forecast.predicted_24h || forecast.predicted_24h.length === 0) {
      return [];
    }

    return forecast.predicted_24h.map((val, i) => {
      const d = new Date(baseDate.getTime() + (i + 1) * 3600 * 1000);
      const hourNum = d.getHours();
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const displayHour = hourNum % 12 || 12;
      const hourStr = `${displayHour}:00 ${ampm}`;
      const shortHourStr = `${displayHour} ${ampm}`;
      const cat = getAQICategory(val);
      const catCfg = CPCB_CATEGORIES[cat];

      // Trend relative to previous hour
      const prevVal = i > 0 ? forecast.predicted_24h[i - 1] : forecast.current_pm25;
      const diff = Math.round(val - prevVal);

      // Icon selector based on time of day
      let timeIcon = <Sun className="w-4 h-4 text-amber-400" />;
      if (hourNum === 6) timeIcon = <Sunrise className="w-4 h-4 text-amber-300" />;
      else if (hourNum === 18) timeIcon = <Sunset className="w-4 h-4 text-orange-400" />;
      else if (hourNum < 6 || hourNum > 18)
        timeIcon = <Moon className="w-4 h-4 text-indigo-300" />;

      return {
        idx: i,
        hourStr,
        shortHourStr,
        val: Math.round(val),
        diff,
        cat,
        catCfg,
        timeIcon,
        isNight: hourNum < 6 || hourNum > 18,
      };
    });
  }, [forecast, baseDate]);

  // Immediate next 6 hours
  const immediateHours = useMemo(() => hourlyItems.slice(0, 6), [hourlyItems]);

  // Daily highlights (best window vs peak inversion)
  const highlights = useMemo(() => {
    return computeDailyWindowHighlights(forecast.predicted_24h, timestamp);
  }, [forecast, timestamp]);

  // Determine overall expected direction (improving vs worsening)
  const overallTrend = useMemo(() => {
    if (!hourlyItems || hourlyItems.length === 0) {
      return {
        status: 'steady' as const,
        title: 'Projected Steady Conditions',
        text: 'Particulate levels are expected to remain consistent over the next 12 hours.',
        icon: '↔️',
        badgeBg: 'bg-slate-800 text-slate-300',
      };
    }

    const current = forecast.current_pm25;
    const next6Avg = hourlyItems.slice(0, 6).reduce((acc, h) => acc + h.val, 0) / 6;
    const peak24 = Math.max(...hourlyItems.map((h) => h.val));
    const diffToPeak = Math.round(peak24 - current);

    if (diffToPeak >= 25) {
      return {
        status: 'worsening' as const,
        title: 'Air Quality Expected to Worsen Tonight',
        text: `Particulate levels are projected to rise +${diffToPeak} µg/m³ higher, peaking at ~${Math.round(peak24)} µg/m³ around ${highlights.peakWarning.startHour} due to nighttime ground cooling trapping smoke.`,
        icon: '⚠️',
        badgeBg: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
      };
    } else if (current - next6Avg >= 15) {
      const drop = Math.round(current - next6Avg);
      return {
        status: 'improving' as const,
        title: 'Air Quality Expected to Improve Today',
        text: `Particulate concentrations are projected to decrease by ~${drop} µg/m³ this afternoon as solar warming expands the atmospheric mixing layer.`,
        icon: '🌤️',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
      };
    }

    return {
      status: 'steady' as const,
      title: 'Stable Air Quality Trajectory',
      text: `Particulate levels will remain relatively stable within the ${forecast.current_aqi} range over the coming hours.`,
      icon: '🍃',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
    };
  }, [hourlyItems, forecast, highlights]);

  // SVG Area / Line Chart geometry calculations
  const chartConfig = useMemo(() => {
    if (!hourlyItems || hourlyItems.length === 0) return null;

    const values = hourlyItems.map((h) => h.val);
    const maxVal = Math.max(...values, 280);
    const yMax = Math.ceil(maxVal / 50) * 50; // round to nearest 50

    const svgWidth = 760;
    const svgHeight = 220;
    const padLeft = 50;
    const padRight = 30;
    const padTop = 25;
    const padBottom = 40;

    const plotW = svgWidth - padLeft - padRight;
    const plotH = svgHeight - padTop - padBottom;

    const getX = (index: number) => padLeft + (index / (values.length - 1)) * plotW;
    const getY = (val: number) => padTop + plotH * (1 - Math.min(val, yMax) / yMax);

    // Compute coordinate points
    const points = hourlyItems.map((item, idx) => ({
      x: getX(idx),
      y: getY(item.val),
      item,
    }));

    // Build smooth cubic Bezier curve path
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) * 0.45;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) * 0.55;
      const cpY2 = p1.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }

    // Closed area path for gradient
    const lastX = points[points.length - 1].x;
    const baselineY = padTop + plotH;
    const areaD = `${pathD} L ${lastX} ${baselineY} L ${padLeft} ${baselineY} Z`;

    const safeY = getY(60); // CPCB safe limit line (60 µg/m³)
    const severeY = getY(250); // Severe limit line (250 µg/m³)

    return {
      svgWidth,
      svgHeight,
      padLeft,
      padRight,
      padTop,
      padBottom,
      plotW,
      plotH,
      yMax,
      points,
      pathD,
      areaD,
      safeY,
      severeY,
      baselineY,
    };
  }, [hourlyItems]);

  const activePoint = hoveredHourIdx !== null && chartConfig
    ? chartConfig.points[hoveredHourIdx]
    : null;

  return (
    <div className="bg-[#121620] border-2 border-[#232A3B] rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
      {/* 1. Header with Title & Next 6 Hours / All 24 Hours Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              24-Hour Air Quality Forecast & Timeline
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Hourly predicted particulate trend for {stationName} (1 to 24 hours ahead)
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-[#181E2B] p-1.5 rounded-2xl border border-[#232A3B] self-start sm:self-center">
          <button
            onClick={() => setViewMode('immediate')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'immediate'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Next 6 Hours
          </button>
          <button
            onClick={() => setViewMode('all24')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'all24'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            All 24 Hours
          </button>
        </div>
      </div>

      {/* 2. Overall Trajectory Highlight Banner (Expected to Improve or Worsen) */}
      <div className={`p-4 rounded-2xl flex items-start gap-3.5 ${
        overallTrend.status === 'worsening'
          ? 'bg-rose-950/30 border border-rose-500/40'
          : overallTrend.status === 'improving'
          ? 'bg-emerald-950/30 border border-emerald-500/40'
          : 'bg-[#181E2B] border border-[#232A3B]'
      }`}>
        <span className="text-2xl shrink-0 mt-0.5">{overallTrend.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">
              {overallTrend.title}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${overallTrend.badgeBg}`}>
              {overallTrend.status.toUpperCase()}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
            {overallTrend.text}
          </p>
        </div>
      </div>

      {/* 3. CLEAN HOURLY TIMELINE / LINE & AREA CHART */}
      <div className="bg-[#0D111A] p-4 sm:p-5 rounded-2xl border border-[#232A3B] relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              Predicted PM2.5 Trajectory (µg/m³)
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Hover hours to inspect
            </span>
          </div>

          {/* Active Hover Point Tooltip Badge */}
          {activePoint && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#181E2B] border border-[#232A3B] text-xs font-mono animate-in fade-in">
              <span className="text-slate-300">{activePoint.item.hourStr}:</span>
              <span className="font-bold text-white">{activePoint.item.val} µg/m³</span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: activePoint.item.catCfg.bgHex,
                  color: activePoint.item.catCfg.textHex,
                }}
              >
                {activePoint.item.cat}
              </span>
            </div>
          )}
        </div>

        {/* Responsive SVG Chart */}
        {chartConfig && (
          <div className="w-full overflow-x-auto scrollbar-none">
            <svg
              viewBox={`0 0 ${chartConfig.svgWidth} ${chartConfig.svgHeight}`}
              className="w-full h-48 sm:h-56 select-none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="forecastAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35" />
                  <stop offset="60%" stopColor="#ECC138" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#ECC138" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Background Grid Lines & Y-axis labels */}
              {[0, 60, 120, 200, 250].map((gridVal) => {
                if (gridVal > chartConfig.yMax) return null;
                const yPos = chartConfig.padTop + chartConfig.plotH * (1 - gridVal / chartConfig.yMax);
                return (
                  <g key={gridVal}>
                    <line
                      x1={chartConfig.padLeft}
                      y1={yPos}
                      x2={chartConfig.padLeft + chartConfig.plotW}
                      y2={yPos}
                      stroke="#232A3B"
                      strokeWidth="1"
                      strokeDasharray={gridVal === 0 ? 'none' : '2 3'}
                    />
                    <text
                      x={chartConfig.padLeft - 8}
                      y={yPos + 4}
                      fill="#64748B"
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {gridVal}
                    </text>
                  </g>
                );
              })}

              {/* Safe Limit Reference Line (60 µg/m³) - Clearly Labeled */}
              <g>
                <line
                  x1={chartConfig.padLeft}
                  y1={chartConfig.safeY}
                  x2={chartConfig.padLeft + chartConfig.plotW}
                  y2={chartConfig.safeY}
                  stroke="#10B981"
                  strokeWidth="1.8"
                  strokeDasharray="4 3"
                />
                <rect
                  x={chartConfig.padLeft + chartConfig.plotW - 130}
                  y={chartConfig.safeY - 18}
                  width="130"
                  height="16"
                  rx="4"
                  fill="#064E3B"
                  opacity="0.9"
                />
                <text
                  x={chartConfig.padLeft + chartConfig.plotW - 65}
                  y={chartConfig.safeY - 6}
                  fill="#34D399"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  Safe Limit (60 µg/m³)
                </text>
              </g>

              {/* Severe Threshold Line (250 µg/m³) */}
              {chartConfig.severeY >= chartConfig.padTop && (
                <g>
                  <line
                    x1={chartConfig.padLeft}
                    y1={chartConfig.severeY}
                    x2={chartConfig.padLeft + chartConfig.plotW}
                    y2={chartConfig.severeY}
                    stroke="#EF4444"
                    strokeWidth="1.6"
                    strokeDasharray="3 3"
                  />
                  <rect
                    x={chartConfig.padLeft + chartConfig.plotW - 135}
                    y={chartConfig.severeY - 18}
                    width="135"
                    height="16"
                    rx="4"
                    fill="#450A0A"
                    opacity="0.9"
                  />
                  <text
                    x={chartConfig.padLeft + chartConfig.plotW - 68}
                    y={chartConfig.severeY - 6}
                    fill="#FCA5A5"
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    Severe Alert (250 µg/m³)
                  </text>
                </g>
              )}

              {/* Area Gradient Fill */}
              <path d={chartConfig.areaD} fill="url(#forecastAreaGrad)" />

              {/* Main Line Trajectory */}
              <path
                d={chartConfig.pathD}
                stroke="#38BDF8"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* X-axis Time Labels (Never Clipped) */}
              {chartConfig.points.map((pt, idx) => {
                if (idx % 3 !== 0 && idx !== chartConfig.points.length - 1) return null;
                return (
                  <text
                    key={idx}
                    x={pt.x}
                    y={chartConfig.padTop + chartConfig.plotH + 20}
                    fill="#94A3B8"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {pt.item.shortHourStr}
                  </text>
                );
              })}

              {/* Data Point Circles on Curve */}
              {chartConfig.points.map((pt, idx) => {
                const isHovered = hoveredHourIdx === idx;
                return (
                  <g
                    key={idx}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredHourIdx(idx)}
                    onMouseLeave={() => setHoveredHourIdx(null)}
                  >
                    {/* Hover vertical guideline */}
                    {isHovered && (
                      <line
                        x1={pt.x}
                        y1={chartConfig.padTop}
                        x2={pt.x}
                        y2={chartConfig.baselineY}
                        stroke="#ECC138"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                    )}

                    {/* Outer halo on hover */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 8 : 4.5}
                      fill={pt.item.catCfg.color}
                      className="transition-all"
                      opacity={isHovered ? 0.4 : 0.2}
                    />

                    {/* Inner solid dot */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 5 : 3.5}
                      fill={pt.item.catCfg.color}
                      stroke="#FFFFFF"
                      strokeWidth={isHovered ? 2 : 1.5}
                      className="transition-all"
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* Visible CPCB Category Colors Legend */}
        <div className="mt-3 pt-3 border-t border-[#232A3B] flex flex-wrap items-center justify-between gap-2 text-[10.5px]">
          <span className="font-mono text-slate-400 font-bold uppercase">
            Color Legend:
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {Object.entries(CPCB_CATEGORIES).map(([catName, cfg]) => (
              <div key={catName} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: cfg.color }}
                />
                <span className="text-slate-300 font-medium">{catName}</span>
                <span className="font-mono text-slate-400 text-[9.5px]">
                  ({cfg.min}–{cfg.max === 999 ? '500+' : cfg.max})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. HOURLY CARDS (Next 6 Hours vs All 24 Hours) */}
      {viewMode === 'immediate' ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase">
              Immediate Outlook: Next 6 Hours
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Next 1 to 6 hours ahead
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {immediateHours.map((item) => (
              <div
                key={item.idx}
                className="p-3.5 rounded-2xl bg-[#0D111A] border border-[#232A3B] hover:border-slate-600 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {item.shortHourStr}
                  </span>
                  <div>{item.timeIcon}</div>
                </div>

                <div className="my-2.5">
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-2xl font-black font-mono tracking-tight"
                      style={{ color: item.catCfg.textHex }}
                    >
                      {item.val}
                    </span>
                    <span className="text-[10px] text-slate-400">µg/m³</span>
                  </div>

                  <span
                    className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-1"
                    style={{ backgroundColor: item.catCfg.bgHex, color: item.catCfg.textHex }}
                  >
                    {item.cat}
                  </span>

                  {/* Contextual everyday activity recommendation icon */}
                  <div className="flex items-center gap-1.5 mt-2 text-[10.5px] text-slate-300 font-medium">
                    <span>
                      {item.val <= 60 ? '🏃' : item.val <= 120 ? '🚶' : '🏡'}
                    </span>
                    <span className="truncate">
                      {item.val <= 60
                        ? 'Great for Jogging'
                        : item.val <= 120
                        ? 'Light Outdoor Walk'
                        : 'Indoors Preferred'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#232A3B] flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Trend:</span>
                  {item.diff === 0 ? (
                    <span className="text-slate-400 font-mono">Stable</span>
                  ) : item.diff > 0 ? (
                    <span className="text-amber-400 font-mono flex items-center">
                      <TrendingUp className="w-3 h-3 mr-0.5" /> +{item.diff}
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-mono flex items-center">
                      <TrendingDown className="w-3 h-3 mr-0.5" /> {item.diff}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ALL 24 HOURS TIMELINE STRIP */
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase">
              Full 24-Hour Hourly Progression
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Scroll horizontally to view all horizons
            </span>
          </div>

          <div className="overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-slate-700">
            <div className="flex items-stretch gap-2.5 min-w-max">
              {hourlyItems.map((item) => (
                <div
                  key={item.idx}
                  className="flex flex-col items-center justify-between p-3 rounded-2xl bg-[#0D111A] border border-[#232A3B] w-[96px] sm:w-[104px] hover:border-slate-600 transition-all text-center"
                >
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {item.shortHourStr}
                  </span>
                  <div className="my-1.5">{item.timeIcon}</div>

                  <span
                    className="text-base sm:text-lg font-black font-mono tracking-tight"
                    style={{ color: item.catCfg.textHex }}
                  >
                    {item.val}
                  </span>

                  <div
                    className="w-full h-1.5 rounded-full my-2"
                    style={{ backgroundColor: item.catCfg.color }}
                  />

                  <span
                    className="text-[10px] font-semibold truncate w-full px-1"
                    style={{ color: item.catCfg.textHex }}
                    title={item.cat}
                  >
                    {item.cat}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Clean Transparency Footer */}
      <div className="pt-3 border-t border-[#232A3B]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-400">
        <span>Projected hourly trajectory from WA-TGCN spatio-temporal AI model</span>
        <span className="font-mono text-slate-400">Horizons 1 to 24 Hours Ahead</span>
      </div>
    </div>
  );
};
