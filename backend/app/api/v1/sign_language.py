"""
FastAPI router for Sign Language Recognition, Sessions, and Gemma 4 Tutor Bridge.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.database.session import get_db
from app.core.exceptions import EntityNotFoundException, ValidationError
from app.api.deps import get_current_user_optional, get_current_user
from app.models.user import User
from app.schemas.sign_language import (
    SignModelsStatusResponse,
    SignModelInfo,
    SignVocabularyResponse,
    CreateSessionRequest,
    CreateSessionResponse,
    ProcessFrameRequest,
    ProcessFrameResponse,
    ProcessLandmarksRequest,
    SessionStatusResponse,
    ConfirmTextRequest,
    ConfirmTextResponse,
    AskTutorFromSignRequest,
    AskTutorFromSignResponse,
    SignPrediction
)
from app.services.sign_language.model_registry import SignModelRegistry
from app.services.sign_language.landmark_extractor import MediaPipeLandmarkExtractor
from app.services.sign_language.recognition_session import SessionManager
from app.services.sign_language.vocabulary_service import SignVocabularyService
from app.services.ai.ai_service import AIService

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/sign-language", tags=["Sign Language Recognition"])

# Cached singletons
landmark_extractor = MediaPipeLandmarkExtractor()


@router.get("/models", response_model=SignModelsStatusResponse)
async def list_models():
    """Returns load status and metadata for all pre-trained sign language models."""
    registry = SignModelRegistry.get_instance()

    models_info = [
        SignModelInfo(
            name=m.get("description", k),
            filename=m.get("filename", ""),
            model_type=m.get("model_type", ""),
            input_dimension=m.get("input_dim", 0),
            supported_classes=m.get("classes", []),
            is_loaded=m.get("is_loaded", False),
            status=m.get("status", "")
        )
        for k, m in registry.metadata.items()
    ]

    loaded_count = sum(1 for m in models_info if m.is_loaded)
    return SignModelsStatusResponse(
        total_models=len(models_info),
        loaded_models=loaded_count,
        models=models_info
    )


@router.get("/vocabulary", response_model=SignVocabularyResponse)
async def get_vocabulary():
    """Returns the full Indian Sign Language (ISL) vocabulary, categories, and descriptions."""
    return SignVocabularyService.get_vocabulary()


@router.post("/sessions", response_model=CreateSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    request: CreateSessionRequest,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Initializes a new real-time webcam sign language recognition session."""
    user_id = str(current_user.id) if current_user else None
    manager = SessionManager.get_instance()
    session = manager.create_session(
        user_id=user_id,
        mode=request.mode,
        language=request.language
    )

    return CreateSessionResponse(
        session_id=session.session_id,
        mode=session.mode,
        language=session.language,
        created_at=session.created_at,
        status="active"
    )


@router.get("/sessions/{session_id}", response_model=SessionStatusResponse)
async def get_session(session_id: str):
    """Retrieves session status, frame count, and currently recognized text buffer."""
    manager = SessionManager.get_instance()
    session = manager.get_session(session_id)
    if not session:
        raise EntityNotFoundException("RecognitionSession", session_id)
    return session.to_status_response()


@router.delete("/sessions/{session_id}", status_code=status.HTTP_200_OK)
async def close_session(session_id: str):
    """Closes and frees resources for a sign recognition session."""
    manager = SessionManager.get_instance()
    closed = manager.close_session(session_id)
    if not closed:
        raise EntityNotFoundException("RecognitionSession", session_id)
    return {"message": "Session successfully terminated", "session_id": session_id}


@router.post("/sessions/{session_id}/frames", response_model=ProcessFrameResponse)
async def process_frame(
    session_id: str,
    request: ProcessFrameRequest
):
    """
    Processes a base64-encoded webcam video frame.
    Extracts MediaPipe landmarks, performs MLP inference, debounces, and appends confirmed signs.
    """
    manager = SessionManager.get_instance()
    session = manager.get_session(session_id)
    if not session:
        raise EntityNotFoundException("RecognitionSession", session_id)

    try:
        landmarks_list, handedness, _ = landmark_extractor.extract_from_base64(request.frame_base64)
    except Exception as e:
        logger.error("frame_extraction_failed", error=str(e), session_id=session_id)
        raise ValidationError(f"Failed to process video frame: {str(e)}")

    prediction = session.process_landmarks(landmarks_list)

    return ProcessFrameResponse(
        session_id=session.session_id,
        prediction=prediction,
        current_text=session.confirmed_text,
        frame_count=session.frame_count
    )


@router.post("/sessions/{session_id}/landmarks", response_model=ProcessFrameResponse)
async def process_landmarks(
    session_id: str,
    request: ProcessLandmarksRequest
):
    """
    Processes client-side extracted landmarks directly (efficient for low-bandwidth mobile clients).
    """
    manager = SessionManager.get_instance()
    session = manager.get_session(session_id)
    if not session:
        raise EntityNotFoundException("RecognitionSession", session_id)

    prediction = session.process_landmarks(request.hands)

    return ProcessFrameResponse(
        session_id=session.session_id,
        prediction=prediction,
        current_text=session.confirmed_text,
        frame_count=session.frame_count
    )


@router.post("/confirm", response_model=ConfirmTextResponse)
async def confirm_text_action(request: ConfirmTextRequest):
    """Executes editing actions (append, space, backspace, clear) on session text."""
    manager = SessionManager.get_instance()
    session = manager.get_session(request.session_id)
    if not session:
        raise EntityNotFoundException("RecognitionSession", request.session_id)

    action = request.action.lower()
    if action == "append":
        if not request.character:
            raise ValidationError("Character is required for append action")
        current = session.append_character(request.character)
    elif action == "space":
        current = session.add_space()
    elif action == "backspace":
        current = session.backspace()
    elif action == "clear":
        current = session.clear_text()
    else:
        raise ValidationError(f"Unsupported action: {request.action}")

    return ConfirmTextResponse(
        session_id=session.session_id,
        current_text=current,
        action_performed=action
    )


@router.post("/clear", response_model=ConfirmTextResponse)
async def clear_session_text(session_id: str):
    """Convenience endpoint to clear current session text buffer."""
    manager = SessionManager.get_instance()
    session = manager.get_session(session_id)
    if not session:
        raise EntityNotFoundException("RecognitionSession", session_id)

    current = session.clear_text()
    return ConfirmTextResponse(
        session_id=session.session_id,
        current_text=current,
        action_performed="clear"
    )


@router.post("/ask-tutor", response_model=AskTutorFromSignResponse)
async def ask_tutor_from_sign(
    request: AskTutorFromSignRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Pipes recognized sign language text directly into the Gemma 4 Cloud AI Tutor.
    Empowers non-verbal / Deaf learners to ask questions directly via sign language!
    """
    manager = SessionManager.get_instance()
    session = manager.get_session(request.session_id)
    if not session:
        raise EntityNotFoundException("RecognitionSession", request.session_id)

    query_text = session.confirmed_text.strip()
    if not query_text:
        raise ValidationError("Cannot ask tutor: session text buffer is empty. Sign some characters first.")

    ai_service = AIService()
    if current_user:
        from app.schemas.ai_tutor import TutorRequest
        tutor_req = TutorRequest(
            message=query_text,
            task="educational_explanation",
            conversation_id=request.conversation_id,
            input_type="sign_language"
        )
        tutor_resp = await ai_service.answer_tutor_request(current_user, tutor_req, db)
        reply_text = tutor_resp.response.text
        conv_id = tutor_resp.conversation_id
    else:
        sys_inst = "You are Gemma 4, an inclusive educational AI tutor for EduBridge AI."
        prompt = f"The student signed: '{query_text}'. Please provide a clear, supportive educational explanation."
        content = await ai_service.provider.generate_educational_content(
            prompt=prompt,
            system_instruction=sys_inst,
            task="educational_explanation"
        )
        reply_text = content.text
        conv_id = request.conversation_id

    return AskTutorFromSignResponse(
        session_id=session.session_id,
        recognized_text=query_text,
        tutor_reply=reply_text,
        conversation_id=conv_id,
        mode="explain"
    )
