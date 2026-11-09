"""
Unit and integration tests for Phases 7, 8, and 9:
Avatar & SiGML, Speech, AAC, Visual OCR, and Gamification.
"""

import pytest
import base64
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.avatar.sigml_parser import SiGMLParser
from app.services.avatar.avatar_service import AvatarService
from app.services.gamification.gamification_service import GamificationService


async def get_test_headers(client: AsyncClient, username: str = "testuser_phase") -> dict:
    email = f"{username}@edubridge.org"
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": username,
            "email": email,
            "password": "Password123!",
            "full_name": f"Test {username}"
        }
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"username_or_email": username, "password": "Password123!"}
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# -------------------- PHASE 7: AVATAR & SIGML --------------------

class TestAvatarAndSiGML:
    def test_sigml_parser_from_xml(self):
        sample_sigml = """<sigml>
            <hns_sign gloss="HELLO">
                <hamnosys_nonmanual>
                    <hnm_mouthpicture picture="h@lo"/>
                </hamnosys_nonmanual>
                <hamnosys_manual>
                    <hamopenhand/>
                    <hamextfingeru/>
                    <hampalmf/>
                    <hamforehead/>
                    <hammoveo/>
                </hamnosys_manual>
            </hns_sign>
        </sigml>"""
        anim = SiGMLParser.parse_sigml_text(sample_sigml, filename="hello.sigml")
        assert anim.gloss == "HELLO"
        assert anim.mouth_picture == "h@lo"
        assert "hamopenhand" in anim.hamnosys_symbols
        assert anim.duration_ms >= 1000
        assert len(anim.threejs_bones) >= 3

    def test_avatar_service_indexing_and_vocabulary(self):
        service = AvatarService.get_instance()
        assert len(service.gloss_to_file) >= 100
        assert "0" in service.gloss_to_file or "ZERO" in service.gloss_to_file

        vocab = service.get_vocabulary(limit=50)
        assert vocab.total_signs >= 100
        assert len(vocab.signs) == 50

    def test_avatar_translation_with_fingerspelling(self):
        service = AvatarService.get_instance()
        # Translate a number string that exists in SiGML
        res = service.translate_text("0 1", target_language="ISL")
        assert res.original_text == "0 1"
        assert len(res.sequence) >= 2
        assert res.total_duration_ms > 0

    def test_avatar_sequence_compilation(self):
        service = AvatarService.get_instance()
        seq = service.compile_sequence(["0", "1"])
        assert seq.total_signs == 2
        assert len(seq.animations) == 2
        assert seq.animations[0].gloss in ["0", "ZERO"]


@pytest.mark.asyncio
class TestAvatarAPI:
    async def test_avatar_endpoints(self, client: AsyncClient):
        # 1. Languages
        resp_lang = await client.get("/api/v1/avatar/languages")
        assert resp_lang.status_code == 200
        assert any(l["code"] == "ISL" for l in resp_lang.json())

        # 2. Vocabulary
        resp_vocab = await client.get("/api/v1/avatar/vocabulary?limit=20")
        assert resp_vocab.status_code == 200
        assert len(resp_vocab.json()["signs"]) == 20

        # 3. Translate
        resp_trans = await client.post(
            "/api/v1/avatar/translate",
            json={"text": "HELLO 1", "target_language": "ISL", "fingerspell_unknown": True}
        )
        assert resp_trans.status_code == 200
        assert len(resp_trans.json()["sequence"]) >= 2

        # 4. Specific animation
        resp_anim = await client.get("/api/v1/avatar/animation/0")
        assert resp_anim.status_code == 200
        data = resp_anim.json()
        assert data["gloss"] in ["0", "ZERO"]
        assert len(data["threejs_bones"]) > 0


# -------------------- PHASE 8: SPEECH, AAC & OCR --------------------

@pytest.mark.asyncio
class TestSpeechAPI:
    async def test_speech_status(self, client: AsyncClient):
        resp = await client.get("/api/v1/speech/status")
        assert resp.status_code == 200
        data = resp.json()
        assert data["tts_available"] is True
        assert data["stt_available"] is True

    async def test_speech_synthesize_and_transcribe(self, client: AsyncClient):
        # Synthesize TTS
        resp_syn = await client.post(
            "/api/v1/speech/synthesize",
            json={"text": "Welcome to EduBridge AI", "language": "en"}
        )
        assert resp_syn.status_code == 200
        syn_data = resp_syn.json()
        assert len(syn_data["audio_base64"]) > 0
        assert syn_data["duration_estimate_seconds"] > 0

        # Transcribe STT
        resp_stt = await client.post(
            "/api/v1/speech/transcribe",
            json={"audio_base64": syn_data["audio_base64"], "language": "en"}
        )
        assert resp_stt.status_code == 200
        stt_data = resp_stt.json()
        assert len(stt_data["transcription"]) > 0


@pytest.mark.asyncio
class TestAACAPI:
    async def test_aac_board_and_custom_crud(self, client: AsyncClient):
        # 1. Anonymous board fetch
        resp_board = await client.get("/api/v1/aac/phrases")
        assert resp_board.status_code == 200
        board = resp_board.json()
        assert board["total_phrases"] >= 10
        assert "greetings" in board["categories"]

        # 2. Authenticated user custom phrase CRUD
        headers = await get_test_headers(client, username="aac_learner_custom")

        # Create
        resp_create = await client.post(
            "/api/v1/aac/phrases",
            json={
                "category": "classroom",
                "label": "My Custom Card",
                "text": "I would like to present my answer.",
                "icon": "hand",
                "quick_shortcut": "p"
            },
            headers=headers
        )
        assert resp_create.status_code == 201
        created = resp_create.json()
        phrase_id = created["id"]
        assert created["label"] == "My Custom Card"

        # Update
        resp_patch = await client.patch(
            f"/api/v1/aac/phrases/{phrase_id}",
            json={"label": "Updated Presentation Card"},
            headers=headers
        )
        assert resp_patch.status_code == 200
        assert resp_patch.json()["label"] == "Updated Presentation Card"

        # Delete
        resp_del = await client.delete(f"/api/v1/aac/phrases/{phrase_id}", headers=headers)
        assert resp_del.status_code == 200


@pytest.mark.asyncio
class TestVisualOCRAPI:
    async def test_visual_ocr_and_description(self, client: AsyncClient):
        # Create a small valid 10x10 base64 PNG image
        dummy_png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

        # OCR
        resp_ocr = await client.post(
            "/api/v1/visual/ocr",
            json={"image_base64": dummy_png, "language": "eng"}
        )
        assert resp_ocr.status_code == 200
        data_ocr = resp_ocr.json()
        assert len(data_ocr["extracted_text"]) > 0

        # Description
        resp_desc = await client.post(
            "/api/v1/visual/describe",
            json={"image_base64": dummy_png, "target_modality": "screen_reader"}
        )
        assert resp_desc.status_code == 200
        data_desc = resp_desc.json()
        assert len(data_desc["description"]) > 0
        assert len(data_desc["key_elements"]) > 0


# -------------------- PHASE 9: GAMIFICATION --------------------

class TestGamificationServiceUnits:
    def test_level_calculation(self):
        assert GamificationService.calculate_level(0) == 1
        assert GamificationService.calculate_level(99) == 1
        assert GamificationService.calculate_level(100) == 2
        assert GamificationService.calculate_level(400) == 3
        assert GamificationService.calculate_level(1600) == 5


@pytest.mark.asyncio
class TestGamificationAPI:
    async def test_gamification_workflow(self, client: AsyncClient):
        headers = await get_test_headers(client, username="gamer_student_phase")

        # 1. Profile
        resp_prof = await client.get("/api/v1/gamification/profile", headers=headers)
        assert resp_prof.status_code == 200
        prof = resp_prof.json()
        assert prof["level"] == 1
        assert prof["xp"] == 0

        # 2. Daily challenges
        resp_chal = await client.get("/api/v1/gamification/challenges", headers=headers)
        assert resp_chal.status_code == 200
        assert resp_chal.json()["total_challenges"] >= 3

        # Complete challenge
        resp_comp = await client.post(
            "/api/v1/gamification/challenges/daily_sign_practice/complete",
            headers=headers
        )
        assert resp_comp.status_code == 200
        comp_data = resp_comp.json()
        assert comp_data["xp_awarded"] == 60
        assert comp_data["total_xp"] >= 60

        # 3. Quiz Submit
        resp_quiz = await client.post(
            "/api/v1/gamification/quiz/submit",
            json={"lesson_id": 1, "score": 4, "max_score": 5},
            headers=headers
        )
        assert resp_quiz.status_code == 200
        qdata = resp_quiz.json()
        assert qdata["passed"] is True
        assert qdata["xp_earned"] > 0
        assert qdata["new_total_xp"] > 100

        # 4. Achievements
        resp_achs = await client.get("/api/v1/gamification/achievements", headers=headers)
        assert resp_achs.status_code == 200
        achs = resp_achs.json()
        assert len(achs) >= 4

        # 5. Streaks
        resp_strk = await client.get("/api/v1/gamification/streaks", headers=headers)
        assert resp_strk.status_code == 200
        assert resp_strk.json()["current_streak_days"] >= 1

        # 6. Leaderboard (live DB)
        resp_lead = await client.get("/api/v1/gamification/leaderboard")
        assert resp_lead.status_code == 200
        lead = resp_lead.json()
        assert lead["total_ranked_learners"] >= 1
        assert any(e["username"] == "gamer_student_phase" for e in lead["leaderboard"])
