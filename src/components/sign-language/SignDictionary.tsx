/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Volume2, Sparkles, Filter } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';

interface DictionaryEntry {
  sign: string;
  category: 'Alphabet' | 'Greetings' | 'Courtesy' | 'Education' | 'Everyday';
  description: string;
  hindiTranslation: string;
  icon?: string;
}

const DICTIONARY_ITEMS: DictionaryEntry[] = [
  { sign: 'A', category: 'Alphabet', description: 'Closed fist with thumb resting alongside index finger', hindiTranslation: 'ए', icon: '✊' },
  { sign: 'B', category: 'Alphabet', description: 'Four fingers upright and flat together, thumb folded across palm', hindiTranslation: 'बी', icon: '✋' },
  { sign: 'C', category: 'Alphabet', description: 'Hand curved smoothly into a crescent "C" shape', hindiTranslation: 'सी', icon: '🤏' },
  { sign: 'D', category: 'Alphabet', description: 'Index finger points straight up, other fingers touch thumb in a circle', hindiTranslation: 'डी', icon: '☝️' },
  { sign: 'E', category: 'Alphabet', description: 'Fingertips curl down to touch the thumb tip', hindiTranslation: 'ई', icon: '✊' },
  { sign: 'NAMASTE', category: 'Greetings', description: 'Palms pressed together at chest level with gentle respectful head bow', hindiTranslation: 'नमस्ते', icon: '🙏' },
  { sign: 'HELLO', category: 'Greetings', description: 'Open flat hand raised to temple, sweeping gently forward', hindiTranslation: 'नमस्ते / हैलो', icon: '👋' },
  { sign: 'THANK YOU', category: 'Courtesy', description: 'Fingers touch chin, sweep forward and slightly down with open palm', hindiTranslation: 'धन्यवाद', icon: '✨' },
  { sign: 'WELCOME', category: 'Courtesy', description: 'Open hands sweeping inward towards body in warm reception', hindiTranslation: 'स्वागत है', icon: '🤝' },
  { sign: 'HELP', category: 'Everyday', description: 'Thumbs-up hand rests on flat palm and both are raised upward together', hindiTranslation: 'मदद', icon: '🆘' },
  { sign: 'YES', category: 'Everyday', description: 'Fist nods up and down at wrist twice like a nodding head', hindiTranslation: 'हाँ', icon: '👍' },
  { sign: 'NO', category: 'Everyday', description: 'Index and middle fingers snap swiftly down against thumb', hindiTranslation: 'नहीं', icon: '👎' },
  { sign: 'GOOD', category: 'Courtesy', description: 'Right fingers touch chin, then drop into open left palm', hindiTranslation: 'अच्छा', icon: '🌟' },
  { sign: 'LEARN', category: 'Education', description: 'Sweeping hand motion lifting knowledge from flat open book palm to forehead', hindiTranslation: 'सीखना', icon: '📖' },
  { sign: 'TEACHER', category: 'Education', description: 'Both hands sweep outward from temples followed by person marker sign', hindiTranslation: 'अध्यापक', icon: '🧑‍🏫' },
  { sign: 'STUDENT', category: 'Education', description: 'Sign for "Learn" combined with vertical person marker downwards', hindiTranslation: 'विद्यार्थी', icon: '🎒' },
];

export const SignDictionary: React.FC<{ onSelectSign?: (sign: string) => void }> = ({ onSelectSign }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const { speak } = useAccessibility();

  const categories = ['All', 'Alphabet', 'Greetings', 'Courtesy', 'Education', 'Everyday'];

  const filtered = DICTIONARY_ITEMS.filter((item) => {
    const matchesSearch =
      item.sign.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.hindiTranslation.includes(searchTerm);
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="p-4 bg-[#FFFFFF] rounded-2xl border-2 border-[#222222] shadow-stitch flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search ISL sign or translation..."
            className="w-full pl-9 pr-4 py-2 rounded-full border-2 border-[#222222] text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#F28C00]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition shrink-0 ${
                selectedCategory === cat
                  ? 'bg-[#F28C00] text-white border-[#222222]'
                  : 'bg-[#F1F1F1] text-[#666666] border-[#222222]/20 hover:border-[#222222]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Dictionary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((item) => (
          <div
            key={item.sign}
            className="p-4 bg-[#FFFFFF] rounded-2xl border-2 border-[#222222] shadow-stitch hover:border-[#F28C00] transition flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between">
                <span className="text-2xl">{item.icon || '🤟'}</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#FFF0C9] border border-[#222222] text-[#222222]">
                  {item.category}
                </span>
              </div>
              <h4 className="text-base font-extrabold text-[#222222] mt-2 group-hover:text-[#F28C00] transition">
                {item.sign}
              </h4>
              <p className="text-xs font-semibold text-[#F28C00]">{item.hindiTranslation}</p>
              <p className="text-xs text-[#666666] mt-2 leading-relaxed">{item.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#222222]/15 flex items-center justify-between">
              <button
                onClick={() => speak(`${item.sign}. In Hindi: ${item.hindiTranslation}. ${item.description}`)}
                className="p-1.5 rounded-full bg-[#F1F1F1] hover:bg-[#FFE0BD] border border-[#222222] transition"
                title="Speak description"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#222222]" />
              </button>

              {onSelectSign && (
                <button
                  onClick={() => onSelectSign(item.sign)}
                  className="px-3 py-1 bg-[#FFD966] text-[#222222] rounded-full text-[11px] font-bold border border-[#222222] hover:bg-[#FFE0BD] transition"
                >
                  View 3D Demo
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
