"""Order schemas."""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


ORDER_STATUSES = [
    "order_placed", "pending_tailor", "fabric_picked",
    "stitching_in_progress", "quality_check", "out_for_delivery",
    "delivered", "cancelled"
]


class OrderCreate(BaseModel):
    tailor_id: int
    design_id: Optional[int] = None
    custom_design_image_url: Optional[str] = None
    measurement_data: Optional[str] = None
    measurement_profile_id: Optional[int] = None
    fabric_pickup_slot: Optional[datetime] = None
    delivery_slot: Optional[datetime] = None
    is_urgent: bool = False
    urgent_delivery_days: Optional[int] = None
    payment_mode: Optional[str] = None  # cash, upi, card, online


class OrderStatusUpdate(BaseModel):
    status: str


class OrderResponse(BaseModel):
    id: int
    order_number: str
    customer_id: int
    tailor_id: int
    design_id: Optional[int] = None
    custom_design_image_url: Optional[str] = None
    status: str
    measurement_data: Optional[str] = None
    fabric_pickup_slot: Optional[datetime] = None
    delivery_slot: Optional[datetime] = None
    is_urgent: bool
    urgent_delivery_days: Optional[int] = None
    base_price: float
    urgency_charge: float
    total_price: float
    payment_mode: Optional[str] = None
    refund_amount: Optional[float] = None
    cancellation_penalty: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderListResponse(OrderResponse):
    pass
