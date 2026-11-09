"""
FastAPI router for 3D Sign Language Avatar animations, SiGML compilation, and translation.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query
import structlog

from app.core.exceptions import EntityNotFoundException, ValidationError
from app.schemas.avatar import (
    AvatarLanguageInfo,
    AvatarVocabularyResponse,
    TranslateTextRequest,
    TranslateTextResponse,
    AnimationSequenceRequest,
    AnimationSequenceResponse,
    SignAnimationPayload
)
from app.services.avatar.avatar_service import AvatarService

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/avatar", tags=["3D Sign Avatar & Translation"])


@router.get("/languages", response_model=List[AvatarLanguageInfo])
async def list_languages():
    """Lists supported sign languages and available animation inventory."""
    service = AvatarService.get_instance()
    return service.get_supported_languages()


@router.get("/vocabulary", response_model=AvatarVocabularyResponse)
async def list_vocabulary(limit: int = Query(default=500, ge=1, le=2000)):
    """Returns available sign animation glosses and SiGML assets."""
    service = AvatarService.get_instance()
    return service.get_vocabulary(limit=limit)


@router.post("/translate", response_model=TranslateTextResponse)
async def translate_text_to_sign(request: TranslateTextRequest):
    """
    Translates input text into an ordered sign sequence.
    Utilizes fingerspelling fallback for words not present in the direct SiGML inventory.
    """
    if not request.text.strip():
        raise ValidationError("Input text cannot be empty")

    service = AvatarService.get_instance()
    return service.translate_text(
        text=request.text,
        target_language=request.target_language,
        fingerspell_unknown=request.fingerspell_unknown
    )


@router.get("/animation/{sign_id}", response_model=SignAnimationPayload)
async def get_sign_animation(sign_id: str):
    """
    Retrieves full animation payload for a specific sign gloss or filename.
    Returns parsed HamNoSys tags and Three.js bone keyframe tracks.
    """
    service = AvatarService.get_instance()
    anim = service.get_animation_by_sign_id(sign_id)
    if not anim:
        raise EntityNotFoundException("SignAnimation", sign_id)
    return anim


@router.post("/sequence", response_model=AnimationSequenceResponse)
async def compile_animation_sequence(request: AnimationSequenceRequest):
    """
    Compiles a sequence of sign glosses into a concatenated Three.js animation payload.
    """
    if not request.glosses:
        raise ValidationError("Glosses list cannot be empty")

    service = AvatarService.get_instance()
    return service.compile_sequence(request.glosses, fps=request.fps)

