import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import '../customer/Orders.css';

interface Order {
  id: number;
  order_number: string;
  status: string;
  total_price: number;
  customer_id: number;
  tailor_id: number;
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

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () => {
    const q = statusFilter ? `?status_filter=${statusFilter}` : '';
    client.get<Order[]>(`/api/orders${q}`).then((r) => {
      setOrders(Array.isArray(r.data) ? r.data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(load, [statusFilter]);

  const deleteOrder = async (orderId: number) => {
    if (!confirm('Delete this order? This cannot be undone.')) return;
    setDeleting(orderId);
    try {
      await client.delete(`/api/orders/${orderId}`);
      load();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="page">
      <h1>All Orders</h1>
      <p className="text-muted">Monitor platform orders.</p>
      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
        <option value="">All statuses</option>
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="order-list">
          {orders.map((o) => (
            <div key={o.id} className="order-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to={`/orders/${o.id}`} style={{ flex: 1, minWidth: 0 }}>
                <span className="order-num">{o.order_number}</span>
                <span className="status-badge" data-status={o.status}>{STATUS_LABELS[o.status] || o.status}</span>
                <span>₹{o.total_price.toFixed(2)}</span>
                <span>C#{o.customer_id} T#{o.tailor_id}</span>
                <span>{new Date(o.created_at).toLocaleDateString()}</span>
              </Link>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => deleteOrder(o.id)}
                disabled={deleting === o.id}
                style={{ color: 'var(--color-error, #dc2626)' }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
