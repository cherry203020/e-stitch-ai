"""Measurements API."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models import User, Measurement
from ..schemas.measurement import MeasurementCreate, MeasurementResponse
from ..core.dependencies import get_current_user

router = APIRouter(prefix="/measurements", tags=["measurements"])


@router.get("", response_model=List[MeasurementResponse])
async def list_measurements(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List saved measurements for current user."""
    result = await db.execute(
        select(Measurement).where(Measurement.user_id == current_user.id)
        .order_by(Measurement.created_at.desc())
    )
    return list(result.scalars().all())


@router.post("", response_model=MeasurementResponse)
async def create_measurement(
    data: MeasurementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save body measurements (manual or profile)."""
    m = Measurement(user_id=current_user.id, name=data.name, data=data.data)
    db.add(m)
    await db.flush()
    await db.refresh(m)
    return m


@router.get("/{measurement_id}", response_model=MeasurementResponse)
async def get_measurement(
    measurement_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get measurement by ID."""
    result = await db.execute(
        select(Measurement)
        .where(Measurement.id == measurement_id, Measurement.user_id == current_user.id)
    )
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Measurement not found")
    return m


@router.delete("/{measurement_id}")
async def delete_measurement(
    measurement_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete measurement profile."""
    result = await db.execute(
        select(Measurement)
        .where(Measurement.id == measurement_id, Measurement.user_id == current_user.id)
    )
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Measurement not found")
    await db.delete(m)
    await db.flush()
    return {"status": "deleted"}
