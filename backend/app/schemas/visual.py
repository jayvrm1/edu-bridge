"""
Pydantic schemas for Visual Accessibility, OCR text extraction, and Image Description.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class OCRLine(BaseModel):
    text: str
    confidence: float = 0.95
    bounding_box: Optional[Dict[str, float]] = None


class OCRRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded image (PNG/JPEG/WebP)")
    language: str = Field(default="eng", description="OCR language hint (e.g., 'eng', 'hin')")


class OCRResponse(BaseModel):
    extracted_text: str = Field(..., description="Full extracted text content")
    confidence: float = Field(default=0.92, description="Estimated extraction confidence")
    lines: List[OCRLine] = Field(default_factory=list, description="Extracted text line-by-line")
    image_width: int
    image_height: int
    ocr_engine: str = Field(default="tesseract_or_cv_pipeline")


class DescribeImageRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded image or diagram")
    context_prompt: Optional[str] = Field(default="Describe this educational diagram for a visually impaired student", description="Prompt guidance")
    target_modality: str = Field(default="screen_reader", description="screen_reader, high_contrast, or tactile")


class DescribeImageResponse(BaseModel):
    description: str = Field(..., description="Accessible, descriptive explanation of the image")
    key_elements: List[str] = Field(default_factory=list, description="Primary visual components identified")
    educational_summary: str = Field(..., description="Key academic takeaway of diagram")
    model_provider: str = Field(default="gemma_vision_interface")

