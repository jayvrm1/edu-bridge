"""
Pydantic schemas for Sign Language Recognition, Models, Sessions, and Tutor Bridge.
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime


class LandmarkPoint(BaseModel):
    x: float = Field(..., description="Normalized X coordinate [0.0, 1.0]")
    y: float = Field(..., description="Normalized Y coordinate [0.0, 1.0]")
    z: float = Field(default=0.0, description="Normalized Z coordinate (depth)")


class HandLandmarks(BaseModel):
    handedness: str = Field(default="Right", description="Hand orientation: Left or Right")
    score: float = Field(default=1.0, description="MediaPipe detection score")
    landmarks: List[LandmarkPoint] = Field(..., description="21 normalized landmark points")


class SignModelInfo(BaseModel):
    name: str = Field(..., description="Identifier name of the model")
    filename: str = Field(..., description="Filename on disk")
    model_type: str = Field(..., description="Model architecture type (e.g., MLP, RandomForest)")
    input_dimension: int = Field(..., description="Expected feature input dimension (e.g., 42, 84)")
    supported_classes: List[str] = Field(..., description="List of recognized symbols")
    is_loaded: bool = Field(..., description="Whether model is loaded and ready in memory")
    status: str = Field(..., description="Load status message")


class SignModelsStatusResponse(BaseModel):
    total_models: int = Field(..., description="Total registered models")
    loaded_models: int = Field(..., description="Number of currently loaded models")
    models: List[SignModelInfo] = Field(..., description="Details for each model")


class SignVocabularyItem(BaseModel):
    symbol: str = Field(..., description="Character, digit, or gesture label")
    category: str = Field(..., description="alphabet, digit, or control_gesture")
    hand_count: int = Field(..., description="1 for single-hand, 2 for two-hand")
    description: str = Field(..., description="Instructional description of how to perform sign")


class SignVocabularyResponse(BaseModel):
    total_items: int = Field(..., description="Total supported vocabulary symbols")
    categories: Dict[str, List[str]] = Field(..., description="Categorized list of symbols")
    items: List[SignVocabularyItem] = Field(..., description="Full vocabulary item specifications")


class CreateSessionRequest(BaseModel):
    mode: str = Field(default="auto", description="Recognition mode: auto, alphabet, or number")
    language: str = Field(default="ISL", description="Sign language dialect (default: ISL)")
    client_fps: Optional[float] = Field(default=30.0, description="Target client frame rate")


class CreateSessionResponse(BaseModel):
    session_id: str = Field(..., description="Unique webcam recognition session ID")
    mode: str = Field(..., description="Active recognition mode")
    language: str = Field(..., description="Active sign language dialect")
    created_at: datetime = Field(..., description="Session creation timestamp")
    status: str = Field(default="active", description="Session state")


class ProcessFrameRequest(BaseModel):
    frame_base64: str = Field(..., description="Base64-encoded image frame (JPEG/PNG/WebP)")
    timestamp_ms: Optional[float] = Field(default=None, description="Client frame timestamp")


class ProcessLandmarksRequest(BaseModel):
    hands: List[List[Dict[str, float]]] = Field(
        ...,
        description="List of detected hands, each containing 21 landmark dicts with x, y, and optional z"
    )
    timestamp_ms: Optional[float] = Field(default=None, description="Client frame timestamp")


class SignPrediction(BaseModel):
    predicted_label: Optional[str] = Field(default=None, description="Recognized symbol (e.g. 'A', '1', or None)")
    confidence: float = Field(default=0.0, description="Confidence score between 0.0 and 1.0")
    is_confirmed: bool = Field(default=False, description="True if confidence exceeds configured threshold and is debounced")
    num_hands: int = Field(default=0, description="Number of hands detected (0, 1, or 2)")
    mode_used: str = Field(default="none", description="Model used: single_hand_alphabet, two_hand_alphabet, number, etc.")
    top_candidates: List[Dict[str, Any]] = Field(default_factory=list, description="Top prediction alternatives with probabilities")
    message: Optional[str] = Field(default=None, description="Status or advisory message")


class ProcessFrameResponse(BaseModel):
    session_id: str = Field(..., description="Session identifier")
    prediction: SignPrediction = Field(..., description="Frame recognition result")
    current_text: str = Field(..., description="Current accumulated text in session buffer")
    frame_count: int = Field(..., description="Total frames processed in session")


class SessionStatusResponse(BaseModel):
    session_id: str = Field(..., description="Unique webcam recognition session ID")
    user_id: Optional[str] = Field(default=None, description="Associated user ID")
    status: str = Field(..., description="Session state: active, idle, or closed")
    mode: str = Field(..., description="Recognition mode")
    language: str = Field(..., description="Sign language code")
    current_text: str = Field(..., description="Current text buffer")
    frame_count: int = Field(..., description="Total frames processed")
    created_at: datetime = Field(..., description="Session start time")
    last_activity: datetime = Field(..., description="Last frame or command timestamp")


class ConfirmTextRequest(BaseModel):
    session_id: str = Field(..., description="Session identifier")
    action: str = Field(default="append", description="Action: append, space, backspace, or clear")
    character: Optional[str] = Field(default=None, description="Character to append (required if action='append')")


class ConfirmTextResponse(BaseModel):
    session_id: str = Field(..., description="Session identifier")
    current_text: str = Field(..., description="Updated text buffer")
    action_performed: str = Field(..., description="Action that was executed")


class AskTutorFromSignRequest(BaseModel):
    session_id: str = Field(..., description="Session identifier containing recognized text")
    custom_instruction: Optional[str] = Field(default=None, description="Optional custom instruction to Gemma 4 tutor")
    conversation_id: Optional[str] = Field(default=None, description="Optional existing conversation ID to continue")


class AskTutorFromSignResponse(BaseModel):
    session_id: str = Field(..., description="Session identifier")
    recognized_text: str = Field(..., description="Text queried from sign language session")
    tutor_reply: str = Field(..., description="Gemma 4 tutor response")
    conversation_id: Optional[Any] = Field(default=None, description="Conversation identifier")
    mode: str = Field(..., description="Tutor response mode")
