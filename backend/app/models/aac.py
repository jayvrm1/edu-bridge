"""
Augmentative and Alternative Communication (AAC) database models.
"""

from typing import Optional
from sqlalchemy import String, Integer, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin


class AACPhrase(Base, TimestampMixin):
    __tablename__ = "aac_phrases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    category: Mapped[str] = mapped_column(String(50), default="general", nullable=False, index=True)
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    text: Mapped[str] = mapped_column(String(255), nullable=False)
    icon: Mapped[str] = mapped_column(String(50), default="message", nullable=False)
    quick_shortcut: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    is_system_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    user = relationship("User", lazy="selectin")

