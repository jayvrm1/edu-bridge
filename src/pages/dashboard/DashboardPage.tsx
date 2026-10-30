/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gamificationService } from '../../services/api/gamificationService';
import { DashboardData } from '../../types';
import { INITIAL_DASHBOARD_DATA } from '../../services/api/mockData';
import { MetricCardsGrid } from '../../components/dashboard/MetricCardsGrid';
import { CourseProgressSection } from '../../components/dashboard/CourseProgressSection';
import { DailyChallengeCard } from '../../components/dashboard/DailyChallengeCard';
import { LearningEfficiencyGauge } from '../../components/dashboard/LearningEfficiencyGauge';
import { Mascot } from '../../components/common/Mascot';
import { NavRoute } from '../../components/layout/Sidebar';
import { Flame, Sparkles, ArrowRight, Video, Bot, Award } from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (route: NavRoute) => void;
  onSelectCourse: (courseId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onSelectCourse,
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>(INITIAL_DASHBOARD_DATA);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const result = await gamificationService.getDashboardData();
        setData(result);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const userName = user?.name?.split(' ')[0] || 'Maya';

  return (
    <div className="space-y-6">
      {/* 1. Student Greeting & Mascot Hero Banner (Stitch Spec) */}
      <div className="relative p-6 sm:p-7 rounded-3xl border-2 border-[#222222] bg-[#FFF0C9] shadow-stitch overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFFFF] border-2 border-[#222222] text-xs font-bold text-[#222222]">
            <span>🔥 7-Day Streak Active</span>
            <span className="text-[#F28C00]">•</span>
            <span>Top 5% of active learners</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] tracking-tight">
            Good morning, {userName}! 👋
          </h1>
          <p className="text-sm text-[#222222]/80 font-medium leading-relaxed">
            Ready to learn without communication barriers today? Your ISL camera workspace and 3D tutor are prepped for your morning session.
          </p>

          {/* Quick Action Badges */}
          <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <button
              onClick={() => onNavigate('tutor')}
              className="px-4 py-2 bg-[#F28C00] text-white rounded-full font-bold text-xs border-2 border-[#222222] hover:bg-[#de7f00] flex items-center gap-1.5 transition shadow-xs"
            >
              <Bot className="w-4 h-4" />
              <span>Launch AI Tutor</span>
            </button>
            <button
              onClick={() => onNavigate('sign-studio')}
              className="px-4 py-2 bg-[#FFFFFF] text-[#222222] rounded-full font-bold text-xs border-2 border-[#222222] hover:bg-[#FFE0BD] flex items-center gap-1.5 transition"
            >
              <Video className="w-4 h-4 text-[#F28C00]" />
              <span>Practice in Sign Studio</span>
            </button>
          </div>
        </div>

        {/* Mascot Illustration Anchor (Stitch Spec) */}
        <div className="relative shrink-0 flex items-center justify-center">
          <Mascot expression="signing" size={135} badge="Level 4" />
        </div>
      </div>

      {/* 2. 4-Up Pastel Metric Stat Tiles (Stitch Spec) */}
      <MetricCardsGrid
        stats={data.stats}
        onViewAchievements={() => onNavigate('achievements')}
        onViewLeaderboard={() => onNavigate('leaderboard')}
      />

      {/* 3. Daily Challenge Block (Stitch Spec) */}
      <DailyChallengeCard
        challenge={data.dailyChallenge}
        onNavigateToSignStudio={() => onNavigate('sign-studio')}
      />

      {/* 4. Active Course Progress Section (Stitch Spec) */}
      <CourseProgressSection
        courses={data.activeCourses}
        onContinueCourse={onSelectCourse}
        onViewAllCourses={() => onNavigate('courses')}
      />

      {/* 5. Learning Efficiency Donut Ring (Stitch Spec) */}
      <LearningEfficiencyGauge
        efficiencyPercent={data.stats.learningEfficiencyPercent}
      />
    </div>
  );
};
