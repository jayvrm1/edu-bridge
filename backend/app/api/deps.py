"""
FastAPI route dependencies: Authentication, Current User, and Authorization.
"""

from typing import Optional
from fastapi import Depends, status, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.core.security import decode_access_token
from app.core.exceptions import AuthenticationError, PermissionDeniedError
from app.database.session import get_db
from app.models.user import User


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login",
    auto_error=False
)


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Extracts and validates user from Bearer access token."""
    if not token:
        raise AuthenticationError("Authorization header with Bearer token is required")

    payload = decode_access_token(token)
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise AuthenticationError("Invalid token subject")

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise AuthenticationError("Malformed token subject")

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise AuthenticationError("User not found or deleted")

    if not user.is_active:
        raise AuthenticationError("Inactive user account")

    return user


async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Returns User if valid Bearer token provided, otherwise None without raising an error."""
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        user_id_str = payload.get("sub")
        if not user_id_str:
            return None
        user_id = int(user_id_str)
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if user and user.is_active:
            return user
        return None
    except Exception:
        return None


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Verifies that the authenticated user is currently active."""
    if not current_user.is_active:
        raise AuthenticationError("Inactive user account")
    return current_user


async def get_current_superuser(
    current_user: User = Depends(get_current_user)
) -> User:
    """Verifies that the authenticated user possesses superuser privileges."""
    if not current_user.is_superuser:
        raise PermissionDeniedError("Administrative privileges required")
    return current_user

