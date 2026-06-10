import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';

export default function TailorDashboard() {
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    client
      .get('/api/tailors/me')
      .then(() => setHasProfile(true))
      .catch((err: { response?: { status: number } }) => {
        setHasProfile(err.response?.status === 404 ? false : true);
      });
  }, []);

  return (
    <div className="page">
      <h1>Tailor Dashboard</h1>
      <p className="text-muted">Manage your workload and incoming orders.</p>

      {hasProfile === false && (
        <div className="card card-highlight" style={{ marginBottom: '1.5rem', borderColor: 'var(--color-primary)' }}>
          <h3>Complete your profile</h3>
          <p>Add your shop details and select your gender so customers can find and book you.</p>
          <Link to="/tailor/profile" className="btn btn-primary">Set up profile</Link>
        </div>
      )}

      <div className="card-grid">
        <Link to="/tailor/profile" className="card">
          <h3>My Profile</h3>
          <p>Edit shop name, gender, pricing and delivery</p>
        </Link>
        <Link to="/tailor/orders" className="card">
          <h3>Manage Orders</h3>
          <p>Accept/reject orders and update status</p>
        </Link>
      </div>
    </div>
  );
}
