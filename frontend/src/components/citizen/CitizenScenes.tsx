import React from 'react';

interface SceneProps {
  className?: string;
  height?: number;
}

/**
 * Modern vector scene for outdoor / indoor exercise.
 * Illustrates a person in athletic wear enjoying physical activity
 * with subtle park foliage and clean morning air.
 */
export const ExerciseScene: React.FC<SceneProps> = ({ className = '', height = 125 }) => (
  <svg
    viewBox="0 0 320 130"
    height={height}
    className={`w-full ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <style>
      {`
        @keyframes breezeFloat {
          0% { transform: translateX(0px); }
          50% { transform: translateX(6px); }
          100% { transform: translateX(0px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .anim-breeze { animation: none !important; }
        }
        .anim-breeze {
          animation: breezeFloat 4s ease-in-out infinite;
        }
      `}
    </style>

    {/* Ambient park ground gradient */}
    <rect width="320" height="130" rx="14" fill="url(#exercise-bg)" />

    {/* Distant soft trees */}
    <circle cx="45" cy="85" r="35" fill="#064E3B" opacity="0.45" />
    <circle cx="88" cy="80" r="30" fill="#065F46" opacity="0.35" />
    <circle cx="255" cy="82" r="36" fill="#064E3B" opacity="0.4" />
    <circle cx="295" cy="86" r="28" fill="#065F46" opacity="0.35" />

    {/* Gentle sun / daylight glow */}
    <circle cx="160" cy="28" r="20" fill="url(#sun-glow)" opacity="0.55" />

    {/* Park running pathway */}
    <path d="M0 110 Q120 100 200 106 T320 104 L320 130 L0 130 Z" fill="#1E293B" />
    <path d="M0 110 Q120 100 200 106 T320 104" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />

    {/* Runner Figure (Stylized, athletic, graceful) */}
    <g transform="translate(138, 50)">
      {/* Head */}
      <circle cx="22" cy="10" r="6.5" fill="#F8C291" />
      {/* Hair */}
      <path d="M16 10 C16 4 21 3 24 3 C28 3 30 5 30 9 C28 8 25 8 22 8 C19 8 18 9 16 10 Z" fill="#0F172A" />
      {/* Torso in Emerald Athletic Top */}
      <path d="M17 17 L27 16 L25 34 L15 34 Z" fill="#10B981" />
      {/* Running Arms */}
      <path d="M18 19 L9 25 L4 21" stroke="#F8C291" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M26 19 L34 24 L38 20" stroke="#F8C291" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {/* Running Legs */}
      <path d="M17 34 L11 46 L3 47" stroke="#38BDF8" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23 34 L28 44 L38 50" stroke="#38BDF8" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* Shoes */}
      <circle cx="3" cy="47" r="2.2" fill="#ECC138" />
      <circle cx="38" cy="50" r="2.2" fill="#ECC138" />
    </g>

    {/* Motion & Air Breeze Lines with subtle drift */}
    <g className="anim-breeze">
      <path d="M105 70 Q122 66 135 70" stroke="#34D399" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
      <path d="M182 66 Q198 63 214 67" stroke="#34D399" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
      {/* Gentle leaf */}
      <path d="M115 50 C122 47 127 50 125 56 C120 58 115 55 115 50 Z" fill="#34D399" opacity="0.7" />
    </g>

    <defs>
      <linearGradient id="exercise-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0B131E" />
        <stop offset="100%" stopColor="#091E21" />
      </linearGradient>
      <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ECC138" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#ECC138" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

/**
 * Modern vector scene for commuting, travel & N95 mask protection.
 */
export const CommuteScene: React.FC<SceneProps> = ({ className = '', height = 125 }) => (
  <svg
    viewBox="0 0 320 130"
    height={height}
    className={`w-full ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="320" height="130" rx="14" fill="url(#commute-bg)" />

    {/* City skyline silhouettes */}
    <rect x="25" y="48" width="30" height="58" rx="2" fill="#1E293B" opacity="0.6" />
    <rect x="60" y="34" width="38" height="72" rx="2" fill="#1E293B" opacity="0.5" />
    <rect x="225" y="42" width="32" height="64" rx="2" fill="#1E293B" opacity="0.5" />
    <rect x="262" y="30" width="42" height="76" rx="2" fill="#1E293B" opacity="0.6" />

    {/* Street & Transit Platform */}
    <path d="M0 104 L320 104 L320 130 L0 130 Z" fill="#0F172A" />
    <line x1="0" y1="104" x2="320" y2="104" stroke="#334155" strokeWidth="2" />

    {/* Transit Shelter Column & Roof */}
    <rect x="108" y="38" width="4" height="66" rx="1" fill="#475569" />
    <path d="M92 38 L175 38 L170 44 L96 44 Z" fill="#64748B" />

    {/* Commuter Waiting with N95 Mask */}
    <g transform="translate(132, 48)">
      {/* Head */}
      <circle cx="16" cy="11" r="6.5" fill="#F8C291" />
      <path d="M11 10 C11 5 15 4 19 4 C22 4 24 6 23 9 C21 8 19 8 16 8 C14 8 13 9 11 10 Z" fill="#0F172A" />
      {/* White N95 Mask */}
      <path d="M13 12 C13 11 16 11 18 11 C21 11 22 12 22 13 C22 16 20 18 18 18 C15 18 13 16 13 12 Z" fill="#FFFFFF" stroke="#FB923C" strokeWidth="1.2" />
      {/* Coat / Commuter Jacket */}
      <path d="M10 18 L22 18 L24 42 L8 42 Z" fill="#334155" />
      {/* Commuter Bag / Backpack */}
      <rect x="6" y="21" width="5" height="17" rx="2" fill="#C89B6D" />
      {/* Legs */}
      <line x1="12" y1="42" x2="12" y2="59" stroke="#1E293B" strokeWidth="2.8" />
      <line x1="19" y1="42" x2="19" y2="59" stroke="#1E293B" strokeWidth="2.8" />
    </g>

    {/* Moving vehicle light trails */}
    <path d="M185 112 L295 112" stroke="#FB923C" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />
    <path d="M25 114 L85 114" stroke="#FDE047" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />

    {/* Atmospheric Particulate Dust */}
    <circle cx="180" cy="55" r="2" fill="#FDBA74" opacity="0.75" />
    <circle cx="196" cy="72" r="2.4" fill="#FDBA74" opacity="0.55" />
    <circle cx="218" cy="52" r="1.8" fill="#FDBA74" opacity="0.65" />

    <defs>
      <linearGradient id="commute-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0E131E" />
        <stop offset="100%" stopColor="#1B1621" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * Modern vector scene for home indoor air & HEPA air purifier.
 */
export const HomeScene: React.FC<SceneProps> = ({ className = '', height = 125 }) => (
  <svg
    viewBox="0 0 320 130"
    height={height}
    className={`w-full ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <style>
      {`
        @keyframes purifierWaves {
          0% { stroke-dashoffset: 24; opacity: 0.4; }
          50% { opacity: 0.9; }
          100% { stroke-dashoffset: 0; opacity: 0.4; }
        }
        @media (prefers-reduced-motion: reduce) {
          .anim-wave { animation: none !important; }
        }
        .anim-wave {
          stroke-dasharray: 6 4;
          animation: purifierWaves 3s linear infinite;
        }
      `}
    </style>

    <rect width="320" height="130" rx="14" fill="url(#home-bg)" />

    {/* Room Floor */}
    <path d="M0 108 L320 108 L320 130 L0 130 Z" fill="#0A0E17" />
    <line x1="0" y1="108" x2="320" y2="108" stroke="#1E293B" strokeWidth="1.8" />

    {/* Sealed Window with outside night sky */}
    <rect x="35" y="24" width="65" height="66" rx="4" fill="#0B132B" stroke="#334155" strokeWidth="2" />
    <line x1="67" y1="24" x2="67" y2="90" stroke="#334155" strokeWidth="1.5" />
    <line x1="35" y1="57" x2="100" y2="57" stroke="#334155" strokeWidth="1.5" />
    {/* Window lock status */}
    <circle cx="67" cy="57" r="2.8" fill="#10B981" />

    {/* Potted Indoor Plant */}
    <path d="M125 94 L137 94 L134 108 L128 108 Z" fill="#C89B6D" />
    <path d="M131 94 Q121 76 116 80 Q124 85 131 94" fill="#10B981" />
    <path d="M131 94 Q141 73 147 77 Q139 85 131 94" fill="#34D399" />
    <path d="M131 94 Q131 71 128 69 Q133 77 131 94" fill="#059669" />

    {/* Modern Tower HEPA Air Purifier */}
    <rect x="220" y="52" width="26" height="56" rx="5" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.8" />
    <line x1="225" y1="84" x2="241" y2="84" stroke="#334155" strokeWidth="1.2" />
    <line x1="225" y1="89" x2="241" y2="89" stroke="#334155" strokeWidth="1.2" />
    <line x1="225" y1="94" x2="241" y2="94" stroke="#334155" strokeWidth="1.2" />
    <line x1="225" y1="99" x2="241" y2="99" stroke="#334155" strokeWidth="1.2" />
    {/* Clean air LED ring */}
    <circle cx="233" cy="61" r="3.2" fill="#38BDF8" />

    {/* Clean Airflow Waves emanating upward & spreading across the room */}
    <path d="M233 48 C233 32 215 26 175 34" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" className="anim-wave" />
    <path d="M233 44 C233 24 195 18 150 26" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" className="anim-wave" style={{ animationDelay: '-1s' }} />
    <path d="M233 40 C233 14 180 10 130 18" stroke="#34D399" strokeWidth="1.6" strokeLinecap="round" className="anim-wave" style={{ animationDelay: '-2s' }} />

    {/* Clean sparkle stars indoors */}
    <path d="M172 45 L174 49 L178 51 L174 53 L172 57 L170 53 L166 51 L170 49 Z" fill="#38BDF8" opacity="0.75" />
    <path d="M192 26 L193 29 L196 30 L193 31 L192 34 L191 31 L188 30 L191 29 Z" fill="#34D399" opacity="0.85" />

    <defs>
      <linearGradient id="home-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0B131E" />
        <stop offset="100%" stopColor="#0D2027" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * Modern vector scene for sensitive family members (child, senior, warm protected home).
 */
export const FamilyScene: React.FC<SceneProps> = ({ className = '', height = 125 }) => (
  <svg
    viewBox="0 0 320 130"
    height={height}
    className={`w-full ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="320" height="130" rx="14" fill="url(#family-bg)" />

    {/* Warm indoor ambient lamp */}
    <path d="M245 42 L268 42 L274 56 L239 56 Z" fill="#ECC138" opacity="0.75" />
    <rect x="255" y="56" width="2" height="54" fill="#94A3B8" />
    <ellipse cx="256" cy="110" rx="12" ry="2.5" fill="#64748B" />
    {/* Lamp warm glow cone */}
    <path d="M239 56 L220 112 L292 112 L274 56 Z" fill="url(#lamp-glow)" opacity="0.38" />

    {/* Cozy couch silhouette */}
    <rect x="75" y="68" width="135" height="42" rx="8" fill="#1E293B" />
    <rect x="68" y="78" width="15" height="32" rx="4" fill="#334155" />
    <rect x="202" y="78" width="15" height="32" rx="4" fill="#334155" />

    {/* Adult Figure on Couch */}
    <g transform="translate(100, 50)">
      <circle cx="16" cy="11" r="6.5" fill="#F8C291" />
      <path d="M11 10 C11 5 15 4 19 4 C23 4 25 6 24 8 C22 7 19 7 16 7 C14 7 13 8 11 10 Z" fill="#0F172A" />
      <path d="M10 18 L23 18 L25 39 L8 39 Z" fill="#475569" />
    </g>

    {/* Child Figure comfortably seated beside */}
    <g transform="translate(140, 59)">
      <circle cx="12" cy="8" r="5" fill="#F8C291" />
      <path d="M8 8 C8 4 11 3 14 3 C17 3 19 5 18 6 C16 6 13 6 12 6 C10 6 9 7 8 8 Z" fill="#C89B6D" />
      <path d="M7 14 L18 14 L19 30 L6 30 Z" fill="#F87171" opacity="0.9" />
    </g>

    {/* Health shield & Heart icon overhead */}
    <path d="M154 28 C154 24 158 20 162 20 C166 20 170 24 170 28 C170 35 162 41 162 41 C162 41 154 35 154 28 Z" fill="#F87171" opacity="0.85" />

    <defs>
      <linearGradient id="family-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#121422" />
        <stop offset="100%" stopColor="#211728" />
      </linearGradient>
      <linearGradient id="lamp-glow" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#ECC138" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#ECC138" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
);
