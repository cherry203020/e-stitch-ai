import { useState, useEffect } from 'react';
import client from '../../api/client';
import './Measurements.css';

interface Measurement {
  id: number;
  name?: string;
  data: string;
  created_at: string;
}

export default function Measurements() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [data, setData] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    client.get<Measurement[]>('/api/measurements').then((r) => {
      setMeasurements(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(load, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/api/measurements', { name: name || undefined, data });
      setName('');
      setData('');
      load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this measurement profile?')) return;
    await client.delete(`/api/measurements/${id}`);
    load();
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="page">
      <h1>My Measurements</h1>
      <p className="text-muted">Save body measurements for faster order placement.</p>

      <form onSubmit={save} className="measurement-form">
        <input
          type="text"
          placeholder="Profile name (e.g. Standard)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          placeholder='Measurements JSON e.g. {"shoulder":14,"bust":34,"waist":28,"length":14}'
          rows={4}
          value={data}
          onChange={(e) => setData(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary" disabled={saving}>Save</button>
      </form>

      <h2>Saved profiles</h2>
      <div className="measurement-list">
        {measurements.map((m) => (
          <div key={m.id} className="measurement-card">
            <div>
              <strong>{m.name || `Profile ${m.id}`}</strong>
              <pre>{m.data}</pre>
            </div>
            <button type="button" className="btn btn-outline" onClick={() => remove(m.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
