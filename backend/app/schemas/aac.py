"""
Pydantic schemas for Augmentative and Alternative Communication (AAC).
"""

from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime


class AACPhraseBase(BaseModel):
    category: str = Field(default="general", description="Phrase category (e.g., greetings, needs, classroom)")
    label: str = Field(..., min_length=1, max_length=100, description="Short button or card label")
    text: str = Field(..., min_length=1, max_length=255, description="Full spoken/expressed text")
    icon: str = Field(default="message", description="Material / Lucide icon name")
    quick_shortcut: Optional[str] = Field(default=None, description="Keyboard quick shortcut key")
    order_index: int = Field(default=0, description="Display order sequence")


class AACPhraseCreate(AACPhraseBase):
    pass


class AACPhraseUpdate(BaseModel):
    category: Optional[str] = None
    label: Optional[str] = None
    text: Optional[str] = None
    icon: Optional[str] = None
    quick_shortcut: Optional[str] = None
    order_index: Optional[int] = None


class AACPhraseResponse(AACPhraseBase):
    id: int
    user_id: Optional[int] = None
    is_system_default: bool
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AACBoardCategoryGroup(BaseModel):
    category: str
    phrases: List[AACPhraseResponse]


class AACBoardResponse(BaseModel):
    total_phrases: int
    categories: List[str]
    board: List[AACBoardCategoryGroup]
