"""Order & Scheduling API."""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import User, Order, Tailor, Design
from ..schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate, ORDER_STATUSES
from ..core.dependencies import get_current_user, require_customer, require_tailor_or_admin, require_admin
from ..services.order_service import (
    calculate_order_price, calculate_cancellation_refund,
    can_cancel_order, generate_order_number
)

router = APIRouter(prefix="/orders", tags=["orders"])


async def _get_order_with_relations(db: AsyncSession, order_id: int) -> Optional[Order]:
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.tailor), selectinload(Order.design), selectinload(Order.customer))
        .where(Order.id == order_id)
    )
    return result.scalar_one_or_none()


@router.post("", response_model=OrderResponse)
async def create_order(
    data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_customer)
):
    """Place new stitching order."""
    result = await db.execute(select(Tailor).where(Tailor.id == data.tailor_id))
    tailor = result.scalar_one_or_none()
    if not tailor:
        raise HTTPException(status_code=404, detail="Tailor not found")
    if not tailor.is_verified:
        raise HTTPException(status_code=400, detail="Tailor not verified")
    
    base_price = tailor.base_stitching_price
    base_p, urgency_p = calculate_order_price(
        base_price, data.is_urgent, tailor.urgency_multiplier
    )
    
    order = Order(
        order_number=generate_order_number(),
        customer_id=current_user.id,
        tailor_id=data.tailor_id,
        design_id=data.design_id,
        custom_design_image_url=data.custom_design_image_url,
        measurement_data=data.measurement_data,
        measurement_profile_id=data.measurement_profile_id,
        fabric_pickup_slot=data.fabric_pickup_slot,
        delivery_slot=data.delivery_slot,
        is_urgent=1 if data.is_urgent else 0,
        urgent_delivery_days=data.urgent_delivery_days,
        base_price=base_p,
        urgency_charge=urgency_p,
        total_price=base_p + urgency_p,
        payment_mode=data.payment_mode,
        status="order_placed"
    )
    db.add(order)
    await db.flush()
    await db.refresh(order)
    return order


@router.get("", response_model=List[OrderResponse])
async def list_orders(
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List orders - customer sees own, tailor sees assigned, admin sees all."""
    q = select(Order)
    if current_user.role == "customer":
        q = q.where(Order.customer_id == current_user.id)
    elif current_user.role == "tailor":
        r = await db.execute(select(Tailor).where(Tailor.user_id == current_user.id))
        t = r.scalar_one_or_none()
        if t:
            q = q.where(Order.tailor_id == t.id)
        else:
            q = q.where(Order.id == -1)  # no orders
    # admin sees all
    if status_filter:
        q = q.where(Order.status == status_filter)
    q = q.order_by(Order.created_at.desc())
    result = await db.execute(q)
    return list(result.scalars().all())


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get order details (with access control)."""
    order = await _get_order_with_relations(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if current_user.role == "customer" and order.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == "tailor":
        r = await db.execute(select(Tailor).where(Tailor.user_id == current_user.id))
        t = r.scalar_one_or_none()
        if not t or order.tailor_id != t.id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    return order


@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_tailor_or_admin)
):
    """Update order status (tailor or admin)."""
    if data.status not in ORDER_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    order = await _get_order_with_relations(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if current_user.role == "tailor":
        r = await db.execute(select(Tailor).where(Tailor.user_id == current_user.id))
        t = r.scalar_one_or_none()
        if not t or order.tailor_id != t.id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Acceptance flow: pending_tailor -> fabric_picked (or reject)
    if order.status == "order_placed" and data.status in ("fabric_picked", "cancelled"):
        order.status = "pending_tailor"  # tailor accepts by moving to fabric_picked
    order.status = data.status
    await db.flush()
    await db.refresh(order)
    return order


@router.post("/{order_id}/accept")
async def tailor_accept_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_tailor_or_admin)
):
    """Tailor accepts order - moves to pending_tailor -> fabric_picked."""
    order = await _get_order_with_relations(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    r = await db.execute(select(Tailor).where(Tailor.user_id == current_user.id))
    t = r.scalar_one_or_none()
    if not t or order.tailor_id != t.id:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Access denied")
    
    if order.status != "order_placed":
        raise HTTPException(status_code=400, detail="Order already processed")
    
    order.status = "pending_tailor"
    await db.flush()
    return {"status": "accepted", "order_id": order_id}


@router.post("/{order_id}/reject")
async def tailor_reject_order(
    order_id: int,
    reason: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_tailor_or_admin)
):
    """Tailor rejects order."""
    order = await _get_order_with_relations(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    r = await db.execute(select(Tailor).where(Tailor.user_id == current_user.id))
    t = r.scalar_one_or_none()
    if not t or order.tailor_id != t.id:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Access denied")
    
    if order.status != "order_placed":
        raise HTTPException(status_code=400, detail="Order already processed")
    
    from datetime import datetime
    refund, penalty = calculate_cancellation_refund(order.total_price, order.fabric_pickup_slot)
    order.status = "cancelled"
    order.cancelled_at = datetime.utcnow()
    order.cancellation_reason = reason or "Tailor rejected"
    order.refund_amount = refund
    order.cancellation_penalty = penalty
    await db.flush()
    return {"status": "rejected", "refund_amount": refund}


@router.post("/{order_id}/cancel")
async def cancel_order(
    order_id: int,
    reason: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel order (customer or admin). Time-based refund rules apply."""
    order = await _get_order_with_relations(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if current_user.role == "customer" and order.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not can_cancel_order(order.status):
        raise HTTPException(status_code=400, detail="Order cannot be cancelled at this stage")
    
    from datetime import datetime
    refund, penalty = calculate_cancellation_refund(order.total_price, order.fabric_pickup_slot)
    
    order.status = "cancelled"
    order.cancelled_at = datetime.utcnow()
    order.cancellation_reason = reason
    order.refund_amount = refund
    order.cancellation_penalty = penalty
    await db.flush()
    return {"status": "cancelled", "refund_amount": refund, "penalty": penalty}


@router.delete("/{order_id}", status_code=204)
async def delete_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete order (admin only)."""
    order = await _get_order_with_relations(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    await db.delete(order)
    await db.flush()
