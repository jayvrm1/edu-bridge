"""
Gamification models with lazy='selectin' for async loading.
"""

from datetime import datetime, date, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy import String, Integer, ForeignKey, DateTime, Date, Boolean, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin


class UserGamification(Base, TimestampMixin):
    __tablename__ = "user_gamification"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    xp: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    current_streak_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    longest_streak_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_activity_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="gamification")
    xp_transactions: Mapped[List["XPTransaction"]] = relationship(
        "XPTransaction", back_populates="gamification", cascade="all, delete-orphan", lazy="selectin"
    )
    user_achievements: Mapped[List["UserAchievement"]] = relationship(
        "UserAchievement", back_populates="gamification", cascade="all, delete-orphan", lazy="selectin"
    )


class XPTransaction(Base):
    __tablename__ = "xp_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    gamification_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("user_gamification.id", ondelete="CASCADE"), nullable=False, index=True
    )
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    action_type: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    gamification: Mapped["UserGamification"] = relationship("UserGamification", back_populates="xp_transactions")


class Achievement(Base, TimestampMixin):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    badge_icon: Mapped[str] = mapped_column(String(100), default="star", nullable=False)
    xp_reward: Mapped[int] = mapped_column(Integer, default=50, nullable=False)

    user_achievements: Mapped[List["UserAchievement"]] = relationship(
        "UserAchievement", back_populates="achievement", cascade="all, delete-orphan", lazy="selectin"
    )


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    gamification_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("user_gamification.id", ondelete="CASCADE"), nullable=False, index=True
    )
    achievement_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False, index=True
    )
    unlocked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    gamification: Mapped["UserGamification"] = relationship("UserGamification", back_populates="user_achievements")
    achievement: Mapped["Achievement"] = relationship("Achievement", back_populates="user_achievements", lazy="selectin")


class Lesson(Base, TimestampMixin):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(20), default="beginner", nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content_payload: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    quiz_attempts: Mapped[List["QuizAttempt"]] = relationship(
        "QuizAttempt", back_populates="lesson", cascade="all, delete-orphan", lazy="selectin"
    )


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    lesson_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True
    )
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    max_score: Mapped[int] = mapped_column(Integer, nullable=False)
    passed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    lesson: Mapped["Lesson"] = relationship("Lesson", back_populates="quiz_attempts")


from app.models.user import User
