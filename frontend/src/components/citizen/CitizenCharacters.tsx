import React from 'react';
import { AQICategory } from '../../types';

interface CharacterProps {
  category: AQICategory;
  className?: string;
  size?: number;
}

/**
 * Editorial, friendly vector illustrations representing human experiences
 * across the 6 CPCB air quality conditions.
 * Designed to seamlessly blend with EcoTwin's dark cinematic palette.
 */
export const AQICharacter: React.FC<CharacterProps> = ({
  category,
  className = '',
  size = 120,
}) => {
  switch (category) {
    case 'Good':
      // Serene, smiling figure breathing fresh mountain/park air with open posture
      return (
        <svg
          viewBox="0 0 160 160"
          width={size}
          height={size}
          className={`${className} motion-safe:transition-transform hover:scale-105 duration-300`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fresh aura halo */}
          <circle cx="80" cy="80" r="70" fill="url(#good-glow)" opacity="0.4" />
          <circle cx="80" cy="80" r="58" stroke="#10B981" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" className="motion-safe:animate-spin" style={{ animationDuration: '30s' }} />

          {/* Clean air breeze leaves */}
          <path d="M125 45 C135 40 145 45 142 55 C135 60 125 55 125 45 Z" fill="#34D399" opacity="0.8" />
          <path d="M22 65 C18 55 28 50 35 55 C38 65 30 70 22 65 Z" fill="#34D399" opacity="0.7" />
          <path d="M130 115 C138 120 135 130 125 128 C120 122 122 114 130 115 Z" fill="#10B981" opacity="0.6" />

          {/* Torso & Shoulders */}
          <path d="M48 140 C48 115 62 105 80 105 C98 105 112 115 112 140 Z" fill="#1E293B" stroke="#10B981" strokeWidth="2" />
          {/* Emerald collar accent */}
          <path d="M70 106 L80 118 L90 106" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Head & Neck */}
          <rect x="74" y="90" width="12" height="18" rx="4" fill="#F8C291" />
          <circle cx="80" cy="74" r="24" fill="#F8C291" />

          {/* Hair (tidy, modern) */}
          <path d="M57 70 C57 52 68 46 80 46 C92 46 103 52 103 70 C96 64 88 64 80 64 C72 64 64 64 57 70 Z" fill="#0F172A" />

          {/* Happy, peaceful closed eyes */}
          <path d="M69 73 Q73 70 77 73" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M83 73 Q87 70 91 73" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Rosy fresh air cheeks */}
          <circle cx="67" cy="78" r="3.5" fill="#F87171" opacity="0.4" />
          <circle cx="93" cy="78" r="3.5" fill="#F87171" opacity="0.4" />

          {/* Warm calm smile */}
          <path d="M74 81 Q80 87 86 81" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Fresh breeze swirls */}
          <path d="M30 40 Q45 35 60 42" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          <path d="M100 38 Q115 32 130 40" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />

          <defs>
            <radialGradient id="good-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      );

    case 'Satisfactory':
      // Cheerful figure giving a friendly thumbs-up or pleasant nod
      return (
        <svg
          viewBox="0 0 160 160"
          width={size}
          height={size}
          className={`${className} motion-safe:transition-transform hover:scale-105 duration-300`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="80" cy="80" r="70" fill="url(#sat-glow)" opacity="0.35" />
          <circle cx="80" cy="80" r="58" stroke="#84CC16" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />

          {/* Torso */}
          <path d="M48 140 C48 116 62 106 80 106 C98 106 112 116 112 140 Z" fill="#1E293B" stroke="#84CC16" strokeWidth="2" />
          <path d="M72 106 L80 116 L88 106" stroke="#A3E635" strokeWidth="2" strokeLinecap="round" />

          {/* Neck & Head */}
          <rect x="74" y="91" width="12" height="17" rx="4" fill="#F8C291" />
          <circle cx="80" cy="74" r="24" fill="#F8C291" />

          {/* Hair */}
          <path d="M56 72 C56 50 70 48 80 48 C90 48 104 50 104 72 C95 65 85 64 80 64 C75 64 65 65 56 72 Z" fill="#334155" />

          {/* Open smiling eyes */}
          <circle cx="73" cy="72" r="2.5" fill="#0F172A" />
          <circle cx="87" cy="72" r="2.5" fill="#0F172A" />

          {/* Light cheeks */}
          <circle cx="68" cy="77" r="3" fill="#F87171" opacity="0.3" />
          <circle cx="92" cy="77" r="3" fill="#F87171" opacity="0.3" />

          {/* Friendly smile */}
          <path d="M74 80 Q80 86 86 80" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Sun icon */}
          <circle cx="128" cy="42" r="9" fill="#FACC15" opacity="0.85" />
          <path d="M128 28 L128 31 M128 53 L128 56 M114 42 L117 42 M139 42 L142 42" stroke="#FACC15" strokeWidth="2" strokeLinecap="round" />

          <defs>
            <radialGradient id="sat-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#84CC16" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#84CC16" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      );

    case 'Moderate':
      // Mindful, observant character checking outdoor conditions
      return (
        <svg
          viewBox="0 0 160 160"
          width={size}
          height={size}
          className={`${className} motion-safe:transition-transform hover:scale-105 duration-300`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="80" cy="80" r="70" fill="url(#mod-glow)" opacity="0.35" />
          <circle cx="80" cy="80" r="58" stroke="#FACC15" strokeWidth="1.5" strokeDasharray="2 3" opacity="0.5" />

          {/* Torso */}
          <path d="M48 140 C48 116 62 106 80 106 C98 106 112 116 112 140 Z" fill="#1E293B" stroke="#FACC15" strokeWidth="2" />

          {/* Light yellow scarf */}
          <path d="M66 102 C66 98 94 98 94 102 C94 110 66 110 66 102 Z" fill="#FACC15" opacity="0.85" />
          <path d="M84 106 L87 122 L79 122 Z" fill="#FACC15" opacity="0.85" />

          {/* Neck & Head */}
          <rect x="74" y="90" width="12" height="16" rx="4" fill="#F8C291" />
          <circle cx="80" cy="74" r="24" fill="#F8C291" />

          {/* Hair */}
          <path d="M56 70 C56 50 68 47 80 47 C92 47 104 50 104 70 C96 63 86 63 80 63 C74 63 64 63 56 70 Z" fill="#1E293B" />

          {/* Thoughtful, observant eyes */}
          <circle cx="73" cy="71" r="2.2" fill="#0F172A" />
          <circle cx="87" cy="71" r="2.2" fill="#0F172A" />
          <path d="M70 66 L76 66" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M84 66 L90 66" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />

          {/* Calm neutral-positive mouth */}
          <path d="M76 81 L84 81" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />

          {/* Gentle haze indicator dots */}
          <circle cx="34" cy="52" r="2" fill="#FDE047" opacity="0.5" />
          <circle cx="44" cy="46" r="3" fill="#FDE047" opacity="0.4" />
          <circle cx="126" cy="60" r="2.5" fill="#FDE047" opacity="0.5" />

          <defs>
            <radialGradient id="mod-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FACC15" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FACC15" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      );

    case 'Poor':
      // Attentive character wearing an N95 mask outdoors with calm confidence
      return (
        <svg
          viewBox="0 0 160 160"
          width={size}
          height={size}
          className={`${className} motion-safe:transition-transform hover:scale-105 duration-300`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="80" cy="80" r="70" fill="url(#poor-glow)" opacity="0.35" />
          <circle cx="80" cy="80" r="58" stroke="#FB923C" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />

          {/* Torso with hooded jacket */}
          <path d="M46 140 C46 114 62 105 80 105 C98 105 114 114 114 140 Z" fill="#1E293B" stroke="#FB923C" strokeWidth="2" />
          <path d="M80 105 L80 140" stroke="#FB923C" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.6" />

          {/* Neck & Head */}
          <rect x="74" y="90" width="12" height="16" rx="4" fill="#F8C291" />
          <circle cx="80" cy="74" r="24" fill="#F8C291" />

          {/* Hair / Hood fringe */}
          <path d="M56 70 C56 50 68 46 80 46 C92 46 104 50 104 70 C96 64 88 64 80 64 C72 64 64 64 56 70 Z" fill="#0F172A" />

          {/* Mindful eyes */}
          <circle cx="73" cy="69" r="2.2" fill="#0F172A" />
          <circle cx="87" cy="69" r="2.2" fill="#0F172A" />
          <path d="M70 65 L76 66" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M84 66 L90 65" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />

          {/* Fitted N95 White/Orange Mask */}
          <path d="M68 76 C68 74 74 73 80 73 C86 73 92 74 92 76 C92 84 86 92 80 93 C74 92 68 84 68 76 Z" fill="#F8FAFC" stroke="#FB923C" strokeWidth="1.8" />
          {/* Mask ear loops */}
          <path d="M68 76 C62 76 58 78 58 80" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <path d="M92 76 C98 76 102 78 102 80" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          {/* Mask valve dot */}
          <circle cx="80" cy="82" r="2.5" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />

          {/* Floating particulate dust wisps */}
          <circle cx="28" cy="70" r="2" fill="#FDBA74" opacity="0.6" />
          <circle cx="36" cy="85" r="2.5" fill="#FDBA74" opacity="0.5" />
          <circle cx="132" cy="75" r="2.5" fill="#FDBA74" opacity="0.6" />

          <defs>
            <radialGradient id="poor-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FB923C" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FB923C" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      );

    case 'Very Poor':
      // Careful character safely staying indoors with clean air shield & N95 mask
      return (
        <svg
          viewBox="0 0 160 160"
          width={size}
          height={size}
          className={`${className} motion-safe:transition-transform hover:scale-105 duration-300`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="80" cy="80" r="70" fill="url(#vpoor-glow)" opacity="0.4" />
          <circle cx="80" cy="80" r="58" stroke="#F87171" strokeWidth="1.8" strokeDasharray="4 3" opacity="0.6" />

          {/* Protective indoor arch */}
          <path d="M30 140 C30 75 52 50 80 50 C108 50 130 75 130 140" stroke="#F87171" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.35" fill="none" />

          {/* Torso */}
          <path d="M46 140 C46 114 62 105 80 105 C98 105 114 114 114 140 Z" fill="#1E293B" stroke="#F87171" strokeWidth="2" />

          {/* Head & Neck */}
          <rect x="74" y="90" width="12" height="16" rx="4" fill="#F8C291" />
          <circle cx="80" cy="74" r="24" fill="#F8C291" />

          {/* Hair */}
          <path d="M56 70 C56 50 68 46 80 46 C92 46 104 50 104 70 C96 63 88 63 80 63 C72 63 64 63 56 70 Z" fill="#0F172A" />

          {/* Concerned, caring eyes */}
          <circle cx="73" cy="69" r="2.2" fill="#0F172A" />
          <circle cx="87" cy="69" r="2.2" fill="#0F172A" />
          <path d="M70 66 Q73 64 77 66" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          <path d="M83 66 Q87 64 90 66" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" fill="none" />

          {/* Fitted N95 White Respirator Mask */}
          <path d="M67 76 C67 74 74 72 80 72 C86 72 93 74 93 76 C93 85 86 93 80 94 C74 93 67 85 67 76 Z" fill="#FFFFFF" stroke="#F87171" strokeWidth="2" />
          <path d="M67 76 C60 76 56 78 56 81" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <path d="M93 76 C100 76 104 78 104 81" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          {/* Exhalation valve */}
          <rect x="77" y="79" width="6" height="6" rx="2" fill="#E2E8F0" stroke="#F87171" strokeWidth="1" />

          {/* Clean air shield icon badge */}
          <path d="M125 35 L135 40 L135 50 C135 57 130 63 125 65 C120 63 115 57 115 50 L115 40 Z" fill="#1E293B" stroke="#F87171" strokeWidth="1.5" />
          <path d="M122 49 L125 52 L129 46" stroke="#F87171" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Outdoor smoke particles outside shield */}
          <circle cx="24" cy="55" r="2.5" fill="#FCA5A5" opacity="0.6" />
          <circle cx="28" cy="72" r="3" fill="#FCA5A5" opacity="0.5" />
          <circle cx="22" cy="90" r="2.5" fill="#FCA5A5" opacity="0.6" />

          <defs>
            <radialGradient id="vpoor-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F87171" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#F87171" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      );

    case 'Severe':
    default:
      // High alert, fully protected guardian advising clean indoor air
      return (
        <svg
          viewBox="0 0 160 160"
          width={size}
          height={size}
          className={`${className} motion-safe:transition-transform hover:scale-105 duration-300`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="80" cy="80" r="70" fill="url(#sev-glow)" opacity="0.45" />
          <circle cx="80" cy="80" r="58" stroke="#DC2626" strokeWidth="2" strokeDasharray="5 3" opacity="0.7" />

          {/* Reinforced shelter dome */}
          <path d="M26 140 C26 65 50 42 80 42 C110 42 134 65 134 140" stroke="#DC2626" strokeWidth="1.8" strokeDasharray="3 3" opacity="0.4" fill="none" />

          {/* Torso */}
          <path d="M46 140 C46 114 62 105 80 105 C98 105 114 114 114 140 Z" fill="#1E293B" stroke="#DC2626" strokeWidth="2.2" />

          {/* Head & Neck */}
          <rect x="74" y="90" width="12" height="16" rx="4" fill="#F8C291" />
          <circle cx="80" cy="74" r="24" fill="#F8C291" />

          {/* Protective hood */}
          <path d="M54 74 C54 48 66 44 80 44 C94 44 106 48 106 74 C98 66 88 64 80 64 C72 64 62 66 54 74 Z" fill="#0F172A" />

          {/* Focused, vigilant eyes */}
          <circle cx="73" cy="69" r="2.2" fill="#0F172A" />
          <circle cx="87" cy="69" r="2.2" fill="#0F172A" />
          <path d="M70 65 L76 66" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M84 66 L90 65" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />

          {/* Medical-grade N95 Respirator with red seal */}
          <path d="M66 76 C66 73 73 72 80 72 C87 72 94 73 94 76 C94 86 87 94 80 95 C73 94 66 86 66 76 Z" fill="#FFFFFF" stroke="#DC2626" strokeWidth="2.2" />
          <path d="M66 76 C58 76 54 79 54 82" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M94 76 C102 76 106 79 106 82" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <circle cx="80" cy="83" r="3" fill="#DC2626" />

          {/* Home sanctuary shield icon */}
          <path d="M125 35 L135 40 L135 50 C135 57 130 63 125 65 C120 63 115 57 115 50 L115 40 Z" fill="#1E293B" stroke="#DC2626" strokeWidth="1.6" />
          <path d="M121 48 L125 44 L129 48 M125 45 L125 54" stroke="#DC2626" strokeWidth="1.6" strokeLinecap="round" />

          <defs>
            <radialGradient id="sev-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#DC2626" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      );
  }
};

/**
 * Friendly conversational advice dialogue tailored to the current AQI and neighborhood
 */
export function getCompanionDialogue(
  category: AQICategory,
  stationName: string,
  pm25: number
): {
  headline: string;
  advice: string;
  mood: 'joyful' | 'relaxed' | 'mindful' | 'attentive' | 'protective' | 'vigilant';
} {
  switch (category) {
    case 'Good':
      return {
        headline: `Fresh and clean air in ${stationName}!`,
        advice: 'Take advantage of this wonderful air quality: head out for a jog, open the windows, and let your home breathe.',
        mood: 'joyful',
      };
    case 'Satisfactory':
      return {
        headline: `Air quality is pleasant in ${stationName}.`,
        advice: 'Great conditions for your daily commute and outdoor activities. Only individuals with sensitive allergies need caution.',
        mood: 'relaxed',
      };
    case 'Moderate':
      return {
        headline: `Noticeable haze in ${stationName} today.`,
        advice: 'Normal outdoor routines are fine, but consider scheduling heavy running during the clearer afternoon hours.',
        mood: 'mindful',
      };
    case 'Poor':
      return {
        headline: `Dust and particles are high in ${stationName}.`,
        advice: 'Wearing an N95 mask during road travel will keep your lungs comfortable. Prefer lighter workouts in shaded parks.',
        mood: 'attentive',
      };
    case 'Very Poor':
      return {
        headline: `Thick winter pollution across ${stationName}.`,
        advice: 'Prioritize indoor activities today. Keep your windows shut, run an air purifier in sleeping rooms, and slip on an N95 if traveling.',
        mood: 'protective',
      };
    case 'Severe':
    default:
      return {
        headline: `High pollution alert in ${stationName}.`,
        advice: 'Protect yourself and your loved ones by staying indoors in filtered rooms. Avoid all heavy outdoor cardio today.',
        mood: 'vigilant',
      };
  }
}

