// Forgot Password - sends reset link to registered email

import React, { useState, useEffect } from 'react';
import { API_URL } from '../App';

function ForgotPassword({ t, setCurrentView, language }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [captchaId, setCaptchaId] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  // Load CAPTCHA on mount
  useEffect(() => {
    fetchCaptcha();
  }, []);

  const fetchCaptcha = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/captcha`);
      const data = await res.json();
      setCaptchaId(data.id);
      setCaptchaQuestion(data.question);
    } catch (err) {
      console.error('Failed to load CAPTCHA:', err);
    }
  };

  const refreshCaptcha = () => {
    setCaptchaAnswer('');
    fetchCaptcha();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError(t('errFieldsRequired'));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, captcha_token: captchaId, captcha_answer: captchaAnswer })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Request failed.');

      setSuccess(data.message);
      setEmail('');
    } catch (err) {
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '550px', margin: '2rem auto' }}>
      <div className="card">
        <div className="card-header" style={{ justifyContent: 'center' }}>
          <h2 style={{ fontSize: '1.4rem' }}>{t('forgotPasswordTitle')}</h2>
        </div>

        {error && (
          <div className="alert-banner error" role="alert">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ fontSize: '0.9rem' }}>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert-banner success" role="alert">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span style={{ fontSize: '0.9rem' }}>{success}</span>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} aria-label="Forgot Password Form">
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              {t('forgotPasswordDesc')}
            </p>

            <div className="form-group">
              <label className="form-label" htmlFor="forgot-email">{t('forgotPasswordEmailLabel')} *</label>
              <input
                type="email"
                id="forgot-email"
                className="form-control"
                placeholder="email@srfti.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Simple Math CAPTCHA */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" htmlFor="forgot-captcha-answer">{t('captchaLabel')} *</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{captchaQuestion}</span>
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  style={{ background: 'var(--secondary)', border: '1px solid var(--border)', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}
                  title="Refresh"
                >
                  ↻
                </button>
              </div>
              <input
                type="text"
                id="forgot-captcha-answer"
                className="form-control"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                placeholder="Enter answer"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={loading}
            >
              {loading ? t('loading') : t('forgotPasswordSubmitBtn')}
            </button>
          </form>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button
            className="btn btn-secondary"
            style={{ border: 'none', background: 'none', padding: '0', color: 'var(--primary)', textDecoration: 'underline', fontWeight: 700, fontSize: '0.9rem' }}
            onClick={() => { setCurrentView('auth'); }}
          >
            {t('forgotPasswordBackToLogin')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;