"""Review model - post-delivery ratings."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..database import Base


class Review(Base):
    """Customer review and rating for tailor after delivery."""
    
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True, nullable=False)
    tailor_id = Column(Integer, ForeignKey("tailors.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    rating = Column(Float, nullable=False)  # 1-5
    comment = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    order = relationship("Order", back_populates="review")
    tailor = relationship("Tailor", back_populates="reviews")
    customer = relationship("User", back_populates="reviews_given", foreign_keys=[customer_id])
