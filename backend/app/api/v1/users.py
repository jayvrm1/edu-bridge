"""
User Profile and Account Management endpoints.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.models.user import User, UserProfile
from app.schemas.user import UserResponse, UserProfileUpdate
from app.api.deps import get_current_active_user


router = APIRouter(prefix="/users", tags=["User Profile"])


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile and accessibility settings"
)
async def get_my_profile(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> UserResponse:
    stmt = select(User).where(User.id == current_user.id)
    res = await db.execute(stmt)
    user = res.scalar_one()
    return user


@router.patch(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update current user profile information"
)
async def update_my_profile(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> UserResponse:
    stmt = select(UserProfile).where(UserProfile.user_id == current_user.id)
    res = await db.execute(stmt)
    profile = res.scalar_one_or_none()

    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    if payload.full_name is not None:
        profile.full_name = payload.full_name
    if payload.preferred_language is not None:
        profile.preferred_language = payload.preferred_language
    if payload.avatar_url is not None:
        profile.avatar_url = payload.avatar_url
    if payload.profile_metadata is not None:
        merged = profile.profile_metadata.copy() if profile.profile_metadata else {}
        merged.update(payload.profile_metadata)
        profile.profile_metadata = merged

    await db.commit()

    # Return refreshed user
    user_stmt = select(User).where(User.id == current_user.id)
    user_res = await db.execute(user_stmt)
    return user_res.scalar_one()

