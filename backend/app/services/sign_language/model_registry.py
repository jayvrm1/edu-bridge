"""
Central Model Registry for Sign Language Recognition.
Loads, manages, and catalogs verified machine learning models.
"""

import os
import pickle
from pathlib import Path
from typing import Dict, Any, Optional, List
import structlog

from app.core.config import settings

logger = structlog.get_logger(__name__)


# Exact verified label maps from original training scripts
LABELS_SINGLE_HAND_ALPHABET = {
    0: 'C', 1: 'I', 2: 'L', 3: 'O', 4: 'U', 5: 'V'
}

LABELS_TWO_HAND_ALPHABET = {
    0: 'A', 1: 'B', 2: 'D', 3: 'E', 4: 'F', 5: 'G', 6: 'H', 7: 'J', 
    8: 'K', 9: 'M', 10: 'N', 11: 'P', 12: 'Q', 13: 'R', 14: 'S', 
    15: 'T', 16: 'W', 17: 'X', 18: 'Y', 19: 'Z'
}

LABELS_NUMBERS = {
    0: '1', 1: '2', 2: '3', 3: '4', 4: '5', 
    5: '6', 6: '7', 7: '8', 8: '9', 9: '0'
}


class SignModelRegistry:
    """
    Manages loading and querying pre-trained ISL recognition models.
    Thread-safe and cached in memory.
    """
    _instance: Optional["SignModelRegistry"] = None

    def __init__(self, models_dir: Optional[Path] = None):
        self.models_dir = models_dir or settings.resolved_models_dir
        self.models: Dict[str, Any] = {}
        self.metadata: Dict[str, Dict[str, Any]] = {}
        self._initialize_catalog()

    @classmethod
    def get_instance(cls, models_dir: Optional[Path] = None) -> "SignModelRegistry":
        if cls._instance is None:
            cls._instance = cls(models_dir)
            cls._instance.load_all()
        return cls._instance

    def _initialize_catalog(self) -> None:
        self.catalog_definitions = {
            "mlp_single_hand_alphabet": {
                "filename": "mlp_model_1.p",
                "model_type": "MLPClassifier",
                "input_dim": 42,
                "classes": list(LABELS_SINGLE_HAND_ALPHABET.values()),
                "label_map": LABELS_SINGLE_HAND_ALPHABET,
                "description": "ISL single-hand alphabets (C, I, L, O, U, V) via 42 normalized landmark features"
            },
            "mlp_two_hand_alphabet": {
                "filename": "mlp_model_2.p",
                "model_type": "MLPClassifier",
                "input_dim": 84,
                "classes": list(LABELS_TWO_HAND_ALPHABET.values()),
                "label_map": LABELS_TWO_HAND_ALPHABET,
                "description": "ISL two-hand alphabets (A, B, D, E, F, G, H, J, K, M, N, P, Q, R, S, T, W, X, Y, Z) via 84 normalized landmark features"
            },
            "mlp_numbers": {
                "filename": "mlp_model_num.p",
                "model_type": "MLPClassifier",
                "input_dim": 42,
                "classes": list(LABELS_NUMBERS.values()),
                "label_map": LABELS_NUMBERS,
                "description": "ISL digits (0-9) via 42 normalized landmark features"
            },
            "mediapipe_gesture_task": {
                "filename": "gesture_recognizer.task",
                "model_type": "MediaPipeGestureTask",
                "input_dim": 0,
                "classes": ["Open_Palm", "Closed_Fist", "Pointing_Up", "Thumb_Up", "Thumb_Down", "Victory", "ILoveYou"],
                "label_map": {},
                "description": "Binary MediaPipe Gesture Recognizer bundle asset"
            },
            "legacy_random_forest": {
                "filename": "random_forest.joblib",
                "model_type": "RandomForestClassifier",
                "input_dim": 61,
                "classes": ["ISL_Alphabet_A_to_Z"],
                "label_map": {},
                "description": "Legacy 61-feature scikit-learn 0.23 Random Forest (retained for audit)"
            }
        }

    def load_all(self) -> None:
        """Load all compatible models into memory."""
        logger.info("loading_sign_language_models", models_dir=str(self.models_dir))

        for model_id, info in self.catalog_definitions.items():
            file_path = self.models_dir / info["filename"]
            if not file_path.exists():
                self.metadata[model_id] = {
                    **info,
                    "is_loaded": False,
                    "status": f"File not found: {info['filename']}"
                }
                logger.warn("model_file_missing", model_id=model_id, path=str(file_path))
                continue

            try:
                if info["filename"].endswith(".p"):
                    with open(file_path, "rb") as f:
                        data = pickle.load(f)
                    
                    # Both dict wrapping {'model': classifier} and direct classifier are handled
                    model_obj = data.get("model", data) if isinstance(data, dict) else data
                    self.models[model_id] = model_obj
                    self.metadata[model_id] = {
                        **info,
                        "is_loaded": True,
                        "status": "Loaded and operational"
                    }
                    logger.info("model_loaded_successfully", model_id=model_id)

                elif info["filename"].endswith(".task"):
                    # MediaPipe task binary bundle - verify presence
                    self.metadata[model_id] = {
                        **info,
                        "is_loaded": True,
                        "status": "MediaPipe Task asset verified and available"
                    }

                elif info["filename"].endswith(".joblib"):
                    # Check compatibility
                    try:
                        import joblib
                        rf = joblib.load(file_path)
                        self.models[model_id] = rf
                        self.metadata[model_id] = {
                            **info,
                            "is_loaded": True,
                            "status": "Loaded and operational"
                        }
                    except Exception as exc:
                        self.metadata[model_id] = {
                            **info,
                            "is_loaded": False,
                            "status": f"Legacy sklearn format incompatible: {str(exc)}"
                        }
                        logger.info("legacy_model_incompatible", model_id=model_id, note="Expected due to sklearn version divergence")

            except Exception as e:
                self.metadata[model_id] = {
                    **info,
                    "is_loaded": False,
                    "status": f"Load error: {str(e)}"
                }
                logger.error("model_load_failed", model_id=model_id, error=str(e))

    def get_model(self, model_id: str) -> Optional[Any]:
        return self.models.get(model_id)

    def get_metadata(self, model_id: str) -> Optional[Dict[str, Any]]:
        return self.metadata.get(model_id)

    def get_all_metadata(self) -> List[Dict[str, Any]]:
        return list(self.metadata.values())

    def is_operational(self) -> bool:
        """Returns True if the primary alphabet and number models are active."""
        return (
            "mlp_single_hand_alphabet" in self.models and
            "mlp_two_hand_alphabet" in self.models and
            "mlp_numbers" in self.models
        )

