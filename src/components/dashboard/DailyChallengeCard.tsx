/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { DailyChallenge } from '../../types';
import { gamificationService } from '../../services/api/gamificationService';
import { useAccessibility } from '../../context/AccessibilityContext';
import { Target, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface DailyChallengeCardProps {
  challenge: DailyChallenge;
  onNavigateToSignStudio?: () => void;
}

export const DailyChallengeCard: React.FC<DailyChallengeCardProps> = ({
  challenge: initialChallenge,
  onNavigateToSignStudio,
}) => {
  const [challenge, setChallenge] = useState<DailyChallenge>(initialChallenge);
  const [isClaimed, setIsClaimed] = useState<boolean>(initialChallenge.completed);
  const { announce, speak } = useAccessibility();

  const handleClaim = async () => {
    try {
      const res = await gamificationService.completeDailyChallenge(challenge.id);
      setIsClaimed(true);
      setChallenge((prev) => ({
        ...prev,
        completed: true,
        currentProgress: prev.targetProgress,
      }));

      confetti({
        particleCount: 60,
        spread: 60,
        colors: ['#FFD966', '#F28C00', '#FFE0BD'],
      });

      announce(`Daily challenge completed! Earned +${res.xpAwarded} XP.`);
      speak(`Congratulations! Daily challenge completed. You earned ${res.xpAwarded} XP!`);
    } catch (err) {
      console.error('Failed to complete challenge:', err);
    }
  };

  const progressPercent = Math.round(
    (challenge.currentProgress / challenge.targetProgress) * 100
  );

  return (
    <div className="p-5 rounded-2xl border-2 border-[#222222] bg-[#FFF0C9] shadow-stitch flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Left Icon and Details */}
      <div className="flex items-start gap-3.5 w-full sm:w-auto">
        <div className="w-12 h-12 rounded-2xl bg-[#FFD966] border-2 border-[#222222] flex items-center justify-center text-2xl shrink-0 shadow-xs">
          🎯
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#FFFFFF] border border-[#222222] text-[#222222]">
              Daily Challenge
            </span>
            <span className="text-xs font-bold text-[#F28C00] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> +{challenge.xpReward} XP Reward
            </span>
          </div>

          <h3 className="text-base font-extrabold text-[#222222]">
            {challenge.title}
          </h3>
          <p className="text-xs text-[#666666] max-w-md leading-relaxed">
            {challenge.description}
          </p>

          {/* Progress bar */}
          <div className="pt-2 flex items-center gap-3">
            <div className="w-36 h-2 bg-white rounded-full overflow-hidden border border-[#222222]/30">
              <div
                className="h-full bg-[#F28C00] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-[#222222]">
              {challenge.currentProgress}/{challenge.targetProgress} Signs
            </span>
          </div>
        </div>
      </div>

      {/* Action CTA Button */}
      <div className="shrink-0 w-full sm:w-auto flex justify-end">
        {challenge.completed || isClaimed ? (
          <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-100 border-2 border-emerald-600 rounded-full text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Challenge Completed ✓</span>
          </div>
        ) : challenge.currentProgress >= challenge.targetProgress ? (
          <button
            onClick={handleClaim}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#F28C00] text-white rounded-full font-bold text-xs border-2 border-[#222222] hover:bg-[#de7f00] flex items-center justify-center gap-1.5 shadow-xs transition"
          >
            <span>Claim +{challenge.xpReward} XP</span>
            <Sparkles className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onNavigateToSignStudio}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#F28C00] text-white rounded-full font-bold text-xs border-2 border-[#222222] hover:bg-[#de7f00] flex items-center justify-center gap-1.5 shadow-xs transition"
          >
            <span>Practice in Camera</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
