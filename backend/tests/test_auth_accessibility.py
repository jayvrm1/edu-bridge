"""
Tests for Phase 4: Authentication, Refresh Token Rotation, User Profiles,
and Multi-Disability Accessibility Preferences.
"""

import pytest
from httpx import AsyncClient
from app.core.security import create_access_token
from datetime import timedelta


@pytest.mark.asyncio
async def test_user_registration_success(client: AsyncClient):
    """Test successful user registration with multi-disability onboarding options."""
    payload = {
        "username": "ananya_learner",
        "email": "ananya@edubridge.org",
        "password": "Password123!",
        "full_name": "Ananya Sen",
        "preferred_language": "en",
        "hearing_impairment": True,
        "visual_impairment": False,
        "speech_impairment": True,
        "other_requirements": False
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "ananya_learner"
    assert data["email"] == "ananya@edubridge.org"
    assert data["is_active"] is True
    assert data["profile"]["full_name"] == "Ananya Sen"
    assert data["accessibility_preferences"]["hearing_impairment"] is True
    assert data["accessibility_preferences"]["speech_impairment"] is True
    assert data["accessibility_preferences"]["visual_impairment"] is False


@pytest.mark.asyncio
async def test_duplicate_username_rejection(client: AsyncClient):
    """Test registration fails with duplicate username."""
    payload = {
        "username": "ananya_learner",
        "email": "another_email@edubridge.org",
        "password": "Password123!",
        "full_name": "Duplicate User"
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert "username already exists" in data["error"]["message"].lower()


@pytest.mark.asyncio
async def test_duplicate_email_rejection(client: AsyncClient):
    """Test registration fails with duplicate email."""
    payload = {
        "username": "different_username",
        "email": "ananya@edubridge.org",
        "password": "Password123!",
        "full_name": "Duplicate Email"
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert "email address already exists" in data["error"]["message"].lower()


@pytest.mark.asyncio
async def test_login_success_and_token_response(client: AsyncClient):
    """Test login yields access and refresh tokens."""
    payload = {
        "username_or_email": "ananya_learner",
        "password": "Password123!"
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["username"] == "ananya_learner"


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient):
    """Test login with wrong password fails."""
    payload = {
        "username_or_email": "ananya_learner",
        "password": "WrongPassword999!"
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False


@pytest.mark.asyncio
async def test_refresh_token_rotation(client: AsyncClient):
    """Test rotating refresh token grants a new pair and revokes the old refresh token."""
    # 1. Login to obtain refresh token
    login_res = await client.post("/api/v1/auth/login", json={
        "username_or_email": "ananya_learner",
        "password": "Password123!"
    })
    tokens = login_res.json()
    old_refresh = tokens["refresh_token"]

    # 2. Call refresh
    refresh_res = await client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert refresh_res.status_code == 200
    new_tokens = refresh_res.json()
    assert new_tokens["refresh_token"] != old_refresh
    assert "access_token" in new_tokens

    # 3. Attempting to reuse old refresh token must be rejected (Replay protection)
    replay_res = await client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert replay_res.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_without_token(client: AsyncClient):
    """Test protected /users/me rejected without token."""
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_with_expired_token(client: AsyncClient):
    """Test access token expiration rejection."""
    expired_token = create_access_token(
        {"sub": "1", "username": "ananya_learner"},
        expires_delta=timedelta(seconds=-10)
    )
    headers = {"Authorization": f"Bearer {expired_token}"}
    response = await client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_user_profile_get_and_patch(client: AsyncClient):
    """Test authenticated profile fetch and partial update."""
    login_res = await client.post("/api/v1/auth/login", json={
        "username_or_email": "ananya_learner",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # GET /me
    me_res = await client.get("/api/v1/users/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["username"] == "ananya_learner"

    # PATCH /me
    patch_res = await client.patch("/api/v1/users/me", headers=headers, json={
        "full_name": "Ananya Sen Gupta",
        "preferred_language": "hi",
        "profile_metadata": {"learning_track": "STEM-ISL"}
    })
    assert patch_res.status_code == 200
    data = patch_res.json()
    assert data["profile"]["full_name"] == "Ananya Sen Gupta"
    assert data["profile"]["preferred_language"] == "hi"
    assert data["profile"]["profile_metadata"]["learning_track"] == "STEM-ISL"


@pytest.mark.asyncio
async def test_change_password_workflow(client: AsyncClient):
    """Test authenticated password change and subsequent login with new password."""
    # Register temp user
    await client.post("/api/v1/auth/register", json={
        "username": "pwd_user",
        "email": "pwd@edubridge.org",
        "password": "OldPassword1!"
    })

    login_res = await client.post("/api/v1/auth/login", json={
        "username_or_email": "pwd_user",
        "password": "OldPassword1!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Change password
    change_res = await client.post("/api/v1/auth/change-password", headers=headers, json={
        "current_password": "OldPassword1!",
        "new_password": "NewStrongPassword2@"
    })
    assert change_res.status_code == 200

    # Old password fails
    fail_res = await client.post("/api/v1/auth/login", json={
        "username_or_email": "pwd_user",
        "password": "OldPassword1!"
    })
    assert fail_res.status_code == 401

    # New password succeeds
    success_res = await client.post("/api/v1/auth/login", json={
        "username_or_email": "pwd_user",
        "password": "NewStrongPassword2@"
    })
    assert success_res.status_code == 200


@pytest.mark.asyncio
async def test_accessibility_preferences_get_put_patch(client: AsyncClient):
    """Test complete retrieval, replacement, and partial update of multi-disability preferences."""
    login_res = await client.post("/api/v1/auth/login", json={
        "username_or_email": "ananya_learner",
        "password": "Password123!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. GET preferences
    get_res = await client.get("/api/v1/accessibility/preferences", headers=headers)
    assert get_res.status_code == 200
    prefs = get_res.json()
    assert "hearing_impairment" in prefs
    assert "visual_impairment" in prefs
    assert "speech_impairment" in prefs

    # 2. PUT full replacement (multi-preference: hearing + visual high contrast)
    put_res = await client.put("/api/v1/accessibility/preferences", headers=headers, json={
        "hearing_impairment": True,
        "visual_impairment": True,
        "speech_impairment": False,
        "other_requirements": False,
        "captions_enabled": True,
        "sign_language_avatar_enabled": True,
        "visual_notifications_enabled": True,
        "audio_independent_interaction": True,
        "screen_reader_compatible": True,
        "high_contrast": True,
        "text_size": "large",
        "audio_descriptions_enabled": True,
        "voice_interaction_enabled": False,
        "sign_language_input_enabled": True,
        "aac_communication_enabled": False,
        "text_communication_enabled": True,
        "quick_response_phrases_enabled": False,
        "preferences_metadata": {"color_palette": "yellow_on_black"}
    })
    assert put_res.status_code == 200
    put_data = put_res.json()
    assert put_data["high_contrast"] is True
    assert put_data["text_size"] == "large"
    assert put_data["captions_enabled"] is True

    # 3. PATCH partial update
    patch_res = await client.patch("/api/v1/accessibility/preferences", headers=headers, json={
        "text_size": "x-large",
        "aac_communication_enabled": True
    })
    assert patch_res.status_code == 200
    patch_data = patch_res.json()
    assert patch_data["text_size"] == "x-large"
    assert patch_data["aac_communication_enabled"] is True
    assert patch_data["high_contrast"] is True  # preserved


@pytest.mark.asyncio
async def test_logout_session_revocation(client: AsyncClient):
    """Test user logout revokes refresh token."""
    login_res = await client.post("/api/v1/auth/login", json={
        "username_or_email": "ananya_learner",
        "password": "Password123!"
    })
    tokens = login_res.json()
    token = tokens["access_token"]
    refresh = tokens["refresh_token"]
    headers = {"Authorization": f"Bearer {token}"}

    logout_res = await client.post("/api/v1/auth/logout", headers=headers, json={"refresh_token": refresh})
    assert logout_res.status_code == 200

    # Refresh should now fail because session was revoked
    ref_res = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert ref_res.status_code == 401

