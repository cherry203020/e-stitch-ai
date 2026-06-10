import { useState, useEffect } from 'react';
import client from '../../api/client';
import '../customer/Tailors.css';

interface Tailor {
  id: number;
  user_id: number;
  shop_name: string;
  is_verified: boolean;
  trust_score: number;
  total_reviews: number;
}

export default function AdminTailors() {
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const load = () => {
    client.get<Tailor[]>('/api/tailors?verified_only=false').then((r) => {
      setTailors(Array.isArray(r.data) ? r.data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const deleteTailor = async (tailorId: number) => {
    if (!confirm('Delete this tailor? This cannot be undone.')) return;
    setUpdating(tailorId);
    try {
      await client.delete(`/api/tailors/${tailorId}`);
      load();
    } finally {
      setUpdating(null);
    }
  };

  useEffect(load, []);

  const toggleVerify = async (tailorId: number, verified: boolean) => {
    setUpdating(tailorId);
    try {
      await client.post(`/api/tailors/${tailorId}/verify`, { verified });
      load();
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="page">
      <h1>Manage Tailors</h1>
      <p className="text-muted">Verify tailor registrations.</p>
      <div className="tailor-list">
        {tailors.map((t) => (
          <div key={t.id} className="tailor-card">
            <div className="tailor-info">
              <h3>
                {t.shop_name}
                {t.is_verified && <span className="verified-badge">✓ Verified</span>}
              </h3>
              <div className="tailor-meta">
                <span>Rating: {t.trust_score} ({t.total_reviews} reviews)</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                className="btn btn-primary"
                onClick={() => toggleVerify(t.id, !t.is_verified)}
                disabled={updating === t.id}
              >
                {t.is_verified ? 'Unverify' : 'Verify'}
              </button>
              <button
                className="btn btn-outline"
                onClick={() => deleteTailor(t.id)}
                disabled={updating === t.id}
                style={{ color: 'var(--color-error, #dc2626)' }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
