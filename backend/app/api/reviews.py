"""Ratings & Feedback API."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ..database import get_db
from ..models import User, Order, Review, Tailor
from ..schemas.review import ReviewCreate, ReviewResponse
from ..core.dependencies import get_current_user, require_customer

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("", response_model=ReviewResponse)
async def create_review(
    data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_customer)
):
    """Rate and review tailor after delivery (post-delivery only)."""
    if not (1 <= data.rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be 1-5")
    
    result = await db.execute(
        select(Order)
        .where(Order.id == data.order_id, Order.customer_id == current_user.id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != "delivered":
        raise HTTPException(status_code=400, detail="Can only review after delivery")
    
    # Check if already reviewed
    r = await db.execute(select(Review).where(Review.order_id == data.order_id))
    if r.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already reviewed this order")
    
    review = Review(
        order_id=data.order_id,
        tailor_id=order.tailor_id,
        customer_id=current_user.id,
        rating=data.rating,
        comment=data.comment
    )
    db.add(review)
    await db.flush()
    
    # Update tailor trust score
    agg = await db.execute(
        select(func.avg(Review.rating), func.count(Review.id))
        .where(Review.tailor_id == order.tailor_id)
    )
    avg_rating, total = agg.one()
    result = await db.execute(select(Tailor).where(Tailor.id == order.tailor_id))
    tailor = result.scalar_one_or_none()
    if tailor:
        tailor.trust_score = round(avg_rating or 0, 2)
        tailor.total_reviews = total or 0
    
    await db.flush()
    await db.refresh(review)
    return review


@router.get("/tailor/{tailor_id}", response_model=List[ReviewResponse])
async def list_tailor_reviews(
    tailor_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user)
):
    """List reviews for a tailor."""
    result = await db.execute(
        select(Review).where(Review.tailor_id == tailor_id)
        .order_by(Review.created_at.desc())
    )
    return list(result.scalars().all())
