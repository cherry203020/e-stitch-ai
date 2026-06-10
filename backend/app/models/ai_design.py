"""AI-generated design sketch model - Phase 2: AI Add-On."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..database import Base


class AIDesignGeneration(Base):
    """
    Stores AI-generated clothing design sketches from user text prompts.
    Assistive/conceptual only - not production-grade fashion simulation.
    """
    __tablename__ = "ai_design_generations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    prompt = Column(Text, nullable=False)
    image_path = Column(String(500), nullable=False)  # relative path under upload_dir/ai_designs/

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="ai_design_generations")
