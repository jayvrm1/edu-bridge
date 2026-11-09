"""
Tests for Phase 5: Gemma 4 AI Tutor, Structured Responses, Conversation Management,
and Quiz Generation Engine.
"""

import pytest
from httpx import AsyncClient
from app.services.ai.gemma_provider import GemmaProvider, MockGemmaProvider
from app.services.ai.response_parser import ResponseParser
from app.services.ai.prompt_builder import PromptBuilder
from app.core.exceptions import AppException
from app.schemas.ai_tutor import ResponsePreferences, QuizQuestion


@pytest.mark.asyncio
async def test_gemma_provider_missing_key_rejection():
    """Verify GemmaProvider strictly rejects live requests when API key is missing."""
    provider = GemmaProvider(api_key="")
    with pytest.raises(AppException) as exc_info:
        await provider.generate_educational_content("prompt", "sys")
    assert exc_info.value.status_code == 503
    assert exc_info.value.code == "AI_PROVIDER_UNCONFIGURED"


def test_response_parser_fallback_recovery():
    """Verify ResponseParser handles non-JSON model output cleanly without crashing."""
    raw_text = "This is a raw text explanation without JSON formatting."
    parsed = ResponseParser.parse_tutor_content(raw_text)
    assert parsed.text == raw_text
    assert len(parsed.summary) > 0
    assert parsed.content_type == "educational_explanation"


def test_prompt_builder_accessibility_adaptation():
    """Verify PromptBuilder incorporates hearing, visual, and speech needs into system prompt."""
    from app.models.user import AccessibilityPreferences, UserProfile

    acc = AccessibilityPreferences(
        user_id=1,
        hearing_impairment=True,
        visual_impairment=True,
        speech_impairment=True
    )
    prof = UserProfile(user_id=1, preferred_language="hi")

    sys_inst = PromptBuilder.build_system_instruction(accessibility=acc, profile=prof)
    assert "Hearing" in sys_inst
    assert "Visual" in sys_inst
    assert "Speech" in sys_inst
    assert "'hi'" in sys_inst


@pytest.mark.asyncio
async def test_tutor_chat_endpoint_success(client: AsyncClient):
    """Test interactive educational chat with authenticated learner."""
    # 1. Register learner with hearing impairment
    reg_res = await client.post("/api/v1/auth/register", json={
        "username": "tutor_student",
        "email": "student@tutor.org",
        "password": "Password123!",
        "hearing_impairment": True
    })
    tokens = (await client.post("/api/v1/auth/login", json={
        "username_or_email": "tutor_student",
        "password": "Password123!"
    })).json()
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    # 2. Chat with tutor
    chat_payload = {
        "message": "Explain how photosynthesis works in plants",
        "task": "educational_explanation",
        "response_preferences": {
            "detail_level": "simple",
            "include_examples": True
        }
    }
    response = await client.post("/api/v1/tutor/chat", headers=headers, json=chat_payload)
    assert response.status_code == 200
    data = response.json()

    assert data["conversation_id"] is not None
    assert data["message_id"] is not None
    assert "text" in data["response"]
    assert "summary" in data["response"]
    assert len(data["response"]["key_points"]) > 0
    assert len(data["response"]["examples"]) > 0
    assert data["output_preferences"]["sign_avatar_enabled"] is True


@pytest.mark.asyncio
async def test_tutor_explain_and_summarize_endpoints(client: AsyncClient):
    """Test specialized /tutor/explain and /tutor/summarize endpoints."""
    tokens = (await client.post("/api/v1/auth/login", json={
        "username_or_email": "tutor_student",
        "password": "Password123!"
    })).json()
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    # Explain
    exp_res = await client.post("/api/v1/tutor/explain", headers=headers, json={
        "message": "Newton's First Law of Motion"
    })
    assert exp_res.status_code == 200
    assert exp_res.json()["response"]["content_type"] == "educational_explanation"

    # Summarize
    sum_res = await client.post("/api/v1/tutor/summarize", headers=headers, json={
        "message": "Cell division and mitosis stages"
    })
    assert sum_res.status_code == 200
    assert sum_res.json()["response"]["content_type"] == "summary"


@pytest.mark.asyncio
async def test_conversation_management_and_isolation(client: AsyncClient):
    """Test conversation history retrieval, isolation between users, and deletion."""
    # User 1
    t1 = (await client.post("/api/v1/auth/login", json={
        "username_or_email": "tutor_student",
        "password": "Password123!"
    })).json()["access_token"]
    h1 = {"Authorization": f"Bearer {t1}"}

    # Create conversation by chatting
    chat_res = await client.post("/api/v1/tutor/chat", headers=h1, json={"message": "First lesson question"})
    conv_id = chat_res.json()["conversation_id"]

    # User 1 can fetch conversation
    fetch_res = await client.get(f"/api/v1/tutor/conversations/{conv_id}", headers=h1)
    assert fetch_res.status_code == 200
    assert len(fetch_res.json()["messages"]) >= 2  # user + assistant

    # User 2 register & login
    await client.post("/api/v1/auth/register", json={
        "username": "intruder_user",
        "email": "intruder@edubridge.org",
        "password": "Password123!"
    })
    t2 = (await client.post("/api/v1/auth/login", json={
        "username_or_email": "intruder_user",
        "password": "Password123!"
    })).json()["access_token"]
    h2 = {"Authorization": f"Bearer {t2}"}

    # User 2 cannot access User 1's conversation (Cross-user isolation)
    forbidden_res = await client.get(f"/api/v1/tutor/conversations/{conv_id}", headers=h2)
    assert forbidden_res.status_code == 403

    # User 1 deletes conversation
    del_res = await client.delete(f"/api/v1/tutor/conversations/{conv_id}", headers=h1)
    assert del_res.status_code == 200

    # It is gone
    not_found_res = await client.get(f"/api/v1/tutor/conversations/{conv_id}", headers=h1)
    assert not_found_res.status_code == 404


@pytest.mark.asyncio
async def test_quiz_generation_and_evaluation(client: AsyncClient):
    """Test generating a quiz and evaluating student responses for XP."""
    t1 = (await client.post("/api/v1/auth/login", json={
        "username_or_email": "tutor_student",
        "password": "Password123!"
    })).json()["access_token"]
    headers = {"Authorization": f"Bearer {t1}"}

    # Generate Quiz
    gen_res = await client.post("/api/v1/tutor/generate-quiz", headers=headers, json={
        "topic": "Solar System",
        "difficulty": "beginner",
        "number_of_questions": 3,
        "question_type": "multiple_choice"
    })
    assert gen_res.status_code == 200
    quiz_data = gen_res.json()
    assert quiz_data["topic"] == "Solar System"
    assert len(quiz_data["questions"]) == 3

    # Submit Answers
    eval_payload = {
        "topic": "Solar System",
        "questions": quiz_data["questions"],
        "answers": {
            1: quiz_data["questions"][0]["correct_answer"],
            2: quiz_data["questions"][1]["correct_answer"],
            3: "Wrong Answer"
        }
    }
    eval_res = await client.post("/api/v1/tutor/quiz/evaluate", headers=headers, json=eval_payload)
    assert eval_res.status_code == 200
    eval_data = eval_res.json()
    assert eval_data["score"] == 2
    assert eval_data["total_questions"] == 3
    assert eval_data["passed"] is True
    assert eval_data["xp_earned"] > 0
    assert len(eval_data["feedback"]) == 3

