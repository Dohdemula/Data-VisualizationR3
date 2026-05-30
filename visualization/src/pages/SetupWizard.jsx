import { useState } from 'react';
import { MdInventory2, MdVisibility, MdVisibilityOff, MdCheckCircle } from 'react-icons/md';
import { initializeSystem } from '../api/api';
import './Login.css';
import './SetupWizard.css';

const TIMEZONES = [
  { value: 'Africa/Nairobi',   label: 'East Africa Time (EAT) — Nairobi' },
  { value: 'Africa/Lagos',     label: 'West Africa Time (WAT) — Lagos'    },
  { value: 'Africa/Cairo',     label: 'Eastern European Time — Cairo'      },
  { value: 'Africa/Johannesburg', label: 'South Africa Standard Time'      },
  { value: 'UTC',              label: 'UTC'                                 },
];

const CURRENCIES = [
  { value: 'KES', label: 'KES — Kenyan Shilling'  },
  { value: 'UGX', label: 'UGX — Ugandan Shilling' },
  { value: 'TZS', label: 'TZS — Tanzanian Shilling' },
  { value: 'NGN', label: 'NGN — Nigerian Naira'    },
  { value: 'GHS', label: 'GHS — Ghanaian Cedi'     },
  { value: 'USD', label: 'USD — US Dollar'          },
];

const STEPS = ['Business', 'Your Account', 'Activation'];

function StepIndicator({ current }) {
  return (
    <div className="sw-steps">
      {STEPS.map((label, i) => (
        <div key={i} className={`sw-step ${i < current ? 'done' : i === current ? 'active' : ''}`}>
          <div className="sw-step-dot">{i < current ? <MdCheckCircle /> : i + 1}</div>
          <div className="sw-step-label">{label}</div>
          {i < STEPS.length - 1 && <div className="sw-step-line" />}
        </div>
      ))}
    </div>
  );
}

export default function SetupWizard({ onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    businessName: '', timezone: 'Africa/Nairobi', currency: 'KES',
    name: '', email: '', password: '', confirmPassword: '',
    setupToken: '',
  });
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [done,     setDone]     = useState(false);

  const set = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); setError(null); };

  const validateStep = () => {
    if (step === 0) {
      if (!form.businessName.trim()) return 'Business name is required.';
    }
    if (step === 1) {
      if (!form.name.trim())          return 'Your name is required.';
      if (!form.email.trim())         return 'Email is required.';
      if (form.password.length < 8)   return 'Password must be at least 8 characters.';
      if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    }
    if (step === 2) {
      if (!form.setupToken.trim()) return 'Please paste your setup token.';
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(null);
    setStep(s => s + 1);
  };

  const back = () => { setError(null); setStep(s => s - 1); };

  const submit = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setLoading(true);
    setError(null);
    try {
      await initializeSystem({
        businessName: form.businessName.trim(),
        timezone:     form.timezone,
        currency:     form.currency,
        name:         form.name.trim(),
        email:        form.email.trim().toLowerCase(),
        password:     form.password,
        setupToken:   form.setupToken.trim(),
      });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="sw-page">
        <div className="sw-card">
          <div className="sw-done">
            <MdCheckCircle className="sw-done-icon" />
            <h2>You're all set!</h2>
            <p>Your InvenSight dashboard is ready. Sign in with the email and password you just created.</p>
            <button className="auth-btn-primary sw-done-btn" onClick={onComplete}>
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sw-page">
      <div className="sw-card">
        <div className="sw-header">
          <div className="sw-logo"><MdInventory2 /></div>
          <div>
            <h1 className="sw-title">Welcome to InvenSight</h1>
            <p className="sw-sub">Let's set up your dashboard. It takes about 2 minutes.</p>
          </div>
        </div>

        <StepIndicator current={step} />

        {error && <div className="auth-error sw-error">{error}</div>}

        {/* ── Step 0: Business ── */}
        {step === 0 && (
          <div className="sw-step-body">
            <h3 className="sw-step-title">Business details</h3>

            <div className="auth-field">
              <label htmlFor="businessName">Business Name</label>
              <input id="businessName" type="text" placeholder="e.g. Kamau Retail Ltd"
                value={form.businessName} onChange={set('businessName')} autoFocus />
            </div>

            <div className="sw-row">
              <div className="auth-field">
                <label htmlFor="timezone">Timezone</label>
                <select id="timezone" value={form.timezone} onChange={set('timezone')}>
                  {TIMEZONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="auth-field">
                <label htmlFor="currency">Currency</label>
                <select id="currency" value={form.currency} onChange={set('currency')}>
                  {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Account ── */}
        {step === 1 && (
          <div className="sw-step-body">
            <h3 className="sw-step-title">Your account</h3>
            <p className="sw-step-hint">This will be the Management account. You can invite staff later from Settings.</p>

            <div className="sw-row">
              <div className="auth-field">
                <label htmlFor="name">Full Name</label>
                <input id="name" type="text" placeholder="Your name"
                  value={form.name} onChange={set('name')} autoFocus />
              </div>
              <div className="auth-field">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" placeholder="you@business.co.ke"
                  value={form.email} onChange={set('email')} />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password <span className="sw-hint-inline">(min 8 characters)</span></label>
              <div className="auth-input-wrap">
                <input id="password" type={showPw ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={form.password} onChange={set('password')}
                  autoComplete="new-password" />
                <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                  {showPw ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input id="confirmPassword" type="password" placeholder="Repeat password"
                value={form.confirmPassword} onChange={set('confirmPassword')}
                autoComplete="new-password" />
            </div>
          </div>
        )}

        {/* ── Step 2: Token ── */}
        {step === 2 && (
          <div className="sw-step-body">
            <h3 className="sw-step-title">Activation token</h3>
            <p className="sw-step-hint">
              Paste the setup token from your approval email. It's a long string — paste it exactly as received.
            </p>

            <div className="auth-field">
              <label htmlFor="setupToken">Setup Token</label>
              <textarea
                id="setupToken"
                className="sw-token-input"
                placeholder="Paste your token here…"
                value={form.setupToken}
                onChange={set('setupToken')}
                rows={5}
                autoFocus
                spellCheck={false}
              />
            </div>

            <div className="sw-review">
              <div className="sw-review-title">Review</div>
              <div className="sw-review-row"><span>Business</span><strong>{form.businessName}</strong></div>
              <div className="sw-review-row"><span>Account</span><strong>{form.name} ({form.email})</strong></div>
              <div className="sw-review-row"><span>Currency</span><strong>{form.currency}</strong></div>
              <div className="sw-review-row"><span>Timezone</span><strong>{form.timezone}</strong></div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="sw-nav">
          {step > 0 && (
            <button className="sw-back-btn" onClick={back} disabled={loading}>
              Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < 2 ? (
            <button className="auth-btn-primary sw-next-btn" onClick={next}>
              Continue
            </button>
          ) : (
            <button className="auth-btn-primary sw-next-btn" onClick={submit} disabled={loading}>
              {loading ? 'Setting up…' : 'Set Up My Dashboard'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
