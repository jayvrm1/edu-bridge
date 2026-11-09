"""
Health check and system status schemas.
"""

from datetime import datetime, timezone
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class ServiceStatus(BaseModel):
    status: str = Field(..., description="Service status: healthy, degraded, or unhealthy")
    details: Optional[Dict[str, Any]] = Field(default=None, description="Diagnostic details")


class HealthResponse(BaseModel):
    status: str = Field(..., description="Overall platform status")
    environment: str = Field(..., description="Current running environment")
    version: str = Field(default="1.0.0", description="API version")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Server timestamp")
    database: ServiceStatus = Field(..., description="Database connectivity status")
    services: Dict[str, str] = Field(default_factory=dict, description="Status of auxiliary services")

