"""Schemas for AI design generation (Phase 2)."""
from typing import Optional, Literal
from pydantic import BaseModel
from datetime import datetime


class AIDesignGenerateRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = None  # optional: what to avoid (e.g. "blurry, distorted")
    source: Literal["auto", "huggingface", "local"] = "auto"  # which model to use: auto, Hugging Face API, or local


class AIDesignFromImageRequest(BaseModel):
    """Save an image generated externally (e.g. Puter.js) for history and download."""
    prompt: str
    image_data_url: str  # data:image/png;base64,...


class AIDesignGenerationResponse(BaseModel):
    id: int
    prompt: str
    image_url: str
    created_at: datetime

    class Config:
        from_attributes = True
