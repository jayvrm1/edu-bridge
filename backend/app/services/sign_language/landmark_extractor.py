"""
MediaPipe Landmark Extractor for Webcam and Image Frames.
Extracts 21 3D landmarks per hand with handedness detection.
Supports modern MediaPipe Tasks Vision API (HandLandmarker / GestureRecognizer)
as well as classic MediaPipe solutions where present.
"""

import base64
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
import structlog

from app.core.config import settings

logger = structlog.get_logger(__name__)

try:
    import cv2
    import mediapipe as mp
    from mediapipe.tasks.python import BaseOptions
    from mediapipe.tasks.python.vision import GestureRecognizer, GestureRecognizerOptions
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False


class MediaPipeLandmarkExtractor:
    """
    Extracts hand landmarks from video frames, base64 strings, or raw image buffers.
    Uses modern MediaPipe GestureRecognizer task bundle or solutions pipeline.
    """

    def __init__(
        self,
        model_asset_path: Optional[Path] = None,
        num_hands: int = 2,
        min_hand_detection_confidence: float = 0.4
    ):
        self.recognizer = None
        self.classic_hands = None

        if not MEDIAPIPE_AVAILABLE:
            logger.warning("mediapipe_not_available")
            return

        model_path = model_asset_path or (settings.resolved_models_dir / "gesture_recognizer.task")

        # 1. Try modern MediaPipe Tasks API
        if model_path.exists():
            try:
                options = GestureRecognizerOptions(
                    base_options=BaseOptions(model_asset_path=str(model_path)),
                    num_hands=num_hands,
                    min_hand_detection_confidence=min_hand_detection_confidence
                )
                self.recognizer = GestureRecognizer.create_from_options(options)
                logger.info("mediapipe_tasks_recognizer_initialized", path=str(model_path))
                return
            except Exception as exc:
                logger.warning("mediapipe_tasks_init_failed", error=str(exc))

        # 2. Fallback to classic solutions.hands if present in environment
        if hasattr(mp, "solutions") and hasattr(mp.solutions, "hands"):
            try:
                self.classic_hands = mp.solutions.hands.Hands(
                    static_image_mode=False,
                    max_num_hands=num_hands,
                    min_detection_confidence=min_hand_detection_confidence,
                    min_tracking_confidence=0.5
                )
                logger.info("mediapipe_classic_hands_initialized")
                return
            except Exception as exc:
                logger.warning("mediapipe_classic_init_failed", error=str(exc))

        logger.info("mediapipe_running_in_stub_or_fallback_mode")

    def decode_base64_frame(self, base64_str: str) -> np.ndarray:
        """
        Decodes base64 string (including data URI format) into OpenCV BGR numpy array.
        """
        if "," in base64_str:
            base64_str = base64_str.split(",", 1)[1]

        try:
            image_bytes = base64.b64decode(base64_str)
            np_arr = np.frombuffer(image_bytes, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            if frame is None:
                raise ValueError("Failed to decode image from buffer")
            return frame
        except Exception as e:
            raise ValueError(f"Invalid base64 frame encoding: {str(e)}")

    def extract_from_frame(
        self,
        frame_bgr: np.ndarray,
        flip_horizontal: bool = True
    ) -> Tuple[List[Any], List[str], Tuple[int, int]]:
        """
        Processes BGR image frame.
        Returns:
            - multi_hand_landmarks: list of hands, each containing 21 landmark items
            - handedness_labels: list of strings ('Left', 'Right')
            - dimensions: (height, width)
        """
        if not MEDIAPIPE_AVAILABLE:
            raise RuntimeError("OpenCV/MediaPipe is not installed")

        if flip_horizontal:
            frame_bgr = cv2.flip(frame_bgr, 1)

        height, width, _ = frame_bgr.shape
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)

        landmarks_list: List[Any] = []
        handedness_list: List[str] = []

        # Route A: Modern Tasks Vision API
        if self.recognizer is not None:
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
            result = self.recognizer.recognize(mp_image)
            if result.hand_landmarks:
                landmarks_list = list(result.hand_landmarks)
                if result.handedness:
                    for h_list in result.handedness:
                        if h_list:
                            handedness_list.append(h_list[0].display_name or h_list[0].category_name)
                if not handedness_list:
                    handedness_list = ["Right"] * len(landmarks_list)
            return landmarks_list, handedness_list, (height, width)

        # Route B: Classic Solutions Hands API
        if self.classic_hands is not None:
            results = self.classic_hands.process(frame_rgb)
            if results.multi_hand_landmarks:
                landmarks_list = list(results.multi_hand_landmarks)
                if results.multi_handedness:
                    for h in results.multi_handedness:
                        handedness_list.append(h.classification[0].label)
                else:
                    handedness_list = ["Right"] * len(landmarks_list)
            return landmarks_list, handedness_list, (height, width)

        # Route C: Neither active
        return [], [], (height, width)

    def extract_from_base64(
        self,
        base64_str: str,
        flip_horizontal: bool = True
    ) -> Tuple[List[Any], List[str], Tuple[int, int]]:
        """Convenience method combining base64 decoding and landmark extraction."""
        frame = self.decode_base64_frame(base64_str)
        return self.extract_from_frame(frame, flip_horizontal=flip_horizontal)
