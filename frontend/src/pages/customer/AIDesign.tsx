import { useState, useEffect } from 'react';
import client from '../../api/client';
import './AIDesign.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

declare global {
  interface Window {
    puter?: {
      ai?: {
        txt2img: (prompt: string, options?: { test_mode?: boolean; model?: string; quality?: string }) => Promise<HTMLImageElement>;
      };
    };
  }
}

interface AIDesignGeneration {
  id: number;
  prompt: string;
  image_url: string;
  created_at: string;
}

interface AIStatus {
  huggingface_configured: boolean;
  local_ai_available: boolean;
  sources: string[];
  message: string;
}

const SKETCH_SUFFIX = ', fashion sketch, clothing design concept, blouse design';

type ServerSource = 'auto' | 'huggingface' | 'local';

export default function AIDesign() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [useServerOnly, setUseServerOnly] = useState(false);
  const [serverSource, setServerSource] = useState<ServerSource>('auto');
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<AIDesignGeneration[]>([]);
  const [selected, setSelected] = useState<AIDesignGeneration | null>(null);

  const loadHistory = () => {
    client.get<AIDesignGeneration[]>('/api/ai-designs').then((r) => {
      setHistory(r.data);
      if (r.data.length && !selected) setSelected(r.data[0]);
    }).catch(() => setHistory([]));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    client.get<AIStatus>('/api/ai-designs/status').then((r) => setStatus(r.data)).catch(() => setStatus(null));
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = prompt.trim();
    if (!text) return;
    setError('');
    setGenerating(true);
    try {
      // Use server (Hugging Face / local AI) when requested or when Puter not available
      const puter = window.puter;
      const useServer = useServerOnly || !puter?.ai?.txt2img;
      if (!useServer && puter?.ai?.txt2img) {
        const fullPrompt = text + SKETCH_SUFFIX;
        const img = await puter.ai.txt2img(fullPrompt, {
          model: 'gpt-image-1-mini',
          quality: 'low',
        });
        const dataUrl = img?.src;
        if (dataUrl && dataUrl.startsWith('data:image/')) {
          const res = await client.post<AIDesignGeneration>('/api/ai-designs/from-image', {
            prompt: text,
            image_data_url: dataUrl,
          });
          setHistory((prev) => [res.data, ...prev]);
          setSelected(res.data);
          return;
        }
      }
      // Backend: Hugging Face or local model (toggle via serverSource)
      const res = await client.post<AIDesignGeneration>('/api/ai-designs', {
        prompt: text,
        negative_prompt: negativePrompt.trim() || undefined,
        source: useServerOnly ? serverSource : 'auto',
      });
      setHistory((prev) => [res.data, ...prev]);
      setSelected(res.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof msg === 'string' ? msg : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!selected) return;
    try {
      const res = await client.get(`/api/ai-designs/${selected.id}/download`, { responseType: 'blob' });
      const blob = res.data as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `e-stitch-design-${selected.id}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Download failed');
    }
  };

  const imgSrc = selected ? `${API_BASE || ''}${selected.image_url}` : null;

  return (
    <div className="page ai-design-page">
      <h1>AI Design Sketch</h1>
      <p className="text-muted">
        Generate a conceptual clothing design from your description. Uses Puter.js when available, or server-side Hugging Face / local AI when enabled.
      </p>

      <form className="ai-design-form" onSubmit={handleGenerate}>
        <label htmlFor="ai-prompt">Describe the design</label>
        <textarea
          id="ai-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Simple round neck blouse with short sleeves and lace border"
          rows={3}
          disabled={generating}
        />
        <label htmlFor="ai-negative" className="ai-design-optional">
          Avoid in image (optional, for server AI)
        </label>
        <input
          id="ai-negative"
          type="text"
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          placeholder="e.g. blurry, low quality, distorted"
          disabled={generating}
        />
        <label className="ai-design-checkbox">
          <input
            type="checkbox"
            checked={useServerOnly}
            onChange={(e) => setUseServerOnly(e.target.checked)}
            disabled={generating}
          />
          Use server AI only (skip Puter.js)
        </label>
        {useServerOnly && (
          <label className="ai-design-source-label">
            Server model:
            <select
              value={serverSource}
              onChange={(e) => setServerSource(e.target.value as ServerSource)}
              disabled={generating}
              className="ai-design-source-select"
            >
              <option value="auto">Auto (local then Hugging Face)</option>
              <option value="huggingface" disabled={status && !status.huggingface_configured}>
                Hugging Face API {status && !status.huggingface_configured ? '(not configured)' : ''}
              </option>
              <option value="local" disabled={status && !status.local_ai_available}>
                Local model {status && !status.local_ai_available ? '(run scripts/download_ai_model.py)' : ''}
              </option>
            </select>
          </label>
        )}
        {error && <div className="ai-design-error">{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={generating}>
          {generating ? 'Generating…' : 'Generate design'}
        </button>
      </form>

      <section className="ai-design-result">
        <h2>Preview &amp; download</h2>
        {imgSrc ? (
          <>
            <div className="ai-design-preview-wrap">
              <img src={imgSrc} alt={selected?.prompt || 'Design sketch'} className="ai-design-preview" />
            </div>
            <p className="ai-design-prompt-display">{selected?.prompt}</p>
            <button type="button" className="btn btn-outline" onClick={handleDownload}>
              Download sketch
            </button>
          </>
        ) : (
          <p className="text-muted">Generate a design above or pick one from history to preview and download.</p>
        )}
      </section>

      <section className="ai-design-history">
        <h2>Prompt history</h2>
        <p className="text-muted">Revisit and download previously generated ideas.</p>
        {history.length === 0 ? (
          <p className="text-muted">No generations yet.</p>
        ) : (
          <div className="ai-design-history-grid">
            {history.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`ai-design-history-card ${selected?.id === item.id ? 'selected' : ''}`}
                onClick={() => setSelected(item)}
              >
                <img src={`${API_BASE || ''}${item.image_url}`} alt="" className="ai-design-history-thumb" />
                <span className="ai-design-history-prompt">{item.prompt}</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
