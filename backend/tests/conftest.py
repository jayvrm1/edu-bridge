"""
Pytest configuration, fixtures and test database setup.
Uses an isolated in-memory SQLite database for high-speed testing without external dependencies.
"""

import os
import pytest
import pytest_asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text

# Force test configuration before importing application modules
os.environ["APP_ENV"] = "testing"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["DATABASE_URL_SYNC"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "test_secret_key_minimum_32_characters_long_for_security"
os.environ["JWT_SECRET_KEY"] = "test_jwt_secret_key_minimum_32_chars_long_here"
os.environ["LOG_LEVEL"] = "ERROR"

from app.core.config import settings
from app.database.base import Base
from app.database.session import get_db
import app.models  # Register all models with Base.metadata
from app.main import create_application


test_engine = create_async_engine(
    "sqlite+aiosqlite:///:memory:",
    connect_args={"check_same_thread": False}
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def prepare_database():
    """Create all database tables before test session and drop them after."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provides an isolated database session per test with automatic rollback."""
    async with TestingSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Provides an async HTTP test client with overridden database dependency."""
    app = create_application()

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with TestingSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

