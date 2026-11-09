"""
Phase 10: Cross-Module Integration Tests for EduBridge AI.
Validates end-to-end interactions across Sign Language, AI Tutor, AAC, Speech, and Gamification.
"""

import pytest
import base64
from httpx import AsyncClient


async def get_test_headers(client: AsyncClient, username: str) -> dict:
    email = f"{username}@edubridge.org"
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": username,
            "email": email,
            "password": "Password123!",
            "full_name": f"Integration {username}",
            "hearing_impairment": True,
            "speech_impairment": True
        }
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"username_or_email": username, "password": "Password123!"}
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
class TestCrossModuleIntegrations:

    async def test_sign_language_to_gemma_tutor_bridge(self, client: AsyncClient):
        """Webcam Sign recognition -> Confirm text -> Query Gemma 4 Tutor."""
        headers = await get_test_headers(client, username="sign_tutor_user")

        # 1. Create recognition session
        sess_resp = await client.post("/api/v1/sign-language/sessions", json={"mode": "auto"}, headers=headers)
        assert sess_resp.status_code == 201
        session_id = sess_resp.json()["session_id"]

        # 2. Append confirmed letters "WHAT IS AI"
        for word in ["WHAT", "IS", "AI"]:
            for ch in word:
                await client.post("/api/v1/sign-language/confirm", json={"session_id": session_id, "action": "append", "character": ch})
            await client.post("/api/v1/sign-language/confirm", json={"session_id": session_id, "action": "space"})

        status_resp = await client.get(f"/api/v1/sign-language/sessions/{session_id}")
        assert "WHAT IS AI" in status_resp.json()["current_text"]

        # 3. Ask tutor directly from signed text
        tutor_resp = await client.post("/api/v1/sign-language/ask-tutor", json={"session_id": session_id}, headers=headers)
        assert tutor_resp.status_code == 200
        data = tutor_resp.json()
        assert "WHAT IS AI" in data["recognized_text"]
        assert len(data["tutor_reply"]) > 0

    async def test_aac_to_gemma_tutor_bridge(self, client: AsyncClient):
        """AAC card selection -> Query Gemma 4 Tutor."""
        headers = await get_test_headers(client, username="aac_tutor_user")

        resp = await client.post(
            "/api/v1/aac/ask-tutor?phrase_text=Could you please explain photosynthesis simply?",
            headers=headers
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["source"] == "aac"
        assert len(data["tutor_reply"]) > 0

    async def test_speech_to_gemma_tutor_bridge(self, client: AsyncClient):
        """Voice input -> STT -> Query Gemma 4 Tutor -> TTS Audio Reply."""
        headers = await get_test_headers(client, username="speech_tutor_user")

        # Base64 dummy audio bytes
        dummy_audio = base64.b64encode(b"WAVE_AUDIO_SAMPLE_FOR_INTEGRATION_TEST").decode("ascii")

        resp = await client.post(
            "/api/v1/speech/ask-tutor",
            params={"audio_base64": dummy_audio, "language": "en"},
            headers=headers
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["source"] == "voice"
        assert len(data["tutor_reply"]) > 0
        assert len(data["audio_reply_base64"]) > 0

    async def test_quiz_completion_to_gamification_rewards(self, client: AsyncClient):
        """Quiz completion -> XP Award -> Level Progression -> Streak."""
        headers = await get_test_headers(client, username="quiz_gamer_user")

        # Initial profile
        prof_before = (await client.get("/api/v1/gamification/profile", headers=headers)).json()
        initial_xp = prof_before["xp"]

        # Submit passed quiz
        quiz_resp = await client.post(
            "/api/v1/gamification/quiz/submit",
            json={"lesson_id": 1, "score": 5, "max_score": 5},
            headers=headers
        )
        assert quiz_resp.status_code == 200
        qdata = quiz_resp.json()
        assert qdata["passed"] is True
        assert qdata["xp_earned"] >= 100
        assert qdata["new_total_xp"] > initial_xp

        # Verify leaderboard updated
        lead_resp = await client.get("/api/v1/gamification/leaderboard")
        assert lead_resp.status_code == 200
        assert any(u["username"] == "quiz_gamer_user" for u in lead_resp.json()["leaderboard"])

