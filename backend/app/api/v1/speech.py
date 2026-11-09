"""
FastAPI router for Text-to-Speech (TTS) and Speech-to-Text (STT) services.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.database.session import get_db
from app.api.deps import get_current_user_optional
from app.models.user import User

from app.core.exceptions import ValidationError
from app.schemas.speech import (
    SpeechStatusResponse,
    SynthesizeSpeechRequest,
    SynthesizeSpeechResponse,
    TranscribeAudioRequest,
    TranscribeAudioResponse
)
from app.services.speech.speech_service import SpeechService

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/speech", tags=["Speech & Audio Accessibility"])


@router.get("/status", response_model=SpeechStatusResponse)
async def get_speech_status():
    """Returns availability and supported profiles for TTS and STT providers."""
    return SpeechService.get_instance().get_status()


@router.post("/synthesize", response_model=SynthesizeSpeechResponse)
async def synthesize_speech(request: SynthesizeSpeechRequest):
    """Converts written text into spoken audio data (TTS)."""
    if not request.text.strip():
        raise ValidationError("Input text cannot be empty")
    return SpeechService.get_instance().synthesize(request)


@router.post("/transcribe", response_model=TranscribeAudioResponse)
async def transcribe_speech(request: TranscribeAudioRequest):
    """Converts recorded audio samples into recognized text (STT)."""
    if not request.audio_base64.strip():
        raise ValidationError("Audio payload cannot be empty")
    try:
        return SpeechService.get_instance().transcribe(request)
    except ValueError as e:
        raise ValidationError(str(e))


@router.post("/ask-tutor")
async def ask_tutor_from_speech(
    audio_base64: str,
    language: str = "en",
    conversation_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Transcribes student audio and queries the Gemma 4 AI Tutor directly.
    Empowers voice-first learners (e.g. visually impaired or mobility impaired).
    """
    from app.services.ai.ai_service import AIService
    from app.schemas.ai_tutor import TutorRequest

    stt_resp = SpeechService.get_instance().transcribe(
        TranscribeAudioRequest(audio_base64=audio_base64, language=language)
    )
    user_query = stt_resp.transcription

    ai_service = AIService()
    if current_user:
        tutor_req = TutorRequest(
            message=user_query,
            task="educational_explanation",
            conversation_id=conversation_id,
            input_type="voice"
        )
        tutor_resp = await ai_service.answer_tutor_request(current_user, tutor_req, db)
        reply = tutor_resp.response.text
        conv_id = tutor_resp.conversation_id
    else:
        sys_inst = "You are Gemma 4, an inclusive educational AI tutor for EduBridge AI."
        prompt = f"The student asked via voice speech: '{user_query}'. Provide a supportive, clear educational explanation."
        content = await ai_service.provider.generate_educational_content(
            prompt=prompt,
            system_instruction=sys_inst,
            task="educational_explanation"
        )
        reply = content.text
        conv_id = conversation_id

    # Synthesize audio reply
    tts_resp = SpeechService.get_instance().synthesize(
        SynthesizeSpeechRequest(text=reply[:300], language=language)
    )

    return {
        "source": "voice",
        "transcribed_query": user_query,
        "tutor_reply": reply,
        "audio_reply_base64": tts_resp.audio_base64,
        "conversation_id": conv_id
    }
