"""
Tests for application startup, root metadata, and error routing.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    """Verify root GET / returns platform identity and links."""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "EduBridge AI Backend"
    assert data["tagline"] == "Learning Without Communication Barriers"
    assert data["status"] == "online"
    assert data["docs"] == "/docs"
    assert data["health"] == "/health"
    assert data["api_v1"] == "/api/v1"


@pytest.mark.asyncio
async def test_not_found_endpoint(client: AsyncClient):
    """Verify non-existent route returns standard error schema."""
    response = await client.get("/non-existent-path-for-testing")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert "error" in data
    assert data["error"]["code"] == "HTTP_404"

