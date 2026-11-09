"""
Database models export.
All SQLAlchemy models must be imported here so Alembic can discover metadata.
"""

from app.database.base import Base
from app.models.user import User, UserProfile, AccessibilityPreferences, UserSession
from app.models.conversation import Conversation, Message
from app.models.gamification import (
    UserGamification,
    XPTransaction,
    Achievement,
    UserAchievement,
    Lesson,
    QuizAttempt
)
from app.models.sign_language import (
    SignVocabulary,
    SignAnimation,
    ModelConfiguration
)
from app.models.aac import AACPhrase

__all__ = [
    "Base",
    "User",
    "UserProfile",
    "AccessibilityPreferences",
    "UserSession",
    "Conversation",
    "Message",
    "UserGamification",
    "XPTransaction",
    "Achievement",
    "UserAchievement",
    "Lesson",
    "QuizAttempt",
    "SignVocabulary",
    "SignAnimation",
    "ModelConfiguration",
    "AACPhrase"
]
