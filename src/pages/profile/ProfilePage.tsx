/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import {
  User as UserIcon,
  Mail,
  Shield,
  Save,
  Server,
  LogOut,
  Sparkles,
  Trophy,
  CheckCircle2,
} from 'lucide-react';

interface ProfilePageProps {
  onOpenBackendModal: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onOpenBackendModal }) => {
  const { user, logout } = useAuth();
  const { preferences } = useAccessibility();

  const [name, setName] = useState(user?.name || 'Maya Patel');
  const [email, setEmail] = useState(user?.email || 'maya@edubridge.ai');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#222222]">
          Student Profile & Account Settings
        </h1>
        <p className="text-xs text-[#666666] mt-0.5">
          Manage your personal details, credentials, and backend server endpoints
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="p-6 bg-[#FFFFFF] rounded-2xl border-2 border-[#222222] shadow-stitch flex flex-col sm:flex-row items-center gap-5">
        <img
          src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
          alt={user?.name}
          className="w-20 h-20 rounded-full object-cover border-2 border-[#222222] shadow-sm shrink-0"
        />

        <div className="text-center sm:text-left space-y-1 flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-lg font-extrabold text-[#222222]">{user?.name}</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FFF0C9] text-[#222222] border border-[#222222] text-xs font-bold">
              Level {user?.level} • {user?.levelTitle}
            </span>
          </div>
          <p className="text-xs text-[#666666]">{user?.email}</p>

          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs font-bold text-[#222222]">
            <span className="flex items-center gap-1">🔥 {user?.streakDays} Days Streak</span>
            <span>•</span>
            <span className="flex items-center gap-1">⭐ {user?.xp} XP Total</span>
            <span>•</span>
            <span className="flex items-center gap-1">🏆 Global Rank #{user?.globalRank}</span>
          </div>
        </div>
      </div>

      {/* Edit Details Form */}
      <div className="p-6 bg-[#FFFFFF] rounded-2xl border-2 border-[#222222] shadow-stitch space-y-4">
        <h3 className="text-base font-bold text-[#222222]">
          Personal Information
        </h3>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#222222] uppercase tracking-wide">
              Full Legal or Preferred Name
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-[#222222] text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#F28C00]"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#222222] uppercase tracking-wide">
              Account Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-[#222222] text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#F28C00]"
                required
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            {isSaved && (
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Profile changes saved successfully!
              </span>
            )}
            <button
              type="submit"
              className="ml-auto px-5 py-2.5 bg-[#F28C00] text-white rounded-full font-bold text-xs border-2 border-[#222222] hover:bg-[#de7f00] flex items-center gap-1.5 shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>

      {/* Backend & Integration Section */}
      <div className="p-6 bg-[#FFFFFF] rounded-2xl border-2 border-[#222222] shadow-stitch space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#222222] flex items-center gap-2">
              <Server className="w-4 h-4 text-[#F28C00]" />
              <span>FastAPI Backend Architecture</span>
            </h3>
            <p className="text-xs text-[#666666]">
              Configure endpoint URLs, ping server health, and view OpenAPI schemas.
            </p>
          </div>
          <button
            onClick={onOpenBackendModal}
            className="px-4 py-2 bg-[#FFF0C9] border-2 border-[#222222] text-xs font-bold text-[#222222] rounded-full hover:bg-[#FFD966] transition shadow-xs"
          >
            Launch Inspector
          </button>
        </div>
      </div>

      {/* Danger Zone / Logout */}
      <div className="p-5 bg-red-50 rounded-2xl border-2 border-red-300 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-red-900">Sign Out of EduBridge AI</h4>
          <p className="text-[11px] text-red-700">
            End your current session safely. All your streak and XP stats remain saved.
          </p>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 bg-white text-red-700 border-2 border-red-500 rounded-full text-xs font-bold hover:bg-red-100 transition flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
