import { useState, useEffect } from 'react';
import client from '../../api/client';
import '../customer/Designs.css';

interface Design {
  id: number;
  name: string;
  category: string;
  price?: number;
  description?: string;
  image_url?: string;
}

export default function AdminDesigns() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = () => {
    client.get<Design[]>('/api/designs').then((r) => {
      setDesigns(Array.isArray(r.data) ? r.data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(load, []);

  const deleteDesign = async (designId: number) => {
    if (!confirm('Delete this design? This cannot be undone.')) return;
    setDeleting(designId);
    try {
      await client.delete(`/api/designs/${designId}`);
      load();
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="page">
      <h1>Manage Catalog Designs</h1>
      <p className="text-muted">View and delete catalog designs. Prices are minimum ₹1000.</p>
      <div className="design-grid">
        {designs.map((d) => (
          <div key={d.id} className="design-card" style={{ position: 'relative' }}>
            {d.image_url && (
              <img src={d.image_url} alt={d.name} className="design-img" loading="lazy" />
            )}
            <div className="design-body">
              <h3>{d.name}</h3>
              <span className="badge">{d.category}</span>
              <p className="design-price">₹{(d.price ?? 1000).toLocaleString()}</p>
              {d.description && <p>{d.description}</p>}
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => deleteDesign(d.id)}
                disabled={deleting === d.id}
                style={{ marginTop: '0.5rem', color: 'var(--color-error, #dc2626)' }}
              >
                {deleting === d.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
