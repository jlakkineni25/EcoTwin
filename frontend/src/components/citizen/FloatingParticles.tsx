import React from 'react';

interface Props {
  className?: string;
  count?: number;
  color?: string;
}

/**
 * Subtle, atmospheric floating particulate background.
 * Lightweight SVG dots that gently drift across the container.
 * Fully respects reduced-motion accessibility preferences.
 */
export const FloatingParticles: React.FC<Props> = ({
  className = '',
  count = 12,
  color = '#ECC138',
}) => {
  // Deterministic particle positions and animation delays
  const particles = [
    { id: 1, cx: '12%', cy: '25%', r: 2.2, dur: '14s', del: '0s', op: 0.25 },
    { id: 2, cx: '28%', cy: '68%', r: 1.8, dur: '18s', del: '-4s', op: 0.2 },
    { id: 3, cx: '45%', cy: '35%', r: 2.8, dur: '16s', del: '-8s', op: 0.3 },
    { id: 4, cx: '62%', cy: '78%', r: 1.5, dur: '20s', del: '-2s', op: 0.2 },
    { id: 5, cx: '78%', cy: '22%', r: 2.4, dur: '15s', del: '-6s', op: 0.28 },
    { id: 6, cx: '88%', cy: '55%', r: 1.9, dur: '17s', del: '-10s', op: 0.22 },
    { id: 7, cx: '35%', cy: '85%', r: 2.0, dur: '19s', del: '-3s', op: 0.18 },
    { id: 8, cx: '55%', cy: '15%', r: 2.5, dur: '13s', del: '-7s', op: 0.25 },
  ];

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}>
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <style>
          {`
            @keyframes gentleFloat {
              0% { transform: translateY(0px) translateX(0px); }
              50% { transform: translateY(-12px) translateX(8px); }
              100% { transform: translateY(0px) translateX(0px); }
            }
            @media (prefers-reduced-motion: reduce) {
              .ambient-particle {
                animation: none !important;
              }
            }
            .ambient-particle {
              animation: gentleFloat infinite ease-in-out;
            }
          `}
        </style>
        {particles.slice(0, count).map((p) => (
          <circle
            key={p.id}
            cx={p.cx}
            cy={p.cy}
            r={p.r}
            fill={color}
            opacity={p.op}
            className="ambient-particle"
            style={{
              animationDuration: p.dur,
              animationDelay: p.del,
            }}
          />
        ))}
      </svg>
    </div>
  );
};

