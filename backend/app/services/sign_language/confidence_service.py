"""
Confidence scoring, temporal smoothing, and debounce filtering for real-time sign recognition.
Prevents flicker, rejects low-confidence predictions, and controls character repetition.
"""

import time
from collections import deque
from typing import Optional, Tuple, Dict, Any
import structlog

from app.core.config import settings

logger = structlog.get_logger(__name__)


class ConfidenceDebouncer:
    """
    Applies sliding-window smoothing and temporal debouncing over raw predictions.
    """

    def __init__(
        self,
        confidence_threshold: Optional[float] = None,
        stability_frames: int = 2,
        cooldown_seconds: float = 1.0
    ):
        self.confidence_threshold = confidence_threshold or settings.SIGN_CONFIDENCE_THRESHOLD
        self.stability_frames = stability_frames
        self.cooldown_seconds = cooldown_seconds

        self.recent_labels = deque(maxlen=stability_frames)
        self.last_confirmed_char: Optional[str] = None
        self.last_confirmed_time: float = 0.0

    def evaluate(
        self,
        predicted_label: Optional[str],
        confidence: float
    ) -> Tuple[bool, Optional[str], str]:
        """
        Evaluates a frame prediction.
        Returns:
            - is_confirmed: bool (True if candidate should be committed to text)
            - label_to_commit: Optional[str] (Character to append, or None)
            - status_reason: str (Diagnostic explanation)
        """
        now = time.time()

        if not predicted_label or predicted_label in ("Unknown", "None", ""):
            self.recent_labels.clear()
            return False, None, "No sign detected"

        if confidence < self.confidence_threshold:
            self.recent_labels.clear()
            return False, None, f"Confidence {confidence:.2f} below threshold {self.confidence_threshold:.2f}"

        self.recent_labels.append(predicted_label)

        # Check stability across recent frames
        if len(self.recent_labels) < self.stability_frames:
            return False, None, f"Stabilizing sign ({len(self.recent_labels)}/{self.stability_frames})"

        all_match = all(lbl == predicted_label for lbl in self.recent_labels)
        if not all_match:
            return False, None, "Inconsistent gesture across frames"

        # Check debounce cooldown for repeated character
        if predicted_label == self.last_confirmed_char:
            if (now - self.last_confirmed_time) < self.cooldown_seconds:
                return False, None, f"Debounce cooldown active for '{predicted_label}'"

        # Confirmed!
        self.last_confirmed_char = predicted_label
        self.last_confirmed_time = now
        return True, predicted_label, f"Confirmed '{predicted_label}' with confidence {confidence:.2f}"

    def reset(self) -> None:
        """Reset state tracking."""
        self.recent_labels.clear()
        self.last_confirmed_char = None
        self.last_confirmed_time = 0.0

