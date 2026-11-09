"""
Authentication endpoints: Registration, Login, Token Refresh, Password Management, and Logout.
"""

from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    create_password_reset_token,
    verify_password_reset_token,
    generate_secure_random_token
)
from app.core.exceptions import AuthenticationError, ValidationError, EntityNotFoundException
from app.core.rate_limit import auth_rate_limiter
from app.database.session import get_db
from app.models.user import User, UserProfile, AccessibilityPreferences, UserSession
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    LogoutRequest
)
from app.schemas.user import UserResponse
from app.api.deps import get_current_user
from app.services.email_service import get_email_service, BaseEmailService


router = APIRouter(prefix="/auth", tags=["Authentication"])


def ensure_utc(dt: datetime) -> datetime:
    """Ensures datetime is timezone-aware in UTC for safe comparison."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new learner account"
)
async def register(
    payload: UserRegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> UserResponse:
    auth_rate_limiter.check(request, key_prefix="register")

    # Check for duplicate username or email
    stmt = select(User).where(or_(User.username == payload.username, User.email == payload.email))
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        if existing_user.username == payload.username:
            raise ValidationError("A user with this username already exists.")
        if existing_user.email == payload.email:
            raise ValidationError("A user with this email address already exists.")

    # Create User
    new_user = User(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
        is_active=True
    )
    db.add(new_user)
    await db.flush()

    # Create UserProfile
    profile = UserProfile(
        user_id=new_user.id,
        full_name=payload.full_name,
        preferred_language=payload.preferred_language,
        profile_metadata={}
    )
    db.add(profile)

    # Create Accessibility Preferences (multi-disability supported on onboarding)
    prefs = AccessibilityPreferences(
        user_id=new_user.id,
        hearing_impairment=payload.hearing_impairment,
        visual_impairment=payload.visual_impairment,
        speech_impairment=payload.speech_impairment,
        other_requirements=payload.other_requirements,
        captions_enabled=payload.hearing_impairment,
        sign_language_avatar_enabled=payload.hearing_impairment or not payload.visual_impairment,
        screen_reader_compatible=payload.visual_impairment,
        high_contrast=payload.visual_impairment,
        sign_language_input_enabled=payload.speech_impairment or payload.hearing_impairment,
        aac_communication_enabled=payload.speech_impairment,
        preferences_metadata={}
    )
    db.add(prefs)
    await db.commit()

    # Refresh with relations
    stmt = select(User).where(User.id == new_user.id)
    refreshed = await db.execute(stmt)
    return refreshed.scalar_one()


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Login to receive access and refresh tokens"
)
async def login(
    payload: UserLoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    auth_rate_limiter.check(request, key_prefix="login")

    # Safe lookup by username or email
    stmt = select(User).where(
        or_(User.username == payload.username_or_email, User.email == payload.username_or_email)
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.password_hash):
        raise AuthenticationError("Invalid username/email or password.")

    if not user.is_active:
        raise AuthenticationError("Account has been deactivated. Please contact support.")

    # Generate tokens
    access_token = create_access_token({"sub": str(user.id), "username": user.username})
    refresh_token = create_refresh_token({"sub": str(user.id), "username": user.username})

    # Record active session in DB for rotation & revocation tracking
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    session = UserSession(
        user_id=user.id,
        session_identifier=generate_secure_random_token(16),
        refresh_token=refresh_token,
        ip_address=client_ip,
        device_info=user_agent[:250] if user_agent else None,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        is_revoked=False
    )
    db.add(session)
    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user_id=user.id,
        username=user.username
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Rotate refresh token and issue new access token"
)
async def refresh_token(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    # Decode token signature and claims
    token_claims = decode_refresh_token(payload.refresh_token)
    user_id = int(token_claims["sub"])

    # Verify session in database (prevent replay of revoked/old refresh tokens)
    stmt = select(UserSession).where(
        UserSession.refresh_token == payload.refresh_token,
        UserSession.is_revoked == False
    )
    res = await db.execute(stmt)
    active_session = res.scalar_one_or_none()

    if not active_session or ensure_utc(active_session.expires_at) < datetime.now(timezone.utc):
        raise AuthenticationError("Refresh token is expired, revoked, or invalid.")

    # Revoke old session (Rotation principle)
    active_session.is_revoked = True

    # Check user active status
    user_stmt = select(User).where(User.id == user_id)
    user_res = await db.execute(user_stmt)
    user = user_res.scalar_one_or_none()
    if not user or not user.is_active:
        raise AuthenticationError("User account is inactive or not found.")

    # Issue new token pair
    new_access_token = create_access_token({"sub": str(user.id), "username": user.username})
    new_refresh_token = create_refresh_token({"sub": str(user.id), "username": user.username})

    # Save new active session
    new_session = UserSession(
        user_id=user.id,
        session_identifier=generate_secure_random_token(16),
        refresh_token=new_refresh_token,
        ip_address=active_session.ip_address,
        device_info=active_session.device_info,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        is_revoked=False
    )
    db.add(new_session)
    await db.commit()

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        user_id=user.id,
        username=user.username
    )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Revoke active user session"
)
async def logout(
    payload: LogoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if payload.refresh_token:
        # Revoke specific session
        stmt = select(UserSession).where(
            UserSession.user_id == current_user.id,
            UserSession.refresh_token == payload.refresh_token
        )
        res = await db.execute(stmt)
        sess = res.scalar_one_or_none()
        if sess:
            sess.is_revoked = True
    else:
        # Revoke all active sessions for this user
        stmt = select(UserSession).where(
            UserSession.user_id == current_user.id,
            UserSession.is_revoked == False
        )
        res = await db.execute(stmt)
        for s in res.scalars().all():
            s.is_revoked = True

    await db.commit()
    return {"success": True, "message": "Successfully logged out."}


@router.post(
    "/change-password",
    status_code=status.HTTP_200_OK,
    summary="Change password for authenticated user"
)
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise ValidationError("The current password provided is incorrect.")

    if payload.current_password == payload.new_password:
        raise ValidationError("New password cannot be identical to the current password.")

    current_user.password_hash = hash_password(payload.new_password)

    # Invalidate all existing sessions on password change for security
    stmt = select(UserSession).where(
        UserSession.user_id == current_user.id,
        UserSession.is_revoked == False
    )
    res = await db.execute(stmt)
    for s in res.scalars().all():
        s.is_revoked = True

    await db.commit()
    return {"success": True, "message": "Password changed successfully. Please log in again."}


@router.post(
    "/forgot-password",
    status_code=status.HTTP_200_OK,
    summary="Request a password reset link (protected against email enumeration)"
)
async def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    email_svc: BaseEmailService = Depends(get_email_service)
):
    auth_rate_limiter.check(request, key_prefix="forgot_password")

    stmt = select(User).where(User.email == payload.email)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if user and user.is_active:
        token = create_password_reset_token(user.email)
        await email_svc.send_password_reset_email(user.email, token)

    # Always return 200 with identical generic response to prevent account enumeration attacks
    return {
        "success": True,
        "message": "If an active account exists for that email, a password reset link has been dispatched."
    }


@router.post(
    "/reset-password",
    status_code=status.HTTP_200_OK,
    summary="Reset password using signed token"
)
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    email = verify_password_reset_token(payload.reset_token)
    if not email:
        raise ValidationError("The password reset token is invalid, expired, or has already been used.")

    stmt = select(User).where(User.email == email)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user:
        raise EntityNotFoundException("User", email)

    user.password_hash = hash_password(payload.new_password)

    # Revoke sessions
    sess_stmt = select(UserSession).where(
        UserSession.user_id == user.id,
        UserSession.is_revoked == False
    )
    sess_res = await db.execute(sess_stmt)
    for s in sess_res.scalars().all():
        s.is_revoked = True

    await db.commit()
    return {"success": True, "message": "Password reset successfully. You may now log in with your new password."}
