"""
Security, hashing and token services.
Handles password hashing via bcrypt/argon2 and JWT token generation / verification for access,
refresh, and password reset workflows.
"""

import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings
from app.core.exceptions import AuthenticationError


# Support bcrypt with automatic migration if older hashes are encountered
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hashes a plaintext password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against the stored hash."""
    return pwd_context.verify(plain_password, hashed_password)


def generate_secure_random_token(length: int = 32) -> str:
    """Generates a cryptographically strong random token."""
    return secrets.token_urlsafe(length)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generates a signed short-lived JWT access token."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({
        "exp": expire,
        "iat": now,
        "type": "access"
    })
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generates a signed long-lived JWT refresh token."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode.update({
        "exp": expire,
        "iat": now,
        "type": "refresh",
        "jti": generate_secure_random_token(16)
    })
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def create_password_reset_token(email: str) -> str:
    """Generates a short-lived, signed password reset token."""
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": email,
        "exp": expire,
        "iat": now,
        "type": "password_reset",
        "jti": generate_secure_random_token(16)
    }
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def verify_password_reset_token(token: str) -> Optional[str]:
    """Decodes and validates a password reset token, returning the user email."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "password_reset":
            return None
        email: Optional[str] = payload.get("sub")
        return email
    except JWTError:
        return None


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decodes and validates an access token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise AuthenticationError("Token type must be an access token")
        return payload
    except JWTError as e:
        raise AuthenticationError(f"Could not validate authentication token: {str(e)}")


def decode_refresh_token(token: str) -> Dict[str, Any]:
    """Decodes and validates a refresh token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise AuthenticationError("Token type must be a refresh token")
        return payload
    except JWTError as e:
        raise AuthenticationError(f"Invalid or expired refresh token: {str(e)}")
