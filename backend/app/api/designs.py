"""Design Catalog API."""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models import Design, CustomDesign
from ..schemas.design import DesignCreate, DesignResponse, CustomDesignCreate, CustomDesignResponse
from ..core.dependencies import get_current_user, require_admin, require_any_authenticated
from fastapi import status

router = APIRouter(prefix="/designs", tags=["designs"])


@router.get("", response_model=List[DesignResponse])
async def list_designs(
    category: Optional[str] = Query(None, description="simple, bridal, heavy_work"),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_any_authenticated)
):
    """List predefined blouse designs with optional category filter."""
    q = select(Design)
    if category:
        q = q.where(Design.category == category)
    q = q.order_by(Design.category, Design.name)
    result = await db.execute(q)
    return list(result.scalars().all())


@router.get("/{design_id}", response_model=DesignResponse)
async def get_design(
    design_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_any_authenticated)
):
    """Get design by ID."""
    result = await db.execute(select(Design).where(Design.id == design_id))
    design = result.scalar_one_or_none()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    return design


@router.post("", response_model=DesignResponse)
async def create_design(
    data: DesignCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin)
):
    """Create predefined design (admin only)."""
    design = Design(**data.model_dump())
    db.add(design)
    await db.flush()
    await db.refresh(design)
    return design


@router.delete("/{design_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_design(
    design_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin)
):
    """Delete a design (admin only)."""
    result = await db.execute(select(Design).where(Design.id == design_id))
    design = result.scalar_one_or_none()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    await db.delete(design)
    await db.flush()


@router.post("/custom", response_model=CustomDesignResponse)
async def upload_custom_design(
    data: CustomDesignCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Upload custom/reference design image."""
    custom = CustomDesign(
        user_id=current_user.id,
        image_url=data.image_url,
        description=data.description
    )
    db.add(custom)
    await db.flush()
    await db.refresh(custom)
    return custom
