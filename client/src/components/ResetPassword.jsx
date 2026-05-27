// Reset Password - set new password using token from email link

import React, { useState } from 'react';
import { API_URL } from '../App';

function ResetPassword({ t, setCurrentView, language }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Extract token from URL hash (e.g., /#/reset-password?token=xxx)
  const getHashToken = () => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.split('?')[1] || '');
    return params.get('token') || '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const token = getHashToken();

    if (!token) {
      setError('Invalid or missing reset token. Please use the link from your email.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError(t('errFieldsRequired'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('errPasswordMismatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Reset failed.');

      setSuccess(data.message);
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
          <h2 style={{ fontSize: '1.4rem' }}>{t('resetPasswordTitle')}</h2>
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

        {success ? (
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => {
                window.location.hash = '/auth';
                setCurrentView('auth');
              }}
            >
              {t('loginBtn')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} aria-label="Reset Password Form">
            <div className="form-group">
              <label className="form-label" htmlFor="reset-pass">{t('resetPasswordNewLabel')} *</label>
              <input
                type="password"
                id="reset-pass"
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reset-confirm">{t('resetPasswordConfirmLabel')} *</label>
              <input
                type="password"
                id="reset-confirm"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={loading}
            >
              {loading ? t('loading') : t('resetPasswordSubmitBtn')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
