"""
Main entry point for EduBridge AI Backend.
FastAPI application factory, lifecycle events, middleware, and route mounting.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import register_exception_handlers
from app.database.session import engine, check_database_connection
from app.database.base import Base
from app.api.v1.router import api_v1_router
from app.api.v1.health import router as root_health_router
from app.api.websocket.recognition_ws import router as recognition_ws_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager for application startup and shutdown events."""
    logger.info(f"Starting {settings.PROJECT_NAME} in [{settings.APP_ENV}] mode...")
    logger.info(f"API Prefix: {settings.API_V1_PREFIX}")

    # Database connectivity verification & schema creation for local dev
    db_connected = await check_database_connection()
    if db_connected:
        logger.info("Database connection established successfully.")
        # Auto-create tables for development if using SQLite or fresh test DB
        if settings.DATABASE_URL.startswith("sqlite"):
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Local database tables verified/created.")
    else:
        logger.warning("Database connection could not be established at startup!")

    yield

    logger.info("Shutting down EduBridge AI Backend...")
    await engine.dispose()
    logger.info("Database connection pool closed.")


def create_application() -> FastAPI:
    """Application factory for EduBridge AI Backend."""
    application = FastAPI(
        title=settings.PROJECT_NAME,
        version="1.0.0",
        description=(
            "EduBridge AI Backend — Learning Without Communication Barriers.\n\n"
            "Inclusive multimodal learning platform featuring Indian Sign Language (ISL) recognition, "
            "Gemma 4 AI Tutor integration, 3D avatar animation pipelines, AAC, and multi-disability accessibility."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan
    )

    # CORS Middleware
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Exception Handlers
    register_exception_handlers(application)

    # Root endpoint
    @application.get(
        "/",
        tags=["General"],
        summary="API Root",
        status_code=status.HTTP_200_OK
    )
    async def root():
        return {
            "name": settings.PROJECT_NAME,
            "version": "1.0.0",
            "tagline": "Learning Without Communication Barriers",
            "environment": settings.APP_ENV,
            "status": "online",
            "docs": "/docs",
            "health": "/health",
            "api_v1": settings.API_V1_PREFIX
        }

    # Mount Root Health Route (/health)
    application.include_router(root_health_router, prefix="")

    # Mount API v1 Routes (/api/v1)
    application.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)

    # Mount Real-time WebSockets
    application.include_router(recognition_ws_router)

    return application


app = create_application()

