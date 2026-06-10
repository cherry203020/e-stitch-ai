import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import './Profile.css';

interface TailorProfile {
  id: number;
  user_id: number;
  shop_name: string;
  shop_address: string | null;
  description: string | null;
  gender: string;
  latitude: number | null;
  longitude: number | null;
  base_stitching_price: number;
  urgency_multiplier: number;
  min_delivery_days: number;
  is_verified: boolean;
  trust_score: number;
  total_reviews: number;
  max_concurrent_orders: number;
  created_at: string;
}

export default function TailorProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<TailorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [description, setDescription] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [baseStitchingPrice, setBaseStitchingPrice] = useState(500);
  const [urgencyMultiplier, setUrgencyMultiplier] = useState(1.5);
  const [minDeliveryDays, setMinDeliveryDays] = useState(7);

  useEffect(() => {
    client
      .get<TailorProfile>('/api/tailors/me')
      .then((r) => {
        const p = r.data;
        setProfile(p);
        setShopName(p.shop_name);
        setShopAddress(p.shop_address || '');
        setDescription(p.description || '');
        setGender((p.gender === 'female' ? 'female' : 'male') as 'male' | 'female');
        setBaseStitchingPrice(p.base_stitching_price);
        setUrgencyMultiplier(p.urgency_multiplier);
        setMinDeliveryDays(p.min_delivery_days);
      })
      .catch((err: { response?: { status: number; data?: { detail?: string } } }) => {
        if (err.response?.status === 404) {
          setProfile(null);
        } else {
          setError(err.response?.data?.detail || 'Failed to load profile');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      shop_name: shopName.trim(),
      shop_address: shopAddress.trim() || undefined,
      description: description.trim() || undefined,
      gender,
      base_stitching_price: baseStitchingPrice,
      urgency_multiplier: urgencyMultiplier,
      min_delivery_days: minDeliveryDays,
    };
    try {
      if (profile) {
        await client.patch(`/api/tailors/${profile.id}`, payload);
      } else {
        await client.post('/api/tailors', payload);
      }
      navigate('/tailor');
    } catch (x: unknown) {
      const msg = (x as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to save';
      setError(String(msg));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page"><p>Loading...</p></div>;

  return (
    <div className="page tailor-profile-page">
      <h1>{profile ? 'Edit your tailor profile' : 'Complete your tailor profile'}</h1>
      <p className="text-muted">
        {profile
          ? 'Update your shop details and gender so customers can find you.'
          : 'Set up your shop so customers can discover and book you. Choose your gender so customers can filter by preference.'}
      </p>

      <form onSubmit={handleSubmit} className="tailor-profile-form">
        <section>
          <h2>Shop details</h2>
          <label>
            Shop name <span className="required">*</span>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              required
              placeholder="e.g. Stitch & Style"
            />
          </label>
          <label>
            Shop address
            <input
              type="text"
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              placeholder="Full address for pickup/delivery"
            />
          </label>
          <label>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What you specialise in (optional)"
              rows={2}
            />
          </label>
        </section>

        <section>
          <h2>Your gender</h2>
          <p className="form-hint">Customers can filter by tailor gender preference.</p>
          <label>
            Gender <span className="required">*</span>
            <select value={gender} onChange={(e) => setGender(e.target.value as 'male' | 'female')} required>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>
        </section>

        <section>
          <h2>Pricing & delivery</h2>
          <label>
            Base stitching price (₹)
            <input
              type="number"
              min={0}
              step={50}
              value={baseStitchingPrice}
              onChange={(e) => setBaseStitchingPrice(parseFloat(e.target.value) || 0)}
            />
          </label>
          <label>
            Urgency multiplier (e.g. 1.5 = 50% extra for urgent)
            <input
              type="number"
              min={1}
              step={0.1}
              value={urgencyMultiplier}
              onChange={(e) => setUrgencyMultiplier(parseFloat(e.target.value) || 1.5)}
            />
          </label>
          <label>
            Min delivery days
            <input
              type="number"
              min={1}
              value={minDeliveryDays}
              onChange={(e) => setMinDeliveryDays(parseInt(e.target.value, 10) || 7)}
            />
          </label>
        </section>

        {error && <div className="auth-error">{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : profile ? 'Update profile' : 'Create profile'}
        </button>
      </form>
    </div>
  );
}
