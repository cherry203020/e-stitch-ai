"""Platform rules API - admin pricing and cancellation rules."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models import PlatformRule
from ..schemas.platform_rule import PlatformRuleCreate, PlatformRuleResponse
from ..core.dependencies import require_admin

router = APIRouter(prefix="/platform-rules", tags=["platform-rules"])


@router.get("", response_model=List[PlatformRuleResponse])
async def list_rules(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin)
):
    """List all platform rules (admin only)."""
    result = await db.execute(select(PlatformRule).order_by(PlatformRule.rule_key))
    return list(result.scalars().all())


@router.post("", response_model=PlatformRuleResponse)
async def create_rule(
    data: PlatformRuleCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin)
):
    """Create/update platform rule (admin only)."""
    r = await db.execute(select(PlatformRule).where(PlatformRule.rule_key == data.rule_key))
    existing = r.scalar_one_or_none()
    if existing:
        existing.rule_value = data.rule_value
        existing.description = data.description
        await db.flush()
        await db.refresh(existing)
        return existing
    rule = PlatformRule(**data.model_dump())
    db.add(rule)
    await db.flush()
    await db.refresh(rule)
    return rule


@router.get("/{rule_key}")
async def get_rule(
    rule_key: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin)
):
    """Get specific rule (admin only)."""
    result = await db.execute(select(PlatformRule).where(PlatformRule.rule_key == rule_key))
    r = result.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Rule not found")
    return r
