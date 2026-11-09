"""
FastAPI router for Gamification: XP, Badges, Streaks, Daily Challenges, and Leaderboard.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.database.session import get_db
from app.core.exceptions import EntityNotFoundException, ValidationError
from app.api.deps import get_current_active_user, get_current_user_optional
from app.models.user import User
from app.schemas.gamification import (
    UserGamificationProfileResponse,
    XPTransactionResponse,
    AchievementResponse,
    StreakInfoResponse,
    DailyChallengesResponse,
    LeaderboardResponse,
    QuizSubmitRequest,
    QuizSubmitResponse
)
from app.services.gamification.gamification_service import GamificationService

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/gamification", tags=["Gamification & Learning Progress"])


@router.get("/profile", response_model=UserGamificationProfileResponse)
async def get_user_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieves learner's gamification profile, XP level, and progress to next level."""
    return await GamificationService.get_profile(db, current_user.id)


@router.get("/xp-history", response_model=List[XPTransactionResponse])
async def get_xp_history(
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieves chronological XP earning history."""
    profile = await GamificationService.get_profile(db, current_user.id)
    return profile.recent_transactions[:limit]


@router.get("/achievements", response_model=List[AchievementResponse])
async def get_achievements(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Lists all available badges and achievements with unlocked status."""
    return await GamificationService.get_achievements(db, current_user.id)


@router.get("/streaks", response_model=StreakInfoResponse)
async def get_streaks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Returns learner's active consecutive day streaks and record."""
    return await GamificationService.get_streak_info(db, current_user.id)


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Returns actual database leaderboard rankings sorted by total XP."""
    return await GamificationService.get_leaderboard(db, limit=limit)


@router.get("/challenges", response_model=DailyChallengesResponse)
async def get_daily_challenges(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieves daily inclusive learning quests and progress."""
    return await GamificationService.get_daily_challenges(db, current_user.id)


@router.post("/challenges/{challenge_id}/complete")
async def complete_challenge(
    challenge_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Marks a daily learning challenge complete and awards XP."""
    return await GamificationService.complete_daily_challenge(db, current_user.id, challenge_id)


@router.post("/quiz/submit", response_model=QuizSubmitResponse)
async def submit_quiz(
    payload: QuizSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Submits educational quiz results, records attempt, and awards XP."""
    return await GamificationService.submit_quiz(db, current_user.id, payload)

