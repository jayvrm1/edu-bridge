"""
Tests for database connectivity and transaction execution.
"""

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import check_database_connection


@pytest.mark.asyncio
async def test_database_connection_check():
    """Verify check_database_connection ping returns boolean."""
    result = await check_database_connection()
    assert isinstance(result, bool)


@pytest.mark.asyncio
async def test_session_execute_query(db_session: AsyncSession):
    """Verify executing a basic query via the async session."""
    result = await db_session.execute(text("SELECT 42 AS value"))
    row = result.fetchone()
    assert row is not None
    assert row[0] == 42

