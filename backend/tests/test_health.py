"""
Tests for system health check endpoints.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_health_endpoint(client: AsyncClient):
    """Verify top-level GET /health reports application and database health."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "database" in data
    assert "status" in data["database"]
    assert "environment" in data
    assert "version" in data
    assert "timestamp" in data
    assert "services" in data


@pytest.mark.asyncio
async def test_api_v1_health_endpoint(client: AsyncClient):
    """Verify versioned GET /api/v1/health reports system status."""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert data["services"]["api"] == "operational"
    assert data["database"]["status"] in ["healthy", "unhealthy"]

