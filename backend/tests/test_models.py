"""
Tests for SQLAlchemy database models, relationships, and constraints.
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User, UserProfile, AccessibilityPreferences
from app.models.conversation import Conversation, Message
from app.models.gamification import UserGamification, XPTransaction, Achievement
from app.models.sign_language import SignVocabulary, SignAnimation
from app.core.security import hash_password, verify_password


@pytest.mark.asyncio
async def test_user_and_accessibility_profile(db_session: AsyncSession):
    """Verify creating a user with multi-disability accessibility preferences."""
    hashed = hash_password("Secret12345!")
    user = User(
        username="learner_aarav",
        email="aarav@edubridge.test",
        password_hash=hashed,
        is_active=True
    )
    db_session.add(user)
    await db_session.flush()

    # Add profile
    profile = UserProfile(
        user_id=user.id,
        full_name="Aarav Sharma",
        preferred_language="hi",
        profile_metadata={"grade": "10", "learning_goal": "Science in ISL"}
    )
    db_session.add(profile)

    # Add accessibility preferences (multiple disabilities supported)
    prefs = AccessibilityPreferences(
        user_id=user.id,
        hearing_impairment=True,
        visual_impairment=False,
        speech_impairment=True,
        other_requirements=False,
        preferences_metadata={"sign_variant": "ISL", "captions_enabled": True}
    )
    db_session.add(prefs)
    await db_session.commit()

    # Query back
    stmt = (
        select(User)
        .where(User.username == "learner_aarav")
    )
    result = await db_session.execute(stmt)
    saved_user = result.scalar_one()

    assert saved_user.id is not None
    assert verify_password("Secret12345!", saved_user.password_hash) is True
    assert saved_user.profile.full_name == "Aarav Sharma"
    assert saved_user.accessibility_preferences.hearing_impairment is True
    assert saved_user.accessibility_preferences.speech_impairment is True
    assert saved_user.accessibility_preferences.visual_impairment is False


@pytest.mark.asyncio
async def test_conversation_and_messages(db_session: AsyncSession):
    """Verify creating a learning conversation with multimodal messages."""
    user = User(
        username="conv_user",
        email="conv@edubridge.test",
        password_hash=hash_password("Pass1234!"),
        is_active=True
    )
    db_session.add(user)
    await db_session.flush()

    conversation = Conversation(
        user_id=user.id,
        title="Photosynthesis Explanation"
    )
    db_session.add(conversation)
    await db_session.flush()

    msg1 = Message(
        conversation_id=conversation.id,
        role="user",
        input_type="sign_language",
        content="Photosynthesis explain please",
        metadata_payload={"confidence": 0.94, "sign_language": "ISL"}
    )
    msg2 = Message(
        conversation_id=conversation.id,
        role="assistant",
        input_type="text",
        content="Photosynthesis is the process by which green plants make food using sunlight.",
        metadata_payload={"model": "gemma-4", "avatar_animation_available": True}
    )
    db_session.add_all([msg1, msg2])
    await db_session.commit()

    stmt = select(Conversation).where(Conversation.id == conversation.id)
    res = await db_session.execute(stmt)
    conv = res.scalar_one()

    assert len(conv.messages) == 2
    assert conv.messages[0].input_type == "sign_language"
    assert conv.messages[0].metadata_payload["confidence"] == 0.94
    assert conv.messages[1].role == "assistant"


@pytest.mark.asyncio
async def test_sign_vocabulary_and_animation(db_session: AsyncSession):
    """Verify sign vocabulary and SiGML animation model."""
    sign = SignVocabulary(
        language_identifier="ISL",
        sign_identifier="HELLO",
        gloss="HELLO",
        category="word",
        two_handed=False,
        dataset_source="SilentTalk_SiGML",
        is_active=True
    )
    db_session.add(sign)
    await db_session.flush()

    anim = SignAnimation(
        sign_id=sign.id,
        sigml_filename="hello.sigml",
        sigml_content="<sigml><hns_sign gloss='hello'>...</hns_sign></sigml>",
        hamnosys_code="hamflathand",
        bone_keyframes_json={"bones": ["RightArm", "RightForeArm"], "frames": 45},
        duration_seconds=1.5
    )
    db_session.add(anim)
    await db_session.commit()

    stmt = select(SignVocabulary).where(SignVocabulary.sign_identifier == "HELLO")
    res = await db_session.execute(stmt)
    saved_sign = res.scalar_one()

    assert saved_sign.gloss == "HELLO"
    assert len(saved_sign.animations) == 1
    assert saved_sign.animations[0].sigml_filename == "hello.sigml"

