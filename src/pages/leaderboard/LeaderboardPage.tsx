/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { INITIAL_DASHBOARD_DATA } from '../../services/api/mockData';
import { LeaderboardUser } from '../../types';
import { Trophy, Flame, Sparkles, Medal, Award } from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  const [users] = useState<LeaderboardUser[]>(INITIAL_DASHBOARD_DATA.leaderboard);

  const top1 = users.find((u) => u.rank === 1);
  const top2 = users.find((u) => u.rank === 2);
  const top3 = users.find((u) => u.rank === 3);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#222222]">
              Weekly Inclusive Leaderboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FFD966] text-[#222222] border border-[#222222] text-xs font-bold">
              Gold Division
            </span>
          </div>
          <p className="text-xs text-[#666666] mt-0.5">
            Encouraging continuous daily progress, peer recognition, and celebratory learning momentum
          </p>
        </div>

        <div className="text-xs font-bold text-[#F28C00] bg-[#FFF0C9] px-3.5 py-1.5 rounded-full border border-[#222222]">
          ⏱️ Resets in 3 days, 14 hours
        </div>
      </div>

      {/* Podium Showcase (Top 3 Learners) */}
      <div className="p-6 bg-[#FFFFFF] rounded-3xl border-2 border-[#222222] shadow-stitch">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#888888] text-center mb-6">
          This Week&apos;s Honor Podium
        </h2>

        <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto items-end text-center">
          {/* 2nd Place */}
          {top2 && (
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <img
                  src={top2.avatar}
                  alt={top2.name}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-[#222222]"
                />
                <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#8C531B] text-white text-xs font-bold flex items-center justify-center border-2 border-white">
                  2
                </span>
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-[#222222] truncate w-full">
                {top2.name}
              </div>
              <div className="text-xs font-bold text-[#8C531B] mt-0.5">{top2.xp} XP</div>
              <div className="w-full h-24 bg-[#FFE0BD] border-2 border-b-0 border-[#222222] rounded-t-2xl mt-3 flex items-center justify-center font-bold text-sm text-[#8C531B]">
                2nd
              </div>
            </div>
          )}

          {/* 1st Place */}
          {top1 && (
            <div className="flex flex-col items-center">
              <div className="text-xl mb-1 animate-bounce">👑</div>
              <div className="relative mb-2">
                <img
                  src={top1.avatar}
                  alt={top1.name}
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-full object-cover border-3 border-[#222222] ring-4 ring-[#F28C00]"
                />
                <span className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-[#F28C00] text-white text-xs font-bold flex items-center justify-center border-2 border-white">
                  1
                </span>
              </div>
              <div className="text-sm sm:text-base font-extrabold text-[#222222] truncate w-full">
                {top1.name}
              </div>
              <div className="text-xs font-bold text-[#F28C00] mt-0.5">{top1.xp} XP</div>
              <div className="w-full h-32 bg-[#FFD966] border-2 border-b-0 border-[#222222] rounded-t-2xl mt-3 flex items-center justify-center font-bold text-base text-[#222222]">
                1st Place
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3 && (
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <img
                  src={top3.avatar}
                  alt={top3.name}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-[#222222]"
                />
                <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#FFD966] text-[#222222] text-xs font-bold flex items-center justify-center border-2 border-white">
                  3
                </span>
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-[#222222] truncate w-full">
                {top3.name}
              </div>
              <div className="text-xs font-bold text-[#666666] mt-0.5">{top3.xp} XP</div>
              <div className="w-full h-18 bg-[#D9EAFB] border-2 border-b-0 border-[#222222] rounded-t-2xl mt-3 flex items-center justify-center font-bold text-sm text-[#222222]">
                3rd
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Complete Rankings List */}
      <div className="p-6 bg-[#FFFFFF] rounded-3xl border-2 border-[#222222] shadow-stitch space-y-3">
        <h3 className="text-sm font-bold text-[#222222]">
          Full Division Rankings
        </h3>

        <div className="space-y-2">
          {users.map((u) => {
            const isMe = u.isCurrentUser;
            return (
              <div
                key={u.id}
                className={`p-3.5 rounded-2xl border-2 transition flex items-center justify-between text-xs sm:text-sm ${
                  isMe
                    ? 'bg-[#222222] text-white border-[#222222] shadow-md'
                    : 'bg-[#F1F1F1] text-[#222222] border-[#222222]/20 hover:border-[#222222]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono font-extrabold w-6 text-center ${
                      isMe ? 'text-[#FFD966]' : 'text-[#666666]'
                    }`}
                  >
                    #{u.rank}
                  </span>
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-[#222222]"
                  />
                  <div>
                    <div className="font-extrabold flex items-center gap-2">
                      <span>{u.name}</span>
                      {isMe && (
                        <span className="text-[10px] bg-[#F28C00] text-white px-2 py-0.2 rounded-full font-bold">
                          You
                        </span>
                      )}
                    </div>
                    {u.statusBadge && (
                      <span className={`text-[11px] ${isMe ? 'text-[#FFD966]' : 'text-[#F28C00] font-semibold'}`}>
                        {u.statusBadge}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs font-bold">
                    🔥 {u.streak}d
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                      isMe
                        ? 'bg-[#F28C00] text-white'
                        : 'bg-white text-[#222222] border border-[#222222]/20'
                    }`}
                  >
                    {u.xp.toLocaleString()} XP
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
