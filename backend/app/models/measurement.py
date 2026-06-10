"""Measurement model - body measurements for orders."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..database import Base


class Measurement(Base):
    """Saved body measurements for a customer."""
    
    __tablename__ = "measurements"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    name = Column(String(100), nullable=True)  # "Standard", "Party wear", etc.
    
    # JSON blob for flexibility: { "shoulder": 14, "bust": 34, "waist": 28, ... }
    data = Column(Text, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="measurements")
