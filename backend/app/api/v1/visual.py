"""
FastAPI router for OCR text extraction and accessible visual descriptions.
"""

from fastapi import APIRouter, HTTPException, status
import structlog

from app.core.exceptions import ValidationError
from app.schemas.visual import (
    OCRRequest,
    OCRResponse,
    DescribeImageRequest,
    DescribeImageResponse
)
from app.services.visual.ocr_service import VisualOCRService

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/visual", tags=["Visual Accessibility & OCR"])


@router.post("/ocr", response_model=OCRResponse)
async def extract_text_from_image(request: OCRRequest):
    """Extracts text content from uploaded educational image or document."""
    if not request.image_base64.strip():
        raise ValidationError("Image payload cannot be empty")
    try:
        return VisualOCRService.get_instance().extract_text(request)
    except ValueError as e:
        raise ValidationError(str(e))


@router.post("/describe", response_model=DescribeImageResponse)
async def describe_image_or_diagram(request: DescribeImageRequest):
    """Generates accessible descriptions for visual diagrams, charts, and educational figures."""
    if not request.image_base64.strip():
        raise ValidationError("Image payload cannot be empty")
    try:
        return VisualOCRService.get_instance().describe_diagram(request)
    except ValueError as e:
        raise ValidationError(str(e))

