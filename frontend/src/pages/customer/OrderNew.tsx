import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import './OrderNew.css';

interface Tailor {
  id: number;
  shop_name: string;
  gender?: string;
  is_verified?: boolean;
  base_stitching_price: number;
  urgency_multiplier: number;
  min_delivery_days: number;
  match_score?: number;
  match_reasons?: string[];
}

interface Design {
  id: number;
  name: string;
  category: string;
}

interface AIDesignItem {
  id: number;
  prompt: string;
  image_url: string;
  created_at: string;
}

interface Measurement {
  id: number;
  name?: string;
  data: string;
}

export default function OrderNew() {
  const [search] = useSearchParams();
  const tailorId = search.get('tailor') || '';
  const navigate = useNavigate();

  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [selectedTailor, setSelectedTailor] = useState<number | null>(tailorId ? parseInt(tailorId, 10) : null);
  const [selectedDesign, setSelectedDesign] = useState<number | null>(null);
  const [measurementData, setMeasurementData] = useState('');
  const [measurementProfileId, setMeasurementProfileId] = useState<number | null>(null);
  const [customDesignUrl, setCustomDesignUrl] = useState('');
  const [customDesignFile, setCustomDesignFile] = useState<File | null>(null);
  const [uploadingDesign, setUploadingDesign] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [urgentDays, setUrgentDays] = useState(2);
  const [pickupDate, setPickupDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [tailorGender, setTailorGender] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<string>('');
  const [autoMatchTailor, setAutoMatchTailor] = useState(false);
  const [designSource, setDesignSource] = useState<'catalog' | 'upload' | 'ai'>('catalog');
  const [aiDesigns, setAiDesigns] = useState<AIDesignItem[]>([]);
  const [selectedAiDesignId, setSelectedAiDesignId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const designIdFromUrl = search.get('design');

  // Load tailors (all profiles visible to customer), designs, measurements
  useEffect(() => {
    if (autoMatchTailor) return; // tailors list is driven by auto-match effect when on
    const tailorParams = new URLSearchParams();
    tailorParams.set('verified_only', 'false'); // show all tailors
    if (tailorGender) tailorParams.set('gender', tailorGender);
    Promise.all([
      client.get<Tailor[]>(`/api/tailors?${tailorParams}`),
      client.get<Design[]>('/api/designs'),
      client.get<Measurement[]>('/api/measurements'),
    ]).then(([t, d, m]) => {
      const tailorsList = Array.isArray(t.data) ? t.data : [];
      const designsList = Array.isArray(d.data) ? d.data : [];
      const measurementsList = Array.isArray(m.data) ? m.data : [];
      setTailors(tailorsList);
      setDesigns(designsList);
      setMeasurements(measurementsList);
      if (tailorsList.length) setSelectedTailor((prev) => prev ?? tailorsList[0].id);
      const id = designIdFromUrl ? parseInt(designIdFromUrl, 10) : NaN;
      if (!isNaN(id) && designsList.some((x) => x.id === id)) setSelectedDesign(id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [designIdFromUrl, tailorGender, autoMatchTailor]);

  // Auto-match tailor: fetch with use_match (urgency/price/distance), pick top result
  useEffect(() => {
    if (!autoMatchTailor) return;
    const params = new URLSearchParams();
    params.set('verified_only', 'false');
    params.set('use_match', 'true');
    if (tailorGender) params.set('gender', tailorGender);
    client.get<Tailor[]>(`/api/tailors?${params}`).then((r) => {
      const list = Array.isArray(r.data) ? r.data : [];
      if (list.length) {
        setTailors(list);
        setSelectedTailor(list[0].id);
      }
    }).catch(() => {});
  }, [autoMatchTailor, tailorGender]);

  const tailor = tailors.find((t) => t.id === selectedTailor);
  const basePrice = tailor?.base_stitching_price ?? 0;
  const urgentCharge = isUrgent ? basePrice * ((tailor?.urgency_multiplier ?? 1.5) - 1) : 0;
  const total = basePrice + urgentCharge;

  const API_BASE = import.meta.env.VITE_API_URL || '';

  // Load AI designs when user chooses "AI-generated design"
  useEffect(() => {
    if (designSource !== 'ai') return;
    client.get<AIDesignItem[]>('/api/ai-designs').then((r) => setAiDesigns(r.data || [])).catch(() => setAiDesigns([]));
  }, [designSource]);

  const effectiveCustomDesignUrl = customDesignUrl || (selectedAiDesignId ? aiDesigns.find((a) => a.id === selectedAiDesignId)?.image_url : null) || '';

  const selectAiDesign = (item: AIDesignItem) => {
    setCustomDesignUrl(item.image_url);
    setSelectedAiDesignId(item.id);
    setSelectedDesign(null);
    setCustomDesignFile(null);
  };
  const clearDesignSource = () => {
    setDesignSource('catalog');
    setCustomDesignUrl('');
    setCustomDesignFile(null);
    setSelectedAiDesignId(null);
  };

  const handleDesignFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image (JPEG, PNG, or WebP)');
      return;
    }
    setError('');
    setUploadingDesign(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await client.post<{ url: string }>('/api/uploads/design-image', formData);
      const url = typeof data.url === 'string' ? data.url : (data as { url?: string }).url;
      if (url) {
        setCustomDesignUrl(url);
        setCustomDesignFile(file);
        setSelectedDesign(null);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof msg === 'string' ? msg : 'Upload failed');
    } finally {
      setUploadingDesign(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTailor) {
      setError('Please select a tailor');
      return;
    }
    const isCustomOrder = !!(customDesignUrl.trim() || (selectedAiDesignId && aiDesigns.find((a) => a.id === selectedAiDesignId)?.image_url));
    if (isCustomOrder && !measurementData.trim()) {
      setError('Please add measurements so the tailor can stitch to your size.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const designImageUrl = customDesignUrl || (selectedAiDesignId ? aiDesigns.find((a) => a.id === selectedAiDesignId)?.image_url : null) || undefined;
      const { data } = await client.post('/api/orders', {
        tailor_id: selectedTailor,
        design_id: designSource === 'catalog' ? selectedDesign || undefined : undefined,
        custom_design_image_url: (designSource === 'upload' || designSource === 'ai') ? designImageUrl : undefined,
        measurement_data: measurementData || undefined,
        measurement_profile_id: measurementProfileId || undefined,
        fabric_pickup_slot: pickupDate ? new Date(pickupDate).toISOString() : undefined,
        delivery_slot: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
        is_urgent: isUrgent,
        urgent_delivery_days: isUrgent ? urgentDays : undefined,
        payment_mode: paymentMode || undefined,
      });
      navigate(`/orders/${data.id}`);
    } catch (x: unknown) {
      const msg = (x as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to place order';
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const selectMeasurement = (m: Measurement) => {
    setMeasurementData(m.data);
    setMeasurementProfileId(m.id);
  };

  const designFromCatalog = designIdFromUrl && designs.find((d) => d.id === selectedDesign);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="page">
      <h1>Place New Order</h1>
      <p className="text-muted">Schedule fabric pickup and delivery. Optionally choose urgent stitching.</p>

      {designFromCatalog && (
        <div className="order-form-catalog-design">
          <strong>Design from catalog:</strong> {designFromCatalog.name} ({designFromCatalog.category})
        </div>
      )}

      <form onSubmit={handleSubmit} className="order-form">
        <section>
          <h2>1. Select Tailor</h2>
          <label className="order-form-checkbox">
            <input type="checkbox" checked={autoMatchTailor} onChange={(e) => setAutoMatchTailor(e.target.checked)} />
            Let AI pick a tailor (auto-match by urgency and requirements)
          </label>
          {autoMatchTailor && tailor && (
            <p className="order-form-matched">Matched: <strong>{tailor.shop_name}</strong> — ₹{tailor.base_stitching_price}{tailor.match_reasons?.length ? ` · ${tailor.match_reasons.join(', ')}` : ''}</p>
          )}
          <label>
            Prefer tailor gender:
            <select value={tailorGender} onChange={(e) => setTailorGender(e.target.value)}>
              <option value="">Any</option>
              <option value="male">Male tailor</option>
              <option value="female">Female tailor</option>
            </select>
          </label>
          {!autoMatchTailor && (
            <label>
              Choose tailor
              <select value={selectedTailor ?? ''} onChange={(e) => setSelectedTailor(parseInt(e.target.value, 10))} required>
                <option value="">Select a tailor</option>
                {tailors.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.shop_name} — ₹{t.base_stitching_price}{t.gender ? ` (${t.gender})` : ''}{t.is_verified ? ' ✓ Verified' : ''}
                  </option>
                ))}
              </select>
            </label>
          )}
        </section>

        <section>
          <h2>2. Design</h2>
          {designFromCatalog ? (
            <p className="order-form-design-locked">Using selected design: <strong>{designFromCatalog.name}</strong></p>
          ) : (
            <>
              <p className="order-form-hint">Choose one: catalog design, upload your image, or use an AI-generated design.</p>
              <div className="order-form-design-tabs">
                <button type="button" className={designSource === 'catalog' ? 'active' : ''} onClick={() => { setDesignSource('catalog'); setCustomDesignUrl(''); setCustomDesignFile(null); setSelectedAiDesignId(null); }}>Catalog</button>
                <button type="button" className={designSource === 'upload' ? 'active' : ''} onClick={() => { setDesignSource('upload'); setSelectedDesign(null); setSelectedAiDesignId(null); }}>Upload image</button>
                <button type="button" className={designSource === 'ai' ? 'active' : ''} onClick={() => { setDesignSource('ai'); setSelectedDesign(null); setCustomDesignUrl(''); setCustomDesignFile(null); }}>AI-generated design</button>
              </div>
              {designSource === 'catalog' && (
                <select value={selectedDesign ?? ''} onChange={(e) => {
                  setSelectedDesign(e.target.value ? parseInt(e.target.value, 10) : null);
                  if (e.target.value) { setCustomDesignUrl(''); setCustomDesignFile(null); setSelectedAiDesignId(null); }
                }}>
                  <option value="">Select from catalog (optional)</option>
                  {designs.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.category})</option>
                  ))}
                </select>
              )}
              {designSource === 'upload' && (
                <div className="order-form-upload-design">
                  <label className="order-form-upload-label">
                    <span>Upload your design image (stitch like this)</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleDesignFileChange}
                      disabled={uploadingDesign}
                    />
                    {uploadingDesign ? ' Uploading…' : ''}
                  </label>
                  {customDesignUrl && (
                    <div className="order-form-custom-preview">
                      <img src={`${API_BASE}${customDesignUrl}`} alt="Your design" />
                      <p className="order-form-custom-note">Tailor will stitch like this. Add measurements below.</p>
                      <button type="button" className="btn btn-outline" onClick={() => { setCustomDesignUrl(''); setCustomDesignFile(null); }}>Remove image</button>
                    </div>
                  )}
                </div>
              )}
              {designSource === 'ai' && (
                <div className="order-form-ai-designs">
                  {aiDesigns.length === 0 ? (
                    <p className="order-form-hint">No AI designs yet. <Link to="/ai-design">Create one</Link> and come back.</p>
                  ) : (
                    <>
                      <p className="order-form-hint">Pick one of your AI-generated designs to use as reference.</p>
                      <div className="order-form-ai-designs-grid">
                        {aiDesigns.map((item) => (
                          <button key={item.id} type="button" className={`order-form-ai-design-card ${selectedAiDesignId === item.id ? 'selected' : ''}`} onClick={() => selectAiDesign(item)}>
                            <img src={`${API_BASE}${item.image_url}`} alt="" />
                            <span>{item.prompt?.slice(0, 40)}{(item.prompt?.length || 0) > 40 ? '…' : ''}</span>
                          </button>
                        ))}
                      </div>
                      {effectiveCustomDesignUrl && (
                        <div className="order-form-custom-preview">
                          <img src={`${API_BASE}${effectiveCustomDesignUrl}`} alt="Selected design" />
                          <button type="button" className="btn btn-outline" onClick={clearDesignSource}>Choose different source</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        <section>
          <h2>3. Measurements</h2>
          {measurements.length > 0 && (
            <div className="measurement-profiles">
              {measurements.map((m) => (
                <button key={m.id} type="button" className="btn btn-outline" onClick={() => selectMeasurement(m)}>
                  Use {m.name || `Profile ${m.id}`}
                </button>
              ))}
            </div>
          )}
          <textarea
            placeholder='Measurements JSON e.g. {"shoulder":14,"bust":34,"waist":28}'
            rows={3}
            value={measurementData}
            onChange={(e) => setMeasurementData(e.target.value)}
          />
        </section>

        <section>
          <h2>4. Schedule</h2>
          <label>
            Fabric pickup date:
            <input type="datetime-local" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
          </label>
          <label>
            Delivery date:
            <input type="datetime-local" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
          </label>
        </section>

        <section>
          <h2>5. Urgent stitching</h2>
          <label>
            <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} />
            Urgent (+{((tailor?.urgency_multiplier ?? 1.5) - 1) * 100}% extra)
          </label>
          {isUrgent && (
            <input
              type="number"
              min={1}
              value={urgentDays}
              onChange={(e) => setUrgentDays(parseInt(e.target.value, 10) || 2)}
            />
          )}
        </section>

        <section>
          <h2>6. Payment mode</h2>
          <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
            <option value="">Select payment</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="online">Online</option>
          </select>
        </section>

        <div className="price-summary">
          <div>Base: ₹{basePrice.toFixed(2)}</div>
          {isUrgent && <div>Urgency: ₹{urgentCharge.toFixed(2)}</div>}
          <strong>Total: ₹{total.toFixed(2)}</strong>
        </div>

        {error && <div className="auth-error">{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Placing...' : 'Place Order'}
        </button>
      </form>
    </div>
  );
}
