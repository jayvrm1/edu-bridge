"""
Pydantic schemas for 3D Sign Language Avatar, SiGML Animations, and Translation Sequences.
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class AvatarLanguageInfo(BaseModel):
    code: str = Field(..., description="Language identifier (e.g. 'ISL', 'ASL')")
    name: str = Field(..., description="Full language name")
    is_primary: bool = Field(default=False, description="Primary platform language")
    total_animations: int = Field(default=0, description="Available animations count")
    status: str = Field(default="operational", description="Support status")


class AvatarVocabularyItem(BaseModel):
    gloss: str = Field(..., description="Sign gloss label (e.g. 'HELLO', 'ZERO')")
    filename: str = Field(..., description="Associated SiGML file name")
    category: str = Field(default="general", description="Vocabulary category")
    has_sigml: bool = Field(default=True, description="Whether SiGML source file exists")
    has_hamnosys: bool = Field(default=True, description="Whether HamNoSys tags are present")


class AvatarVocabularyResponse(BaseModel):
    total_signs: int = Field(..., description="Total available sign animations")
    language: str = Field(default="ISL", description="Sign language code")
    signs: List[AvatarVocabularyItem] = Field(..., description="List of available sign vocabulary")


class TranslateTextRequest(BaseModel):
    text: str = Field(..., description="Input text to translate into sign language sequence")
    target_language: str = Field(default="ISL", description="Target sign language dialect")
    fingerspell_unknown: bool = Field(default=True, description="Fingerspell words without direct signs")


class SignSequenceToken(BaseModel):
    token: str = Field(..., description="Word or character")
    is_fingerspelled: bool = Field(default=False, description="Whether sign is a fingerspelled letter")
    sigml_file: Optional[str] = Field(default=None, description="Matching SiGML filename if found")
    found: bool = Field(default=True, description="Whether matching animation exists")
    duration_ms: int = Field(default=1200, description="Estimated duration in milliseconds")


class TranslateTextResponse(BaseModel):
    original_text: str = Field(..., description="Original input text")
    language: str = Field(default="ISL", description="Target sign language")
    sequence: List[SignSequenceToken] = Field(..., description="Ordered list of sign tokens")
    total_duration_ms: int = Field(..., description="Total estimated animation sequence duration")
    coverage_percentage: float = Field(..., description="Percentage of tokens with valid animations")


class AnimationSequenceRequest(BaseModel):
    glosses: List[str] = Field(..., description="List of sign glosses to compile into animation sequence")
    fps: int = Field(default=30, description="Target animation keyframe rate")


class ThreeJsBoneTrack(BaseModel):
    bone_name: str = Field(..., description="Target bone name in human skeleton rig")
    times: List[float] = Field(..., description="Keyframe timestamp seconds")
    values: List[float] = Field(..., description="Quaternion or Vector3 track values")


class SignAnimationPayload(BaseModel):
    gloss: str = Field(..., description="Sign gloss")
    sigml_filename: str = Field(..., description="SiGML file")
    raw_sigml: str = Field(..., description="Raw SiGML XML text")
    hamnosys_symbols: List[str] = Field(default_factory=list, description="Extracted HamNoSys tags")
    mouth_picture: Optional[str] = Field(default=None, description="Non-manual viseme mouth shape")
    duration_ms: int = Field(default=1200, description="Duration in ms")
    threejs_bones: List[ThreeJsBoneTrack] = Field(default_factory=list, description="Bone animation tracks for Three.js")


class AnimationSequenceResponse(BaseModel):
    total_signs: int = Field(..., description="Number of signs in sequence")
    total_duration_ms: int = Field(..., description="Combined sequence duration in ms")
    animations: List[SignAnimationPayload] = Field(..., description="Compiled animations ready for avatar playback")

