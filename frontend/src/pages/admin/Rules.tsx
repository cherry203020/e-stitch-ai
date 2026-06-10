import { useState, useEffect } from 'react';
import client from '../../api/client';
import './Rules.css';

interface Rule {
  id: number;
  rule_key: string;
  rule_value: string;
  description?: string;
}

export default function AdminRules() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');

  const load = () => {
    client.get<Rule[]>('/api/platform-rules').then((r) => {
      setRules(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(load, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await client.post('/api/platform-rules', {
      rule_key: editKey,
      rule_value: editValue,
    });
    setEditKey('');
    setEditValue('');
    load();
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="page">
      <h1>Platform Rules</h1>
      <p className="text-muted">Manage pricing and cancellation rules.</p>

      <form onSubmit={save} className="rule-form">
        <input
          type="text"
          placeholder="Rule key (e.g. cancellation_rules)"
          value={editKey}
          onChange={(e) => setEditKey(e.target.value)}
          required
        />
        <textarea
          placeholder='Rule value (JSON or string)'
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          rows={2}
          required
        />
        <button type="submit" className="btn btn-primary">Save</button>
      </form>

      <h2>Current rules</h2>
      <div className="rule-list">
        {rules.map((r) => (
          <div key={r.id} className="rule-card">
            <strong>{r.rule_key}</strong>
            <pre>{r.rule_value}</pre>
            {r.description && <p>{r.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
