"""Platform rules - admin-managed pricing and cancellation rules."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from ..database import Base


class PlatformRule(Base):
    """Admin-configurable platform rules."""
    
    __tablename__ = "platform_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    
    rule_key = Column(String(100), unique=True, nullable=False)  # e.g. "default_urgency_multiplier"
    rule_value = Column(Text, nullable=False)  # JSON or string
    description = Column(Text, nullable=True)
    
    # Cancellation rules: hours_before_pickup -> refund_percentage
    # Example: {"24": 100, "12": 75, "0": 0} = full refund if 24h before, 75% if 12h, no refund if less
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
