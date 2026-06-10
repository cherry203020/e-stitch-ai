"""Tailor model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..database import Base


class Tailor(Base):
    """Tailor profile - verified tailors with pricing and location."""
    
    __tablename__ = "tailors"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    shop_name = Column(String(255), nullable=False)
    shop_address = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    
    # male or female
    gender = Column(String(20), default="male", nullable=False)
    
    # Location for distance calculation and Maps
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Pricing (in INR)
    base_stitching_price = Column(Float, default=0.0, nullable=False)
    urgency_multiplier = Column(Float, default=1.5, nullable=False)  # e.g. 1.5 = 50% extra
    min_delivery_days = Column(Integer, default=7, nullable=False)  # Standard delivery
    
    # Verification & trust
    is_verified = Column(Integer, default=0, nullable=False)  # Admin verified
    trust_score = Column(Float, default=0.0, nullable=False)  # Calculated from ratings
    total_reviews = Column(Integer, default=0, nullable=False)
    
    # Workload
    max_concurrent_orders = Column(Integer, default=10, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="tailor_profile")
    orders = relationship("Order", back_populates="tailor")
    reviews = relationship("Review", back_populates="tailor")
