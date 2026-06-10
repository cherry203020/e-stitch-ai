import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import './Tailors.css';

interface Tailor {
  id: number;
  user_id: number;
  shop_name: string;
  shop_address?: string;
  gender?: string;
  latitude?: number;
  longitude?: number;
  base_stitching_price: number;
  urgency_multiplier: number;
  min_delivery_days: number;
  is_verified: boolean;
  trust_score: number;
  total_reviews: number;
  distance_km?: number;
  match_score?: number;
  match_reasons?: string[];
}

export default function Tailors() {
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [minRating, setMinRating] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [useMatch, setUseMatch] = useState(true);
  const [tailorGender, setTailorGender] = useState<string>('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => setLocation(null)
    );
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (!verifiedOnly) params.set('verified_only', 'false');
    if (minRating) params.set('min_rating', minRating);
    if (maxPrice) params.set('max_price', maxPrice);
    if (useMatch) params.set('use_match', 'true');
    if (tailorGender) params.set('gender', tailorGender);
    if (location) {
      params.set('latitude', String(location.latitude));
      params.set('longitude', String(location.longitude));
    }
    client.get<Tailor[]>(`/api/tailors?${params}`).then((r) => {
      setTailors(Array.isArray(r.data) ? r.data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [verifiedOnly, minRating, maxPrice, useMatch, tailorGender, location]);

  return (
    <div className="page">
      <h1>Find Tailors</h1>
      <p className="text-muted">Compare tailors by price, rating, distance. Transparent pricing.</p>
      <div className="filters-row">
        <label>
          <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
          Verified only
        </label>
        <label>
          <input type="checkbox" checked={useMatch} onChange={(e) => setUseMatch(e.target.checked)} />
          AI match (recommended)
        </label>
        <select value={tailorGender} onChange={(e) => setTailorGender(e.target.value)} title="Tailor gender">
          <option value="">Any tailor</option>
          <option value="male">Male tailor</option>
          <option value="female">Female tailor</option>
        </select>
        <input
          type="number"
          placeholder="Min rating (1-5)"
          min="1"
          max="5"
          step="0.5"
          value={minRating}
          onChange={(e) => setMinRating(e.target.value)}
        />
        <input
          type="number"
          placeholder="Max price (₹)"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="tailor-list">
          {tailors.map((t) => (
            <div key={t.id} className="tailor-card">
              {t.match_score != null && (
                <div className="tailor-match">
                  <span className="match-score">{t.match_score}% match</span>
                  {t.match_reasons?.length ? (
                    <span className="match-reasons">{t.match_reasons.join(' · ')}</span>
                  ) : null}
                </div>
              )}
              <div className="tailor-info">
                <h3>
                  {t.shop_name}
                  {t.is_verified && <span className="verified-badge">✓ Verified</span>}
                  {t.gender && <span className="tailor-gender-badge">{t.gender}</span>}
                </h3>
                {t.shop_address && <p className="addr">{t.shop_address}</p>}
                <div className="tailor-meta">
                  <span>Rating: {(Number(t.trust_score) || 0).toFixed(1)} ({t.total_reviews ?? 0} reviews)</span>
                  <span>Delivery: ~{t.min_delivery_days} days</span>
                  {t.distance_km != null && <span>{t.distance_km} km away</span>}
                </div>
              </div>
              <div className="tailor-pricing">
                <div className="price-main">₹{Number(t.base_stitching_price)}</div>
                <div className="price-note">base stitching</div>
                <div className="price-urgent">Urgent: +{(((Number(t.urgency_multiplier) || 1.5) - 1) * 100).toFixed(0)}%</div>
                <Link to={`/orders/new?tailor=${t.id}`} className="btn btn-primary">Select</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
