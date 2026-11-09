"""
Pydantic schemas for Gamification, XP, Levels, Badges, Streaks, and Leaderboards.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel, Field, ConfigDict


class XPTransactionResponse(BaseModel):
    id: int
    amount: int
    action_type: str
    description: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AchievementResponse(BaseModel):
    id: int
    slug: str
    name: str
    description: str
    badge_icon: str
    xp_reward: int
    is_unlocked: bool = False
    unlocked_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserGamificationProfileResponse(BaseModel):
    user_id: int
    xp: int
    level: int
    current_streak_days: int
    longest_streak_days: int
    last_activity_date: Optional[date] = None
    next_level_xp: int
    progress_percentage: float
    unlocked_achievements_count: int
    recent_transactions: List[XPTransactionResponse] = Field(default_factory=list)


class StreakInfoResponse(BaseModel):
    current_streak_days: int
    longest_streak_days: int
    last_activity_date: Optional[date] = None
    is_streak_active_today: bool


class DailyChallengeItem(BaseModel):
    id: str
    title: str
    description: str
    xp_reward: int
    category: str
    progress: int
    target: int
    is_completed: bool


class DailyChallengesResponse(BaseModel):
    total_challenges: int
    completed_challenges: int
    challenges: List[DailyChallengeItem]


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    username: str
    full_name: str
    level: int
    xp: int
    current_streak_days: int


class LeaderboardResponse(BaseModel):
    total_ranked_learners: int
    leaderboard: List[LeaderboardEntry]


class QuizSubmitRequest(BaseModel):
    lesson_id: int = Field(default=1, description="Target lesson or quiz ID")
    score: int = Field(..., ge=0, description="Correct questions count")
    max_score: int = Field(..., ge=1, description="Total questions count")
    time_spent_seconds: Optional[int] = Field(default=60, description="Duration in seconds")


class QuizSubmitResponse(BaseModel):
    attempt_id: int
    score: int
    max_score: int
    percentage: float
    passed: bool
    xp_earned: int
    new_total_xp: int
    new_level: int
    unlocked_achievement: Optional[str] = None
