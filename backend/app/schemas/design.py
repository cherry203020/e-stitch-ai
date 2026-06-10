"""Design schemas."""
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class DesignBase(BaseModel):
    name: str
    description: Optional[str] = None
    neck_type: Optional[str] = None
    sleeve_type: Optional[str] = None
    back_type: Optional[str] = None
    category: str  # simple, bridal, heavy_work
    price: float = 1000.0
    image_url: Optional[str] = None

    @field_validator("price")
    @classmethod
    def price_min(cls, v: float) -> float:
        if v < 1000:
            raise ValueError("Price must be at least 1000")
        return v


class DesignCreate(DesignBase):
    pass


class DesignResponse(DesignBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CustomDesignCreate(BaseModel):
    image_url: str
    description: Optional[str] = None


class CustomDesignResponse(BaseModel):
    id: int
    user_id: int
    image_url: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
