import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import './Orders.css';

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

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const q = statusFilter ? `?status_filter=${statusFilter}` : '';
    client.get<Order[]>(`/api/orders${q}`).then((r) => {
      setOrders(Array.isArray(r.data) ? r.data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div className="page">
      <h1>My Orders</h1>
      <p className="text-muted">Track order status in real time.</p>
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
            <Link to={`/orders/${o.id}`} key={o.id} className="order-card">
              <span className="order-num">{o.order_number}</span>
              <span className="status-badge" data-status={o.status}>
                {STATUS_LABELS[o.status] || o.status}
              </span>
              <span>₹{o.total_price.toFixed(2)}</span>
              <span>{new Date(o.created_at).toLocaleDateString()}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
