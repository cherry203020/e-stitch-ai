"""Measurement schemas."""
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class MeasurementCreate(BaseModel):
    name: Optional[str] = None
    data: str  # JSON string


class MeasurementUpdate(BaseModel):
    name: Optional[str] = None
    data: Optional[str] = None


class MeasurementResponse(BaseModel):
    id: int
    user_id: int
    name: Optional[str] = None
    data: str
    created_at: datetime

    class Config:
        from_attributes = True
