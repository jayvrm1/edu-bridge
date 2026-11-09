"""
API v1 root router aggregator.
Mounts all v1 domain routers.
"""

from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.accessibility import router as accessibility_router
from app.api.v1.tutor import router as tutor_router
from app.api.v1.sign_language import router as sign_language_router
from app.api.v1.avatar import router as avatar_router
from app.api.v1.speech import router as speech_router
from app.api.v1.aac import router as aac_router
from app.api.v1.visual import router as visual_router
from app.api.v1.gamification import router as gamification_router


api_v1_router = APIRouter()

# Register sub-routers
api_v1_router.include_router(health_router, prefix="", tags=["Health"])
api_v1_router.include_router(auth_router)
api_v1_router.include_router(users_router)
api_v1_router.include_router(accessibility_router)
api_v1_router.include_router(tutor_router)
api_v1_router.include_router(sign_language_router)
api_v1_router.include_router(avatar_router)
api_v1_router.include_router(speech_router)
api_v1_router.include_router(aac_router)
api_v1_router.include_router(visual_router)
api_v1_router.include_router(gamification_router)
