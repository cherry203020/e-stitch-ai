"""Order business logic - pricing, cancellation, status flow."""
import json
from datetime import datetime, timedelta
from typing import Optional, Tuple

ORDER_STATUS_FLOW = [
    "order_placed", "pending_tailor", "fabric_picked",
    "stitching_in_progress", "quality_check", "out_for_delivery",
    "delivered"
]

# Default cancellation rules: hours_before_pickup -> refund_percentage
DEFAULT_CANCELLATION_RULES = {
    "72": 100,   # Full refund if 72h+ before pickup
    "48": 75,    # 75% refund if 48h+ before
    "24": 50,    # 50% refund if 24h+ before
    "0": 0       # No refund if less than 24h
}


def calculate_order_price(
    base_price: float,
    is_urgent: bool,
    urgency_multiplier: float = 1.5
) -> Tuple[float, float]:
    """Calculate base price and urgency charge."""
    urgency_charge = 0.0
    if is_urgent:
        urgency_charge = base_price * (urgency_multiplier - 1.0)
    total = base_price + urgency_charge
    return round(base_price, 2), round(urgency_charge, 2)


def calculate_cancellation_refund(
    total_price: float,
    pickup_slot: Optional[datetime],
    rules: Optional[dict] = None
) -> Tuple[float, float]:
    """
    Calculate refund and penalty based on time before pickup.
    Returns (refund_amount, penalty).
    """
    rules = rules or DEFAULT_CANCELLATION_RULES
    now = datetime.utcnow()
    if not pickup_slot:
        # No pickup slot - full refund
        return total_price, 0.0
    
    hours_before = (pickup_slot - now).total_seconds() / 3600
    refund_pct = 0
    for threshold_str, pct in sorted(rules.items(), key=lambda x: int(x[0]), reverse=True):
        if hours_before >= int(threshold_str):
            refund_pct = pct
            break
    
    refund = total_price * (refund_pct / 100)
    penalty = total_price - refund
    return round(refund, 2), round(penalty, 2)


def can_cancel_order(status: str) -> bool:
    """Check if order can be cancelled based on current status."""
    non_cancellable = ["out_for_delivery", "delivered"]
    return status not in non_cancellable


def can_request_urgent(status: str) -> bool:
    """Check if urgent can be requested (only at order_placed)."""
    return status == "order_placed"


def generate_order_number() -> str:
    """Generate unique order number."""
    import random
    import string
    ts = datetime.utcnow().strftime("%Y%m%d%H%M")
    r = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"ES-{ts}-{r}"
