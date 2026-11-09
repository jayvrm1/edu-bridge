"""
Conversation and Message lifecycle manager.
Enforces strict user ownership, manages chat context, and persists turns in PostgreSQL.
"""

from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.conversation import Conversation, Message
from app.core.exceptions import EntityNotFoundException, PermissionDeniedError


class ConversationManager:
    """Manages conversations and message persistence for learners."""

    @classmethod
    async def get_or_create_conversation(
        cls,
        db: AsyncSession,
        user_id: int,
        conversation_id: Optional[int] = None,
        initial_title: str = "New Learning Session"
    ) -> Conversation:
        if conversation_id:
            stmt = select(Conversation).where(Conversation.id == conversation_id)
            res = await db.execute(stmt)
            conv = res.scalar_one_or_none()
            if not conv:
                raise EntityNotFoundException("Conversation", conversation_id)
            if conv.user_id != user_id:
                raise PermissionDeniedError("You do not have permission to access this conversation.")
            return conv

        # Create new
        new_conv = Conversation(
            user_id=user_id,
            title=initial_title
        )
        db.add(new_conv)
        await db.commit()
        await db.refresh(new_conv)
        return new_conv

    @classmethod
    async def save_message(
        cls,
        db: AsyncSession,
        conversation_id: int,
        role: str,
        content: str,
        input_type: str = "text",
        metadata: Optional[dict] = None
    ) -> Message:
        msg = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            input_type=input_type,
            metadata_payload=metadata or {}
        )
        db.add(msg)
        await db.commit()
        await db.refresh(msg)
        return msg

    @classmethod
    async def list_user_conversations(
        cls,
        db: AsyncSession,
        user_id: int,
        limit: int = 20,
        offset: int = 0
    ) -> List[Conversation]:
        stmt = (
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(desc(Conversation.created_at))
            .limit(limit)
            .offset(offset)
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @classmethod
    async def get_user_conversation(
        cls,
        db: AsyncSession,
        user_id: int,
        conversation_id: int
    ) -> Conversation:
        stmt = select(Conversation).where(Conversation.id == conversation_id)
        res = await db.execute(stmt)
        conv = res.scalar_one_or_none()
        if not conv:
            raise EntityNotFoundException("Conversation", conversation_id)
        if conv.user_id != user_id:
            raise PermissionDeniedError("Access to this conversation is forbidden.")
        return conv

    @classmethod
    async def delete_conversation(
        cls,
        db: AsyncSession,
        user_id: int,
        conversation_id: int
    ) -> bool:
        conv = await cls.get_user_conversation(db, user_id, conversation_id)
        await db.delete(conv)
        await db.commit()
        return True

