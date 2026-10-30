/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AACItem } from '../../types';
import { AAC_GRID_ITEMS } from '../../services/api/mockData';
import { useAccessibility } from '../../context/AccessibilityContext';
import { MessageSquare, Sparkles, Volume2 } from 'lucide-react';

interface AACKeyboardProps {
  onSelectPhrase: (phrase: string, signToken?: string) => void;
  className?: string;
}

export const AACKeyboard: React.FC<AACKeyboardProps> = ({ onSelectPhrase, className = '' }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const { speak } = useAccessibility();

  const categories = [
    { id: 'all', label: 'All Tiles' },
    { id: 'greetings', label: '👋 Greetings' },
    { id: 'needs', label: '🆘 Urgent Needs' },
    { id: 'learning', label: '💡 Questions' },
    { id: 'feelings', label: '😊 Feelings' },
  ];

  const filtered = activeCategory === 'all'
    ? AAC_GRID_ITEMS
    : AAC_GRID_ITEMS.filter((item) => item.category === activeCategory);

  const handleTileClick = (item: AACItem) => {
    speak(item.phrase);
    onSelectPhrase(item.phrase, item.signToken);
  };

  return (
    <div className={`p-4 bg-[#FFFFFF] rounded-2xl border-2 border-[#222222] shadow-stitch space-y-3 ${className}`}>
      {/* Category selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FFD966] text-[#222222] flex items-center justify-center border border-[#222222]">
            <MessageSquare className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#222222]">
            AAC Communication Phrase Board
          </h3>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                activeCategory === c.id
                  ? 'bg-[#F28C00] text-white border-[#222222]'
                  : 'bg-[#F1F1F1] text-[#666666] border-transparent hover:border-[#222222]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* AAC Tiles Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTileClick(item)}
            className="p-3 bg-[#FFF0C9]/40 hover:bg-[#FFE0BD] active:scale-98 rounded-xl border-2 border-[#222222] text-left transition flex flex-col justify-between group shadow-stitch-sm"
          >
            <div className="flex items-start justify-between w-full">
              <span className="text-2xl group-hover:scale-110 transition-transform">
                {item.icon}
              </span>
              {item.signToken && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FFD966] border border-[#222222] text-[#222222]">
                  {item.signToken}
                </span>
              )}
            </div>

            <div className="mt-2">
              <div className="text-xs font-extrabold text-[#222222] leading-tight">
                {item.label}
              </div>
              <p className="text-[10px] text-[#666666] truncate mt-0.5">
                {item.phrase}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="text-[10px] text-[#888888] flex items-center justify-between pt-1">
        <span>Click any tile to read aloud & insert into AI Tutor</span>
        <span className="font-semibold text-[#F28C00]">12 Quick Accessibility Tiles</span>
      </div>
    </div>
  );
};
