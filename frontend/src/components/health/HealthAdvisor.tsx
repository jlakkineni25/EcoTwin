import React, { useMemo, useState } from 'react';
import { Station, StationForecast } from '../../types';
import { CPCB_CATEGORIES, getAQICategory } from '../../utils/aqi';
import { useTwinStore } from '../../store/useTwinStore';
import { 
  MapPin, 
  ChevronDown, 
  ChevronRight, 
  Sun, 
  Moon, 
  Sunset, 
  Wind, 
  Activity, 
  Sparkles, 
  Footprints, 
  Bike, 
  Home, 
  ShieldAlert, 
  Gauge, 
  Clock, 
  Droplets, 
  Thermometer, 
  Compass, 
  AlertTriangle, 
  CheckCircle2, 
  Map, 
  Flame, 
  CloudFog,
  HeartHandshake
} from 'lucide-react';

interface Props {
  station: Station;
  forecast: StationForecast;
  timestamp: string;
  allStations?: Station[];
  allForecasts?: StationForecast[];
  onNavigateToMap?: () => void;
  onNavigateToForecast?: () => void;
  isEmbedded?: boolean;
}

export const HealthAdvisor: React.FC<Props> = ({
  station,
  forecast,
  timestamp,
  allStations = [],
  allForecasts = [],
  onNavigateToMap,
  onNavigateToForecast,
  isEmbedded = false,
}) => {
  const { setSelectedStationId, compassAngle } = useTwinStore();
  const [isStationDropdownOpen, setIsStationDropdownOpen] = useState(false);

  const currentVal = Math.round(forecast.current_pm25);
  const peakVal = Math.round(forecast.peak_predicted);
  const currentCat = forecast.current_aqi;
  const currentCatCfg = CPCB_CATEGORIES[currentCat] || CPCB_CATEGORIES.Moderate;

  const baseDate = new Date(timestamp.replace(' ', 'T'));

  // Calculate 24-hour hourly trajectory
  const hourlyData = useMemo(() => {
    return forecast.predicted_24h.map((val, i) => {
      const d = new Date(baseDate.getTime() + (i + 1) * 3600 * 1000);
      const hoursNum = d.getHours();
      const hourStr = `${String(hoursNum).padStart(2, '0')}:00`;
      const cat = getAQICategory(val);
      const isSunset = hoursNum === 18;
      const isNight = hoursNum < 6 || hoursNum > 18;

      let faceEmoji = '😊';
      let faceRating = 'Good';
      if (val > 60 && val <= 120) {
        faceEmoji = '😐';
        faceRating = 'Moderate';
      } else if (val > 120 && val <= 250) {
        faceEmoji = '😟';
        faceRating = 'Poor';
      } else if (val > 250) {
        faceEmoji = '😷';
        faceRating = 'Severe';
      }

      return {
        horizon: i + 1,
        time: hourStr,
        hourNum: hoursNum,
        val: Math.round(val),
        cat,
        isSunset,
        isNight,
        faceEmoji,
        faceRating,
        humidity: 50 + ((i * 3 + 12) % 32),
      };
    });
  }, [forecast, baseDate]);

  const minVal = Math.min(...hourlyData.map((h) => h.val));

  // Find lowest pollution window in next 24 hours
  const bestWindow = useMemo(() => {
    let minIdx = 0;
    let lowestVal = Infinity;
    hourlyData.forEach((h, i) => {
      if (h.val < lowestVal) {
        lowestVal = h.val;
        minIdx = i;
      }
    });

    const startH = hourlyData[Math.max(0, minIdx - 1)]?.time || '14:00';
    const endH = hourlyData[Math.min(hourlyData.length - 1, minIdx + 2)]?.time || '17:00';
    return {
      startTime: startH,
      endTime: endH,
      avgVal: lowestVal,
      cat: getAQICategory(lowestVal),
    };
  }, [hourlyData]);

  // Overall Running Status
  const runningStatus = useMemo(() => {
    if (currentVal <= 60) {
      return {
        rating: 'Good',
        tagline: 'Favorable air quality for outdoor cardio',
        emoji: '😊',
        badgeBg: 'bg-[#C89B6D]/20 text-[#FFFDF8] border-[#C89B6D]/40',
        advice: 'Normal outdoor athletic training recommended. Stay hydrated.',
      };
    } else if (currentVal <= 100) {
      return {
        rating: 'Moderate',
        tagline: 'Moderate air quality right now',
        emoji: '😐',
        badgeBg: 'bg-[#ECC138]/20 text-[#ECC138] border-[#ECC138]/40',
        advice: 'Reduce high-intensity aerobic duration. Early afternoon is optimal.',
      };
    } else if (currentVal <= 200) {
      return {
        rating: 'Poor',
        tagline: 'Poor air quality for running right now',
        emoji: '😟',
        badgeBg: 'bg-[#C89B6D] text-[#0B0E14] border-[#C89B6D]',
        advice: 'Elevated fine particulates irritate airways. Shift training indoors to treadmill.',
      };
    } else {
      return {
        rating: 'Severe Hazard',
        tagline: 'Hazardous air quality for all outdoor sports',
        emoji: '😷',
        badgeBg: 'bg-[#ECC138] text-[#0B0E14] border-[#ECC138]',
        advice: 'Severe particulate spike. Strict outdoor athletic suspension recommended.',
      };
    }
  }, [currentVal]);

  // Network Average PM2.5 for radar summary
  const networkAvg = useMemo(() => {
    if (!allForecasts || allForecasts.length === 0) return currentVal;
    const sum = allForecasts.reduce((acc, f) => acc + f.current_pm25, 0);
    return Math.round(sum / allForecasts.length);
  }, [allForecasts, currentVal]);

  // SVG Spline curve for the 24h timeline
  const svgCurve = useMemo(() => {
    if (hourlyData.length === 0) return { path: '', points: [] };
    const width = 840;
    const height = 65;
    const max = Math.max(...hourlyData.map((d) => d.val), 200);
    const min = Math.min(...hourlyData.map((d) => d.val), 20);
    const range = Math.max(max - min, 1);

    const pts = hourlyData.slice(0, 12).map((d, i, arr) => {
      const x = (i / (arr.length - 1)) * (width - 40) + 20;
      const y = height - 12 - ((d.val - min) / range) * (height - 24);
      return { x, y, val: d.val, time: d.time };
    });

    let dStr = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx1 = (p0.x + p1.x) / 2;
      const cy1 = p0.y;
      const cx2 = (p0.x + p1.x) / 2;
      const cy2 = p1.y;
      dStr += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p1.x} ${p1.y}`;
    }

    return { path: dStr, points: pts };
  }, [hourlyData]);

  return (
    <div className={isEmbedded ? "flex flex-col gap-4 text-[#FFFDF8] w-full max-w-full min-w-0" : "flex flex-col gap-5 text-[#FFFDF8]"}>
      {/* 1. TOP MOBILE WEATHER APP LOCATION PILL */}
      {!isEmbedded ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <button
              onClick={() => setIsStationDropdownOpen(!isStationDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#121620] hover:bg-[#181E2B] border border-[#232A3B] text-xs font-mono font-bold tracking-wider shadow-lg transition-all text-[#FFFDF8] group"
            >
              <MapPin className="w-4 h-4 text-[#ECC138] group-hover:scale-110 transition-transform" />
              <span className="text-sm font-sans font-bold text-[#FFFDF8]">
                {station.name}
              </span>
              <span className="text-slate-400 font-normal">#{station.id}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
            </button>

            {/* Station Quick Selector Dropdown */}
            {isStationDropdownOpen && allStations.length > 0 && (
              <div className="absolute top-full left-0 mt-2 w-72 max-h-72 overflow-y-auto p-2 rounded-2xl bg-[#0B0E14]/95 backdrop-blur-2xl border border-[#232A3B] shadow-2xl z-40 flex flex-col gap-1">
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-[#ECC138] font-bold border-b border-[#232A3B]">
                  Select Delhi Monitoring Station (37 Total)
                </div>
                {allStations.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedStationId(s.id);
                      setIsStationDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                      s.id === station.id
                        ? 'bg-[#C89B6D] text-[#0B0E14] font-bold'
                        : 'text-slate-300 hover:bg-[#121620] hover:text-white'
                    }`}
                  >
                    <span className="truncate">{s.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">#{s.id}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-[#121620] px-3 py-1.5 rounded-full border border-[#232A3B]">
            <Clock className="w-3.5 h-3.5 text-[#ECC138]" />
            <span>Forecast Issued: {timestamp}</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between pb-1 border-b border-[#232A3B] text-xs font-mono">
          <span className="text-[#ECC138] font-bold flex items-center gap-1.5">
            <HeartHandshake className="w-3.5 h-3.5 text-[#ECC138] shrink-0" />
            <span>Citizen Health & Activity Advisory</span>
          </span>
          <span className="text-slate-400">CPCB & WHO Standards</span>
        </div>
      )}

      {/* 2. HERO WEATHER DISPLAY (matching Screenshot 1) */}
      <div className={isEmbedded ? "p-3.5 sm:p-4 rounded-2xl bg-[#0B0E14] border border-[#232A3B] relative overflow-hidden flex flex-col justify-between" : "p-6 sm:p-8 rounded-3xl bg-[#121620] border border-[#232A3B] shadow-2xl relative overflow-hidden flex flex-col justify-between"}>
        {/* Subtle warm atmospheric glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#ECC138]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#232A3B]">
          <div>
            {/* Big Hero PM2.5 (styled like 31° in weather app) */}
            <div className="flex items-baseline gap-2">
              <span className={isEmbedded ? "text-5xl font-display font-extrabold tracking-tighter text-[#FFFDF8]" : "text-6xl sm:text-8xl font-display font-extrabold tracking-tighter text-[#FFFDF8]"}>
                {currentVal}
              </span>
              <span className="text-xl font-mono text-[#ECC138] font-bold">µg/m³</span>
            </div>

            {/* Weather & Smog Condition Headline (matching 'Haze' in screenshot) */}
            <h3 className={`${isEmbedded ? 'text-lg' : 'text-2xl sm:text-3xl'} font-display font-extrabold text-[#FFFDF8] mt-0.5 tracking-tight`}>
              {currentVal > 150
                ? 'Severe Winter Smog · Inversion Trapping'
                : currentVal > 90
                ? 'Dense Atmospheric Haze'
                : 'Moderate Particulate Layer'}
            </h3>

            {/* High / Low Range & Feels Like (matching ↑ 31° / ↓ 23° Feels like 34°) */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400 mt-1.5">
              <span>↑ {peakVal} µg/m³</span>
              <span className="text-slate-600">/</span>
              <span>↓ {minVal} µg/m³</span>
              <span className="text-slate-600">•</span>
              <span className="text-[#C89B6D] font-bold">CPCB: {currentCat}</span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:items-end">
            <div className="px-3 py-1.5 rounded-xl bg-[#121620] border border-[#232A3B] flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ECC138] animate-pulse" />
              <div className="text-right">
                <div className="text-[9px] font-mono uppercase text-slate-400">Optimal Window</div>
                <div className="text-xs font-mono font-bold text-[#FFFDF8]">
                  {bestWindow.startTime} – {bestWindow.endTime} (~{bestWindow.avgVal})
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Condition Summary Paragraph */}
        <div className="mt-3 text-xs text-slate-300 leading-relaxed">
          Boundary layer inversion trapping emissions. Max inflow <b className="text-[#ECC138]">{peakVal} µg/m³</b> expected, followed by gradual ventilation.
        </div>

        {/* 3. HOURLY CONNECTED SPLINE TIMELINE (matching Screenshot 1 horizontal ribbon) */}
        <div className="mt-5 pt-3 border-t border-[#232A3B]">
          <div className="flex items-center justify-between mb-2 text-xs font-mono text-slate-400">
            <span className="uppercase tracking-wider text-[#ECC138] font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Next 12 Hours Forecast Ribbon</span>
            </span>
            {onNavigateToForecast && (
              <button
                onClick={onNavigateToForecast}
                className="hover:text-white flex items-center gap-1 transition-colors text-[#C89B6D]"
              >
                <span>Full 24-hour fan chart</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Horizontal Hourly Cells with Icons */}
          <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#232A3B] w-full max-w-full">
            <div className={`${isEmbedded ? 'min-w-[540px]' : 'min-w-[760px]'} flex items-center justify-between gap-1.5`}>
              {hourlyData.slice(0, 10).map((h, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center justify-center p-1.5 rounded-xl bg-[#0B0E14]/80 border border-[#232A3B] text-center"
                >
                  <span className="text-[10px] font-mono text-slate-400">{h.time}</span>
                  
                  {/* Weather Icon (matching sun/cloud/sunset in screenshot 1) */}
                  <div className="my-1">
                    {h.isSunset ? (
                      <Sunset className="w-4 h-4 text-[#ECC138]" />
                    ) : h.isNight ? (
                      <Moon className="w-4 h-4 text-[#C89B6D]" />
                    ) : (
                      <Sun className="w-4 h-4 text-[#ECC138]" />
                    )}
                  </div>

                  {/* Hourly PM2.5 Number */}
                  <span className="text-xs font-mono font-bold text-[#FFFDF8]">
                    {h.isSunset ? 'Inversion' : `${h.val}°`}
                  </span>

                  {/* Small condition/humidity indicator below */}
                  <span className="text-[9px] font-mono text-slate-500 mt-0.5 flex items-center gap-0.5">
                    <Droplets className="w-2.5 h-2.5 text-slate-400" />
                    <span>{h.humidity}%</span>
                  </span>
                </div>
              ))}
            </div>

            {/* Golden Spline Curve Graphic */}
            <div className={`${isEmbedded ? 'min-w-[540px]' : 'min-w-[760px]'} h-[65px] relative -mt-3`}>
              <svg className="w-full h-full overflow-visible" viewBox="0 0 840 65">
                <defs>
                  <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ECC138" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#ECC138" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d={`${svgCurve.path} L 820 65 L 20 65 Z`}
                  fill="url(#curveGradient)"
                />
                <path
                  d={svgCurve.path}
                  fill="none"
                  stroke="#ECC138"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {svgCurve.points.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="#FFFDF8"
                    stroke="#ECC138"
                    strokeWidth="2"
                  />
                ))}
              </svg>
            </div>
          </div>
        </div>

        {/* "Today's Temperature" equivalent banner (matching Screenshot 1) */}
        <div className="mt-3.5 p-3 rounded-2xl bg-[#0B0E14] border border-[#232A3B] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300 min-w-0">
            <Thermometer className="w-4 h-4 text-[#ECC138] shrink-0" />
            <span className="truncate">Today's Airshed: Higher particulate density than yesterday</span>
          </div>
          <div className="flex items-center gap-1 font-bold text-[#ECC138] shrink-0">
            <span>+18 µg/m³</span>
            <span>↑</span>
          </div>
        </div>
      </div>

      {/* 4. AQI & POLLUTANT METRIC CARDS (matching Screenshot 2) */}
      <div className={isEmbedded ? "flex flex-col gap-3" : "grid grid-cols-1 md:grid-cols-2 gap-5"}>
        {/* AQI Status Card (matching Screenshot 2 AQI card) */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0B0E14] border border-[#232A3B] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-400 mb-1.5">
              <span className="font-bold text-[#ECC138]">AQI Scale</span>
              <span>24h Standard</span>
            </div>
            <div className="text-xl font-display font-extrabold text-[#FFFDF8]">
              {currentCat} ({Math.round(currentVal * 1.8)})
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Air quality is in the {currentCat} band. Respiratory discomfort likely upon prolonged exposure.
            </p>
          </div>

          {/* Horizontal multi-color gradient meter bar */}
          <div className="mt-3">
            <div className="h-2 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 via-orange-500 to-red-600 relative overflow-hidden">
              <div
                className="absolute top-0 bottom-0 w-2 bg-[#FFFDF8] border border-black rounded-full shadow-md"
                style={{
                  left: `${Math.min(100, Math.max(5, (currentVal / 300) * 100))}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
              <span>Good (0)</span>
              <span>Moderate (100)</span>
              <span>Severe (300+)</span>
            </div>
          </div>
        </div>

        {/* Wind & Advection Vector Card (matching Screenshot 2 Wind gauge) */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0B0E14] border border-[#232A3B] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-400 mb-1.5">
              <span className="font-bold text-[#ECC138] flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5" />
                <span>Wind Advection</span>
              </span>
              <span>2.4 m/s</span>
            </div>
            <div className="text-lg font-display font-bold text-[#FFFDF8]">
              Light Breeze from NW ({compassAngle}°)
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Transporting particulate plumes along the regional stubble corridor directly into Delhi.
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-[#232A3B]">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#C89B6D]">
              <Compass className="w-3.5 h-3.5 text-[#ECC138]" />
              <span>NW ({compassAngle}°)</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Ventilation: Low</span>
          </div>
        </div>
      </div>

      {/* 5. PARTICULATE PRECURSORS (matching Screenshot 2 Pollen Card) */}
      <div className={isEmbedded ? "p-3.5 sm:p-4 rounded-2xl bg-[#0B0E14] border border-[#232A3B]" : "p-5 rounded-2xl bg-[#121620] border border-[#232A3B]"}>
        <div className="text-[11px] font-mono uppercase text-[#ECC138] font-bold mb-2.5 flex items-center gap-1.5">
          <CloudFog className="w-3.5 h-3.5 text-[#ECC138]" />
          <span>Active Pollutant Speciation</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl bg-[#121620] border border-[#232A3B] text-center">
            <span className="text-[9px] font-mono uppercase text-slate-400">PM2.5 (Fine)</span>
            <div className="text-base font-mono font-bold text-[#ECC138] mt-0.5">{currentVal} µg/m³</div>
            <span className="text-[9px] text-red-400">Primary Hazard</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#121620] border border-[#232A3B] text-center">
            <span className="text-[9px] font-mono uppercase text-slate-400">PM10 (Dust)</span>
            <div className="text-base font-mono font-bold text-[#FFFDF8] mt-0.5">{Math.round(currentVal * 1.65)} µg/m³</div>
            <span className="text-[9px] text-orange-400">Coarse Dust</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#121620] border border-[#232A3B] text-center">
            <span className="text-[9px] font-mono uppercase text-slate-400">NO2</span>
            <div className="text-base font-mono font-bold text-[#C89B6D] mt-0.5">54 ppb</div>
            <span className="text-[9px] text-slate-400">Traffic Inflow</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#121620] border border-[#232A3B] text-center">
            <span className="text-[9px] font-mono uppercase text-slate-400">Inversion Cap</span>
            <div className="text-base font-mono font-bold text-[#FFFDF8] mt-0.5">420 m</div>
            <span className="text-[9px] text-slate-500">Trapped</span>
          </div>
        </div>
      </div>

      {/* 6. ACTIVITY FEASIBILITY WITH HOURLY FACES (matching Screenshot 3 Running Card) */}
      <div className={isEmbedded ? "flex flex-col gap-3" : "grid grid-cols-1 md:grid-cols-2 gap-5"}>
        {/* Running & Outdoor Sports Card (exact replica of Screenshot 3 Running card) */}
        <div className={isEmbedded ? "p-3.5 sm:p-4 rounded-2xl bg-[#0B0E14] border border-[#232A3B] flex flex-col justify-between" : "p-5 rounded-2xl bg-[#121620] border border-[#232A3B] flex flex-col justify-between"}>
          <div>
            <div className="flex items-center justify-between text-xs font-mono uppercase text-slate-400 mb-2">
              <span className="font-bold text-[#ECC138] flex items-center gap-1.5">
                <Footprints className="w-4 h-4 text-[#ECC138]" />
                <span>Running & Cardio</span>
              </span>
              <span>Hourly Feasibility</span>
            </div>

            {/* Big Status Headline (matching 'Poor weather for running right now') */}
            <div className="text-2xl font-display font-extrabold text-[#FFFDF8] mt-1">
              {runningStatus.rating}
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {runningStatus.tagline}. High particulate intake can induce bronchospasm during intense aerobic exertion.
            </p>

            {/* Hourly facial tags row (matching the orange/red circle faces in screenshot 3) */}
            <div className="mt-4 flex items-center gap-2">
              {hourlyData.slice(0, 4).map((h, i) => (
                <div
                  key={i}
                  className="flex-1 p-2 rounded-xl bg-[#0B0E14] border border-[#232A3B] text-center"
                >
                  <div className="text-[10px] font-mono text-slate-400">{h.time}</div>
                  <div className="text-xl my-0.5">{h.faceEmoji}</div>
                  <div className="text-[10px] font-mono font-bold text-slate-300">{h.faceRating}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#232A3B] flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Best window: {bestWindow.startTime}</span>
            <span className="text-[#C89B6D]">Treadmill Recommended</span>
          </div>
        </div>

        {/* Commuting & Transit Guidance Card */}
        <div className={isEmbedded ? "p-3.5 sm:p-4 rounded-2xl bg-[#0B0E14] border border-[#232A3B] flex flex-col justify-between" : "p-5 rounded-2xl bg-[#121620] border border-[#232A3B] flex flex-col justify-between"}>
          <div>
            <div className="flex items-center justify-between text-xs font-mono uppercase text-slate-400 mb-2">
              <span className="font-bold text-[#ECC138] flex items-center gap-1.5">
                <Bike className="w-4 h-4 text-[#ECC138]" />
                <span>Commuting & Travel</span>
              </span>
              <span>Transit Safety</span>
            </div>

            <div className="text-2xl font-display font-extrabold text-[#FFFDF8] mt-1">
              {currentVal > 100 ? 'N95 Respirator Advised' : 'Standard Commute'}
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Maintain vehicle cabin air recirculation. Keep windows sealed during morning rush hour inversion.
            </p>

            {/* Commuter Checklist */}
            <div className="mt-4 flex flex-col gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0B0E14] border border-[#232A3B]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#ECC138] shrink-0" />
                <span>Vehicle AC Recirculation: <b>ON</b></span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0B0E14] border border-[#232A3B]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C89B6D] shrink-0" />
                <span>Pedestrian / Cycling: <b>N95 Mask Required</b></span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#232A3B] flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Sensitive Groups: High Alert</span>
            <span className="text-[#ECC138]">Exposure: Elevated</span>
          </div>
        </div>
      </div>

      {/* 7. RADAR AND MAPS THUMBNAIL CARD (matching Screenshot 3 Radar and maps) */}
      <div className={isEmbedded ? "p-3.5 sm:p-4 rounded-2xl bg-[#0B0E14] border border-[#232A3B] flex flex-col sm:flex-row sm:items-center justify-between gap-3" : "p-5 rounded-2xl bg-[#121620] border border-[#232A3B] flex flex-col sm:flex-row sm:items-center justify-between gap-5"}>
        <div className="flex items-start gap-3.5">
          <div
            className="relative w-20 h-16 sm:w-24 sm:h-20 rounded-xl overflow-hidden border border-[#ECC138]/40 shadow-lg shrink-0 group cursor-pointer"
            onClick={onNavigateToMap}
            title="Open Interactive Delhi Satellite Airshed Map"
          >
            <img
              src="/images/delhi-satellite-night.jpg"
              alt="Delhi Satellite Airshed Map"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-transparent to-transparent opacity-60"></div>
            <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-[#0B0E14]/85 backdrop-blur text-[8px] font-mono font-bold text-[#ECC138] border border-[#ECC138]/30">
              RADAR
            </div>
            <div className="absolute bottom-1 left-1.5 flex items-center gap-1 text-[8px] font-mono text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ECC138] animate-ping"></span>
              <span>Live 37 Nodes</span>
            </div>
          </div>
          <div>
            <div className="text-xs font-mono uppercase text-[#ECC138] font-bold mb-1 flex items-center gap-1.5">
              <Map className="w-3.5 h-3.5 text-[#ECC138]" />
              <span>Radar and Airshed Maps</span>
            </div>
            <h4 className="text-base sm:text-lg font-display font-bold text-[#FFFDF8]">
              Delhi NCR Continuous Monitoring Network
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Current network average of approximately <b className="text-white font-mono">{networkAvg} µg/m³</b> across all 37 CAAQMS stations.
            </p>
          </div>
        </div>

        {onNavigateToMap && (
          <button
            onClick={onNavigateToMap}
            className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[#C89B6D] hover:bg-[#d8a879] text-[#0B0E14] font-mono text-xs font-bold transition-all shadow-md shrink-0"
          >
            <span>Open Airshed Map & Flow</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
