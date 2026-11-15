import React from 'react';

export interface EcoTwinLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  variant?: 'dark' | 'light';
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
  ariaLabel?: string;
}

/**
 * EcoTwin Custom Logo Component
 * Symbolism:
 * - Green Leaf: Environmental Intelligence & Ecological Health
 * - Cyan Flowing Streamlines: Atmospheric Fluid Dynamics & Wind Advection
 * - Gold & Connected Nodes: Graph Neural Network (WA-TGCN) & Sensor Mesh
 */
export const EcoTwinIcon: React.FC<{ sizePx?: number; className?: string }> = ({
  sizePx = 36,
  className = '',
}) => {
  return (
    <svg
      viewBox="0 0 44 44"
      width={sizePx}
      height={sizePx}
      className={`shrink-0 ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Leaf Emerald Gradient */}
        <linearGradient id="ecotwin-leaf-grad" x1="8" y1="34" x2="28" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>

        {/* Wind Cyan Streamline Gradient */}
        <linearGradient id="ecotwin-wind-grad" x1="4" y1="26" x2="40" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0284C7" stopOpacity="0.2" />
          <stop offset="35%" stopColor="#38BDF8" stopOpacity="0.9" />
          <stop offset="80%" stopColor="#67E8F9" stopOpacity="1" />
          <stop offset="100%" stopColor="#A5F3FC" stopOpacity="0.5" />
        </linearGradient>

        {/* Gold Central Node Radial Glow */}
        <radialGradient id="ecotwin-gold-glow" cx="23" cy="18" r="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE047" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#ECC138" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ECC138" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient Badge Frame */}
      <rect x="2" y="2" width="40" height="40" rx="12" fill="#101522" stroke="#232A3B" strokeWidth="1.2" />

      {/* 1. Stylized Environmental Leaf Blade */}
      <path
        d="M 12 34 C 8 24 10 14 22 7 C 24 13 25 18 30 21 C 28 29 21 35 12 34 Z"
        fill="url(#ecotwin-leaf-grad)"
        opacity="0.92"
      />

      {/* Leaf Spine (Delicate translucency) */}
      <path
        d="M 12 34 Q 18 24 22 7"
        stroke="#A7F3D0"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.65"
      />

      {/* 2. Flowing Wind Advection Vectors */}
      {/* Primary sweeping streamline */}
      <path
        d="M 4 25 C 13 21 21 19 38 12"
        stroke="url(#ecotwin-wind-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Secondary aerodynamic slipstream */}
      <path
        d="M 8 30 C 17 27 26 23 40 18"
        stroke="#38BDF8"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.75"
        strokeDasharray="4 2"
      />

      {/* 3. Graph Neural Network: Directed Interconnected Edges */}
      <line x1="12" y1="24" x2="23" y2="18" stroke="#ECC138" strokeWidth="1.4" opacity="0.85" />
      <line x1="23" y1="18" x2="35" y2="13" stroke="#38BDF8" strokeWidth="1.4" opacity="0.85" />
      <line x1="23" y1="18" x2="27" y2="28" stroke="#10B981" strokeWidth="1.2" opacity="0.7" />

      {/* Graph Sensor Nodes */}
      {/* Node A (Upwind - Emerald) */}
      <circle cx="12" cy="24" r="2.2" fill="#34D399" stroke="#0B0E14" strokeWidth="1" />

      {/* Central Hub Node (Dynamic Core - Radiant Gold) */}
      <circle cx="23" cy="18" r="6" fill="url(#ecotwin-gold-glow)" />
      <circle cx="23" cy="18" r="3" fill="#ECC138" stroke="#0B0E14" strokeWidth="1" />
      <circle cx="23" cy="18" r="1.2" fill="#FFFDF8" />

      {/* Node B (Downwind Receptor - Cyan) */}
      <circle cx="35" cy="13" r="2.4" fill="#38BDF8" stroke="#0B0E14" strokeWidth="1" />

      {/* Node C (Crosswind Node - Amber) */}
      <circle cx="27" cy="28" r="2" fill="#C89B6D" stroke="#0B0E14" strokeWidth="1" />
    </svg>
  );
};

export const EcoTwinLogo: React.FC<EcoTwinLogoProps> = ({
  size = 'md',
  showWordmark = true,
  showSubtitle = false,
  subtitle,
  variant = 'dark',
  className = '',
  onClick,
  interactive = false,
  ariaLabel = 'EcoTwin Home - Scroll to top',
}) => {
  const sizeMap = {
    sm: { iconPx: 28, text: 'text-sm', sub: 'text-[9.5px]', tracking: 'tracking-tight' },
    md: { iconPx: 34, text: 'text-base sm:text-lg', sub: 'text-[10px]', tracking: 'tracking-tight' },
    lg: { iconPx: 40, text: 'text-xl sm:text-2xl', sub: 'text-[11px]', tracking: 'tracking-tight' },
    xl: { iconPx: 48, text: 'text-2xl sm:text-3xl', sub: 'text-xs', tracking: 'tracking-tight' },
  };

  const { iconPx, text, sub, tracking } = sizeMap[size];

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as any);
    }
  };

  const isClickable = interactive || !!onClick;

  const content = (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${
        isClickable ? 'cursor-pointer group' : ''
      } ${className}`}
      {...(isClickable
        ? {
            role: 'button',
            tabIndex: 0,
            onClick: handleClick,
            onKeyDown: handleKeyDown,
            'aria-label': ariaLabel,
          }
        : {})}
    >
      {/* Custom EcoTwin Symbol */}
      <div className={`transition-transform duration-300 ${isClickable ? 'group-hover:scale-105' : ''}`}>
        <EcoTwinIcon sizePx={iconPx} />
      </div>

      {/* Brand Wordmark & Subtitle */}
      {showWordmark && (
        <div className="flex flex-col justify-center text-left">
          <div className={`font-display font-black leading-none ${text} ${tracking} flex items-center`}>
            <span className={variant === 'dark' ? 'text-[#FFFDF8]' : 'text-slate-900'}>
              ECO
            </span>
            <span className="text-[#ECC138]">
              TWIN
            </span>
          </div>

          {showSubtitle && subtitle && (
            <span
              className={`font-mono uppercase tracking-widest mt-0.5 ${sub} ${
                variant === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  return content;
};
