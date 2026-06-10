"""Design models - predefined and custom blouse designs."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..database import Base


class Design(Base):
    """Predefined blouse design catalog."""
    
    __tablename__ = "designs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Design attributes for filtering
    neck_type = Column(String(100), nullable=True)  # V-neck, round, boat, etc.
    sleeve_type = Column(String(100), nullable=True)  # sleeveless, short, three-quarter, full
    back_type = Column(String(100), nullable=True)  # high, low, keyhole
    
    # Category: simple, bridal, heavy_work
    category = Column(String(50), nullable=False, index=True)
    
    # Price in INR (minimum 1000)
    price = Column(Float, default=1000.0, nullable=False)
    
    image_url = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    orders = relationship("Order", back_populates="design")


class CustomDesign(Base):
    """Customer-uploaded custom/reference design."""
    
    __tablename__ = "custom_designs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    image_url = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
