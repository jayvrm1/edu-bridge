/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface MascotProps {
  expression?: 'greeting' | 'signing' | 'thinking' | 'cheering';
  size?: number;
  className?: string;
  badge?: string;
}

export const Mascot: React.FC<MascotProps> = ({
  expression = 'greeting',
  size = 120,
  className = '',
  badge,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`EduBridge AI Mascot Bridgey ${expression}`}
    >
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm transition-transform duration-300 hover:scale-105"
      >
        {/* Glow / Background aura */}
        <circle cx="100" cy="100" r="85" fill="#FFF0C9" />

        {/* Antennas */}
        <line x1="100" y1="46" x2="100" y2="28" stroke="#222222" strokeWidth="4" strokeLinecap="round" />
        <circle cx="100" cy="24" r="8" fill="#F28C00" stroke="#222222" strokeWidth="3" />
        {expression === 'thinking' && (
          <path d="M104 20 Q112 12 118 18" stroke="#F28C00" strokeWidth="3" strokeLinecap="round" fill="none" />
        )}

        {/* Robot Head */}
        <rect
          x="48"
          y="46"
          width="104"
          height="80"
          rx="26"
          fill="#FFD966"
          stroke="#222222"
          strokeWidth="4"
        />

        {/* Face Screen Visor */}
        <rect
          x="58"
          y="56"
          width="84"
          height="54"
          rx="18"
          fill="#222222"
        />

        {/* Cheerful Eyes */}
        {expression === 'cheering' ? (
          <>
            {/* Happy arch eyes */}
            <path d="M72 82 Q80 72 88 82" stroke="#FFD966" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M112 82 Q120 72 128 82" stroke="#FFD966" strokeWidth="4" strokeLinecap="round" fill="none" />
          </>
        ) : expression === 'thinking' ? (
          <>
            <circle cx="80" cy="80" r="7" fill="#FFD966" />
            <ellipse cx="120" cy="76" rx="8" ry="4" fill="#FFD966" />
          </>
        ) : (
          <>
            {/* Friendly round eyes */}
            <circle cx="80" cy="80" r="7.5" fill="#FFD966" />
            <circle cx="83" cy="78" r="2.5" fill="#FFFFFF" />
            <circle cx="120" cy="80" r="7.5" fill="#FFD966" />
            <circle cx="123" cy="78" r="2.5" fill="#FFFFFF" />
          </>
        )}

        {/* Rosy Cheeks */}
        <circle cx="68" cy="94" r="5" fill="#F6C4C4" />
        <circle cx="132" cy="94" r="5" fill="#F6C4C4" />

        {/* Smiling Digital Mouth */}
        {expression === 'greeting' && (
          <path d="M92 92 Q100 98 108 92" stroke="#FFD966" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        )}
        {expression === 'signing' && (
          <path d="M93 92 Q100 96 107 92" stroke="#FFD966" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        )}
        {expression === 'cheering' && (
          <path d="M92 90 Q100 102 108 90 Z" fill="#F28C00" stroke="#FFD966" strokeWidth="2" />
        )}
        {expression === 'thinking' && (
          <line x1="94" y1="94" x2="106" y2="94" stroke="#FFD966" strokeWidth="3" strokeLinecap="round" />
        )}

        {/* Robot Body */}
        <rect
          x="62"
          y="132"
          width="76"
          height="54"
          rx="18"
          fill="#FFFFFF"
          stroke="#222222"
          strokeWidth="4"
        />

        {/* Chest Heart / Badge Indicator */}
        <circle cx="100" cy="158" r="14" fill="#FFE0BD" stroke="#222222" strokeWidth="3" />
        <text
          x="100"
          y="163"
          textAnchor="middle"
          fontSize="14"
          fontWeight="bold"
          fill="#F28C00"
        >
          {expression === 'signing' ? '🤟' : '★'}
        </text>

        {/* Arms / Hands */}
        {expression === 'greeting' ? (
          <>
            {/* Left resting arm */}
            <path d="M62 144 C45 152 46 168 56 172" stroke="#222222" strokeWidth="4" strokeLinecap="round" fill="none" />
            <circle cx="56" cy="172" r="7" fill="#FFD966" stroke="#222222" strokeWidth="3" />
            {/* Right waving arm */}
            <path d="M138 144 C158 135 168 115 160 98" stroke="#222222" strokeWidth="4" strokeLinecap="round" fill="none" />
            <circle cx="160" cy="94" r="9" fill="#FFD966" stroke="#222222" strokeWidth="3" />
            {/* Sparkles around wave */}
            <path d="M172 88 L176 84 M172 98 L177 100" stroke="#F28C00" strokeWidth="2.5" strokeLinecap="round" />
          </>
        ) : expression === 'signing' ? (
          <>
            {/* Both hands poised in active sign */}
            <path d="M62 144 C42 140 40 120 54 112" stroke="#222222" strokeWidth="4" strokeLinecap="round" fill="none" />
            <circle cx="56" cy="110" r="9" fill="#FFD966" stroke="#222222" strokeWidth="3" />
            <path d="M138 144 C158 140 160 120 146 112" stroke="#222222" strokeWidth="4" strokeLinecap="round" fill="none" />
            <circle cx="144" cy="110" r="9" fill="#FFD966" stroke="#222222" strokeWidth="3" />
          </>
        ) : expression === 'cheering' ? (
          <>
            {/* Both arms raised up */}
            <path d="M62 144 C42 128 35 100 45 80" stroke="#222222" strokeWidth="4" strokeLinecap="round" fill="none" />
            <circle cx="46" cy="76" r="9" fill="#FFD966" stroke="#222222" strokeWidth="3" />
            <path d="M138 144 C158 128 165 100 155 80" stroke="#222222" strokeWidth="4" strokeLinecap="round" fill="none" />
            <circle cx="154" cy="76" r="9" fill="#FFD966" stroke="#222222" strokeWidth="3" />
          </>
        ) : (
          <>
            {/* Thinking pose */}
            <path d="M62 144 C48 152 48 168 58 172" stroke="#222222" strokeWidth="4" strokeLinecap="round" fill="none" />
            <circle cx="58" cy="172" r="7" fill="#FFD966" stroke="#222222" strokeWidth="3" />
            <path d="M138 144 C152 140 150 115 138 108" stroke="#222222" strokeWidth="4" strokeLinecap="round" fill="none" />
            <circle cx="138" cy="106" r="8" fill="#FFD966" stroke="#222222" strokeWidth="3" />
          </>
        )}
      </svg>

      {/* Floating Badge */}
      {badge && (
        <span className="absolute -bottom-1 -right-1 bg-[#F28C00] text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#222222] shadow-sm">
          {badge}
        </span>
      )}
    </div>
  );
};
