"""
Gamification Service.
Manages XP transactions, levels, achievements, streaks, and database-backed leaderboards.
"""

from datetime import datetime, date, timezone, timedelta
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func
import structlog

from app.models.gamification import (
    UserGamification,
    XPTransaction,
    Achievement,
    UserAchievement,
    Lesson,
    QuizAttempt
)
from app.models.user import User, UserProfile
from app.schemas.gamification import (
    UserGamificationProfileResponse,
    XPTransactionResponse,
    AchievementResponse,
    StreakInfoResponse,
    DailyChallengeItem,
    DailyChallengesResponse,
    LeaderboardEntry,
    LeaderboardResponse,
    QuizSubmitRequest,
    QuizSubmitResponse
)

logger = structlog.get_logger(__name__)

INITIAL_ACHIEVEMENTS = [
    {"slug": "first_steps", "name": "First Steps", "description": "Joined EduBridge AI and completed initial session", "icon": "sparkles", "xp": 50},
    {"slug": "sign_starter", "name": "Sign Starter", "description": "Practiced your first Indian Sign Language gesture", "icon": "hand", "xp": 75},
    {"slug": "quiz_whiz", "name": "Quiz Whiz", "description": "Passed an interactive educational quiz", "icon": "award", "xp": 100},
    {"slug": "streak_master", "name": "Consistent Learner", "description": "Maintained a 3-day active learning streak", "icon": "flame", "xp": 150},
    {"slug": "level_5", "name": "Rising Scholar", "description": "Reached Level 5 in EduBridge learning journey", "icon": "crown", "xp": 200},
]


class GamificationService:
    """Orchestrates learning rewards, streaks, and ranking."""

    @staticmethod
    def calculate_level(total_xp: int) -> int:
        """Formula: Level = floor(sqrt(XP / 100)) + 1."""
        if total_xp <= 0:
            return 1
        return int((total_xp / 100.0) ** 0.5) + 1

    @staticmethod
    def calculate_next_level_xp(current_level: int) -> int:
        """XP needed to reach current_level + 1."""
        return (current_level ** 2) * 100

    @classmethod
    async def get_or_create_gamification(cls, db: AsyncSession, user_id: int) -> UserGamification:
        stmt = select(UserGamification).where(UserGamification.user_id == user_id)
        res = await db.execute(stmt)
        record = res.scalar_one_or_none()

        if not record:
            record = UserGamification(
                user_id=user_id,
                xp=0,
                level=1,
                current_streak_days=1,
                longest_streak_days=1,
                last_activity_date=datetime.now(timezone.utc).date()
            )
            db.add(record)
            await db.commit()
            await db.refresh(record)

            # Seed initial achievements in database if empty
            await cls._seed_achievements_if_needed(db)

        return record

    @classmethod
    async def _seed_achievements_if_needed(cls, db: AsyncSession) -> None:
        stmt = select(func.count(Achievement.id))
        count = (await db.execute(stmt)).scalar() or 0
        if count == 0:
            for ach in INITIAL_ACHIEVEMENTS:
                db.add(Achievement(
                    slug=ach["slug"],
                    name=ach["name"],
                    description=ach["description"],
                    badge_icon=ach["icon"],
                    xp_reward=ach["xp"]
                ))
            await db.commit()

    @classmethod
    async def get_profile(cls, db: AsyncSession, user_id: int) -> UserGamificationProfileResponse:
        record = await cls.get_or_create_gamification(db, user_id)
        next_xp = cls.calculate_next_level_xp(record.level)
        current_level_base = ((record.level - 1) ** 2) * 100
        span = max(1, next_xp - current_level_base)
        progress = round(min(100.0, max(0.0, (record.xp - current_level_base) / span * 100.0)), 1)

        # Recent transactions
        stmt = select(XPTransaction).where(
            XPTransaction.gamification_id == record.id
        ).order_by(desc(XPTransaction.created_at)).limit(10)
        tx_res = await db.execute(stmt)
        recent_txs = [XPTransactionResponse.model_validate(t) for t in tx_res.scalars().all()]

        unlocked_count = len(record.user_achievements) if record.user_achievements else 0

        return UserGamificationProfileResponse(
            user_id=record.user_id,
            xp=record.xp,
            level=record.level,
            current_streak_days=record.current_streak_days,
            longest_streak_days=record.longest_streak_days,
            last_activity_date=record.last_activity_date,
            next_level_xp=next_xp,
            progress_percentage=progress,
            unlocked_achievements_count=unlocked_count,
            recent_transactions=recent_txs
        )

    @classmethod
    async def award_xp(
        cls,
        db: AsyncSession,
        user_id: int,
        amount: int,
        action_type: str,
        description: Optional[str] = None
    ) -> Tuple[int, int, Optional[str]]:
        """
        Atomically records XP transaction, recalculates level, and evaluates achievements.
        Returns: (new_total_xp, new_level, unlocked_achievement_name)
        """
        record = await cls.get_or_create_gamification(db, user_id)

        # 1. Add XP Transaction
        tx = XPTransaction(
            gamification_id=record.id,
            amount=amount,
            action_type=action_type,
            description=description or f"Awarded {amount} XP for {action_type}"
        )
        db.add(tx)

        # 2. Update Total XP & Level
        record.xp += amount
        new_level = cls.calculate_level(record.xp)
        record.level = new_level

        # 3. Check streak
        today = datetime.now(timezone.utc).date()
        if record.last_activity_date != today:
            if record.last_activity_date == today - timedelta(days=1):
                record.current_streak_days += 1
            else:
                record.current_streak_days = 1
            record.longest_streak_days = max(record.longest_streak_days, record.current_streak_days)
            record.last_activity_date = today

        # 4. Check achievements
        unlocked_name = await cls._check_and_unlock_achievements(db, record)

        await db.commit()
        await db.refresh(record)

        return record.xp, record.level, unlocked_name

    @classmethod
    async def _check_and_unlock_achievements(
        cls,
        db: AsyncSession,
        gamification: UserGamification
    ) -> Optional[str]:
        await cls._seed_achievements_if_needed(db)
        ach_stmt = select(Achievement)
        all_achs = (await db.execute(ach_stmt)).scalars().all()

        existing_unlocked_ids = {
            ua.achievement_id for ua in (gamification.user_achievements or [])
        }

        unlocked_badge = None
        for a in all_achs:
            if a.id in existing_unlocked_ids:
                continue

            should_unlock = False
            if a.slug == "first_steps" and gamification.xp >= 10:
                should_unlock = True
            elif a.slug == "streak_master" and gamification.current_streak_days >= 3:
                should_unlock = True
            elif a.slug == "level_5" and gamification.level >= 5:
                should_unlock = True
            elif a.slug == "sign_starter" and gamification.xp >= 50:
                should_unlock = True

            if should_unlock:
                ua = UserAchievement(
                    gamification_id=gamification.id,
                    achievement_id=a.id
                )
                db.add(ua)
                gamification.xp += a.xp_reward
                unlocked_badge = a.name
                break

        return unlocked_badge

    @classmethod
    async def get_achievements(cls, db: AsyncSession, user_id: int) -> List[AchievementResponse]:
        await cls._seed_achievements_if_needed(db)
        record = await cls.get_or_create_gamification(db, user_id)

        user_ach_map = {
            ua.achievement_id: ua.unlocked_at for ua in (record.user_achievements or [])
        }

        ach_stmt = select(Achievement).order_by(Achievement.id)
        all_achs = (await db.execute(ach_stmt)).scalars().all()

        results = []
        for a in all_achs:
            is_unlocked = a.id in user_ach_map
            results.append(AchievementResponse(
                id=a.id,
                slug=a.slug,
                name=a.name,
                description=a.description,
                badge_icon=a.badge_icon,
                xp_reward=a.xp_reward,
                is_unlocked=is_unlocked,
                unlocked_at=user_ach_map.get(a.id)
            ))
        return results

    @classmethod
    async def get_streak_info(cls, db: AsyncSession, user_id: int) -> StreakInfoResponse:
        record = await cls.get_or_create_gamification(db, user_id)
        today = datetime.now(timezone.utc).date()
        is_active = (record.last_activity_date == today)

        return StreakInfoResponse(
            current_streak_days=record.current_streak_days,
            longest_streak_days=record.longest_streak_days,
            last_activity_date=record.last_activity_date,
            is_streak_active_today=is_active
        )

    @classmethod
    async def get_leaderboard(cls, db: AsyncSession, limit: int = 20) -> LeaderboardResponse:
        stmt = (
            select(UserGamification, User, UserProfile)
            .join(User, UserGamification.user_id == User.id)
            .outerjoin(UserProfile, User.id == UserProfile.user_id)
            .order_by(desc(UserGamification.xp))
            .limit(limit)
        )
        res = await db.execute(stmt)
        rows = res.all()

        entries = []
        for rank, (gam, u, prof) in enumerate(rows, start=1):
            name = prof.full_name if (prof and prof.full_name) else u.username
            entries.append(LeaderboardEntry(
                rank=rank,
                user_id=u.id,
                username=u.username,
                full_name=name,
                level=gam.level,
                xp=gam.xp,
                current_streak_days=gam.current_streak_days
            ))

        total_count = (await db.execute(select(func.count(UserGamification.id)))).scalar() or len(entries)

        return LeaderboardResponse(
            total_ranked_learners=total_count,
            leaderboard=entries
        )

    @classmethod
    async def get_daily_challenges(cls, db: AsyncSession, user_id: int) -> DailyChallengesResponse:
        record = await cls.get_or_create_gamification(db, user_id)

        challenges = [
            DailyChallengeItem(
                id="daily_sign_practice",
                title="Practice 3 Signs",
                description="Sign 3 distinct letters or numbers in webcam session",
                xp_reward=60,
                category="sign_language",
                progress=min(3, record.xp // 20),
                target=3,
                is_completed=(record.xp >= 60)
            ),
            DailyChallengeItem(
                id="daily_tutor_query",
                title="Ask Gemma 4 Tutor",
                description="Ask an academic question using speech, sign, or AAC",
                xp_reward=50,
                category="ai_tutor",
                progress=1 if record.xp > 0 else 0,
                target=1,
                is_completed=(record.xp > 0)
            ),
            DailyChallengeItem(
                id="daily_quiz_perfect",
                title="Pass a Quiz",
                description="Achieve 70%+ score on any topic quiz",
                xp_reward=80,
                category="quiz",
                progress=1 if record.level >= 2 else 0,
                target=1,
                is_completed=(record.level >= 2)
            ),
        ]
        completed = sum(1 for c in challenges if c.is_completed)
        return DailyChallengesResponse(
            total_challenges=len(challenges),
            completed_challenges=completed,
            challenges=challenges
        )

    @classmethod
    async def complete_daily_challenge(cls, db: AsyncSession, user_id: int, challenge_id: str) -> Dict[str, Any]:
        rewards = {
            "daily_sign_practice": 60,
            "daily_tutor_query": 50,
            "daily_quiz_perfect": 80
        }
        reward_xp = rewards.get(challenge_id, 40)
        new_xp, new_lvl, badge = await cls.award_xp(
            db=db,
            user_id=user_id,
            amount=reward_xp,
            action_type="challenge_completion",
            description=f"Completed daily challenge '{challenge_id}'"
        )
        return {
            "challenge_id": challenge_id,
            "status": "completed",
            "xp_awarded": reward_xp,
            "total_xp": new_xp,
            "level": new_lvl,
            "badge_unlocked": badge
        }

    @classmethod
    async def submit_quiz(cls, db: AsyncSession, user_id: int, payload: QuizSubmitRequest) -> QuizSubmitResponse:
        # Ensure dummy lesson exists for foreign key
        lesson_stmt = select(Lesson).where(Lesson.id == payload.lesson_id)
        lesson = (await db.execute(lesson_stmt)).scalar_one_or_none()
        if not lesson:
            lesson = Lesson(
                id=payload.lesson_id,
                title="Educational Module",
                category="Science",
                difficulty="intermediate"
            )
            db.add(lesson)
            await db.commit()

        pct = round((payload.score / payload.max_score) * 100.0, 1)
        passed = pct >= 60.0

        # Persist attempt
        attempt = QuizAttempt(
            user_id=user_id,
            lesson_id=lesson.id,
            score=payload.score,
            max_score=payload.max_score,
            passed=passed
        )
        db.add(attempt)
        await db.commit()
        await db.refresh(attempt)

        # Award XP
        xp_earned = payload.score * 25 + (50 if passed else 10)
        new_xp, new_lvl, badge = await cls.award_xp(
            db=db,
            user_id=user_id,
            amount=xp_earned,
            action_type="quiz_attempt",
            description=f"Scored {payload.score}/{payload.max_score} ({pct}%) on Lesson {lesson.id}"
        )

        return QuizSubmitResponse(
            attempt_id=attempt.id,
            score=payload.score,
            max_score=payload.max_score,
            percentage=pct,
            passed=passed,
            xp_earned=xp_earned,
            new_total_xp=new_xp,
            new_level=new_lvl,
            unlocked_achievement=badge
        )

