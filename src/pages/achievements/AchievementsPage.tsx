/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SAMPLE_ACHIEVEMENTS } from '../../services/api/mockData';
import { Achievement } from '../../types';
import {
  Award,
  Flame,
  Sparkles,
  Trophy,
  CheckCircle2,
  Printer,
  X,
  FileCheck,
  ShieldCheck,
} from 'lucide-react';

export const AchievementsPage: React.FC = () => {
  const { user } = useAuth();
  const [achievements] = useState<Achievement[]>(SAMPLE_ACHIEVEMENTS);
  const [showCertificate, setShowCertificate] = useState<boolean>(false);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#222222]">
              Achievements & Milestones
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FFF0C9] text-[#222222] border border-[#222222] text-xs font-bold">
              {unlockedCount} of {achievements.length} Badges Unlocked
            </span>
          </div>
          <p className="text-xs text-[#666666] mt-0.5">
            Celebrate barrier-free milestones, streak consistency, and certified certificates
          </p>
        </div>

        <button
          onClick={() => setShowCertificate(true)}
          className="px-5 py-2.5 bg-[#F28C00] text-white rounded-full font-bold text-xs border-2 border-[#222222] hover:bg-[#de7f00] flex items-center gap-2 shadow-xs transition"
        >
          <Award className="w-4 h-4" />
          <span>View Verified Certificate</span>
        </button>
      </div>

      {/* Hero Stats Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border-2 border-[#222222] bg-[#FFD966] shadow-stitch flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white border-2 border-[#222222] flex items-center justify-center text-2xl">
            🔥
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-[#222222]/80">Longest Streak</div>
            <div className="text-xl font-extrabold text-[#222222]">{user?.streakDays || 7} Days</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl border-2 border-[#222222] bg-[#D9EAFB] shadow-stitch flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white border-2 border-[#222222] flex items-center justify-center text-2xl">
            ⭐
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-[#222222]/80">Total XP Earned</div>
            <div className="text-xl font-extrabold text-[#222222]">{user?.xp.toLocaleString()} XP</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl border-2 border-[#222222] bg-[#F6C4C4] shadow-stitch flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white border-2 border-[#222222] flex items-center justify-center text-2xl">
            💎
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-[#222222]/80">Learner Tier</div>
            <div className="text-xl font-extrabold text-[#222222]">{user?.levelTitle}</div>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-[#222222]">
          Milestone Badges ({achievements.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border-2 border-[#222222] shadow-stitch flex flex-col justify-between transition ${
                item.unlocked ? 'bg-[#FFFFFF]' : 'bg-[#F1F1F1] opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div
                    className={`w-12 h-12 rounded-2xl border-2 border-[#222222] flex items-center justify-center text-2xl shadow-xs ${
                      item.unlocked ? 'bg-[#FFF0C9]' : 'bg-gray-200 grayscale'
                    }`}
                  >
                    {item.icon}
                  </div>
                  {item.unlocked ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Unlocked
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-[#888888] bg-white px-2 py-0.5 rounded-full border border-gray-300">
                      In Progress
                    </span>
                  )}
                </div>

                <h3 className="text-base font-extrabold text-[#222222] mt-3">
                  {item.title}
                </h3>
                <p className="text-xs text-[#666666] mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#222222]/15">
                <div className="flex justify-between text-[11px] font-bold text-[#222222] mb-1">
                  <span>Progress</span>
                  <span>{item.progress}/{item.maxProgress}</span>
                </div>
                <div className="w-full h-2 bg-[#F1F1F1] rounded-full overflow-hidden border border-[#222222]/20">
                  <div
                    className="h-full bg-[#F28C00] rounded-full"
                    style={{ width: `${Math.min(100, (item.progress / item.maxProgress) * 100)}%` }}
                  />
                </div>
                <div className="mt-2 text-[10px] text-[#F28C00] font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>+{item.xpReward} XP Reward</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Printable Certificate Modal */}
      {showCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] w-full max-w-2xl rounded-3xl border-2 border-[#222222] shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
            <button
              onClick={() => setShowCertificate(false)}
              className="absolute top-4 right-4 p-2 rounded-full border-2 border-[#222222] hover:bg-[#F1F1F1] transition"
              aria-label="Close certificate"
            >
              <X className="w-4 h-4 text-[#222222]" />
            </button>

            {/* Certificate Frame */}
            <div className="border-4 border-double border-[#222222] p-6 sm:p-8 bg-[#FFF0C9]/30 rounded-2xl text-center space-y-4">
              <div className="text-3xl">🏅</div>
              <div className="text-xs font-mono font-bold tracking-widest text-[#F28C00] uppercase">
                EDUBRIDGE AI • OFFICIAL ACCREDITATION
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#222222] font-serif">
                Certificate of Inclusive Mastery
              </h2>
              <p className="text-xs text-[#666666]">
                This is proudly presented to
              </p>
              <div className="text-xl sm:text-2xl font-extrabold text-[#222222] underline decoration-[#F28C00] decoration-2 underline-offset-4">
                {user?.name || 'Maya Patel'}
              </div>
              <p className="text-xs text-[#555555] max-w-md mx-auto leading-relaxed">
                For demonstrating exceptional perseverance, mastering over 25 certified Indian Sign Language gestures, and completing continuous multi-modal learning modules without communication barriers.
              </p>

              <div className="pt-4 flex items-center justify-around border-t border-[#222222]/20 text-xs">
                <div>
                  <div className="font-bold text-[#222222]">October 29, 2026</div>
                  <div className="text-[10px] text-[#888888]">Issue Date</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#FFD966] border-2 border-[#222222] flex items-center justify-center text-lg font-bold">
                  ★
                </div>
                <div>
                  <div className="font-bold text-[#222222]">ISL-EB-2026-884</div>
                  <div className="text-[10px] text-[#888888]">Verification ID</div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#666666] flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Verified & Tamper-Resistant
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#F28C00] text-white rounded-full font-bold text-xs border-2 border-[#222222] hover:bg-[#de7f00] flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Certificate</span>
                </button>
                <button
                  onClick={() => setShowCertificate(false)}
                  className="px-4 py-2 bg-[#F1F1F1] text-[#222222] rounded-full font-bold text-xs border-2 border-[#222222] hover:bg-[#FFE0BD] transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
