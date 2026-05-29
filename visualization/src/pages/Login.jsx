import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdInventory2, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { useRole } from '../context/RoleContext';
import './Login.css';

const DEMO_ACCOUNTS = [
  { label: 'Management',  credential: 'julius', password: 'demo123', color: '#6d28d9' },
  { label: 'Analytical',  credential: 'alice',  password: 'demo123', color: '#1d4ed8' },
  { label: 'Operational', credential: 'john',   password: 'demo123', color: '#065f46' },
];

export default function Login() {
  const { login } = useRole();
  const navigate = useNavigate();

  const [credential, setCredential] = useState('');
  const [password, setPassword]     = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!credential.trim() || !password) {
      setError('Please enter your email/username and password.');
      return;
    }
    setLoading(true);
    try {
      await login({ credential: credential.trim(), password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (account) => {
    setCredential(account.credential);
    setPassword(account.password);
    setError(null);
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="auth-brand-logo">
          <MdInventory2 />
        </div>
        <h1 className="auth-brand-name">InventIQ</h1>
        <p className="auth-brand-tagline">
          Intelligent Inventory Forecasting &amp; Sales Analytics for Kenyan SMEs
        </p>
        <ul className="auth-brand-features">
          <li>Demand forecasting with confidence bands</li>
          <li>Real-time stock &amp; reorder alerts</li>
          <li>Sales analytics &amp; trend insights</li>
          <li>Role-based access for your whole team</li>
        </ul>
      </div>

      <div className="auth-card-wrap">
        <div className="auth-card">
          <h2 className="auth-card-title">Sign in to your account</h2>
          <p className="auth-card-sub">Enter your email or username to continue.</p>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={submit} noValidate>
            <div className="auth-field">
              <label htmlFor="credential">Email or Username</label>
              <input
                id="credential"
                type="text"
                placeholder="e.g. julius or julius@store.co.ke"
                value={credential}
                onChange={e => setCredential(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className="auth-input-wrap">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-pw-toggle"
                  onClick={() => setShowPw(v => !v)}
                  tabIndex={-1}
                >
                  {showPw ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
            </div>

            <button className="auth-btn-primary" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/signup">Create one</Link>
          </p>

          <div className="auth-demo">
            <div className="auth-demo-label">Demo accounts</div>
            <div className="auth-demo-pills">
              {DEMO_ACCOUNTS.map(a => (
                <button
                  key={a.label}
                  className="auth-demo-pill"
                  style={{ '--pill-color': a.color }}
                  onClick={() => fillDemo(a)}
                  type="button"
                >
                  {a.label}
                </button>
              ))}
            </div>
            <p className="auth-demo-hint">Click a role to pre-fill credentials, then Sign In.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
