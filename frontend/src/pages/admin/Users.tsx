import { useState, useEffect } from 'react';
import client from '../../api/client';
import '../customer/Orders.css';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  phone?: string;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () => {
    client.get<User[]>('/api/auth/users').then((r) => {
      setUsers(Array.isArray(r.data) ? r.data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(load, []);

  const deleteUser = async (userId: number) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    setDeleting(userId);
    try {
      await client.delete(`/api/auth/users/${userId}`);
      load();
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="page">
      <h1>Manage Users</h1>
      <p className="text-muted">View and delete users. You cannot delete your own account.</p>
      <div className="order-list">
        {users.map((u) => (
          <div key={u.id} className="order-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>{u.full_name}</strong> ({u.email})
              <span className="badge" style={{ marginLeft: '0.5rem' }}>{u.role}</span>
              {u.phone && <span style={{ marginLeft: '0.5rem', color: 'var(--color-text-muted)' }}>{u.phone}</span>}
              <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Joined {new Date(u.created_at).toLocaleDateString()}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => deleteUser(u.id)}
              disabled={deleting === u.id}
              style={{ color: 'var(--color-error, #dc2626)' }}
            >
              {deleting === u.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
