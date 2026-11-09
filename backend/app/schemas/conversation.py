"""
Conversation and Message schemas (Pydantic v2).
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict


class MessageCreate(BaseModel):
    role: str = Field(default="user", description="Message role: user, assistant, system")
    input_type: str = Field(default="text", description="Input type: text, sign_language, voice, aac, ocr")
    content: str = Field(..., description="Text or transcript of user/assistant message")
    metadata_payload: Dict[str, Any] = Field(default_factory=dict, description="Metadata such as confidence scores")


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    role: str
    input_type: str
    content: str
    metadata_payload: Dict[str, Any]
    created_at: datetime


class ConversationCreate(BaseModel):
    title: Optional[str] = Field(default="New Learning Session", max_length=200)


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    created_at: datetime
    messages: List[MessageResponse] = []
