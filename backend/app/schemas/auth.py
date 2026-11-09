"""
Authentication and registration schemas.
"""

from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    email: EmailStr = Field(..., description="Valid email address")
    password: str = Field(..., min_length=8, max_length=128, description="Strong password (min 8 chars)")
    full_name: Optional[str] = Field(default=None, max_length=100, description="Full display name")
    preferred_language: str = Field(default="en", max_length=10, description="Preferred UI / teaching language")
    
    # Optional onboarding accessibility preferences
    hearing_impairment: bool = Field(default=False, description="Has hearing impairment / uses sign language")
    visual_impairment: bool = Field(default=False, description="Has visual impairment / needs screen reader or high contrast")
    speech_impairment: bool = Field(default=False, description="Has speech impairment / non-speaking / uses AAC")
    other_requirements: bool = Field(default=False, description="Other physical/cognitive accessibility needs")


class UserLoginRequest(BaseModel):
    username_or_email: str = Field(..., description="Username or email address")
    password: str = Field(..., description="Plaintext password")


class TokenResponse(BaseModel):
    access_token: str = Field(..., description="Bearer JWT access token")
    refresh_token: str = Field(..., description="Bearer JWT refresh token for rotation")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in_minutes: int = Field(..., description="Access token validity period in minutes")
    user_id: int
    username: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., description="Valid refresh token")


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., description="Current account password")
    new_password: str = Field(..., min_length=8, max_length=128, description="New strong password")


class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered account email address")


class ResetPasswordRequest(BaseModel):
    reset_token: str = Field(..., description="Cryptographically signed reset token")
    new_password: str = Field(..., min_length=8, max_length=128, description="New strong password")


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = Field(default=None, description="Optional refresh token to revoke specifically")
