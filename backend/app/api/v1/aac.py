"""
FastAPI router for Augmentative and Alternative Communication (AAC) cards & custom boards.
"""

from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.database.session import get_db
from app.core.exceptions import EntityNotFoundException, ValidationError
from app.api.deps import get_current_user_optional, get_current_active_user
from app.models.user import User
from app.schemas.aac import (
    AACPhraseCreate,
    AACPhraseUpdate,
    AACPhraseResponse,
    AACBoardResponse
)
from app.services.aac.aac_service import AACService

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/aac", tags=["Augmentative & Alternative Communication (AAC)"])


@router.get("/phrases", response_model=AACBoardResponse)
async def get_aac_board(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Retrieves full AAC phrase board grouped by categories for user or guest."""
    user_id = current_user.id if current_user else None
    return await AACService.get_user_board(db, user_id=user_id)


@router.post("/phrases", response_model=AACPhraseResponse, status_code=status.HTTP_201_CREATED)
async def create_custom_phrase(
    payload: AACPhraseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Creates a user-specific custom AAC communication card."""
    return await AACService.create_phrase(db, user_id=current_user.id, payload=payload)


@router.patch("/phrases/{phrase_id}", response_model=AACPhraseResponse)
async def update_custom_phrase(
    phrase_id: int,
    payload: AACPhraseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Updates an existing custom AAC phrase card belonging to user."""
    updated = await AACService.update_phrase(db, user_id=current_user.id, phrase_id=phrase_id, payload=payload)
    if not updated:
        raise EntityNotFoundException("AACPhrase", phrase_id)
    return updated


@router.delete("/phrases/{phrase_id}", status_code=status.HTTP_200_OK)
async def delete_custom_phrase(
    phrase_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Deletes an existing custom AAC phrase card belonging to user."""
    deleted = await AACService.delete_phrase(db, user_id=current_user.id, phrase_id=phrase_id)
    if not deleted:
        raise EntityNotFoundException("AACPhrase", phrase_id)
    return {"message": "AAC phrase successfully deleted", "phrase_id": phrase_id}


@router.post("/ask-tutor")
async def ask_tutor_from_aac(
    phrase_text: str,
    conversation_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Submits an AAC communication phrase directly to the Gemma 4 AI Tutor.
    Empowers non-speaking/speech-impaired learners to ask questions via visual symbols.
    """
    from app.services.ai.ai_service import AIService
    from app.schemas.ai_tutor import TutorRequest

    ai_service = AIService()
    if current_user:
        tutor_req = TutorRequest(
            message=phrase_text,
            task="educational_explanation",
            conversation_id=conversation_id,
            input_type="aac"
        )
        tutor_resp = await ai_service.answer_tutor_request(current_user, tutor_req, db)
        return {
            "source": "aac",
            "phrase_text": phrase_text,
            "tutor_reply": tutor_resp.response.text,
            "conversation_id": tutor_resp.conversation_id
        }
    else:
        sys_inst = "You are Gemma 4, an inclusive educational AI tutor for EduBridge AI."
        prompt = f"The student communicated via AAC board: '{phrase_text}'. Provide a supportive, clear educational explanation."
        content = await ai_service.provider.generate_educational_content(
            prompt=prompt,
            system_instruction=sys_inst,
            task="educational_explanation"
        )
        return {
            "source": "aac",
            "phrase_text": phrase_text,
            "tutor_reply": content.text,
            "conversation_id": conversation_id
        }
