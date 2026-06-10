import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'customer' | 'tailor' | 'admin'>('customer');
  const [err, setErr] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    try {
      await register({ email, password, full_name: fullName, phone, role: role as string });
      navigate('/');
    } catch (x: unknown) {
      const msg = (x as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Registration failed';
      setErr(String(msg));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>E-Stitch</h1>
        <p className="auth-subtitle">Create an account</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <select value={role} onChange={(e) => setRole(e.target.value as 'customer' | 'tailor' | 'admin')}>
            <option value="customer">Customer</option>
            <option value="tailor">Tailor</option>
            <option value="admin">Admin</option>
          </select>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {err && <div className="auth-error">{err}</div>}
          <button type="submit" className="btn btn-primary">Register</button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
