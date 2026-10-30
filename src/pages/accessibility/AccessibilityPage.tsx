/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAuth } from '../../context/AuthContext';
import {
  Eye,
  Type,
  Volume2,
  Sliders,
  Check,
  Video,
  Sparkles,
  Zap,
  Ear,
  MessageSquare,
} from 'lucide-react';

export const AccessibilityPage: React.FC = () => {
  const { preferences, updatePreference, toggleNeed, speak, stopSpeaking, isSpeaking } =
    useAccessibility();
  const { user } = useAuth();

  const accessibilityNeeds = [
    {
      id: 'hearing_impairment' as const,
      label: 'Hearing Impairment / D/deaf',
      desc: 'Enables high-contrast captions, visual sign avatar, and visual notification cues.',
      icon: '🤟',
    },
    {
      id: 'visual_impairment' as const,
      label: 'Visual Impairment / Low Vision',
      desc: 'Enables large text sizing, high-contrast borders, and rich screen-reader descriptions.',
      icon: '👁️',
    },
    {
      id: 'speech_impairment' as const,
      label: 'Speech Impairment / Non-Speaking',
      desc: 'Enables interactive AAC phrase boards, sign input camera, and instant text-to-speech.',
      icon: '💬',
    },
    {
      id: 'adhd_cognitive' as const,
      label: 'ADHD & Cognitive Focus Support',
      desc: 'Offers simplified multi-step breakdown modes, break reminders, and reduced distractions.',
      icon: '🧠',
    },
    {
      id: 'motor_mobility' as const,
      label: 'Motor & Mobility Accommodations',
      desc: 'Expanded click targets, full keyboard tab order, and voice navigation options.',
      icon: '⌨️',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#222222]">
            Accessibility & Accommodation Controls
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-[#FFF0C9] text-[#222222] border border-[#222222] text-xs font-bold">
            Zero Barriers
          </span>
        </div>
        <p className="text-xs text-[#666666] mt-0.5">
          EduBridge AI empowers you to customize sensory, cognitive, and physical interaction without medical hurdles.
        </p>
      </div>

      {/* 1. Personalized Accessibility Profile Needs (No Medical Docs Required) */}
      <div className="p-6 bg-[#FFFFFF] rounded-2xl border-2 border-[#222222] shadow-stitch space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#222222]">
            Self-Selected Accommodation Preferences
          </h2>
          <p className="text-xs text-[#666666]">
            Select all that apply to you. You can adjust these anytime without losing your learning progress.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {accessibilityNeeds.map((need) => {
            const isSelected = preferences.needs.includes(need.id);
            return (
              <button
                key={need.id}
                onClick={() => toggleNeed(need.id)}
                className={`p-4 rounded-xl border-2 text-left transition flex items-start gap-3 ${
                  isSelected
                    ? 'bg-[#FFF0C9] border-[#222222] shadow-xs'
                    : 'bg-[#F1F1F1] hover:bg-[#FFE0BD]/30 border-[#222222]/20'
                }`}
              >
                <span className="text-2xl shrink-0 mt-0.5">{need.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#222222]">{need.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#F28C00] shrink-0" />}
                  </div>
                  <p className="text-[11px] text-[#666666] mt-1 leading-snug">{need.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Visual & Display Preferences */}
      <div className="p-6 bg-[#FFFFFF] rounded-2xl border-2 border-[#222222] shadow-stitch space-y-4">
        <h2 className="text-base font-bold text-[#222222] flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#F28C00]" />
          <span>Visual & Display Adaptations</span>
        </h2>

        <div className="space-y-4 divide-y divide-[#222222]/15">
          {/* Text Size Scaling */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-[#222222]">Text Size Scaling</div>
              <p className="text-[11px] text-[#666666]">
                Adjust base typography scale for all learning modules and menus.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(['normal', 'large', 'xlarge'] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => updatePreference('textSize', sz)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition capitalize ${
                    preferences.textSize === sz
                      ? 'bg-[#F28C00] text-white border-[#222222]'
                      : 'bg-[#F1F1F1] text-[#222222] border-[#222222]/20 hover:border-[#222222]'
                  }`}
                >
                  {sz === 'normal' ? 'Normal (100%)' : sz === 'large' ? 'Large (115%)' : 'Extra Large (125%)'}
                </button>
              ))}
            </div>
          </div>

          {/* High Contrast Mode */}
          <div className="pt-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-[#222222]">High Contrast Theme</div>
              <p className="text-[11px] text-[#666666]">
                Boosts text luminosity and thickens outlines to exceed WCAG AAA standards.
              </p>
            </div>
            <button
              onClick={() => updatePreference('highContrast', !preferences.highContrast)}
              className={`w-12 h-7 rounded-full border-2 border-[#222222] transition p-0.5 ${
                preferences.highContrast ? 'bg-[#F28C00]' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white border border-[#222222] transition-transform ${
                  preferences.highContrast ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Reduced Motion */}
          <div className="pt-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-[#222222]">Reduced Motion</div>
              <p className="text-[11px] text-[#666666]">
                Minimizes 3D bobbing, spring animations, and celebratory particles.
              </p>
            </div>
            <button
              onClick={() => updatePreference('reducedMotion', !preferences.reducedMotion)}
              className={`w-12 h-7 rounded-full border-2 border-[#222222] transition p-0.5 ${
                preferences.reducedMotion ? 'bg-[#F28C00]' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white border border-[#222222] transition-transform ${
                  preferences.reducedMotion ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Audio & Speech Preferences */}
      <div className="p-6 bg-[#FFFFFF] rounded-2xl border-2 border-[#222222] shadow-stitch space-y-4">
        <h2 className="text-base font-bold text-[#222222] flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-[#F28C00]" />
          <span>Speech, Voice & Captions</span>
        </h2>

        <div className="space-y-4 divide-y divide-[#222222]/15">
          {/* Captions Enabled */}
          <div className="pt-2 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-[#222222]">Synchronized Captions</div>
              <p className="text-[11px] text-[#666666]">
                Displays persistent real-time captions for every spoken audio prompt.
              </p>
            </div>
            <button
              onClick={() => updatePreference('captionsEnabled', !preferences.captionsEnabled)}
              className={`w-12 h-7 rounded-full border-2 border-[#222222] transition p-0.5 ${
                preferences.captionsEnabled ? 'bg-[#F28C00]' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white border border-[#222222] transition-transform ${
                  preferences.captionsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Speech Rate Slider & Test Button */}
          <div className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#222222]">
                  Text-to-Speech Speed ({preferences.speechRate}x)
                </div>
                <p className="text-[11px] text-[#666666]">
                  Calibrate how fast synthetic speech narration reads aloud.
                </p>
              </div>
              <button
                onClick={() => speak('This is a test of your EduBridge AI voice narration speed.')}
                className="px-3 py-1.5 bg-[#FFF0C9] text-[#222222] rounded-full border border-[#222222] text-xs font-bold hover:bg-[#FFD966] transition flex items-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Test Audio</span>
              </button>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.3"
              step="0.1"
              value={preferences.speechRate}
              onChange={(e) => updatePreference('speechRate', parseFloat(e.target.value))}
              className="w-full accent-[#F28C00] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 4. 3D Sign Avatar & AAC Controls */}
      <div className="p-6 bg-[#FFFFFF] rounded-2xl border-2 border-[#222222] shadow-stitch space-y-4">
        <h2 className="text-base font-bold text-[#222222] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#F28C00]" />
          <span>Sign Language Avatar & AAC Board</span>
        </h2>

        <div className="space-y-4 divide-y divide-[#222222]/15">
          {/* Avatar Speed */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-[#222222]">3D Avatar Gesture Speed</div>
              <p className="text-[11px] text-[#666666]">
                Slow down sign demonstrations for clearer visual finger-spelling inspection.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {[0.5, 1.0, 1.5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => updatePreference('avatarSpeed', spd)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition ${
                    preferences.avatarSpeed === spd
                      ? 'bg-[#F28C00] text-white border-[#222222]'
                      : 'bg-[#F1F1F1] text-[#222222] border-[#222222]/20 hover:border-[#222222]'
                  }`}
                >
                  {spd}x {spd === 0.5 ? '(Slow)' : spd === 1.0 ? '(Normal)' : '(Fast)'}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Sign Language System */}
          <div className="pt-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-[#222222]">Default Sign System</div>
              <p className="text-[11px] text-[#666666]">
                Configure dialect between Indian Sign Language and American Sign Language.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(['ISL', 'ASL'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => updatePreference('preferredSignLanguage', lang)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition ${
                    preferences.preferredSignLanguage === lang
                      ? 'bg-[#FFD966] text-[#222222] border-[#222222]'
                      : 'bg-[#F1F1F1] text-[#666666] border-[#222222]/20'
                  }`}
                >
                  {lang === 'ISL' ? 'Indian (ISL)' : 'American (ASL)'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
