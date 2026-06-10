"""User model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.orm import relationship
from ..database import Base
import enum


class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    TAILOR = "tailor"
    ADMIN = "admin"


class User(Base):
    """User account - supports customer, tailor, admin roles."""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    
    role = Column(String(20), default=UserRole.CUSTOMER.value, nullable=False)
    
    address = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)
    
    latitude = Column(String(20), nullable=True)
    longitude = Column(String(20), nullable=True)
    
    is_active = Column(Integer, default=1, nullable=False)  # SQLite uses integer for bool
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tailor_profile = relationship("Tailor", back_populates="user", uselist=False)
    orders_as_customer = relationship("Order", back_populates="customer", foreign_keys="Order.customer_id")
    measurements = relationship("Measurement", back_populates="user")
    reviews_given = relationship("Review", back_populates="customer", foreign_keys="Review.customer_id")
