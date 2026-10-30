/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient } from './client';
import {
  DashboardData,
  LeaderboardUser,
  Course,
  Quiz,
  QuizResult,
  Achievement,
} from '../../types';
import {
  INITIAL_DASHBOARD_DATA,
  SAMPLE_COURSES,
  SAMPLE_QUIZZES,
  SAMPLE_ACHIEVEMENTS,
} from './mockData';

const DASHBOARD_STORAGE_KEY = 'edubridge_dashboard_data';

export const gamificationService = {
  async getDashboardData(): Promise<DashboardData> {
    try {
      const profile = await apiClient<any>('/api/v1/gamification/profile', {
        method: 'GET',
      });

      if (profile && typeof profile.total_xp === 'number') {
        const base = INITIAL_DASHBOARD_DATA;
        return {
          ...base,
          user: {
            ...base.user,
            xp: profile.total_xp,
            level: profile.current_level || 1,
            levelTitle: profile.rank_title || 'Novice Learner',
            streakDays: profile.current_streak || 1,
          },
          stats: {
            ...base.stats,
            totalXp: profile.total_xp,
            currentStreak: profile.current_streak || 1,
          },
        };
      }
    } catch {
      // fallback
    }

    const saved = localStorage.getItem(DASHBOARD_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_DASHBOARD_DATA;
      }
    }
    localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(INITIAL_DASHBOARD_DATA));
    return INITIAL_DASHBOARD_DATA;
  },

  async getLeaderboard(): Promise<LeaderboardUser[]> {
    try {
      const entries = await apiClient<any[]>('/api/v1/gamification/leaderboard', {
        method: 'GET',
      });

      if (Array.isArray(entries) && entries.length > 0) {
        return entries.map((entry) => ({
          rank: entry.rank,
          id: entry.user_id || `user_${entry.rank}`,
          name: entry.username || `Learner ${entry.rank}`,
          xp: entry.total_xp,
          streakDays: entry.streak_days || 1,
          level: entry.current_level || 1,
          isCurrentUser: false,
        }));
      }
    } catch {
      // fallback
    }
    return INITIAL_DASHBOARD_DATA.leaderboard;
  },

  async getCourses(): Promise<Course[]> {
    return apiClient<Course[]>('/api/v1/courses', {
      method: 'GET',
      fallbackHandler: () => SAMPLE_COURSES,
    });
  },

  async getQuiz(id: string): Promise<Quiz> {
    return apiClient<Quiz>(`/api/v1/quizzes/${id}`, {
      method: 'GET',
      fallbackHandler: () => {
        const quiz = SAMPLE_QUIZZES.find((q) => q.id === id);
        return quiz || SAMPLE_QUIZZES[0];
      },
    });
  },

  async submitQuiz(quizId: string, answers: Record<string, number>): Promise<QuizResult> {
    const quiz = SAMPLE_QUIZZES.find((q) => q.id === quizId) || SAMPLE_QUIZZES[0];
    let correctCount = 0;
    quiz.questions.forEach((q) => {
      if (answers[q.id] === q.correctIndex) {
        correctCount += 1;
      }
    });

    try {
      const res = await apiClient<any>('/api/v1/gamification/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({
          score: correctCount,
          max_score: quiz.questions.length,
          lesson_id: quizId,
          time_spent_seconds: 60,
        }),
      });

      if (res && typeof res.xp_awarded === 'number') {
        return {
          score: correctCount,
          total: quiz.questions.length,
          xpEarned: res.xp_awarded,
          streakBonus: res.streak_updated ?? true,
        };
      }
    } catch {
      // fallback
    }

    const xpEarned = correctCount * 25 + (correctCount === quiz.questions.length ? 50 : 0);

    const saved = localStorage.getItem(DASHBOARD_STORAGE_KEY);
    if (saved) {
      try {
        const data: DashboardData = JSON.parse(saved);
        data.stats.totalXp += xpEarned;
        data.stats.todayXpEarned += xpEarned;
        data.user.xp += xpEarned;
        localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(data));
      } catch {
        // ignore
      }
    }

    return {
      score: correctCount,
      total: quiz.questions.length,
      xpEarned,
      streakBonus: true,
    };
  },

  async getAchievements(): Promise<Achievement[]> {
    try {
      const achievements = await apiClient<any[]>('/api/v1/gamification/achievements', {
        method: 'GET',
      });
      if (Array.isArray(achievements) && achievements.length > 0) {
        return achievements.map((a, idx) => ({
          id: a.id || `ach_${idx}`,
          title: a.title || a.name || 'Accomplishment',
          description: a.description || 'Inclusive learning badge earned',
          icon: a.icon || '🏆',
          xpReward: a.xp_reward || 100,
          unlockedAt: a.unlocked_at || (a.unlocked ? new Date().toISOString() : undefined),
          category: 'inclusive',
        }));
      }
    } catch {
      // fallback
    }
    return SAMPLE_ACHIEVEMENTS;
  },

  async completeDailyChallenge(challengeId: string): Promise<{ xpAwarded: number; newTotalXp: number }> {
    try {
      const res = await apiClient<any>(`/api/v1/gamification/challenges/${challengeId}/complete`, {
        method: 'POST',
      });
      if (res?.xp_awarded) {
        return {
          xpAwarded: res.xp_awarded,
          newTotalXp: res.new_total_xp || 2500,
        };
      }
    } catch {
      // fallback
    }

    const saved = localStorage.getItem(DASHBOARD_STORAGE_KEY);
    let newTotal = 2500;
    if (saved) {
      try {
        const data: DashboardData = JSON.parse(saved);
        data.dailyChallenge.completed = true;
        data.dailyChallenge.currentProgress = data.dailyChallenge.targetProgress;
        data.stats.totalXp += data.dailyChallenge.xpReward;
        data.stats.todayXpEarned += data.dailyChallenge.xpReward;
        data.user.xp += data.dailyChallenge.xpReward;
        newTotal = data.stats.totalXp;
        localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(data));
      } catch {
        // ignore
      }
    }
    return { xpAwarded: 50, newTotalXp: newTotal };
  },
};
