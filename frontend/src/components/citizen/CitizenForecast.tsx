import React, { useMemo, useState, useRef, useCallback } from 'react';
import { StationForecast } from '../../types';
import { getAQICategory, CPCB_CATEGORIES } from '../../utils/aqi';
import {
  Clock,
  Sun,
  Moon,
  Sunset,
  Sunrise,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  Shield,
  Activity,
  ArrowRight,
  Info,
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
  const [selectedHourIdx, setSelectedHourIdx] = useState<number>(0);
  const [hoveredHourIdx, setHoveredHourIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

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
        isMidnight: hourNum === 0,
      };
    });
  }, [forecast, baseDate]);

  // Immediate next 6 hours
  const immediateHours = useMemo(() => hourlyItems.slice(0, 6), [hourlyItems]);

  // Active point: hovered takes priority, falls back to selected hour
  const activeIdx = hoveredHourIdx !== null ? hoveredHourIdx : selectedHourIdx;

  // Determine if this is a synthetic flat fallback for non-Delhi regional monitors
  const isFallbackFlat = useMemo(() => {
    const p = forecast.predicted_24h;
    return p && p.length > 1 && p.every((v) => Math.abs(v - p[0]) < 0.01);
  }, [forecast.predicted_24h]);

  // Determine overall expected direction (improving vs worsening)
  const overallTrend = useMemo(() => {
    if (!hourlyItems || hourlyItems.length === 0) {
      return {
        status: 'steady' as const,
        title: 'Projected Steady Conditions',
        text: 'No forecast is available for this window.',
        icon: '↔️',
        badgeBg: 'bg-slate-800 text-slate-300',
      };
    }

    if (isFallbackFlat) {
      return {
        status: 'steady' as const,
        title: 'Historical Station Median Baseline',
        text: 'This station displays verified continuous CAAQMS observations. Dynamic 24-hour neural advection forecasts are actively computed for the primary Delhi NCR twin.',
        icon: '📊',
        badgeBg: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
      };
    }

    const current = forecast.current_pm25;
    const next6Avg = hourlyItems.slice(0, 6).reduce((acc, h) => acc + h.val, 0) / 6;
    const peak24 = Math.max(...hourlyItems.map((h) => h.val));
    const diffToPeak = Math.round(peak24 - current);
    const peakHour = hourlyItems.reduce((m, h) => (h.val > m.val ? h : m), hourlyItems[0]).hourStr;

    if (diffToPeak >= 25) {
      return {
        status: 'worsening' as const,
        title: 'Air Quality Expected to Worsen',
        text: `The air is expected to get worse: from about ${Math.round(current)} µg/m³ now to about ${Math.round(peak24)} µg/m³ (${getAQICategory(peak24)}) around ${peakHour}.`,
        icon: '⚠️',
        badgeBg: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
      };
    } else if (current - next6Avg >= 15) {
      const drop = Math.round(current - next6Avg);
      return {
        status: 'improving' as const,
        title: 'Air Quality Expected to Improve',
        text: `The air is expected to get better: over the next 6 hours it averages about ${drop} µg/m³ lower than now.`,
        icon: '🌤️',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
      };
    }

    return {
      status: 'steady' as const,
      title: 'Stable Air Quality Trajectory',
      text: `The air is expected to stay about the same (${forecast.current_aqi}) over the coming hours.`,
      icon: '🍃',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
    };
  }, [hourlyItems, forecast, isFallbackFlat]);

  // SVG Area / Line Chart geometry calculations
  const chartConfig = useMemo(() => {
    if (!hourlyItems || hourlyItems.length === 0) return null;

    const values = hourlyItems.map((h) => h.val);
    const maxVal = Math.max(...values, 280);
    // Rounded Y-axis maximum for ample vertical breathing room
    const yMax = Math.max(Math.ceil((maxVal + 30) / 50) * 50, 150);

    const svgWidth = 960;
    const svgHeight = 320;
    const padLeft = 56;
    const padRight = 36;
    const padTop = 38;
    const padBottom = 48;

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

    // Dynamic clean Y-axis ticks
    const yTicks = [0, 60];
    if (yMax >= 120) yTicks.push(120);
    if (yMax >= 180) yTicks.push(180);
    if (yMax >= 250) yTicks.push(250);
    if (yMax >= 320) yTicks.push(300);
    if (yMax >= 420) yTicks.push(400);
    if (!yTicks.includes(yMax)) yTicks.push(yMax);
    const sortedYTicks = Array.from(new Set(yTicks)).sort((a, b) => a - b);

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
      sortedYTicks,
    };
  }, [hourlyItems]);

  // Active point for tooltip and header inspection
  const activePoint = chartConfig && chartConfig.points[activeIdx]
    ? chartConfig.points[activeIdx]
    : null;

  // Pointer position calculator for continuous, jitter-free touch/mouse exploration
  const getIndexFromPointer = useCallback((clientX: number) => {
    if (!svgRef.current || !chartConfig || hourlyItems.length === 0) return null;
    const rect = svgRef.current.getBoundingClientRect();
    if (rect.width <= 0) return null;
    const relX = clientX - rect.left;
    const svgX = (relX / rect.width) * chartConfig.svgWidth;
    const clampedX = Math.max(chartConfig.padLeft, Math.min(chartConfig.padLeft + chartConfig.plotW, svgX));
    const ratio = (clampedX - chartConfig.padLeft) / chartConfig.plotW;
    const idx = Math.round(ratio * (hourlyItems.length - 1));
    return Math.max(0, Math.min(hourlyItems.length - 1, idx));
  }, [chartConfig, hourlyItems.length]);

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
            {isFallbackFlat
              ? `Historical station baseline for ${stationName} (Delhi is the primary 24h neural twin)`
              : `Hourly predicted particulate trend for ${stationName} (1 to 24 hours ahead)`}
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-[#181E2B] p-1.5 rounded-2xl border border-[#232A3B] self-start sm:self-center shrink-0">
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

      {/* 3. PROMINENT, STATIONARY HOURLY FORECAST GRAPH */}
      <div className="bg-[#0D111A] p-4 sm:p-6 rounded-2xl border border-[#232A3B] relative overflow-hidden">
        
        {/* Dedicated, Invariant Header Bar (Permanently rendered with fixed height: Zero layout shifts on hover) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-h-[44px] pb-3 mb-2 border-b border-[#232A3B]/70">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Predicted PM2.5 Trajectory</span>
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            {activePoint ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono">
                <span className="text-slate-400">
                  {hoveredHourIdx !== null ? 'Inspecting:' : 'Selected:'}
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-[#ECC138]/15 text-[#ECC138] border border-[#ECC138]/30 font-bold">
                  +{activePoint.item.idx + 1}h ({activePoint.item.hourStr})
                </span>
              </span>
            ) : (
              <span className="text-[11px] font-mono text-slate-400">
                Tap or hover curve to inspect
              </span>
            )}
          </div>

          {/* Active Hour Information Pill (Always present to prevent height fluctuation) */}
          {activePoint && (
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#141A26] border border-[#232A3B] text-xs font-mono shrink-0 shadow-sm self-start sm:self-auto">
              <span className="text-slate-400">Concentration:</span>
              <span className="font-extrabold text-sm sm:text-base text-white font-mono">
                {activePoint.item.val} <span className="text-[10px] font-normal text-slate-400">µg/m³</span>
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
                style={{
                  backgroundColor: activePoint.item.catCfg.bgHex,
                  color: activePoint.item.catCfg.textHex,
                  borderColor: activePoint.item.catCfg.borderHex,
                }}
              >
                {activePoint.item.cat}
              </span>
              {activePoint.item.diff !== 0 && (
                <span className={`text-[10px] font-mono hidden md:inline-flex items-center gap-0.5 ${activePoint.item.diff > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {activePoint.item.diff > 0 ? `+${activePoint.item.diff}` : activePoint.item.diff}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Enlarged, Stationary Interactive SVG Chart Container */}
        {chartConfig && (
          <div className="w-full relative select-none">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${chartConfig.svgWidth} ${chartConfig.svgHeight}`}
              className="w-full h-72 sm:h-80 md:h-[350px] lg:h-[380px] select-none block"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              onPointerLeave={() => setHoveredHourIdx(null)}
              onTouchMove={(e) => {
                const touch = e.touches[0];
                const idx = getIndexFromPointer(touch.clientX);
                if (idx !== null) {
                  setSelectedHourIdx(idx);
                  setHoveredHourIdx(idx);
                }
              }}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                const idx = getIndexFromPointer(touch.clientX);
                if (idx !== null) {
                  setSelectedHourIdx(idx);
                  setHoveredHourIdx(idx);
                }
              }}
              onTouchEnd={() => setHoveredHourIdx(null)}
            >
              <defs>
                <linearGradient id="citizenForecastAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#ECC138" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#ECC138" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Background Grid Lines & Y-axis numerical labels */}
              {chartConfig.sortedYTicks.map((gridVal) => {
                const yPos = chartConfig.padTop + chartConfig.plotH * (1 - gridVal / chartConfig.yMax);
                return (
                  <g key={gridVal} pointerEvents="none">
                    <line
                      x1={chartConfig.padLeft}
                      y1={yPos}
                      x2={chartConfig.padLeft + chartConfig.plotW}
                      y2={yPos}
                      stroke="#1E2638"
                      strokeWidth="1"
                      strokeDasharray={gridVal === 0 ? 'none' : '3 3'}
                    />
                    <text
                      x={chartConfig.padLeft - 10}
                      y={yPos + 3.5}
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

              {/* Immediate 6-Hour Outlook Shading Band (When in immediate view mode) */}
              {viewMode === 'immediate' && chartConfig.points.length >= 6 && (
                <g pointerEvents="none">
                  <rect
                    x={chartConfig.padLeft}
                    y={chartConfig.padTop}
                    width={chartConfig.points[5].x - chartConfig.padLeft}
                    height={chartConfig.plotH}
                    fill="rgba(16, 185, 129, 0.04)"
                    stroke="rgba(16, 185, 129, 0.25)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    rx={4}
                  />
                  <text
                    x={chartConfig.padLeft + 10}
                    y={chartConfig.padTop + 16}
                    fill="#34D399"
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    Immediate Outlook Focus Window (+1h to +6h)
                  </text>
                </g>
              )}

              {/* Midnight / Next Day Vertical Divider Line */}
              {chartConfig.points.map((pt, idx) => {
                if (!pt.item.isMidnight) return null;
                return (
                  <g key={`midnight-${idx}`} pointerEvents="none">
                    <line
                      x1={pt.x}
                      y1={chartConfig.padTop}
                      x2={pt.x}
                      y2={chartConfig.baselineY}
                      stroke="#334155"
                      strokeWidth="1.2"
                      strokeDasharray="4 4"
                    />
                    <rect
                      x={pt.x - 38}
                      y={chartConfig.padTop - 22}
                      width="76"
                      height="16"
                      rx="4"
                      fill="#1E293B"
                      stroke="#334155"
                      strokeWidth="0.8"
                    />
                    <text
                      x={pt.x}
                      y={chartConfig.padTop - 11}
                      fill="#94A3B8"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      Next Day
                    </text>
                  </g>
                );
              })}

              {/* Safe Limit Reference Line (CPCB 24-hr Standard: 60 µg/m³) */}
              <g pointerEvents="none">
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
                  x={chartConfig.padLeft + chartConfig.plotW - 142}
                  y={chartConfig.safeY - 18}
                  width="142"
                  height="17"
                  rx="4"
                  fill="#064E3B"
                  stroke="#10B981"
                  strokeWidth="0.8"
                  opacity="0.95"
                />
                <text
                  x={chartConfig.padLeft + chartConfig.plotW - 71}
                  y={chartConfig.safeY - 6}
                  fill="#34D399"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  Safe Standard: 60 µg/m³
                </text>
              </g>

              {/* Severe Threshold Line (CPCB Severe Emergency: 250 µg/m³) */}
              {chartConfig.severeY >= chartConfig.padTop && (
                <g pointerEvents="none">
                  <line
                    x1={chartConfig.padLeft}
                    y1={chartConfig.severeY}
                    x2={chartConfig.padLeft + chartConfig.plotW}
                    y2={chartConfig.severeY}
                    stroke="#EF4444"
                    strokeWidth="1.8"
                    strokeDasharray="4 3"
                  />
                  <rect
                    x={chartConfig.padLeft + chartConfig.plotW - 146}
                    y={chartConfig.severeY - 18}
                    width="146"
                    height="17"
                    rx="4"
                    fill="#450A0A"
                    stroke="#EF4444"
                    strokeWidth="0.8"
                    opacity="0.95"
                  />
                  <text
                    x={chartConfig.padLeft + chartConfig.plotW - 73}
                    y={chartConfig.severeY - 6}
                    fill="#FCA5A5"
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    Severe Alert: 250 µg/m³
                  </text>
                </g>
              )}

              {/* Area Gradient Fill */}
              <path d={chartConfig.areaD} fill="url(#citizenForecastAreaGrad)" pointerEvents="none" />

              {/* Main Predicted PM2.5 Curve */}
              <path
                d={chartConfig.pathD}
                stroke="#38BDF8"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                pointerEvents="none"
              />

              {/* X-axis Tick Marks & Hourly Timestamps */}
              {chartConfig.points.map((pt, idx) => {
                // Show labels at regular intervals and at the final +24h point
                const showLabel = idx % 3 === 0 || idx === chartConfig.points.length - 1;
                return (
                  <g key={`axis-tick-${idx}`} pointerEvents="none">
                    {/* Small vertical tick on axis */}
                    <line
                      x1={pt.x}
                      y1={chartConfig.baselineY}
                      x2={pt.x}
                      y2={chartConfig.baselineY + (showLabel ? 5 : 3)}
                      stroke="#334155"
                      strokeWidth="1"
                    />
                    {showLabel && (
                      <text
                        x={pt.x}
                        y={chartConfig.baselineY + 20}
                        fill={activeIdx === idx ? '#ECC138' : '#94A3B8'}
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight={activeIdx === idx ? 'bold' : 'normal'}
                        textAnchor="middle"
                      >
                        {pt.item.shortHourStr}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Stationary Data Point Markers along Curve */}
              {chartConfig.points.map((pt, idx) => {
                const isActive = activeIdx === idx;
                if (isActive) return null; // Active point rendered on top
                return (
                  <circle
                    key={`dot-${idx}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={3.8}
                    fill={pt.item.catCfg.color}
                    stroke="#0B0E14"
                    strokeWidth={1.5}
                    pointerEvents="none"
                  />
                );
              })}

              {/* Active Point Highlight (Guideline, Glowing Halo, Center Dot) */}
              {activePoint && (
                <g pointerEvents="none">
                  {/* Vertical Guideline */}
                  <line
                    x1={activePoint.x}
                    y1={chartConfig.padTop}
                    x2={activePoint.x}
                    y2={chartConfig.baselineY}
                    stroke="#ECC138"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.85"
                  />

                  {/* Highlight Outer Radar Halo */}
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r={11}
                    fill={activePoint.item.catCfg.color}
                    opacity={0.3}
                  />

                  {/* High-Contrast Middle Ring */}
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r={6.5}
                    fill={activePoint.item.catCfg.color}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />

                  {/* Dark Center Core */}
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r={2.5}
                    fill="#0B0E14"
                  />

                  {/* Dynamic Clamped On-Graph SVG Tooltip */}
                  {(() => {
                    const tooltipW = 168;
                    const tooltipH = 64;
                    const isNearRight = activePoint.x > chartConfig.padLeft + chartConfig.plotW - 120;
                    const isNearLeft = activePoint.x < chartConfig.padLeft + 120;
                    let boxX = activePoint.x - tooltipW / 2;
                    if (isNearLeft) boxX = chartConfig.padLeft + 10;
                    if (isNearRight) boxX = chartConfig.padLeft + chartConfig.plotW - tooltipW - 10;

                    // Flip below if point is near the top
                    const showBelow = activePoint.y - tooltipH - 22 < chartConfig.padTop;
                    const boxY = showBelow ? activePoint.y + 18 : activePoint.y - tooltipH - 18;

                    return (
                      <g>
                        {/* Tooltip Background Card */}
                        <rect
                          x={boxX}
                          y={boxY}
                          width={tooltipW}
                          height={tooltipH}
                          rx={10}
                          fill="#0E131F"
                          stroke={activePoint.item.catCfg.color}
                          strokeWidth={1.5}
                          opacity="0.97"
                          filter="drop-shadow(0 4px 14px rgba(0,0,0,0.75))"
                        />

                        {/* Tooltip Header: Hour String & Horizon */}
                        <text
                          x={boxX + 12}
                          y={boxY + 18}
                          fill="#94A3B8"
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {activePoint.item.hourStr}
                        </text>
                        <text
                          x={boxX + tooltipW - 12}
                          y={boxY + 18}
                          fill="#ECC138"
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="end"
                        >
                          +{activePoint.item.idx + 1}h ahead
                        </text>

                        {/* Tooltip PM2.5 Concentration Value */}
                        <text
                          x={boxX + 12}
                          y={boxY + 41}
                          fill="#FFFDF8"
                          fontSize="17"
                          fontFamily="monospace"
                          fontWeight="900"
                        >
                          {activePoint.item.val}
                          <tspan fill="#94A3B8" fontSize="10" fontWeight="normal"> µg/m³</tspan>
                        </text>

                        {/* Tooltip Category Pill Label */}
                        <text
                          x={boxX + tooltipW - 12}
                          y={boxY + 40}
                          fill={activePoint.item.catCfg.textHex}
                          fontSize="11"
                          fontFamily="sans-serif"
                          fontWeight="bold"
                          textAnchor="end"
                        >
                          {activePoint.item.cat}
                        </text>

                        {/* Tooltip Trend relative to previous hour */}
                        <text
                          x={boxX + 12}
                          y={boxY + 55}
                          fill={activePoint.item.diff > 0 ? '#FBBF24' : activePoint.item.diff < 0 ? '#34D399' : '#64748B'}
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {activePoint.item.diff > 0 ? `▲ +${activePoint.item.diff} µg/m³ vs prev` : activePoint.item.diff < 0 ? `▼ ${activePoint.item.diff} µg/m³ vs prev` : '— Steady vs previous'}
                        </text>
                      </g>
                    );
                  })()}
                </g>
              )}

              {/* Generous Invisible Interactive Vertical Hit Columns: Eliminates mouseenter/mouseleave thrashing */}
              {chartConfig.points.map((pt, idx) => {
                const colW = chartConfig.plotW / (chartConfig.points.length - 1);
                const colX = pt.x - colW / 2;
                return (
                  <rect
                    key={`hit-col-${idx}`}
                    x={colX}
                    y={0}
                    width={colW}
                    height={chartConfig.svgHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onPointerEnter={() => setHoveredHourIdx(idx)}
                    onClick={() => {
                      setSelectedHourIdx(idx);
                      setHoveredHourIdx(idx);
                    }}
                  />
                );
              })}
            </svg>
          </div>
        )}

        {/* Visible Official CPCB Category Colors Legend */}
        <div className="mt-4 pt-3 border-t border-[#232A3B] flex flex-wrap items-center justify-between gap-2 text-[10.5px]">
          <span className="font-mono text-slate-400 font-bold uppercase tracking-wider">
            CPCB Category Standard:
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {Object.entries(CPCB_CATEGORIES).map(([catName, cfg]) => (
              <div key={catName} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cfg.color }}
                />
                <span className="text-slate-300 font-medium">{catName}</span>
                <span className="font-mono text-slate-400 text-[9.5px]">
                  ({cfg.max === 999 ? '>250' : `${cfg.min}–${cfg.max}`})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. HOURLY CARDS (Next 6 Hours vs All 24 Hours) WITH TWO-WAY GRAPH SYNCHRONIZATION */}
      {viewMode === 'immediate' ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              Immediate Outlook: Next 6 Hours
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Click any hour to highlight on graph
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {immediateHours.map((item) => {
              const isSelected = item.idx === activeIdx;
              return (
                <button
                  key={item.idx}
                  onClick={() => {
                    setSelectedHourIdx(item.idx);
                    setHoveredHourIdx(item.idx);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#151C2C] border-emerald-400 ring-2 ring-emerald-400/30 shadow-lg shadow-emerald-500/10'
                      : 'bg-[#0D111A] border-[#232A3B] hover:border-slate-500 hover:bg-[#121724]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs font-mono font-bold ${isSelected ? 'text-emerald-300' : 'text-slate-300'}`}>
                      {item.shortHourStr}
                    </span>
                    <div>{item.timeIcon}</div>
                  </div>

                  <div className="my-2.5 w-full">
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

                  <div className="pt-2 border-t border-[#232A3B] flex items-center justify-between text-[11px] w-full">
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
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* ALL 24 HOURS TIMELINE STRIP */
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              Full 24-Hour Hourly Progression
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Click any hour to highlight on graph
            </span>
          </div>

          <div className="overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-slate-700">
            <div className="flex items-stretch gap-2.5 min-w-max">
              {hourlyItems.map((item) => {
                const isSelected = item.idx === activeIdx;
                return (
                  <button
                    key={item.idx}
                    onClick={() => {
                      setSelectedHourIdx(item.idx);
                      setHoveredHourIdx(item.idx);
                    }}
                    className={`flex flex-col items-center justify-between p-3 rounded-2xl border w-[100px] sm:w-[108px] transition-all cursor-pointer text-center shrink-0 ${
                      isSelected
                        ? 'bg-[#151C2C] border-emerald-400 ring-2 ring-emerald-400/30 shadow-lg shadow-emerald-500/10'
                        : 'bg-[#0D111A] border-[#232A3B] hover:border-slate-500 hover:bg-[#121724]'
                    }`}
                  >
                    <span className={`text-xs font-mono font-bold ${isSelected ? 'text-emerald-300' : 'text-slate-300'}`}>
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
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. Clean Transparency Footer */}
      <div className="pt-3 border-t border-[#232A3B]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-400">
        <span>Projected hourly trajectory from WA-TGCN spatio-temporal neural twin</span>
        <span className="font-mono text-slate-400">Horizons 1 to 24 Hours Ahead</span>
      </div>
    </div>
  );
};
