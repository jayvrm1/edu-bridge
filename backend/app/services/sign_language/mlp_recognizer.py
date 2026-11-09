"""
MLP Sign Language Recognizer for Indian Sign Language (ISL).
Performs inference on 42-feature and 84-feature landmark vectors.
"""

from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import structlog

from app.core.config import settings
from app.schemas.sign_language import SignPrediction
from app.services.sign_language.model_registry import (
    SignModelRegistry,
    LABELS_SINGLE_HAND_ALPHABET,
    LABELS_TWO_HAND_ALPHABET,
    LABELS_NUMBERS
)
from app.services.sign_language.feature_processor import FeatureProcessor
from app.services.sign_language.confidence_service import ConfidenceDebouncer

logger = structlog.get_logger(__name__)


class SignLanguageRecognizer:
    """
    Evaluates normalized landmark vectors against verified MLP models.
    Supports single-hand alphabet (42-dim), two-hand alphabet (84-dim), and numbers (42-dim).
    """

    def __init__(
        self,
        registry: Optional[SignModelRegistry] = None,
        debouncer: Optional[ConfidenceDebouncer] = None
    ):
        self.registry = registry or SignModelRegistry.get_instance()
        self.debouncer = debouncer or ConfidenceDebouncer()

    def predict_features(
        self,
        features: List[float],
        mode: str = "auto"
    ) -> SignPrediction:
        """
        Runs model inference on normalized landmark features.
        features: 42 elements (1 hand) or 84 elements (2 hands).
        mode: 'auto', 'alphabet', or 'number'
        """
        num_features = len(features)
        if num_features not in (42, 84):
            return SignPrediction(
                predicted_label=None,
                confidence=0.0,
                is_confirmed=False,
                num_hands=0,
                mode_used="invalid",
                message=f"Expected 42 or 84 features, got {num_features}"
            )

        features_np = np.asarray([features], dtype=np.float32)

        # 1) Two-hand alphabet (84 features)
        if num_features == 84:
            model = self.registry.get_model("mlp_two_hand_alphabet")
            if not model:
                return SignPrediction(
                    predicted_label=None,
                    confidence=0.0,
                    is_confirmed=False,
                    num_hands=2,
                    mode_used="two_hand_alphabet",
                    message="Model 'mlp_two_hand_alphabet' is not loaded"
                )

            label_map = LABELS_TWO_HAND_ALPHABET
            proba = model.predict_proba(features_np)[0]
            best_idx = int(np.argmax(proba))
            confidence = float(proba[best_idx])
            predicted_label = label_map.get(best_idx, "Unknown")
            mode_used = "two_hand_alphabet"

            # Top 3 candidates
            top_indices = np.argsort(proba)[::-1][:3]
            candidates = [
                {"label": label_map.get(idx, "Unknown"), "probability": round(float(proba[idx]), 4)}
                for idx in top_indices
            ]

        # 2) Single-hand (42 features)
        else:
            if mode == "number":
                model = self.registry.get_model("mlp_numbers")
                label_map = LABELS_NUMBERS
                mode_used = "numbers"
                proba = model.predict_proba(features_np)[0] if model is not None else None
            elif mode == "alphabet":
                model = self.registry.get_model("mlp_single_hand_alphabet")
                label_map = LABELS_SINGLE_HAND_ALPHABET
                mode_used = "single_hand_alphabet"
                proba = model.predict_proba(features_np)[0] if model is not None else None
            else:
                # "auto" mode: evaluate both models, pick highest confidence
                model_alpha = self.registry.get_model("mlp_single_hand_alphabet")
                model_num = self.registry.get_model("mlp_numbers")

                conf_alpha, idx_alpha, proba_alpha = 0.0, 0, None
                conf_num, idx_num, proba_num = 0.0, 0, None

                if model_alpha:
                    proba_alpha = model_alpha.predict_proba(features_np)[0]
                    idx_alpha = int(np.argmax(proba_alpha))
                    conf_alpha = float(proba_alpha[idx_alpha])

                if model_num:
                    proba_num = model_num.predict_proba(features_np)[0]
                    idx_num = int(np.argmax(proba_num))
                    conf_num = float(proba_num[idx_num])

                if conf_num > conf_alpha and model_num:
                    model = model_num
                    label_map = LABELS_NUMBERS
                    proba = proba_num
                    best_idx = idx_num
                    confidence = conf_num
                    mode_used = "numbers"
                else:
                    model = model_alpha
                    label_map = LABELS_SINGLE_HAND_ALPHABET
                    proba = proba_alpha
                    best_idx = idx_alpha
                    confidence = conf_alpha
                    mode_used = "single_hand_alphabet"

            if not model or proba is None:
                return SignPrediction(
                    predicted_label=None,
                    confidence=0.0,
                    is_confirmed=False,
                    num_hands=1,
                    mode_used=mode_used,
                    message=f"Model for mode '{mode}' is not loaded"
                )

            best_idx = int(np.argmax(proba))
            confidence = float(proba[best_idx])
            predicted_label = label_map.get(best_idx, "Unknown")

            top_indices = np.argsort(proba)[::-1][:3]
            candidates = [
                {"label": label_map.get(idx, "Unknown"), "probability": round(float(proba[idx]), 4)}
                for idx in top_indices
            ]

        # Apply confidence debouncing
        is_confirmed, confirmed_char, reason = self.debouncer.evaluate(predicted_label, confidence)

        return SignPrediction(
            predicted_label=predicted_label,
            confidence=round(confidence, 4),
            is_confirmed=is_confirmed,
            num_hands=2 if num_features == 84 else 1,
            mode_used=mode_used,
            top_candidates=candidates,
            message=reason
        )

    def predict_from_landmarks(
        self,
        multi_hand_landmarks: List[Any],
        mode: str = "auto"
    ) -> SignPrediction:
        """Extracts normalized features from landmarks and performs inference."""
        if not multi_hand_landmarks:
            self.debouncer.reset()
            return SignPrediction(
                predicted_label=None,
                confidence=0.0,
                is_confirmed=False,
                num_hands=0,
                mode_used="none",
                message="No hands detected in frame"
            )

        features, num_hands, _ = FeatureProcessor.process_multi_hands(multi_hand_landmarks)
        return self.predict_features(features, mode=mode)
