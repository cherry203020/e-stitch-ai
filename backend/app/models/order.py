"""Order model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..database import Base


class Order(Base):
    """Stitching order with full workflow tracking."""
    
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tailor_id = Column(Integer, ForeignKey("tailors.id"), nullable=False)
    design_id = Column(Integer, ForeignKey("designs.id"), nullable=True)  # Null for custom
    
    # Status
    status = Column(String(50), default="order_placed", nullable=False, index=True)
    
    # Measurements (JSON or reference to measurement_id)
    measurement_data = Column(Text, nullable=True)  # JSON snapshot at order time
    measurement_profile_id = Column(Integer, ForeignKey("measurements.id"), nullable=True)
    
    # Custom design reference
    custom_design_image_url = Column(String(500), nullable=True)  # Snapshot for custom designs
    
    # Scheduling
    fabric_pickup_slot = Column(DateTime, nullable=True)
    delivery_slot = Column(DateTime, nullable=True)
    
    # Urgent
    is_urgent = Column(Integer, default=0, nullable=False)
    urgent_delivery_days = Column(Integer, nullable=True)  # e.g. 2 for 2-day delivery
    
    # Pricing (INR)
    base_price = Column(Float, default=0.0, nullable=False)
    urgency_charge = Column(Float, default=0.0, nullable=False)
    total_price = Column(Float, default=0.0, nullable=False)
    
    # Payment: cash, upi, card, online, etc.
    payment_mode = Column(String(50), nullable=True)
    
    # Cancellation
    cancelled_at = Column(DateTime, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    refund_amount = Column(Float, nullable=True)
    cancellation_penalty = Column(Float, nullable=True)
    
    # Admin dispute
    dispute_notes = Column(Text, nullable=True)
    admin_override = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    customer = relationship("User", back_populates="orders_as_customer", foreign_keys=[customer_id])
    tailor = relationship("Tailor", back_populates="orders")
    design = relationship("Design", back_populates="orders")
    review = relationship("Review", back_populates="order", uselist=False)
