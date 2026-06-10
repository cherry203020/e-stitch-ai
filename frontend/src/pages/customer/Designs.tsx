import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import './Designs.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface Design {
  id: number;
  name: string;
  description?: string;
  neck_type?: string;
  sleeve_type?: string;
  back_type?: string;
  category: string;
  price?: number;
  image_url?: string;
}

export default function Designs() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [category, setCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);

  useEffect(() => {
    const q = category ? `?category=${category}` : '';
    client.get<Design[]>(`/api/designs${q}`).then((r) => {
      setDesigns(Array.isArray(r.data) ? r.data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [category]);

  const categories = [
    { value: '', label: 'All' },
    { value: 'simple', label: 'Simple' },
    { value: 'bridal', label: 'Bridal' },
    { value: 'heavy_work', label: 'Heavy Work' },
  ];

  return (
    <div className="page">
      <h1>Blouse Design Catalog</h1>
      <p className="text-muted">Browse predefined blouse designs by category.</p>
      <div className="filters">
        <label>Category:</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {selectedDesign && (
            <div className="design-selected-bar">
              <span>Selected: <strong>{selectedDesign.name}</strong></span>
              <Link
                to={`/orders/new?design=${selectedDesign.id}`}
                className="btn btn-primary"
              >
                Add measurements & place order
              </Link>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setSelectedDesign(null)}
              >
                Clear
              </button>
            </div>
          )}
          {designs.length === 0 ? (
            <div className="design-catalog-empty">
              <p><strong>No designs in the catalog.</strong></p>
              <p className="text-muted">Restore them by running the seed script from the backend folder: <code>python seed_data.py</code></p>
            </div>
          ) : (
          <div className="design-grid">
            {designs.map((d) => (
              <div
                key={d.id}
                className={`design-card${selectedDesign?.id === d.id ? ' selected' : ''}`}
                onClick={() => setSelectedDesign(selectedDesign?.id === d.id ? null : d)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedDesign(selectedDesign?.id === d.id ? null : d);
                  }
                }}
                aria-pressed={selectedDesign?.id === d.id}
              >
              {d.image_url ? (
                <img
                  src={d.image_url.startsWith('http') ? d.image_url : `${API_BASE}${d.image_url}`}
                  alt={d.name}
                    className="design-img"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      const placeholder = (e.target as HTMLImageElement).nextElementSibling;
                      if (placeholder) (placeholder as HTMLElement).style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="design-placeholder"
                  style={{ display: d.image_url ? 'none' : 'flex' }}
                >
                  No image
                </div>
                <div className="design-body">
                  <h3>{d.name}</h3>
                  <div className="design-meta">
                    {d.neck_type && <span>{d.neck_type}</span>}
                    {d.sleeve_type && <span>{d.sleeve_type}</span>}
                    {d.back_type && <span>{d.back_type}</span>}
                  </div>
                  <span className="badge">{d.category}</span>
                  <p className="design-price">₹{(d.price ?? 1000).toLocaleString()}</p>
                  {d.description && <p>{d.description}</p>}
                  <p className="design-card-hint">Click to select, then order</p>
                </div>
              </div>
            ))}
          </div>
          )}
        </>
      )}
    </div>
  );
}
