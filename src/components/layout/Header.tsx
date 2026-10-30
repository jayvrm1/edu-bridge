/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Bell, Volume2, Eye, Menu, Sparkles, SlidersHorizontal, Check } from 'lucide-react';
import { useAuth, DEMO_PROFILES } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';

interface HeaderProps {
  onToggleMobileNav: () => void;
  onOpenBackendModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileNav, onOpenBackendModal }) => {
  const { user, switchDemoProfile } = useAuth();
  const { preferences, updatePreference, speak } = useAccessibility();
  const [searchQuery, setSearchQuery] = useState('');
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, text: '🔥 7-Day streak milestone reached! Keep it going!', time: '10m ago' },
    { id: 2, text: '🎯 Daily Challenge ready: Master 5 Greeting signs.', time: '1h ago' },
    { id: 3, text: '🏆 You passed Maya into #12 on Gold Division leaderboard!', time: '3h ago' },
  ];

  return (
    <header className="px-5 py-3.5 bg-[#FFFFFF] border-b-2 border-stitch-dashed flex items-center justify-between gap-4">
      {/* Left: Mobile Menu Toggle & Global Search Field (Stitch Spec) */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onToggleMobileNav}
          className="lg:hidden p-2 rounded-xl border-2 border-[#222222] bg-[#F1F1F1] hover:bg-[#FFE0BD] transition"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5 text-[#222222]" />
        </button>

        {/* Global Search Pill Input */}
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses, signs, tutors, or concepts..."
            className="w-full pl-9 pr-4 py-2 rounded-full border-2 border-[#222222] text-xs bg-[#FFFFFF] text-[#222222] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#F28C00]"
          />
        </div>
      </div>

      {/* Right: Quick Accessibility Tools & Personas */}
      <div className="flex items-center gap-2.5">
        {/* Persona Quick Switcher (For inclusive evaluation) */}
        <div className="relative">
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="px-3 py-1.5 rounded-full bg-[#FFF0C9] border-2 border-[#222222] text-xs font-bold text-[#222222] hover:bg-[#FFD966] transition flex items-center gap-1.5 shadow-xs"
            title="Switch demo accessibility persona"
          >
            <span className="text-sm">
              {user?.preferences.needs.includes('hearing_impairment')
                ? '🤟'
                : user?.preferences.needs.includes('speech_impairment')
                ? '💬'
                : '👁️'}
            </span>
            <span className="hidden sm:inline">{user?.name.split(' ')[0]}</span>
            <span className="text-[10px] text-[#666666] hidden md:inline">
              ({user?.preferences.preferredSignLanguage || 'ISL'})
            </span>
          </button>

          {showPersonaMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border-2 border-[#222222] shadow-xl p-2 z-50 animate-fade-in">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-[#888888] tracking-wider">
                Select Persona Profile
              </div>
              {(['maya', 'alex', 'samira'] as const).map((key) => {
                const profile = DEMO_PROFILES[key];
                const isActive = user?.id === profile.id;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      switchDemoProfile(key);
                      setShowPersonaMenu(false);
                    }}
                    className={`w-full p-2 rounded-xl text-left transition flex items-center justify-between ${
                      isActive ? 'bg-[#FFF0C9] font-bold border border-[#222222]' : 'hover:bg-[#F1F1F1]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#222222]">{profile.name}</div>
                      <div className="text-[10px] text-[#666666]">{profile.levelTitle}</div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-[#F28C00]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Text-to-speech page reader */}
        <button
          onClick={() => speak('EduBridge AI: Learning without communication barriers. Explore your courses, sign language studio, or AI tutor.')}
          className="p-2 rounded-full bg-[#FFFFFF] border-2 border-[#222222] hover:bg-[#FFE0BD] text-[#222222] transition"
          title="Read screen overview"
        >
          <Volume2 className="w-4 h-4" />
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-full bg-[#FFFFFF] border-2 border-[#222222] hover:bg-[#FFE0BD] text-[#222222] transition relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-[#F28C00] border-2 border-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border-2 border-[#222222] shadow-xl p-3 z-50 animate-fade-in space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#222222]/15">
                <span className="text-xs font-extrabold text-[#222222]">Learning Alerts</span>
                <span className="text-[10px] font-bold text-[#F28C00]">3 New</span>
              </div>
              {notifications.map((n) => (
                <div key={n.id} className="p-2 rounded-xl bg-[#FFF0C9]/40 border border-[#222222]/10 text-xs">
                  <p className="text-[#222222] font-semibold">{n.text}</p>
                  <span className="text-[10px] text-[#888888]">{n.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
