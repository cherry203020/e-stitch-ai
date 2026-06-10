import { useState, useEffect } from 'react';
import client from '../../api/client';
import MannequinViewer from '../../components/MannequinViewer';
import './MannequinPreview.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface AIDesignItem {
  id: number;
  prompt: string;
  image_url: string;
  created_at: string;
}

interface CatalogDesign {
  id: number;
  name: string;
  image_url?: string;
  category: string;
}

export default function MannequinPreview() {
  const [source, setSource] = useState<'ai' | 'catalog'>('ai');
  const [aiList, setAiList] = useState<AIDesignItem[]>([]);
  const [catalogList, setCatalogList] = useState<CatalogDesign[]>([]);
  const [selectedAiId, setSelectedAiId] = useState<number | null>(null);
  const [selectedCatalogId, setSelectedCatalogId] = useState<number | null>(null);

  useEffect(() => {
    client.get<AIDesignItem[]>('/api/ai-designs').then((r) => setAiList(r.data)).catch(() => setAiList([]));
    client.get<CatalogDesign[]>('/api/designs').then((r) => setCatalogList(r.data)).catch(() => setCatalogList([]));
  }, []);

  const selectedImageUrl = (() => {
    if (source === 'ai' && selectedAiId) {
      const item = aiList.find((x) => x.id === selectedAiId);
      return item ? `${API_BASE || ''}${item.image_url}` : null;
    }
    if (source === 'catalog' && selectedCatalogId) {
      const item = catalogList.find((x) => x.id === selectedCatalogId);
      return item?.image_url ? `${API_BASE || ''}${item.image_url}` : null;
    }
    return null;
  })();

  return (
    <div className="page mannequin-preview-page">
      <h1>3D Mannequin Preview</h1>
      <p className="text-muted">
        View a selected or AI-generated design on a basic 3D mannequin. Rotate and zoom for a better look. Assistive only.
      </p>

      <div className="mannequin-preview-source">
        <label>
          <input
            type="radio"
            name="source"
            checked={source === 'ai'}
            onChange={() => setSource('ai')}
          />
          AI-generated designs
        </label>
        <label>
          <input
            type="radio"
            name="source"
            checked={source === 'catalog'}
            onChange={() => setSource('catalog')}
          />
          Catalog designs
        </label>
      </div>

      <div className="mannequin-preview-layout">
        <div className="mannequin-preview-view">
          <MannequinViewer imageUrl={selectedImageUrl} />
        </div>
        <div className="mannequin-preview-picker">
          <h3>Choose design</h3>
          {source === 'ai' && (
            aiList.length === 0 ? (
              <p className="text-muted">No AI designs yet. Create some in AI Design.</p>
            ) : (
              <div className="mannequin-picker-grid">
                {aiList.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`mannequin-picker-card ${selectedAiId === item.id ? 'selected' : ''}`}
                    onClick={() => setSelectedAiId(item.id)}
                  >
                    <img src={`${API_BASE || ''}${item.image_url}`} alt="" />
                    <span>{item.prompt.slice(0, 40)}…</span>
                  </button>
                ))}
              </div>
            )
          )}
          {source === 'catalog' && (
            catalogList.length === 0 ? (
              <p className="text-muted">No catalog designs.</p>
            ) : (
              <div className="mannequin-picker-grid">
                {catalogList.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className={`mannequin-picker-card ${selectedCatalogId === d.id ? 'selected' : ''}`}
                    onClick={() => setSelectedCatalogId(d.id)}
                    disabled={!d.image_url}
                  >
                    {d.image_url ? (
                      <img src={`${API_BASE || ''}${d.image_url}`} alt={d.name} />
                    ) : (
                      <div className="mannequin-picker-placeholder">No image</div>
                    )}
                    <span>{d.name}</span>
                  </button>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
