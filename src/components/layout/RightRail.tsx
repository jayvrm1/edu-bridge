/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ActivityDay, LeaderboardUser } from '../../types';
import { Trophy, Calendar as CalendarIcon, Flame, Sparkles, Volume2 } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';

interface RightRailProps {
  activityDays: ActivityDay[];
  leaderboard: LeaderboardUser[];
  onOpenSignStudio?: () => void;
  onSelectSign?: (sign: string) => void;
}

export const RightRail: React.FC<RightRailProps> = ({
  activityDays,
  leaderboard,
  onOpenSignStudio,
  onSelectSign,
}) => {
  const [selectedDay, setSelectedDay] = useState<ActivityDay | null>(
    activityDays.find((d) => d.isToday) || null
  );

  const { speak } = useAccessibility();

  // Top 3 for Podium
  const top1 = leaderboard.find((u) => u.rank === 1);
  const top2 = leaderboard.find((u) => u.rank === 2);
  const top3 = leaderboard.find((u) => u.rank === 3);

  // Remaining list items including current user
  const otherUsers = leaderboard.filter((u) => u.rank > 3);

  return (
    <aside className="w-full xl:w-80 bg-[#FFFFFF] border-l-2 border-stitch-dashed p-4 flex flex-col gap-6 overflow-y-auto">
      {/* 1. Monthly Activity Heatmap Calendar (Stitch Spec) */}
      <div className="p-4 bg-[#FFFFFF] rounded-2xl border-2 border-[#222222] shadow-stitch space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#F28C00]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#222222]">
              October Learning Rhythm
            </h3>
          </div>
          <span className="text-[10px] font-bold text-[#F28C00] bg-[#FFF0C9] px-2 py-0.5 rounded-full border border-[#222222]/20">
            🔥 7d Streak
          </span>
        </div>

        {/* Calendar Heatmap Grid (7 columns x 5 rows) */}
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="text-[9px] font-bold text-[#888888] pb-1">
              {d}
            </div>
          ))}

          {activityDays.map((day) => {
            const isSelected = selectedDay?.dayNumber === day.dayNumber;
            return (
              <button
                key={day.date}
                onClick={() => setSelectedDay(day)}
                className={`h-7 rounded-lg text-[10px] font-bold border transition flex items-center justify-center relative ${
                  day.isToday
                    ? 'border-2 border-[#222222] bg-[#F28C00] text-white shadow-xs'
                    : day.active
                    ? 'border-[#222222]/40 bg-[#FFD966] text-[#222222]'
                    : 'border-[#222222]/10 bg-[#F1F1F1] text-[#888888] hover:border-[#222222]'
                } ${isSelected ? 'ring-2 ring-[#222222] ring-offset-1' : ''}`}
                title={`Day ${day.dayNumber}: ${day.active ? `${day.minutesLearned}m learned` : 'No activity'}`}
              >
                {day.dayNumber}
              </button>
            );
          })}
        </div>

        {/* Selected Day Tooltip */}
        {selectedDay && (
          <div className="p-2.5 bg-[#FFF0C9]/60 rounded-xl border border-[#222222]/20 text-xs flex items-center justify-between">
            <div>
              <span className="font-bold text-[#222222]">
                Oct {selectedDay.dayNumber} Activity:
              </span>
              <p className="text-[11px] text-[#666666]">
                {selectedDay.active
                  ? `${selectedDay.minutesLearned} mins • ${selectedDay.signsPracticed} signs mastered`
                  : 'Rest day'}
              </p>
            </div>
            {selectedDay.active && <span className="text-base">⭐</span>}
          </div>
        )}
      </div>

      {/* 2. Sign of the Day Spotlight Widget */}
      <div className="p-4 bg-[#FFE0BD] rounded-2xl border-2 border-[#222222] shadow-stitch space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#FFFFFF] border border-[#222222] text-[#222222]">
            Sign of the Day
          </span>
          <button
            onClick={() => speak('Sign of the day is Thank You. In Hindi, Dhanyavaad. Touch chin and extend flat hand outward.')}
            className="p-1.5 rounded-full bg-white hover:bg-[#FFD966] border border-[#222222] transition"
            title="Read sign of the day"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#222222]" />
          </button>
        </div>

        <div>
          <h4 className="text-base font-extrabold text-[#222222]">
            &ldquo;Thank You&rdquo; (धन्यवाद)
          </h4>
          <p className="text-xs text-[#222222]/80 mt-1 leading-relaxed">
            Touch fingers of open hand to chin, then sweep forward gracefully towards the other person.
          </p>
        </div>

        <button
          onClick={() => {
            if (onSelectSign) onSelectSign('THANK YOU');
            if (onOpenSignStudio) onOpenSignStudio();
          }}
          className="w-full py-2 bg-[#FFFFFF] hover:bg-[#FFD966] text-[#222222] rounded-full text-xs font-bold border-2 border-[#222222] flex items-center justify-center gap-1.5 transition shadow-xs"
        >
          <span>Practice in 3D Studio</span>
          <span>🤟</span>
        </button>
      </div>

      {/* 3. Weekly Gamified Leaderboard (Stitch Spec) */}
      <div className="p-4 bg-[#FFFFFF] rounded-2xl border-2 border-[#222222] shadow-stitch space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#F28C00]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#222222]">
              Weekly Leaderboard
            </h3>
          </div>
          <span className="text-[10px] font-bold text-[#666666]">
            Resets Sun
          </span>
        </div>

        {/* Podium Showcase (Top 3 Learners) */}
        <div className="grid grid-cols-3 gap-2 pt-2 items-end text-center">
          {/* 2nd Place */}
          {top2 && (
            <div className="flex flex-col items-center">
              <div className="relative mb-1">
                <img
                  src={top2.avatar}
                  alt={top2.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#222222]"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#8C531B] text-white text-[9px] font-bold flex items-center justify-center border border-white">
                  2
                </span>
              </div>
              <div className="text-[11px] font-bold text-[#222222] truncate w-full">
                {top2.name.split(' ')[0]}
              </div>
              <div className="text-[10px] text-[#666666] font-semibold">
                {top2.xp} XP
              </div>
              <div className="w-full h-12 bg-[#FFE0BD] border-2 border-b-0 border-[#222222] rounded-t-xl mt-1.5" />
            </div>
          )}

          {/* 1st Place */}
          {top1 && (
            <div className="flex flex-col items-center -order-none">
              <div className="text-xs mb-0.5">👑</div>
              <div className="relative mb-1">
                <img
                  src={top1.avatar}
                  alt={top1.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#222222] ring-2 ring-[#F28C00]"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#F28C00] text-white text-[10px] font-bold flex items-center justify-center border border-white">
                  1
                </span>
              </div>
              <div className="text-xs font-extrabold text-[#222222] truncate w-full">
                {top1.name.split(' ')[0]}
              </div>
              <div className="text-[10px] text-[#F28C00] font-bold">
                {top1.xp} XP
              </div>
              <div className="w-full h-16 bg-[#FFD966] border-2 border-b-0 border-[#222222] rounded-t-xl mt-1.5" />
            </div>
          )}

          {/* 3rd Place */}
          {top3 && (
            <div className="flex flex-col items-center">
              <div className="relative mb-1">
                <img
                  src={top3.avatar}
                  alt={top3.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#222222]"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#FFD966] text-[#222222] text-[9px] font-bold flex items-center justify-center border border-white">
                  3
                </span>
              </div>
              <div className="text-[11px] font-bold text-[#222222] truncate w-full">
                {top3.name.split(' ')[0]}
              </div>
              <div className="text-[10px] text-[#666666] font-semibold">
                {top3.xp} XP
              </div>
              <div className="w-full h-9 bg-[#D9EAFB] border-2 border-b-0 border-[#222222] rounded-t-xl mt-1.5" />
            </div>
          )}
        </div>

        {/* List items with current user highlight card (Stitch Spec) */}
        <div className="space-y-1.5 pt-1">
          {otherUsers.map((user) => {
            const isCurrent = user.isCurrentUser;
            return (
              <div
                key={user.id}
                className={`p-2.5 rounded-xl border transition flex items-center justify-between text-xs ${
                  isCurrent
                    ? 'bg-[#222222] text-white border-[#222222] shadow-sm'
                    : 'bg-[#F1F1F1] text-[#222222] border-[#222222]/15 hover:border-[#222222]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`font-bold w-4 text-center ${isCurrent ? 'text-[#FFD966]' : 'text-[#666666]'}`}>
                    #{user.rank}
                  </span>
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-[#222222]"
                  />
                  <div>
                    <div className="font-bold truncate max-w-[110px]">
                      {user.name}
                    </div>
                    {user.statusBadge && (
                      <span className={`text-[9px] ${isCurrent ? 'text-[#FFD966]' : 'text-[#F28C00]'}`}>
                        {user.statusBadge}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex items-center text-[10px] font-bold">
                    🔥{user.streak}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isCurrent
                        ? 'bg-[#F28C00] text-white'
                        : 'bg-white text-[#222222] border border-[#222222]/20'
                    }`}
                  >
                    {user.xp}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
