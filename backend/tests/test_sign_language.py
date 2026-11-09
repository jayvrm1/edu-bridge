"""
Unit and integration tests for Sign Language Recognition, Feature Processing,
Debouncing, Session Management, REST Endpoints, and WebSocket Streaming.
"""

import pytest
import numpy as np
from httpx import AsyncClient
from starlette.testclient import TestClient

from app.main import app
from app.services.sign_language.model_registry import SignModelRegistry
from app.services.sign_language.feature_processor import FeatureProcessor
from app.services.sign_language.confidence_service import ConfidenceDebouncer
from app.services.sign_language.mlp_recognizer import SignLanguageRecognizer
from app.services.sign_language.recognition_session import SessionManager
from app.services.sign_language.vocabulary_service import SignVocabularyService


@pytest.fixture
def registry():
    return SignModelRegistry.get_instance()


@pytest.fixture
def recognizer():
    return SignLanguageRecognizer()


class TestSignModelRegistry:
    def test_registry_initialization(self, registry):
        assert registry.is_operational() is True
        assert "mlp_single_hand_alphabet" in registry.models
        assert "mlp_two_hand_alphabet" in registry.models
        assert "mlp_numbers" in registry.models

    def test_metadata_catalog(self, registry):
        meta = registry.get_all_metadata()
        assert len(meta) >= 3
        single_hand_meta = registry.get_metadata("mlp_single_hand_alphabet")
        assert single_hand_meta is not None
        assert single_hand_meta["input_dim"] == 42
        assert "C" in single_hand_meta["classes"]

        two_hand_meta = registry.get_metadata("mlp_two_hand_alphabet")
        assert two_hand_meta is not None
        assert two_hand_meta["input_dim"] == 84
        assert "A" in two_hand_meta["classes"]


class TestFeatureProcessor:
    def test_coord_extraction(self):
        # Dict
        x, y, z = FeatureProcessor.extract_coords_from_landmark({"x": 0.1, "y": 0.2, "z": 0.3})
        assert x == 0.1 and y == 0.2 and z == 0.3

        # List/Tuple
        x, y, z = FeatureProcessor.extract_coords_from_landmark([0.4, 0.5, 0.6])
        assert x == 0.4 and y == 0.5 and z == 0.6

    def test_single_hand_processing(self):
        # 21 synthetic landmarks
        synthetic_landmarks = [{"x": float(i) * 0.01, "y": float(i) * 0.02, "z": 0.0} for i in range(21)]
        features, bbox = FeatureProcessor.process_hand_landmarks(synthetic_landmarks)
        assert len(features) == 42
        assert bbox["min_x"] == 0.0
        assert bbox["max_x"] == 0.20
        assert bbox["min_y"] == 0.0
        assert bbox["max_y"] == 0.40

    def test_multi_hands_processing(self):
        hand1 = [{"x": 0.1 + i * 0.01, "y": 0.2 + i * 0.01} for i in range(21)]
        hand2 = [{"x": 0.5 + i * 0.01, "y": 0.6 + i * 0.01} for i in range(21)]

        # 1 hand -> 42 features
        feats_1, count_1, _ = FeatureProcessor.process_multi_hands([hand1])
        assert count_1 == 1
        assert len(feats_1) == 42

        # 2 hands -> 84 features
        feats_2, count_2, _ = FeatureProcessor.process_multi_hands([hand1, hand2])
        assert count_2 == 2
        assert len(feats_2) == 84


class TestMLPRecognizer:
    def test_recognize_single_hand(self, recognizer):
        # 42 dummy features
        features = [0.05 * (i % 5) for i in range(42)]
        pred = recognizer.predict_features(features, mode="alphabet")
        assert pred.num_hands == 1
        assert pred.mode_used == "single_hand_alphabet"
        assert pred.predicted_label in ["C", "I", "L", "O", "U", "V"]
        assert 0.0 <= pred.confidence <= 1.0
        assert len(pred.top_candidates) > 0

    def test_recognize_two_hands(self, recognizer):
        # 84 dummy features
        features = [0.03 * (i % 6) for i in range(84)]
        pred = recognizer.predict_features(features, mode="auto")
        assert pred.num_hands == 2
        assert pred.mode_used == "two_hand_alphabet"
        assert pred.predicted_label in [
            'A', 'B', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'M',
            'N', 'P', 'Q', 'R', 'S', 'T', 'W', 'X', 'Y', 'Z'
        ]
        assert 0.0 <= pred.confidence <= 1.0

    def test_recognize_numbers(self, recognizer):
        features = [0.04 * (i % 4) for i in range(42)]
        pred = recognizer.predict_features(features, mode="number")
        assert pred.num_hands == 1
        assert pred.mode_used == "numbers"
        assert pred.predicted_label in ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']


class TestConfidenceDebouncer:
    def test_rejection_below_threshold(self):
        debouncer = ConfidenceDebouncer(confidence_threshold=0.80)
        is_conf, char, _ = debouncer.evaluate("A", 0.50)
        assert is_conf is False
        assert char is None

    def test_stability_confirmation(self):
        debouncer = ConfidenceDebouncer(confidence_threshold=0.70, stability_frames=2, cooldown_seconds=0.5)
        # Frame 1: starts stabilizing
        is_conf1, _, _ = debouncer.evaluate("B", 0.90)
        assert is_conf1 is False

        # Frame 2: 2nd consecutive match -> confirmed!
        is_conf2, char2, _ = debouncer.evaluate("B", 0.90)
        assert is_conf2 is True
        assert char2 == "B"

        # Frame 3: immediate repetition inside cooldown -> suppressed
        is_conf3, _, _ = debouncer.evaluate("B", 0.90)
        assert is_conf3 is False


class TestVocabularyService:
    def test_vocabulary_contents(self):
        vocab = SignVocabularyService.get_vocabulary()
        assert vocab.total_items >= 36
        assert "A" in vocab.categories["all_alphabets"]
        assert "Z" in vocab.categories["all_alphabets"]
        assert "0" in vocab.categories["digits"]
        assert "9" in vocab.categories["digits"]


@pytest.mark.asyncio
class TestSignLanguageAPI:
    async def test_get_models(self, client: AsyncClient):
        response = await client.get("/api/v1/sign-language/models")
        assert response.status_code == 200
        data = response.json()
        assert data["total_models"] >= 3
        assert data["loaded_models"] >= 3

    async def test_get_vocabulary(self, client: AsyncClient):
        response = await client.get("/api/v1/sign-language/vocabulary")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) >= 36

    async def test_session_lifecycle_and_text_operations(self, client: AsyncClient):
        # 1. Create session
        resp_create = await client.post(
            "/api/v1/sign-language/sessions",
            json={"mode": "auto", "language": "ISL"}
        )
        assert resp_create.status_code == 201
        session_data = resp_create.json()
        session_id = session_data["session_id"]

        # 2. Get status
        resp_get = await client.get(f"/api/v1/sign-language/sessions/{session_id}")
        assert resp_get.status_code == 200
        assert resp_get.json()["current_text"] == ""

        # 3. Post landmarks
        synthetic_hand = [{"x": 0.01 * i, "y": 0.02 * i} for i in range(21)]
        resp_landmarks = await client.post(
            f"/api/v1/sign-language/sessions/{session_id}/landmarks",
            json={"hands": [synthetic_hand]}
        )
        assert resp_landmarks.status_code == 200
        pred_data = resp_landmarks.json()["prediction"]
        assert pred_data["num_hands"] == 1
        assert pred_data["confidence"] >= 0.0

        # 4. Text manipulation: append, space, backspace, clear
        await client.post(
            "/api/v1/sign-language/confirm",
            json={"session_id": session_id, "action": "append", "character": "H"}
        )
        await client.post(
            "/api/v1/sign-language/confirm",
            json={"session_id": session_id, "action": "append", "character": "I"}
        )
        resp_status = await client.get(f"/api/v1/sign-language/sessions/{session_id}")
        assert resp_status.json()["current_text"] == "HI"

        # Add space
        resp_space = await client.post(
            "/api/v1/sign-language/confirm",
            json={"session_id": session_id, "action": "space"}
        )
        assert resp_space.json()["current_text"] == "HI "

        # Backspace
        resp_bs = await client.post(
            "/api/v1/sign-language/confirm",
            json={"session_id": session_id, "action": "backspace"}
        )
        assert resp_bs.json()["current_text"] == "HI"

        # Ask tutor with recognized sign text (HI)
        resp_tutor = await client.post(
            "/api/v1/sign-language/ask-tutor",
            json={"session_id": session_id}
        )
        assert resp_tutor.status_code == 200
        tutor_data = resp_tutor.json()
        assert tutor_data["recognized_text"] == "HI"
        assert len(tutor_data["tutor_reply"]) > 0

        # Clear text
        resp_clear = await client.post(f"/api/v1/sign-language/clear?session_id={session_id}")
        assert resp_clear.status_code == 200
        assert resp_clear.json()["current_text"] == ""

        # 5. Delete session
        resp_del = await client.delete(f"/api/v1/sign-language/sessions/{session_id}")
        assert resp_del.status_code == 200

        # Session should now be 404
        resp_gone = await client.get(f"/api/v1/sign-language/sessions/{session_id}")
        assert resp_gone.status_code == 404


def test_sign_language_websocket_stream():
    """Test bi-directional streaming via WebSocket."""
    sync_client = TestClient(app)
    with sync_client.websocket_connect("/ws/v1/sign-language/stream/test_ws_session") as ws:
        # Initial connection packet
        conn_msg = ws.receive_json()
        assert conn_msg["type"] == "connected"

        # Ping-Pong
        ws.send_json({"type": "ping"})
        pong_msg = ws.receive_json()
        assert pong_msg["type"] == "pong"

        # Send command (append)
        ws.send_json({"type": "command", "action": "append", "character": "E"})
        cmd_msg = ws.receive_json()
        assert cmd_msg["type"] == "text_updated"
        assert cmd_msg["current_text"] == "E"

        # Send raw landmarks
        synthetic_hand = [{"x": 0.01 * i, "y": 0.02 * i} for i in range(21)]
        ws.send_json({"type": "landmarks", "hands": [synthetic_hand]})
        pred_msg = ws.receive_json()
        assert pred_msg["type"] == "prediction"
        assert "prediction" in pred_msg
        assert pred_msg["prediction"]["num_hands"] == 1

