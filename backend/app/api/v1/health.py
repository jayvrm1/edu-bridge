"""
Health check and system diagnostics endpoints.
"""

from fastapi import APIRouter, status
from app.core.config import settings
from app.database.session import check_database_connection
from app.schemas.health import HealthResponse, ServiceStatus


router = APIRouter(tags=["Health & Status"])


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="System Health Check",
    description="Returns the operational health of the backend application and PostgreSQL database connectivity."
)
async def get_health_status() -> HealthResponse:
    db_alive = await check_database_connection()
    db_status = ServiceStatus(
        status="healthy" if db_alive else "unhealthy",
        details={"connected": db_alive, "engine": "async"}
    )

    overall_status = "healthy" if db_alive else "degraded"

    return HealthResponse(
        status=overall_status,
        environment=settings.APP_ENV,
        version="1.0.0",
        database=db_status,
        services={
            "api": "operational",
            "gemma_tutor": "configured" if settings.GEMMA_API_KEY else "unconfigured",
            "sign_recognition": "ready"
        }
    )

