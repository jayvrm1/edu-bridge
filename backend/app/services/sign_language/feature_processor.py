"""
Feature extraction and normalization for Indian Sign Language Recognition models.
Replicates the exact landmark preprocessing used during model training.
"""

from typing import List, Dict, Any, Tuple, Optional
import numpy as np


class FeatureProcessor:
    """
    Normalizes hand landmarks to relative coordinate space:
    For single hand: (x_i - min(x), y_i - min(y)) for i in 0..20 -> 42 features.
    For two hands: Hand 1 (42 features) concatenated with Hand 2 (42 features) -> 84 features.
    """

    @staticmethod
    def extract_coords_from_landmark(lm: Any) -> Tuple[float, float, float]:
        """Extract x, y, z floats from object or dict."""
        if isinstance(lm, dict):
            return float(lm.get("x", 0.0)), float(lm.get("y", 0.0)), float(lm.get("z", 0.0))
        elif hasattr(lm, "x") and hasattr(lm, "y"):
            z = getattr(lm, "z", 0.0)
            return float(lm.x), float(lm.y), float(z)
        elif isinstance(lm, (list, tuple)) and len(lm) >= 2:
            z = float(lm[2]) if len(lm) > 2 else 0.0
            return float(lm[0]), float(lm[1]), z
        raise ValueError(f"Unsupported landmark format: {type(lm)}")

    @classmethod
    def process_hand_landmarks(cls, hand_landmarks: Any) -> Tuple[List[float], Dict[str, float]]:
        """
        Process 21 landmarks of a single hand into 42 normalized features:
        [x0 - min_x, y0 - min_y, x1 - min_x, y1 - min_y, ...]
        Also computes the bounding box {min_x, min_y, max_x, max_y}.
        """
        landmarks = getattr(hand_landmarks, "landmark", hand_landmarks)
        if len(landmarks) != 21:
            raise ValueError(f"Expected exactly 21 hand landmarks, received {len(landmarks)}")

        x_coords = []
        y_coords = []
        for lm in landmarks:
            x, y, _ = cls.extract_coords_from_landmark(lm)
            x_coords.append(x)
            y_coords.append(y)

        min_x = min(x_coords)
        min_y = min(y_coords)
        max_x = max(x_coords)
        max_y = max(y_coords)

        features: List[float] = []
        for i in range(21):
            features.append(float(x_coords[i] - min_x))
            features.append(float(y_coords[i] - min_y))

        bbox = {
            "min_x": min_x,
            "min_y": min_y,
            "max_x": max_x,
            "max_y": max_y
        }
        return features, bbox

    @classmethod
    def process_multi_hands(cls, multi_hand_landmarks: List[Any]) -> Tuple[List[float], int, List[Dict[str, float]]]:
        """
        Processes detected hands.
        Returns:
            - features: 42 floats for 1 hand, 84 floats for 2 hands
            - num_hands: 1 or 2 (or 0 if empty)
            - bboxes: list of bounding boxes for each hand
        """
        if not multi_hand_landmarks:
            return [], 0, []

        num_hands = min(len(multi_hand_landmarks), 2)
        all_features: List[float] = []
        all_bboxes: List[Dict[str, float]] = []

        for i in range(num_hands):
            hand_feats, bbox = cls.process_hand_landmarks(multi_hand_landmarks[i])
            all_features.extend(hand_feats)
            all_bboxes.append(bbox)

        return all_features, num_hands, all_bboxes

