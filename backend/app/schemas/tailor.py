"""Tailor schemas."""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class TailorBase(BaseModel):
    shop_name: str
    shop_address: Optional[str] = None
    description: Optional[str] = None
    gender: str = "male"  # male or female
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    base_stitching_price: float = 0.0
    urgency_multiplier: float = 1.5
    min_delivery_days: int = 7


class TailorCreate(TailorBase):
    pass


class TailorUpdate(BaseModel):
    shop_name: Optional[str] = None
    shop_address: Optional[str] = None
    description: Optional[str] = None
    gender: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    base_stitching_price: Optional[float] = None
    urgency_multiplier: Optional[float] = None
    min_delivery_days: Optional[int] = None


class TailorResponse(TailorBase):
    id: int
    user_id: int
    is_verified: bool
    trust_score: float
    total_reviews: int
    max_concurrent_orders: int
    created_at: datetime

    class Config:
        from_attributes = True


class TailorListResponse(BaseModel):
    id: int
    user_id: int
    shop_name: str
    shop_address: Optional[str] = None
    gender: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    base_stitching_price: float
    urgency_multiplier: float
    min_delivery_days: int
    is_verified: bool
    trust_score: float
    total_reviews: int
    distance_km: Optional[float] = None
    match_score: Optional[float] = None  # 0-100 when using AI match
    match_reasons: Optional[List[str]] = None  # e.g. ["Best price", "Top rated"]

    class Config:
        from_attributes = True
