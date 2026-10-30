/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DashboardData } from '../../types';
import { Trophy, Flame, Gem, Star, ArrowUpRight } from 'lucide-react';

interface MetricCardsGridProps {
  stats: DashboardData['stats'];
  onViewAchievements?: () => void;
  onViewLeaderboard?: () => void;
}

export const MetricCardsGrid: React.FC<MetricCardsGridProps> = ({
  stats,
  onViewAchievements,
  onViewLeaderboard,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Trainee Level Card (#D9EAFB Pastel Blue) */}
      <div className="p-4 rounded-2xl border-2 border-[#222222] bg-[#D9EAFB] shadow-stitch flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] transition-transform">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border-2 border-[#222222] flex items-center justify-center text-lg shadow-xs">
            💎
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#222222]/80 bg-white/60 px-2 py-0.5 rounded-full border border-[#222222]/20">
            Current Rank
          </span>
        </div>

        <div className="mt-3">
          <div className="text-xs font-bold text-[#222222]/70 uppercase tracking-wide">
            Trainee Level
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#222222] tracking-tight">
            Level 4
          </div>
          <p className="text-[11px] font-semibold text-[#222222]/80 mt-0.5">
            Intermediate Signer
          </p>

          {/* Progress bar to Level 5 */}
          <div className="mt-2.5">
            <div className="flex justify-between text-[10px] font-bold text-[#222222]/70 mb-1">
              <span>Progress</span>
              <span>{stats.levelProgressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-[#222222]/30">
              <div
                className="h-full bg-[#F28C00] rounded-full transition-all duration-500"
                style={{ width: `${stats.levelProgressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Streak Card (#FFD966 Warm Yellow) */}
      <div className="p-4 rounded-2xl border-2 border-[#222222] bg-[#FFD966] shadow-stitch flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] transition-transform">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border-2 border-[#222222] flex items-center justify-center text-lg shadow-xs">
            🔥
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#222222]/80 bg-white/60 px-2 py-0.5 rounded-full border border-[#222222]/20">
            Active Streak
          </span>
        </div>

        <div className="mt-3">
          <div className="text-xs font-bold text-[#222222]/70 uppercase tracking-wide">
            Daily Momentum
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#222222] tracking-tight">
            {stats.streakDays} Days
          </div>
          <p className="text-[11px] font-semibold text-[#222222]/80 mt-0.5">
            Top 5% of active learners
          </p>

          <div className="mt-2 pt-2 border-t border-[#222222]/15 flex items-center justify-between text-[11px] font-bold text-[#222222]">
            <span>Practice today</span>
            <span className="text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-400">
              Completed ✓
            </span>
          </div>
        </div>
      </div>

      {/* 3. Global Rank Card (#F6C4C4 Soft Pink) */}
      <div
        onClick={onViewLeaderboard}
        className="p-4 rounded-2xl border-2 border-[#222222] bg-[#F6C4C4] shadow-stitch flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer"
      >
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border-2 border-[#222222] flex items-center justify-center text-lg shadow-xs">
            🏆
          </div>
          <ArrowUpRight className="w-4 h-4 text-[#222222] opacity-70 group-hover:opacity-100 transition" />
        </div>

        <div className="mt-3">
          <div className="text-xs font-bold text-[#222222]/70 uppercase tracking-wide">
            Leaderboard Rank
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#222222] tracking-tight">
            #{stats.globalRank}
          </div>
          <p className="text-[11px] font-semibold text-[#222222]/80 mt-0.5">
            +3 spots climbed today
          </p>

          <div className="mt-2 pt-2 border-t border-[#222222]/15 text-[11px] font-bold text-[#222222] flex items-center justify-between">
            <span>League</span>
            <span className="text-[#8d4f00] font-extrabold">Gold Division</span>
          </div>
        </div>
      </div>

      {/* 4. Total XP Metric (#FFFFFF Crisp Neobrutalist with warm accent) */}
      <div
        onClick={onViewAchievements}
        className="p-4 rounded-2xl border-2 border-[#222222] bg-[#FFFFFF] shadow-stitch flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer"
      >
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-[#FFF0C9] border-2 border-[#222222] flex items-center justify-center text-lg shadow-xs">
            ⭐
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
            +{stats.todayXpEarned} XP Today
          </span>
        </div>

        <div className="mt-3">
          <div className="text-xs font-bold text-[#666666] uppercase tracking-wide">
            Total Knowledge XP
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#222222] tracking-tight">
            {stats.totalXp.toLocaleString()} XP
          </div>
          <p className="text-[11px] font-semibold text-[#F28C00] mt-0.5">
            Next unlock at 3,000 XP
          </p>

          <div className="mt-2 pt-2 border-t border-[#222222]/15 text-[11px] font-bold text-[#222222] flex items-center justify-between">
            <span>Achievements</span>
            <span className="text-[#F28C00]">4 Badges Earned →</span>
          </div>
        </div>
      </div>
    </div>
  );
};
