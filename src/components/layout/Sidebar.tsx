/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { Mascot } from '../common/Mascot';
import {
  LayoutDashboard,
  Bot,
  Video,
  BookOpen,
  Gamepad2,
  Trophy,
  Award,
  Sliders,
  User as UserIcon,
  Server,
  LogOut,
  ChevronRight,
  Eye,
  Type,
  Volume2,
} from 'lucide-react';

export type NavRoute =
  | 'dashboard'
  | 'tutor'
  | 'sign-studio'
  | 'courses'
  | 'quizzes'
  | 'achievements'
  | 'leaderboard'
  | 'accessibility'
  | 'profile';

interface SidebarProps {
  currentRoute: NavRoute;
  onNavigate: (route: NavRoute) => void;
  onOpenBackendModal: () => void;
  isBackendConnected: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  onOpenBackendModal,
  isBackendConnected,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();
  const { preferences, updatePreference } = useAccessibility();

  const handleNav = (route: NavRoute) => {
    onNavigate(route);
    if (onCloseMobile) onCloseMobile();
  };

  const navItemClass = (route: NavRoute) => {
    const isActive = currentRoute === route;
    return `w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-bold transition ${
      isActive
        ? 'bg-[#FFF0C9] text-[#222222] border-2 border-[#222222] shadow-xs'
        : 'text-[#222222] hover:bg-[#F1F1F1] border-2 border-transparent'
    }`;
  };

  return (
    <aside className="w-full lg:w-64 bg-[#FFFFFF] border-r-2 border-stitch-dashed flex flex-col justify-between p-4 h-full overflow-y-auto">
      {/* Top Brand & Profile */}
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2">
          <Mascot expression="greeting" size={42} />
          <div>
            <div className="text-base font-extrabold text-[#222222] tracking-tight flex items-center gap-1">
              <span>EduBridge</span>
              <span className="text-[#F28C00]">AI</span>
            </div>
            <p className="text-[10px] text-[#666666] font-medium leading-none">
              Learning Without Barriers
            </p>
          </div>
        </div>

        {/* User Profile Capsule (Stitch Spec) */}
        {user && (
          <div
            onClick={() => handleNav('profile')}
            className="p-3 bg-[#F1F1F1] rounded-2xl border-2 border-[#222222] flex items-center gap-3 cursor-pointer hover:bg-[#FFE0BD]/40 transition group"
          >
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-[#222222] shrink-0"
            />
            <div className="overflow-hidden flex-1">
              <div className="text-xs font-extrabold text-[#222222] truncate group-hover:text-[#F28C00] transition">
                {user.name}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-bold text-[#F28C00] bg-[#FFF0C9] px-1.5 py-0.2 rounded-md border border-[#222222]/20">
                  Lvl {user.level}
                </span>
                <span className="text-[10px] text-[#666666] truncate">
                  {user.levelTitle}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#666666] group-hover:translate-x-0.5 transition-transform" />
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="space-y-5" aria-label="Main Navigation">
          {/* Section: LEARNING */}
          <div className="space-y-1.5">
            <div className="px-3 text-[10px] font-extrabold text-[#888888] tracking-widest uppercase">
              Learning
            </div>
            <button
              onClick={() => handleNav('dashboard')}
              className={navItemClass('dashboard')}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-[#F28C00]" />
                <span>Dashboard</span>
              </div>
              <span className="text-sm">🏠</span>
            </button>
            <button
              onClick={() => handleNav('tutor')}
              className={navItemClass('tutor')}
            >
              <div className="flex items-center gap-2.5">
                <Bot className="w-4 h-4 text-[#F28C00]" />
                <span>AI Tutor</span>
              </div>
              <span className="text-sm">🧠</span>
            </button>
            <button
              onClick={() => handleNav('sign-studio')}
              className={navItemClass('sign-studio')}
            >
              <div className="flex items-center gap-2.5">
                <Video className="w-4 h-4 text-[#F28C00]" />
                <span>Sign Studio</span>
              </div>
              <span className="text-sm">🤟</span>
            </button>
            <button
              onClick={() => handleNav('courses')}
              className={navItemClass('courses')}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-[#F28C00]" />
                <span>My Courses</span>
              </div>
              <span className="text-sm">📚</span>
            </button>
            <button
              onClick={() => handleNav('quizzes')}
              className={navItemClass('quizzes')}
            >
              <div className="flex items-center gap-2.5">
                <Gamepad2 className="w-4 h-4 text-[#F28C00]" />
                <span>Quizzes & Games</span>
              </div>
              <span className="text-sm">🎮</span>
            </button>
          </div>

          {/* Section: GAMIFICATION */}
          <div className="space-y-1.5">
            <div className="px-3 text-[10px] font-extrabold text-[#888888] tracking-widest uppercase">
              Gamification
            </div>
            <button
              onClick={() => handleNav('achievements')}
              className={navItemClass('achievements')}
            >
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-[#F28C00]" />
                <span>Achievements</span>
              </div>
              <span className="text-sm">🏆</span>
            </button>
            <button
              onClick={() => handleNav('leaderboard')}
              className={navItemClass('leaderboard')}
            >
              <div className="flex items-center gap-2.5">
                <Trophy className="w-4 h-4 text-[#F28C00]" />
                <span>Leaderboard</span>
              </div>
              <span className="text-sm">⭐</span>
            </button>
          </div>

          {/* Section: ACCOUNT */}
          <div className="space-y-1.5">
            <div className="px-3 text-[10px] font-extrabold text-[#888888] tracking-widest uppercase">
              Account
            </div>
            <button
              onClick={() => handleNav('accessibility')}
              className={navItemClass('accessibility')}
            >
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-[#F28C00]" />
                <span>Accessibility</span>
              </div>
              <span className="text-sm">♿</span>
            </button>
            <button
              onClick={() => handleNav('profile')}
              className={navItemClass('profile')}
            >
              <div className="flex items-center gap-2.5">
                <UserIcon className="w-4 h-4 text-[#F28C00]" />
                <span>Profile & Settings</span>
              </div>
              <span className="text-sm">⚙️</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Bottom Controls & Backend Connection Indicator */}
      <div className="mt-6 pt-4 border-t border-[#222222]/15 space-y-3">
        {/* Quick Accessibility Bar */}
        <div className="p-2.5 bg-[#FFF0C9]/50 rounded-xl border border-[#222222]/20 flex items-center justify-between">
          <span className="text-[10px] font-bold text-[#666666]">Quick Assist</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => updatePreference('highContrast', !preferences.highContrast)}
              className={`p-1.5 rounded-lg border transition ${
                preferences.highContrast
                  ? 'bg-[#222222] text-white border-[#222222]'
                  : 'bg-white text-[#222222] border-[#222222]/20 hover:border-[#222222]'
              }`}
              title="Toggle High Contrast"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                const next = preferences.textSize === 'normal' ? 'large' : preferences.textSize === 'large' ? 'xlarge' : 'normal';
                updatePreference('textSize', next);
              }}
              className="p-1.5 rounded-lg bg-white border border-[#222222]/20 hover:border-[#222222] text-[#222222] transition"
              title="Scale Text Size"
            >
              <Type className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Backend Status Inspector Trigger Button */}
        <button
          onClick={onOpenBackendModal}
          className="w-full px-3 py-2 bg-[#F1F1F1] hover:bg-[#FFE0BD] border-2 border-[#222222] rounded-xl text-left transition flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-[#F28C00]" />
            <span className="text-[11px] font-bold text-[#222222]">FastAPI Backend</span>
          </div>
          <span
            className={`w-2.5 h-2.5 rounded-full border border-[#222222] ${
              isBackendConnected ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-[#ba1a1a] hover:bg-red-50 rounded-xl transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
