"""Tailor Discovery & Management API."""
from typing import Optional, List
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from geopy.distance import geodesic

from ..database import get_db
from ..models import User, Tailor
from ..schemas.tailor import TailorCreate, TailorResponse, TailorUpdate, TailorListResponse
from ..core.dependencies import get_current_user, require_tailor, require_admin, require_tailor_or_admin

router = APIRouter(prefix="/tailors", tags=["tailors"])


def _distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    if None in (lat1, lon1, lat2, lon2):
        return 0.0
    return round(geodesic((lat1, lon1), (lat2, lon2)).km, 2)


def _compute_match_score(
    tailors: list,
    latitude: Optional[float],
    longitude: Optional[float],
    max_price: Optional[float],
) -> None:
    """AI-style weighted scoring: price (lower better), trust (higher), distance (closer), delivery (faster)."""
    if not tailors:
        return
    prices = [t.base_stitching_price for t in tailors]
    min_p, max_p = min(prices), max(prices)
    price_range = max_p - min_p if max_p > min_p else 1.0
    trust_max = 5.0
    distances = [t.distance_km for t in tailors if t.distance_km is not None]
    max_dist = max(distances) if distances else 50.0
    delivery_days = [t.min_delivery_days for t in tailors]
    max_del = max(delivery_days) - min(delivery_days) or 1
    # Weights: price 35%, trust 35%, distance 20%, delivery 10%
    w_p, w_t, w_d, w_del = 0.35, 0.35, 0.20, 0.10
    for t in tailors:
        reasons = []
        score_p = 1.0 - (t.base_stitching_price - min_p) / price_range if price_range else 1.0
        if max_price and t.base_stitching_price <= max_price:
            reasons.append("Within budget")
        if score_p >= 0.9 and price_range:
            reasons.append("Best price")
        score_t = t.trust_score / trust_max
        if score_t >= 0.8:
            reasons.append("Top rated")
        if t.total_reviews >= 5:
            reasons.append("Well reviewed")
        dist = t.distance_km if t.distance_km is not None else max_dist
        score_dist = max(0, 1.0 - dist / max_dist) if max_dist else 0.5
        if dist is not None and dist <= 5:
            reasons.append("Nearest")
        score_del = 1.0 - (t.min_delivery_days - min(delivery_days)) / max_del if max_del else 1.0
        if score_del >= 0.9:
            reasons.append("Fast delivery")
        raw = w_p * score_p + w_t * score_t + w_d * score_dist + w_del * score_del
        t.match_score = round(min(100, max(0, raw * 100)), 1)
        t.match_reasons = reasons[:3] if reasons else ["Good match"]


@router.get("", response_model=List[TailorListResponse])
async def list_tailors(
    verified_only: bool = Query(True),
    min_rating: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    gender: Optional[str] = Query(None, description="Filter by tailor gender: male or female"),
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
    use_match: bool = Query(False, description="Enable AI match scoring"),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user)
):
    """Discover tailors with filters (price, rating, distance, gender). Use use_match=1 for AI-based ranking."""
    q = select(Tailor).where(Tailor.base_stitching_price >= 0)
    if verified_only:
        q = q.where(Tailor.is_verified == 1)
    if min_rating is not None:
        q = q.where(Tailor.trust_score >= min_rating)
    if max_price is not None:
        q = q.where(Tailor.base_stitching_price <= max_price)
    if gender:
        q = q.where(Tailor.gender == gender.lower())
    q = q.order_by(Tailor.trust_score.desc(), Tailor.base_stitching_price.asc())
    result = await db.execute(q)
    tailors = list(result.scalars().all())
    
    out = []
    for t in tailors:
        d = TailorListResponse(
            id=t.id, user_id=t.user_id, shop_name=t.shop_name, shop_address=t.shop_address,
            gender=getattr(t, "gender", None),
            latitude=t.latitude, longitude=t.longitude,
            base_stitching_price=t.base_stitching_price, urgency_multiplier=t.urgency_multiplier,
            min_delivery_days=t.min_delivery_days, is_verified=bool(t.is_verified),
            trust_score=t.trust_score, total_reviews=t.total_reviews
        )
        if latitude is not None and longitude is not None and t.latitude is not None and t.longitude is not None:
            d.distance_km = _distance_km(float(latitude), float(longitude), float(t.latitude), float(t.longitude))
        out.append(d)
    
    if use_match:
        _compute_match_score(out, latitude, longitude, max_price)
        out.sort(key=lambda x: (-(x.match_score or 0), x.distance_km or 999, -x.trust_score))
    elif latitude is not None and longitude is not None:
        out.sort(key=lambda x: (x.distance_km or 999, -x.trust_score))
    
    return out


@router.get("/me", response_model=TailorResponse)
async def get_my_tailor_profile(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get current user's tailor profile (tailors only)."""
    r = await db.execute(select(Tailor).where(Tailor.user_id == current_user.id))
    t = r.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="No tailor profile")
    return t


@router.get("/{tailor_id}", response_model=TailorResponse)
async def get_tailor(
    tailor_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user)
):
    """Get tailor details with transparent pricing."""
    result = await db.execute(select(Tailor).where(Tailor.id == tailor_id))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Tailor not found")
    return t


@router.post("", response_model=TailorResponse)
async def register_as_tailor(
    data: TailorCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Register as tailor (creates tailor profile, pending admin verification)."""
    from sqlalchemy import select
    r = await db.execute(select(Tailor).where(Tailor.user_id == current_user.id))
    if r.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already has tailor profile")
    if current_user.role != "tailor":
        current_user.role = "tailor"
    
    tailor = Tailor(
        user_id=current_user.id,
        **data.model_dump()
    )
    db.add(tailor)
    await db.flush()
    await db.refresh(tailor)
    return tailor


@router.patch("/{tailor_id}", response_model=TailorResponse)
async def update_tailor(
    tailor_id: int,
    data: TailorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_tailor_or_admin)
):
    """Update tailor profile (own profile or admin)."""
    result = await db.execute(select(Tailor).where(Tailor.id == tailor_id))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Tailor not found")
    if current_user.role == "tailor" and t.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only update own profile")
    
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(t, k, v)
    await db.flush()
    await db.refresh(t)
    return t


class VerifyBody(BaseModel):
    verified: bool

@router.post("/{tailor_id}/verify")
async def verify_tailor(
    tailor_id: int,
    body: VerifyBody,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin)
):
    """Verify tailor (admin only)."""
    result = await db.execute(select(Tailor).where(Tailor.id == tailor_id))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Tailor not found")
    t.is_verified = 1 if body.verified else 0
    await db.flush()
    return {"status": "verified" if body.verified else "unverified"}


@router.delete("/{tailor_id}", status_code=204)
async def delete_tailor(
    tailor_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_admin)
):
    """Delete tailor profile (admin only)."""
    result = await db.execute(select(Tailor).where(Tailor.id == tailor_id))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Tailor not found")
    await db.delete(t)
    await db.flush()
