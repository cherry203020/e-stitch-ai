"""Platform rule schemas."""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PlatformRuleCreate(BaseModel):
    rule_key: str
    rule_value: str
    description: Optional[str] = None


class PlatformRuleResponse(BaseModel):
    id: int
    rule_key: str
    rule_value: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
