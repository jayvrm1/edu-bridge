"""
Gemma 4 AI Tutor endpoints.
Provides academic tutoring, concept explanations, topic summaries, quiz generation, and conversation management.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.models.user import User
from app.api.deps import get_current_active_user
from app.services.ai.ai_service import AIService, get_ai_service
from app.services.ai.conversation_manager import ConversationManager
from app.schemas.ai_tutor import (
    TutorRequest,
    TutorResponse,
    QuizGenerationRequest,
    QuizGenerationResponse,
    QuizEvaluationRequest,
    QuizEvaluationResponse,
    StructuredTutorContent
)
from app.schemas.conversation import ConversationResponse


router = APIRouter(prefix="/tutor", tags=["AI Tutor"])


@router.post(
    "/chat",
    response_model=TutorResponse,
    status_code=status.HTTP_200_OK,
    summary="Interactive learning turn with Gemma 4 Tutor"
)
async def tutor_chat(
    payload: TutorRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    ai_service: AIService = Depends(get_ai_service)
) -> TutorResponse:
    return await ai_service.answer_tutor_request(current_user, payload, db)


@router.post(
    "/explain",
    response_model=TutorResponse,
    status_code=status.HTTP_200_OK,
    summary="Detailed academic concept explanation"
)
async def tutor_explain(
    payload: TutorRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    ai_service: AIService = Depends(get_ai_service)
) -> TutorResponse:
    payload.task = "educational_explanation"
    return await ai_service.answer_tutor_request(current_user, payload, db)


@router.post(
    "/summarize",
    response_model=TutorResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate concise educational topic summary"
)
async def tutor_summarize(
    payload: TutorRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    ai_service: AIService = Depends(get_ai_service)
) -> TutorResponse:
    payload.task = "summary"
    return await ai_service.answer_tutor_request(current_user, payload, db)


@router.post(
    "/generate-quiz",
    response_model=QuizGenerationResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate custom educational quiz"
)
async def generate_quiz(
    payload: QuizGenerationRequest,
    current_user: User = Depends(get_current_active_user),
    ai_service: AIService = Depends(get_ai_service)
) -> QuizGenerationResponse:
    lang = current_user.profile.preferred_language if current_user.profile else "en"
    return await ai_service.quiz_generator.create_quiz(payload, language=lang)


@router.post(
    "/quiz/evaluate",
    response_model=QuizEvaluationResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate submitted quiz answers and award XP"
)
async def evaluate_quiz(
    payload: QuizEvaluationRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    ai_service: AIService = Depends(get_ai_service)
) -> QuizEvaluationResponse:
    return await ai_service.quiz_generator.evaluate_quiz(payload, user_id=current_user.id, db=db)


# ── Conversation Management ──────────────────────────────────────────────────

@router.get(
    "/conversations",
    response_model=List[ConversationResponse],
    status_code=status.HTTP_200_OK,
    summary="List learning conversations for current user"
)
async def list_conversations(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> List[ConversationResponse]:
    return await ConversationManager.list_user_conversations(
        db=db,
        user_id=current_user.id,
        limit=limit,
        offset=offset
    )


@router.get(
    "/conversations/{conversation_id}",
    response_model=ConversationResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve full conversation history"
)
async def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> ConversationResponse:
    return await ConversationManager.get_user_conversation(
        db=db,
        user_id=current_user.id,
        conversation_id=conversation_id
    )


@router.delete(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete conversation and its message history"
)
async def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    await ConversationManager.delete_conversation(
        db=db,
        user_id=current_user.id,
        conversation_id=conversation_id
    )
    return {"success": True, "message": f"Conversation {conversation_id} deleted successfully."}

