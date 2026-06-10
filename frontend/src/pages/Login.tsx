import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    try {
      await login(email, password);
      navigate('/');
    } catch (x: unknown) {
      const msg = (x as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Login failed';
      setErr(String(msg));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>E-Stitch</h1>
        <p className="auth-subtitle">Login to your account</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {err && <div className="auth-error">{err}</div>}
          <button type="submit" className="btn btn-primary">Login</button>
        </form>
        <p className="auth-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
