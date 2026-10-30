/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AccessibilityNeed =
  | 'hearing_impairment'
  | 'visual_impairment'
  | 'speech_impairment'
  | 'adhd_cognitive'
  | 'motor_mobility'
  | 'none';

export interface AccessibilityPreferences {
  needs: AccessibilityNeed[];
  captionsEnabled: boolean;
  captionSize: 'small' | 'medium' | 'large';
  textSize: 'normal' | 'large' | 'xlarge';
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  voiceInteractionEnabled: boolean;
  speechRate: number; // 0.7 to 1.3
  preferredSignLanguage: 'ISL' | 'ASL';
  avatarEnabled: boolean;
  avatarSpeed: number; // 0.5 to 1.5
  aacEnabled: boolean;
  audioDescriptions: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  level: number;
  levelTitle: string;
  xp: number;
  streakDays: number;
  globalRank: number;
  preferences: AccessibilityPreferences;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn?: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export type ComprehensionMode = 'simple' | 'detailed' | 'step_by_step' | 'visual_analogies';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  audioUrl?: string;
  signTokens?: string[];
  visualPrompt?: string;
  inputMethod?: 'text' | 'voice' | 'sign' | 'aac';
}

export interface AACItem {
  id: string;
  label: string;
  phrase: string;
  category: 'greetings' | 'needs' | 'questions' | 'learning' | 'feelings' | 'actions';
  icon: string;
  signToken?: string;
}

export interface SignRecognitionResult {
  sign: string;
  confidence: number;
  timestamp: number;
  alternatives?: { sign: string; confidence: number }[];
  landmarksDetected?: boolean;
}

export interface SignExercise {
  id: string;
  title: string;
  sign: string;
  category: string;
  description: string;
  tips: string[];
  xpReward: number;
  imageUrl?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface Course {
  id: string;
  title: string;
  description: string;
  progressPercent: number;
  totalLessons: number;
  completedLessons: number;
  category: 'ISL' | 'STEM' | 'Everyday Life' | 'Communication';
  durationMinutes: number;
  bannerColor: string;
  icon: string;
  modules: {
    id: string;
    title: string;
    completed: boolean;
    duration: string;
    signCount: number;
  }[];
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  signHint?: string;
  hasAudio?: boolean;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questions: QuizQuestion[];
}

export interface QuizResult {
  score: number;
  total: number;
  xpEarned: number;
  streakBonus: boolean;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  currentProgress: number;
  targetProgress: number;
  completed: boolean;
  category: string;
}

export interface LeaderboardUser {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  streak: number;
  xp: number;
  isCurrentUser?: boolean;
  statusBadge?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  xpReward: number;
  category: 'streak' | 'sign' | 'learning' | 'quiz';
}

export interface ActivityDay {
  date: string;
  dayNumber: number;
  active: boolean;
  isToday: boolean;
  minutesLearned: number;
  signsPracticed: number;
}

export interface DashboardData {
  user: User;
  stats: {
    traineeLevel: string;
    levelProgressPercent: number;
    streakDays: number;
    globalRank: number;
    totalXp: number;
    todayXpEarned: number;
    learningEfficiencyPercent: number;
  };
  dailyChallenge: DailyChallenge;
  activeCourses: Course[];
  leaderboard: LeaderboardUser[];
  activityCalendar: ActivityDay[];
  signOfTheDay: {
    sign: string;
    englishMeaning: string;
    category: string;
    tip: string;
    funFact: string;
  };
}

export interface BackendEndpointHealth {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  status: 'online' | 'offline' | 'checking';
  description: string;
}
