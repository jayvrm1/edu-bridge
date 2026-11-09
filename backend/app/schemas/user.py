"""
User profile and Accessibility preferences schemas (Pydantic v2).
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class AccessibilityPreferencesSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    # High-level disability classifications
    hearing_impairment: bool = Field(default=False, description="Hearing impairment status")
    visual_impairment: bool = Field(default=False, description="Visual impairment status")
    speech_impairment: bool = Field(default=False, description="Speech impairment status")
    other_requirements: bool = Field(default=False, description="Other accessibility status")

    # Granular hearing options
    captions_enabled: bool = Field(default=False, description="Captions enabled on video/speech")
    sign_language_avatar_enabled: bool = Field(default=True, description="3D sign-language avatar enabled")
    visual_notifications_enabled: bool = Field(default=True, description="Visual flashes for audio cues")
    audio_independent_interaction: bool = Field(default=False, description="Strictly audio-independent workflow")

    # Granular visual options
    screen_reader_compatible: bool = Field(default=False, description="Enhanced screen reader compatibility")
    high_contrast: bool = Field(default=False, description="High contrast UI theme")
    text_size: str = Field(default="medium", description="Text size: small, medium, large, x-large")
    audio_descriptions_enabled: bool = Field(default=False, description="Audio descriptions for diagrams/visuals")
    voice_interaction_enabled: bool = Field(default=False, description="Voice-guided interaction")

    # Granular speech options
    sign_language_input_enabled: bool = Field(default=False, description="Sign language webcam input preferred")
    aac_communication_enabled: bool = Field(default=False, description="AAC communication boards enabled")
    text_communication_enabled: bool = Field(default=True, description="Text chat communication enabled")
    quick_response_phrases_enabled: bool = Field(default=False, description="Shortcuts for fast non-verbal responses")

    # Additional custom metadata
    preferences_metadata: Dict[str, Any] = Field(default_factory=dict)


class AccessibilityPreferencesUpdate(BaseModel):
    hearing_impairment: Optional[bool] = None
    visual_impairment: Optional[bool] = None
    speech_impairment: Optional[bool] = None
    other_requirements: Optional[bool] = None

    captions_enabled: Optional[bool] = None
    sign_language_avatar_enabled: Optional[bool] = None
    visual_notifications_enabled: Optional[bool] = None
    audio_independent_interaction: Optional[bool] = None

    screen_reader_compatible: Optional[bool] = None
    high_contrast: Optional[bool] = None
    text_size: Optional[str] = None
    audio_descriptions_enabled: Optional[bool] = None
    voice_interaction_enabled: Optional[bool] = None

    sign_language_input_enabled: Optional[bool] = None
    aac_communication_enabled: Optional[bool] = None
    text_communication_enabled: Optional[bool] = None
    quick_response_phrases_enabled: Optional[bool] = None

    preferences_metadata: Optional[Dict[str, Any]] = None


class UserProfileSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    full_name: Optional[str] = None
    preferred_language: str = "en"
    avatar_url: Optional[str] = None
    profile_metadata: Dict[str, Any] = Field(default_factory=dict)


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, max_length=100)
    preferred_language: Optional[str] = Field(default=None, max_length=10)
    avatar_url: Optional[str] = Field(default=None, max_length=500)
    profile_metadata: Optional[Dict[str, Any]] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: EmailStr
    is_active: bool
    created_at: datetime
    profile: Optional[UserProfileSchema] = None
    accessibility_preferences: Optional[AccessibilityPreferencesSchema] = None
