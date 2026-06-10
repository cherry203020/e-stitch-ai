import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import client from '../../api/client';

export default function ReviewForm() {
  const [search] = useSearchParams();
  const orderId = search.get('order');
  const navigate = useNavigate();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;
    setSubmitting(true);
    setError('');
    try {
      await client.post('/api/reviews', { order_id: parseInt(orderId, 10), rating, comment });
      navigate('/orders');
    } catch (x: unknown) {
      const msg = (x as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to submit review';
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  if (!orderId) {
    navigate('/orders');
    return null;
  }

  return (
    <div className="page">
      <h1>Rate Your Experience</h1>
      <p className="text-muted">Help other customers by leaving a review.</p>
      <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
        <label>
          Rating (1-5):
          <input
            type="number"
            min={1}
            max={5}
            step={0.5}
            value={rating}
            onChange={(e) => setRating(parseFloat(e.target.value) || 5)}
            required
          />
        </label>
        <label>
          Comment (optional):
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
          />
        </label>
        {error && <div className="auth-error">{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={submitting}>Submit Review</button>
      </form>
    </div>
  );
}
