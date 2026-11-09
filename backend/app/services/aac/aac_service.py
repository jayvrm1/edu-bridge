"""
Augmentative and Alternative Communication (AAC) Service.
Manages standard inclusive communication boards and user-customized phrases.
"""

from typing import List, Optional, Dict
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
import structlog

from app.models.aac import AACPhrase
from app.schemas.aac import (
    AACPhraseCreate,
    AACPhraseUpdate,
    AACPhraseResponse,
    AACBoardCategoryGroup,
    AACBoardResponse
)

logger = structlog.get_logger(__name__)

# Predefined universal AAC boards
DEFAULT_AAC_PHRASES = [
    # Greetings
    {"category": "greetings", "label": "Hello", "text": "Hello, good to see you!", "icon": "wave", "shortcut": "1", "order": 1},
    {"category": "greetings", "label": "Good Morning", "text": "Good morning!", "icon": "sun", "shortcut": "2", "order": 2},
    {"category": "greetings", "label": "Thank You", "text": "Thank you very much!", "icon": "heart", "shortcut": "3", "order": 3},
    {"category": "greetings", "label": "Goodbye", "text": "Goodbye, have a great day!", "icon": "hand", "shortcut": "4", "order": 4},

    # Needs
    {"category": "needs", "label": "Need Water", "text": "May I please have a glass of water?", "icon": "droplet", "shortcut": "q", "order": 1},
    {"category": "needs", "label": "Need Break", "text": "I need a short break, please.", "icon": "pause", "shortcut": "w", "order": 2},
    {"category": "needs", "label": "Need Help", "text": "I need some assistance with this.", "icon": "help-circle", "shortcut": "e", "order": 3},
    {"category": "needs", "label": "Yes", "text": "Yes, I agree.", "icon": "check", "shortcut": "y", "order": 4},
    {"category": "needs", "label": "No", "text": "No, thank you.", "icon": "x", "shortcut": "n", "order": 5},

    # Classroom
    {"category": "classroom", "label": "Repeat Please", "text": "Could you please explain that once more?", "icon": "repeat", "shortcut": "a", "order": 1},
    {"category": "classroom", "label": "Slow Down", "text": "Could you please slow down a little bit?", "icon": "clock", "shortcut": "s", "order": 2},
    {"category": "classroom", "label": "Question", "text": "I have a question about this topic.", "icon": "help-circle", "shortcut": "d", "order": 3},
    {"category": "classroom", "label": "I Understand", "text": "I understand the concept clearly now.", "icon": "thumbs-up", "shortcut": "f", "order": 4},

    # Feelings
    {"category": "feelings", "label": "Happy", "text": "I am feeling happy and motivated today.", "icon": "smile", "shortcut": "z", "order": 1},
    {"category": "feelings", "label": "Confused", "text": "I am feeling confused about this lesson.", "icon": "frown", "shortcut": "x", "order": 2},
    {"category": "feelings", "label": "Overwhelmed", "text": "I am feeling a bit overwhelmed by the sensory environment.", "icon": "alert-circle", "shortcut": "c", "order": 3},
]


class AACService:
    """Manages AAC communication cards and boards."""

    @classmethod
    async def get_user_board(cls, db: AsyncSession, user_id: Optional[int] = None) -> AACBoardResponse:
        """Returns merged board containing default system phrases and user custom phrases."""
        query = select(AACPhrase).where(
            or_(AACPhrase.is_system_default == True, AACPhrase.user_id == user_id)
        ).order_by(AACPhrase.category, AACPhrase.order_index)

        res = await db.execute(query)
        db_phrases = list(res.scalars().all())

        # If DB has no system defaults yet, generate from in-memory catalog
        if not db_phrases:
            phrases_list = []
            for item in DEFAULT_AAC_PHRASES:
                p = AACPhrase(
                    id=len(phrases_list) + 1,
                    user_id=None,
                    category=item["category"],
                    label=item["label"],
                    text=item["text"],
                    icon=item["icon"],
                    quick_shortcut=item["shortcut"],
                    is_system_default=True,
                    order_index=item["order"],
                    created_at=datetime.now(timezone.utc)
                )
                phrases_list.append(AACPhraseResponse.model_validate(p, from_attributes=True))
        else:
            phrases_list = [AACPhraseResponse.model_validate(p) for p in db_phrases]

        # Group by category
        grouped: Dict[str, List[AACPhraseResponse]] = {}
        for p in phrases_list:
            grouped.setdefault(p.category, []).append(p)

        board_groups = [
            AACBoardCategoryGroup(category=cat, phrases=items)
            for cat, items in grouped.items()
        ]

        return AACBoardResponse(
            total_phrases=len(phrases_list),
            categories=list(grouped.keys()),
            board=board_groups
        )

    @classmethod
    async def create_phrase(cls, db: AsyncSession, user_id: int, payload: AACPhraseCreate) -> AACPhraseResponse:
        phrase = AACPhrase(
            user_id=user_id,
            category=payload.category.lower().strip(),
            label=payload.label.strip(),
            text=payload.text.strip(),
            icon=payload.icon,
            quick_shortcut=payload.quick_shortcut,
            is_system_default=False,
            order_index=payload.order_index
        )
        db.add(phrase)
        await db.commit()
        await db.refresh(phrase)
        return AACPhraseResponse.model_validate(phrase)

    @classmethod
    async def update_phrase(
        cls,
        db: AsyncSession,
        user_id: int,
        phrase_id: int,
        payload: AACPhraseUpdate
    ) -> Optional[AACPhraseResponse]:
        query = select(AACPhrase).where(and_(AACPhrase.id == phrase_id, AACPhrase.user_id == user_id))
        res = await db.execute(query)
        phrase = res.scalar_one_or_none()
        if not phrase:
            return None

        update_data = payload.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(phrase, field, value)

        await db.commit()
        await db.refresh(phrase)
        return AACPhraseResponse.model_validate(phrase)

    @classmethod
    async def delete_phrase(cls, db: AsyncSession, user_id: int, phrase_id: int) -> bool:
        query = select(AACPhrase).where(and_(AACPhrase.id == phrase_id, AACPhrase.user_id == user_id))
        res = await db.execute(query)
        phrase = res.scalar_one_or_none()
        if not phrase:
            return False

        await db.delete(phrase)
        await db.commit()
        return True
