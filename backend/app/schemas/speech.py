"""
Pydantic schemas for Speech-to-Text and Text-to-Speech audio processing.
"""

from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class SpeechStatusResponse(BaseModel):
    tts_available: bool = Field(..., description="Whether Text-to-Speech provider is active")
    stt_available: bool = Field(..., description="Whether Speech-to-Text provider is active")
    tts_provider: str = Field(..., description="Active TTS provider identifier")
    stt_provider: str = Field(..., description="Active STT provider identifier")
    supported_voices: list[str] = Field(default_factory=list, description="Available voice IDs")
    supported_languages: list[str] = Field(default_factory=list, description="Supported language codes")


class SynthesizeSpeechRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Text to synthesize to speech")
    voice_id: Optional[str] = Field(default="default", description="Voice profile")
    language: str = Field(default="en", description="Language code (e.g. 'en', 'hi')")
    speed: float = Field(default=1.0, ge=0.5, le=2.0, description="Audio speed multiplier")


class SynthesizeSpeechResponse(BaseModel):
    text: str = Field(..., description="Synthesized source text")
    audio_base64: str = Field(..., description="Base64 encoded audio bytes (MP3/WAV)")
    mime_type: str = Field(default="audio/mp3", description="Audio MIME format")
    duration_estimate_seconds: float = Field(..., description="Estimated playback length")
    provider_used: str = Field(..., description="Provider that generated audio")


class TranscribeAudioRequest(BaseModel):
    audio_base64: str = Field(..., description="Base64 encoded audio sample (WAV/MP3/WebM)")
    language: str = Field(default="en", description="Expected audio language code")


class TranscribeAudioResponse(BaseModel):
    transcription: str = Field(..., description="Transcribed textual content")
    confidence: float = Field(default=0.95, description="Confidence score [0.0, 1.0]")
    language_detected: str = Field(default="en", description="Detected language code")
    duration_seconds: float = Field(default=0.0, description="Estimated audio duration")

