import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import '../customer/Orders.css';

interface Order {
  id: number;
  order_number: string;
  status: string;
  total_price: number;
  created_at: string;
}

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

const NEXT_STATUS: Record<string, string> = {
  order_placed: 'fabric_picked',
  pending_tailor: 'fabric_picked',
  fabric_picked: 'stitching_in_progress',
  stitching_in_progress: 'quality_check',
  quality_check: 'out_for_delivery',
  out_for_delivery: 'delivered',
};

export default function TailorOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const load = () => {
    client.get<Order[]>('/api/orders').then((r) => {
      setOrders(Array.isArray(r.data) ? r.data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(load, []);

  const accept = async (id: number) => {
    setUpdating(id);
    try {
      await client.post(`/api/orders/${id}/accept`);
      load();
    } finally {
      setUpdating(null);
    }
  };

  const reject = async (id: number) => {
    if (!confirm('Reject this order?')) return;
    setUpdating(id);
    try {
      await client.post(`/api/orders/${id}/reject`);
      load();
    } finally {
      setUpdating(null);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    setUpdating(id);
    try {
      await client.patch(`/api/orders/${id}/status`, { status });
      load();
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <p>Loading...</p>;

  const pending = orders.filter((o) => o.status === 'order_placed');

  return (
    <div className="page">
      <h1>My Orders</h1>
      <p className="text-muted">Accept, reject, and update order status.</p>

      {pending.length > 0 && (
        <section>
          <h2>Pending acceptance</h2>
          <div className="order-list">
            {pending.map((o) => (
              <div key={o.id} className="order-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link to={`/orders/${o.id}`} style={{ flex: 1 }}>{o.order_number}</Link>
                <span className="status-badge">{STATUS_LABELS[o.status]}</span>
                <span>₹{o.total_price.toFixed(2)}</span>
                <button
                  className="btn btn-primary"
                  onClick={() => accept(o.id)}
                  disabled={updating === o.id}
                >
                  Accept
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => reject(o.id)}
                  disabled={updating === o.id}
                >
                  Reject
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <h2>All orders</h2>
      <div className="order-list">
        {orders.filter((o) => o.status !== 'order_placed').map((o) => (
          <div key={o.id} className="order-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to={`/orders/${o.id}`} style={{ flex: 1 }}>{o.order_number}</Link>
            <span className="status-badge" data-status={o.status}>{STATUS_LABELS[o.status]}</span>
            <span>₹{o.total_price.toFixed(2)}</span>
            {NEXT_STATUS[o.status] && (
              <button
                className="btn btn-primary"
                onClick={() => updateStatus(o.id, NEXT_STATUS[o.status])}
                disabled={updating === o.id}
              >
                → {STATUS_LABELS[NEXT_STATUS[o.status]]}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
