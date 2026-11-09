"""
User, UserProfile, AccessibilityPreferences, and UserSession / RefreshToken database models.
Configured with lazy='selectin' for seamless async SQLAlchemy 2.0 loading.
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy import String, Boolean, ForeignKey, DateTime, Integer, JSON, Index, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships with lazy='selectin' for async compatibility
    profile: Mapped[Optional["UserProfile"]] = relationship(
        "UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan", lazy="selectin"
    )
    accessibility_preferences: Mapped[Optional["AccessibilityPreferences"]] = relationship(
        "AccessibilityPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan", lazy="selectin"
    )
    sessions: Mapped[List["UserSession"]] = relationship(
        "UserSession", back_populates="user", cascade="all, delete-orphan", lazy="selectin"
    )
    conversations: Mapped[List["Conversation"]] = relationship(
        "Conversation", back_populates="user", cascade="all, delete-orphan", lazy="selectin"
    )
    gamification: Mapped[Optional["UserGamification"]] = relationship(
        "UserGamification", back_populates="user", uselist=False, cascade="all, delete-orphan", lazy="selectin"
    )


class UserProfile(Base, TimestampMixin):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    full_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    preferred_language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    profile_metadata: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="profile")


class AccessibilityPreferences(Base):
    __tablename__ = "accessibility_preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    
    # ── High-Level Impairment Flags (Multiple simultaneous selections allowed) ──
    hearing_impairment: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    visual_impairment: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    speech_impairment: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    other_requirements: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Granular Hearing Accessibility Options ──
    captions_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sign_language_avatar_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    visual_notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    audio_independent_interaction: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Granular Visual Accessibility Options ──
    screen_reader_compatible: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    high_contrast: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    text_size: Mapped[str] = mapped_column(String(20), default="medium", nullable=False)
    audio_descriptions_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    voice_interaction_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Granular Speech Accessibility Options ──
    sign_language_input_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    aac_communication_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    text_communication_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    quick_response_phrases_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # ── Custom / Future Extensibility Metadata ──
    preferences_metadata: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="accessibility_preferences")


class UserSession(Base):
    """Stores active sessions, device info, and refresh tokens with rotation."""
    __tablename__ = "user_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    session_identifier: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    refresh_token: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    device_info: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="sessions")


from app.models.conversation import Conversation
from app.models.gamification import UserGamification
