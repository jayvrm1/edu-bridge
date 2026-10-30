/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';

interface LearningEfficiencyGaugeProps {
  efficiencyPercent: number;
}

export const LearningEfficiencyGauge: React.FC<LearningEfficiencyGaugeProps> = ({
  efficiencyPercent = 88,
}) => {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (efficiencyPercent / 100) * circumference;

  return (
    <div className="p-5 rounded-2xl border-2 border-[#222222] bg-[#FFFFFF] shadow-stitch flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Left Text Explanation */}
      <div className="space-y-1.5 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-1.5">
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#FFF0C9] border border-[#222222] text-[#222222] flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-[#F28C00]" />
            Cognitive Metric
          </span>
        </div>
        <h3 className="text-base font-extrabold text-[#222222]">
          Learning Efficiency Rate
        </h3>
        <p className="text-xs text-[#666666] max-w-xs leading-relaxed">
          Measured through gesture recall speed, lesson checkpoints passed on first attempt, and daily consistency.
        </p>
      </div>

      {/* Right Circular Donut Ring Gauge (Stitch Spec) */}
      <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Background track circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#F1F1F1"
            strokeWidth="10"
          />
          {/* Active orange arc */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#F28C00"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          {/* Subtle outline border */}
          <circle
            cx="60"
            cy="60"
            r={radius + 6}
            fill="none"
            stroke="#222222"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        </svg>

        {/* Center percentage label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-xl font-extrabold text-[#222222] leading-none">
            {efficiencyPercent}%
          </span>
          <span className="text-[10px] font-bold text-[#666666] uppercase mt-0.5">
            Optimal
          </span>
        </div>
      </div>
    </div>
  );
};
