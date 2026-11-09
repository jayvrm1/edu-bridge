"""
In-memory session manager for real-time webcam sign recognition sessions.
Maintains active user sessions, isolated debouncers, frame tracking, and text buffers.
"""

import uuid
import time
from datetime import datetime, timezone
from typing import Dict, Optional, Any, List
import structlog

from app.schemas.sign_language import (
    SessionStatusResponse,
    SignPrediction
)
from app.services.sign_language.mlp_recognizer import SignLanguageRecognizer
from app.services.sign_language.confidence_service import ConfidenceDebouncer

logger = structlog.get_logger(__name__)


class SignRecognitionSession:
    """Represents a continuous real-time recognition session for a client."""

    def __init__(
        self,
        session_id: str,
        user_id: Optional[str] = None,
        mode: str = "auto",
        language: str = "ISL"
    ):
        self.session_id = session_id
        self.user_id = user_id
        self.mode = mode
        self.language = language
        self.created_at = datetime.now(timezone.utc)
        self.last_activity = datetime.now(timezone.utc)
        self.frame_count = 0
        self.confirmed_text = ""
        self.is_active = True

        # Per-session recognizer with isolated debouncer
        self.debouncer = ConfidenceDebouncer()
        self.recognizer = SignLanguageRecognizer(debouncer=self.debouncer)

    def record_activity(self) -> None:
        self.last_activity = datetime.now(timezone.utc)
        self.frame_count += 1

    def append_character(self, char: str) -> str:
        self.confirmed_text += char
        self.record_activity()
        return self.confirmed_text

    def add_space(self) -> str:
        if self.confirmed_text and not self.confirmed_text.endswith(" "):
            self.confirmed_text += " "
        self.record_activity()
        return self.confirmed_text

    def backspace(self) -> str:
        if self.confirmed_text:
            self.confirmed_text = self.confirmed_text[:-1]
        self.record_activity()
        return self.confirmed_text

    def clear_text(self) -> str:
        self.confirmed_text = ""
        self.debouncer.reset()
        self.record_activity()
        return self.confirmed_text

    def process_features(self, features: List[float]) -> SignPrediction:
        self.record_activity()
        prediction = self.recognizer.predict_features(features, mode=self.mode)
        if prediction.is_confirmed and prediction.predicted_label:
            self.append_character(prediction.predicted_label)
        return prediction

    def process_landmarks(self, multi_hand_landmarks: List[Any]) -> SignPrediction:
        self.record_activity()
        prediction = self.recognizer.predict_from_landmarks(multi_hand_landmarks, mode=self.mode)
        if prediction.is_confirmed and prediction.predicted_label:
            self.append_character(prediction.predicted_label)
        return prediction

    def to_status_response(self) -> SessionStatusResponse:
        return SessionStatusResponse(
            session_id=self.session_id,
            user_id=self.user_id,
            status="active" if self.is_active else "closed",
            mode=self.mode,
            language=self.language,
            current_text=self.confirmed_text,
            frame_count=self.frame_count,
            created_at=self.created_at,
            last_activity=self.last_activity
        )


class SessionManager:
    """Manages active sign recognition sessions across the backend."""
    _instance: Optional["SessionManager"] = None

    def __init__(self):
        self._sessions: Dict[str, SignRecognitionSession] = {}

    @classmethod
    def get_instance(cls) -> "SessionManager":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def create_session(
        self,
        user_id: Optional[str] = None,
        mode: str = "auto",
        language: str = "ISL"
    ) -> SignRecognitionSession:
        session_id = f"isl_{uuid.uuid4().hex[:12]}"
        session = SignRecognitionSession(
            session_id=session_id,
            user_id=user_id,
            mode=mode,
            language=language
        )
        self._sessions[session_id] = session
        logger.info("sign_session_created", session_id=session_id, user_id=user_id, mode=mode)
        return session

    def get_session(self, session_id: str) -> Optional[SignRecognitionSession]:
        session = self._sessions.get(session_id)
        if session and session.is_active:
            return session
        return None

    def close_session(self, session_id: str) -> bool:
        session = self._sessions.get(session_id)
        if session:
            session.is_active = False
            session.debouncer.reset()
            self._sessions.pop(session_id, None)
            logger.info("sign_session_closed", session_id=session_id)
            return True
        return False

    def cleanup_idle(self, max_idle_seconds: int = 1800) -> int:
        now = datetime.now(timezone.utc)
        expired = []
        for sid, sess in self._sessions.items():
            delta = (now - sess.last_activity).total_seconds()
            if delta > max_idle_seconds:
                expired.append(sid)

        for sid in expired:
            self.close_session(sid)
        return len(expired)

