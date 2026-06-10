import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../../api/client';
import './Orders.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface Order {
  id: number;
  order_number: string;
  status: string;
  total_price: number;
  base_price: number;
  urgency_charge: number;
  payment_mode?: string;
  custom_design_image_url?: string;
  measurement_data?: string;
  fabric_pickup_slot?: string;
  delivery_slot?: string;
  is_urgent: boolean;
  refund_amount?: number;
  cancellation_penalty?: number;
  created_at: string;
}

const STATUS_FLOW = [
  'order_placed', 'pending_tailor', 'fabric_picked',
  'stitching_in_progress', 'quality_check', 'out_for_delivery', 'delivered'
];
const STATUS_LABELS: Record<string, string> = {
  order_placed: 'Order Placed',
  pending_tailor: 'Pending Tailor',
  fabric_picked: 'Fabric Picked',
  stitching_in_progress: 'Stitching in Progress',
  quality_check: 'Quality Check',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    client.get<Order>(`/api/orders/${id}`).then((r) => {
      setOrder(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (!id) return <p>Invalid order.</p>;

  const cancelOrder = async () => {
    if (!order || order.status === 'delivered' || order.status === 'cancelled') return;
    if (!confirm('Cancel this order?')) return;
    setCancelling(true);
    try {
      const { data } = await client.post(`/api/orders/${id}/cancel`);
      setOrder((o) => o ? { ...o, status: 'cancelled', refund_amount: data?.refund_amount, cancellation_penalty: data?.penalty ?? data?.cancellation_penalty } : null);
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = order && !['out_for_delivery', 'delivered', 'cancelled'].includes(order.status);

  if (loading || !order) return <p>Loading...</p>;

  const progressIdx = STATUS_FLOW.indexOf(order.status);

  return (
    <div className="page">
      <Link to="/orders">← Back to orders</Link>
      <h1>Order {order.order_number}</h1>

      <div className="order-track">
        {STATUS_FLOW.map((s, i) => (
          <div key={s} className={`track-step ${i <= progressIdx ? 'done' : ''}`}>
            <div className="track-dot" />
            <span>{STATUS_LABELS[s]}</span>
          </div>
        ))}
      </div>

      <div className="order-detail-card">
        <p><strong>Status:</strong> {STATUS_LABELS[order.status] || order.status}</p>
        <p><strong>Total:</strong> ₹{(order.total_price ?? 0).toFixed(2)} (Base: ₹{order.base_price ?? 0} + Urgency: ₹{order.urgency_charge ?? 0})</p>
        {order.payment_mode && <p><strong>Payment:</strong> {order.payment_mode}</p>}
        {order.custom_design_image_url && (
          <div className="order-detail-custom-design">
            <p><strong>Customer&apos;s design (stitch like this):</strong></p>
            <img src={`${API_BASE}${order.custom_design_image_url}`} alt="Reference design" className="order-detail-design-img" />
          </div>
        )}
        {order.fabric_pickup_slot && <p><strong>Pickup:</strong> {new Date(order.fabric_pickup_slot).toLocaleString()}</p>}
        {order.delivery_slot && <p><strong>Delivery:</strong> {new Date(order.delivery_slot).toLocaleString()}</p>}
        {order.measurement_data && <p><strong>Measurements:</strong> {order.measurement_data}</p>}
        {order.status === 'cancelled' && (
          <>
            {order.refund_amount != null && <p>Refund: ₹{order.refund_amount.toFixed(2)}</p>}
            {order.cancellation_penalty != null && <p>Penalty: ₹{order.cancellation_penalty.toFixed(2)}</p>}
          </>
        )}
        {order.status === 'delivered' && (
          <Link to={`/reviews/new?order=${order.id}`} className="btn btn-primary">Leave a review</Link>
        )}
        {canCancel && (
          <button className="btn btn-outline" onClick={cancelOrder} disabled={cancelling}>
            Cancel order
          </button>
        )}
      </div>
    </div>
  );
}
