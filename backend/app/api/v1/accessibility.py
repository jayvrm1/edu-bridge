"""
Accessibility Preferences API endpoints.
Provides complete configuration for Hearing, Visual, Speech, and Custom accessibility settings.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.models.user import User, AccessibilityPreferences
from app.schemas.user import AccessibilityPreferencesSchema, AccessibilityPreferencesUpdate
from app.api.deps import get_current_active_user


router = APIRouter(prefix="/accessibility", tags=["Accessibility Preferences"])


@router.get(
    "/preferences",
    response_model=AccessibilityPreferencesSchema,
    status_code=status.HTTP_200_OK,
    summary="Get current user accessibility preferences"
)
async def get_accessibility_preferences(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> AccessibilityPreferencesSchema:
    stmt = select(AccessibilityPreferences).where(AccessibilityPreferences.user_id == current_user.id)
    res = await db.execute(stmt)
    prefs = res.scalar_one_or_none()

    if not prefs:
        # Create default preferences record if missing
        prefs = AccessibilityPreferences(user_id=current_user.id)
        db.add(prefs)
        await db.commit()
        await db.refresh(prefs)

    return prefs


@router.put(
    "/preferences",
    response_model=AccessibilityPreferencesSchema,
    status_code=status.HTTP_200_OK,
    summary="Replace entire accessibility preferences profile"
)
async def replace_accessibility_preferences(
    payload: AccessibilityPreferencesSchema,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> AccessibilityPreferencesSchema:
    stmt = select(AccessibilityPreferences).where(AccessibilityPreferences.user_id == current_user.id)
    res = await db.execute(stmt)
    prefs = res.scalar_one_or_none()

    if not prefs:
        prefs = AccessibilityPreferences(user_id=current_user.id)
        db.add(prefs)

    # Overwrite all fields
    for field, val in payload.model_dump().items():
        setattr(prefs, field, val)

    await db.commit()
    await db.refresh(prefs)
    return prefs


@router.patch(
    "/preferences",
    response_model=AccessibilityPreferencesSchema,
    status_code=status.HTTP_200_OK,
    summary="Partially update specific accessibility preferences"
)
async def patch_accessibility_preferences(
    payload: AccessibilityPreferencesUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> AccessibilityPreferencesSchema:
    stmt = select(AccessibilityPreferences).where(AccessibilityPreferences.user_id == current_user.id)
    res = await db.execute(stmt)
    prefs = res.scalar_one_or_none()

    if not prefs:
        prefs = AccessibilityPreferences(user_id=current_user.id)
        db.add(prefs)

    update_data = payload.model_dump(exclude_unset=True)

    # Merge metadata if present
    if "preferences_metadata" in update_data and update_data["preferences_metadata"] is not None:
        merged = prefs.preferences_metadata.copy() if prefs.preferences_metadata else {}
        merged.update(update_data["preferences_metadata"])
        update_data["preferences_metadata"] = merged

    for key, val in update_data.items():
        setattr(prefs, key, val)

    await db.commit()
    await db.refresh(prefs)
    return prefs

