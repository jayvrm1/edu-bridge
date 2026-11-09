"""
Sign Language domain models with lazy='selectin' for async loading.
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy import String, Integer, ForeignKey, DateTime, Boolean, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin


class SignVocabulary(Base, TimestampMixin):
    __tablename__ = "sign_vocabulary"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    language_identifier: Mapped[str] = mapped_column(String(10), default="ISL", nullable=False, index=True)
    sign_identifier: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    gloss: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(30), default="alphabet", nullable=False)
    two_handed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    dataset_source: Mapped[str] = mapped_column(String(100), default="ISL_Lexicon", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    animations: Mapped[List["SignAnimation"]] = relationship(
        "SignAnimation", back_populates="sign", cascade="all, delete-orphan", lazy="selectin"
    )


class SignAnimation(Base, TimestampMixin):
    __tablename__ = "sign_animations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sign_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("sign_vocabulary.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sigml_filename: Mapped[str] = mapped_column(String(100), nullable=False)
    sigml_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    hamnosys_code: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    bone_keyframes_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    duration_seconds: Mapped[float] = mapped_column(default=1.5, nullable=False)

    sign: Mapped["SignVocabulary"] = relationship("SignVocabulary", back_populates="animations")


class ModelConfiguration(Base, TimestampMixin):
    __tablename__ = "model_configurations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    model_type: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    version: Mapped[str] = mapped_column(String(20), default="1.0.0", nullable=False)
    weights_path: Mapped[str] = mapped_column(String(255), nullable=False)
    input_feature_dim: Mapped[int] = mapped_column(Integer, nullable=False)
    supported_classes: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
