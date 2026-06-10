"""Review schemas."""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReviewCreate(BaseModel):
    order_id: int
    rating: float  # 1-5
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    id: int
    order_id: int
    tailor_id: int
    customer_id: int
    rating: float
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
