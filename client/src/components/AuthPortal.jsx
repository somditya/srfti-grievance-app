// Combined Auth Login and Registration portal with email domain locks and simulator triggers

import React, { useState, useEffect } from 'react';
import { API_URL } from '../App';

function AuthPortal({ t, handleLogin, setCurrentView, language }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendingOtp, setResendingOtp] = useState(false);
  const [loginOtpSent, setLoginOtpSent] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [complainantType, setComplainantType] = useState('student');

  // Student-specific fields
  const [department, setDepartment] = useState('');
  const [batch, setBatch] = useState('');
  const [gender, setGender] = useState('');
  const [category, setCategory] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');

  // CAPTCHA state
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

  // Refresh CAPTCHA
  const refreshCaptcha = () => {
    setCaptchaAnswer('');
    fetchCaptcha();
  };

  // Input Validation
  const validateDomain = (emailVal) => {
    const domainRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]*\.)?srfti\.ac\.in$/;
    return domainRegex.test(emailVal);
  };

  // Password validation function
  const validatePasswordFrontend = (passwordVal) => {
    const errors = [];
    if (passwordVal.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(passwordVal)) errors.push('one uppercase letter');
    if (!/[a-z]/.test(passwordVal)) errors.push('one lowercase letter');
    if (!/[0-9]/.test(passwordVal)) errors.push('one number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordVal)) errors.push('one special character');
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setEmailExists(false);
    setPasswordErrors([]);

    // 1. Validation checks
    if (!email || !password || (!isLoginMode && (!name || !confirmPassword))) {
      setError(t('errFieldsRequired'));
      return;
    }

    // Password validation for registration and password reset
    if (!isLoginMode) {
      const errors = validatePasswordFrontend(password);
      if (errors.length > 0) {
        setPasswordErrors(errors);
        return;
      }
      if (password !== confirmPassword) {
        setError(t('errPasswordMismatch'));
        return;
      }
    }

    if (!isLoginMode && !validateDomain(email)) {
      setError(t('errDomainInvalid'));
      return;
    }

    // Student-specific validation
    if (!isLoginMode && complainantType === 'student') {
      if (!department || !batch || !gender || !category || !registrationNo) {
        setError(t('errFieldsRequired'));
        return;
      }
    }

    setLoading(true);

    try {
      if (isLoginMode) {
        // Login API Call
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, captcha_token: captchaId, captcha_answer: captchaAnswer })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed.');

        // Check if OTP verification is required
        if (data.require_otp) {
          setLoginOtpSent(true);
          setError(null);
          return;
        }

        handleLogin(data.token, data.user);
        refreshCaptcha(); // Refresh CAPTCHA after successful login
      } else {
        // Registration API Call
        const regBody = { name, email, password, complainant_type: complainantType, phone, captcha_token: captchaId, captcha_answer: captchaAnswer };
        if (complainantType === 'student') {
          regBody.department = department;
          regBody.batch = batch;
          regBody.gender = gender;
          regBody.category = category;
          regBody.registration_no = registrationNo;
        }
        const res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(regBody)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Registration failed.');

        if (data.require_otp) {
          setOtpSent(true);
          setError(null);
          return;
        }

        setSuccess(t('successAction') + ' Please sign in.');
        setIsLoginMode(true);
        // Clean fields
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.warn('[API Auth] Server is unreachable or threw error. Providing simulation bypass options.');
      const msg = err.message || 'Server connection error.';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        setEmailExists(true);
        setError(null);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'OTP verification failed.');

      setSuccess(data.message);
      setTimeout(() => setIsLoginMode(true), 2000);
    } catch (err) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendingOtp(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: 'dummy', complainant_type: complainantType, captcha_token: 'test_captcha_token' })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('OTP resent. Please check your email.');
      } else {
        setError(data.message || 'Failed to resend OTP.');
      }
    } finally {
      setResendingOtp(false);
    }
  };

  const handleVerifyLoginOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/verify-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'OTP verification failed.');

      handleLogin(data.token, data.user);
    } catch (err) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendLoginOtp = async () => {
    setResendingOtp(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/resend-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('OTP resent. Please check your email.');
      } else {
        setError(data.message || 'Failed to resend OTP.');
      }
    } finally {
      setResendingOtp(false);
    }
  };

  // Graceful visual simulation helper for offline environments
  const handleSimulationLogin = (role, emailSim, complainantTypeSim) => {
    // Generate a simple simulated JWT payload token
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({
      id: 99,
      name: role === 'admin' ? 'Simulated Admin' : (role === 'nodal_officer' ? `Nodal Officer (${complainantTypeSim})` : ' Rahul (Simulated Student)'),
      email: emailSim,
      role: role,
      complainant_type: complainantTypeSim,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }));
    const token = `${header}.${payload}.signature_placeholder`;

    handleLogin(token, {
      id: 99,
      name: role === 'admin' ? 'Simulated Admin' : (role === 'nodal_officer' ? `Nodal Officer (${complainantTypeSim})` : 'Rahul (Simulated Student)'),
      email: emailSim,
      role: role,
      complainant_type: complainantTypeSim,
      phone: '+91-9999999999'
    });
  };

  return (
    <div style={{ maxWidth: '550px', margin: '2rem auto' }}>
      <div className="card">
        <div className="card-header" style={{ justifyContent: 'center' }}>
          <h2 style={{ fontSize: '1.4rem' }}>
            {isLoginMode ? t('authTitleLogin') : t('authTitleRegister')}
          </h2>
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

        {emailExists && !isLoginMode && (
          <div className="alert-banner warning" role="alert" style={{ backgroundColor: '#fef3c7', borderLeft: '4px solid #f59e0b', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: '2px' }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, color: '#92400e', fontSize: '0.95rem', margin: '0 0 0.25rem' }}>{t('emailExistsTitle')}</p>
                <p style={{ color: '#78350f', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>{t('emailExistsMsg')}</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
                    onClick={() => { setIsLoginMode(true); setEmailExists(false); setError(null); }}
                  >
                    {t('emailExistsLoginBtn')}
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
                    onClick={() => { setCurrentView('forgot-password'); }}
                  >
                    {t('emailExistsForgotBtn')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} aria-label={isLoginMode ? "Login Form" : "Registration Form"}>

          {!isLoginMode && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-name">{t('fieldFullName')} *</label>
                <input
                  type="text"
                  id="reg-name"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-type">{t('fieldComplainantType')} *</label>
                <select
                  id="reg-type"
                  className="form-control"
                  value={complainantType}
                  onChange={(e) => setComplainantType(e.target.value)}
                >
                  <option value="student">{t('selectStudent')}</option>
                  <option value="faculty">{t('selectFaculty')}</option>
                  <option value="staff">{t('selectStaff')}</option>
                </select>
              </div>

              {complainantType === 'student' && (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-department">{t('fieldDepartment')} *</label>
                    <select
                      id="reg-department"
                      className="form-control"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                    >
                      <option value="">{language === 'en' ? 'Select Department' : 'विभाग चुनें'}</option>
                      <option value="Animation Cinema">Animation Cinema</option>
                      <option value="Cinematography">Cinematography</option>
                      <option value="Direction & Screenplay Writing">Direction & Screenplay Writing</option>
                      <option value="Editing">Editing</option>
                      <option value="Producing for Film & Television">Producing for Film & Television</option>
                      <option value="Sound Recording & Design">Sound Recording & Design</option>
                      <option value="Cinematography for EDM">Cinematography for EDM</option>
                      <option value="Direction & Producing for EDM">Direction & Producing for EDM</option>
                      <option value="Editing for EDM">Editing for EDM</option>
                      <option value="EDM Management">EDM Management</option>
                      <option value="Sound for EDM">Sound for EDM</option>
                      <option value="Writing for EDM">Writing for EDM</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-batch">{t('fieldBatch')} *</label>
                    <input
                      type="text"
                      id="reg-batch"
                      className="form-control"
                      placeholder={language === 'en' ? 'e.g. 2023-2025' : 'जैसे 2023-2025'}
                      value={batch}
                      onChange={(e) => setBatch(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-gender">{t('fieldGender')} *</label>
                    <select
                      id="reg-gender"
                      className="form-control"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      required
                    >
                      <option value="">{language === 'en' ? 'Select Gender' : 'लिंग चुनें'}</option>
                      <option value="Male">{language === 'en' ? 'Male' : 'पुरुष'}</option>
                      <option value="Female">{language === 'en' ? 'Female' : 'महिला'}</option>
                      <option value="Other">{language === 'en' ? 'Other' : 'अन्य'}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-category">{t('fieldCategory')} *</label>
                    <select
                      id="reg-category"
                      className="form-control"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                    >
                      <option value="">{language === 'en' ? 'Select Category' : 'श्रेणी चुनें'}</option>
                      <option value="General">{language === 'en' ? 'General' : 'सामान्य'}</option>
                      <option value="SC">{language === 'en' ? 'SC' : 'अनुसूचित जाति'}</option>
                      <option value="ST">{language === 'en' ? 'ST' : 'अनुसूचित जनजाति'}</option>
                      <option value="OBC">{language === 'en' ? 'OBC' : 'अन्य पिछड़ा वर्ग'}</option>
                      <option value="EWS">{language === 'en' ? 'EWS' : 'आर्थिक कमजोर वर्ग'}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-no">{t('fieldRegistrationNo')} *</label>
                    <input
                      type="text"
                      id="reg-no"
                      className="form-control"
                      placeholder={language === 'en' ? 'e.g. SRFTI/2023/00123' : 'जैसे SRFTI/2023/00123'}
                      value={registrationNo}
                      onChange={(e) => setRegistrationNo(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}
            </>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">{t('fieldEmail')} *</label>
            <input
              type="email"
              id="auth-email"
              className="form-control"
              placeholder={isLoginMode ? "email@srfti.ac.in" : "username@srfti.ac.in"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {!isLoginMode && <p className="form-help" id="email-help">{t('fieldEmailHelp')}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-pass">{t('fieldPassword')} *</label>
            <input
              type="password"
              id="auth-pass"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {!isLoginMode && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="auth-confirm">{t('fieldConfirmPassword')} *</label>
                <input
                  type="password"
                  id="auth-confirm"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-phone">{t('fieldPhone')}</label>
                <input
                  type="tel"
                  id="reg-phone"
                  className="form-control"
                  value={phone}
                  placeholder="+91-"
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* Password Requirements */}
              {!isLoginMode && (
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '1rem' }}>
                  <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600 }}>{t('passwordRequirements')}:</p>
                  <ul style={{ margin: '0', paddingLeft: '1.2rem' }}>
                    <li style={{ marginBottom: '0.25rem' }}>8+ characters</li>
                    <li style={{ marginBottom: '0.25rem' }}>Uppercase letter (A-Z)</li>
                    <li style={{ marginBottom: '0.25rem' }}>Lowercase letter (a-z)</li>
                    <li style={{ marginBottom: '0.25rem' }}>Number (0-9)</li>
                    <li>Special character (!@#$%^&*(),.?":{}|&lt;&gt;)</li>
                  </ul>
                </div>
              )}
            </>
          )}

          {/* Password Errors */}
          {passwordErrors.length > 0 && (
            <div className="alert-banner error" role="alert">
              <span style={{ fontSize: '0.85rem' }}>
                {passwordErrors.map((err, i) => (
                  <div key={i}>{err}</div>
                ))}
              </span>
            </div>
          )}

          {/* Simple Math CAPTCHA */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" htmlFor="captcha-answer">{t('captchaLabel')} *</label>
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
              id="captcha-answer"
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
            {loading ? t('loading') : (isLoginMode ? t('loginBtn') : t('registerBtn'))}
          </button>
        </form>

        {/* Forgot Password Link */}
        {isLoginMode && !loginOtpSent && (
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button
              className="btn btn-secondary"
              style={{ border: 'none', background: 'none', padding: '0', color: 'var(--primary)', textDecoration: 'underline', fontWeight: 600, fontSize: '0.9rem' }}
              onClick={() => setCurrentView('forgot-password')}
            >
              {t('forgotPasswordLink')}
            </button>
          </div>
        )}

        {/* Login OTP Verification Section */}
        {loginOtpSent && (
          <div style={{ marginTop: '1rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>{t('loginOtpTitle')}</h3>
              <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '1rem' }}>
                {t('loginOtpMsg')}
              </p>
              <form onSubmit={handleVerifyLoginOtp}>
                <div className="form-group">
                  <label className="form-label" htmlFor="login-otp-code">{t('fieldOtpCode')} *</label>
                  <input
                    type="text"
                    id="login-otp-code"
                    className="form-control"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength="6"
                    placeholder="------"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '0.5rem' }}
                  disabled={loading}
                >
                  {loading ? t('loading') : t('verifyOtpBtn')}
                </button>
              </form>
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <button
                  className="btn btn-secondary"
                  style={{ border: 'none', background: 'none', padding: '0', color: 'var(--primary)', textDecoration: 'underline', fontWeight: 600, fontSize: '0.85rem' }}
                  onClick={handleResendLoginOtp}
                  disabled={resendingOtp}
                >
                  {resendingOtp ? t('resendingOtp') : t('resendOtpBtn')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OTP Verification Section (Registration) */}
        {otpSent && (
          <div style={{ marginTop: '1rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>{t('verifyOtpTitle')}</h3>
              <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '1rem' }}>
                {t('verifyOtpMsg')}
              </p>
              <form onSubmit={handleVerifyOtp}>
                <div className="form-group">
                  <label className="form-label" htmlFor="otp-code">{t('fieldOtpCode')} *</label>
                  <input
                    type="text"
                    id="otp-code"
                    className="form-control"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength="6"
                    placeholder="------"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '0.5rem' }}
                  disabled={loading}
                >
                  {loading ? t('loading') : t('verifyOtpBtn')}
                </button>
              </form>
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <button
                  className="btn btn-secondary"
                  style={{ border: 'none', background: 'none', padding: '0', color: 'var(--primary)', textDecoration: 'underline', fontWeight: 600, fontSize: '0.85rem' }}
                  onClick={handleResendOtp}
                  disabled={resendingOtp}
                >
                  {resendingOtp ? t('resendingOtp') : t('resendOtpBtn')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Registration Link */}
        {!otpSent && !loginOtpSent && (
          <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
            {isLoginMode ? (
              <p>
                {t('noAccountText')}{' '}
                <button
                  className="btn btn-secondary"
                  style={{ border: 'none', background: 'none', padding: '0', color: 'var(--primary)', textDecoration: 'underline', fontWeight: 700 }}
                  onClick={() => { setIsLoginMode(false); setError(null); setEmailExists(false); }}
                >
                  {t('registerBtn')}
                </button>
              </p>
            ) : (
              <p>
                {t('hasAccountText')}{' '}
                <button
                  className="btn btn-secondary"
                  style={{ border: 'none', background: 'none', padding: '0', color: 'var(--primary)', textDecoration: 'underline', fontWeight: 700 }}
                  onClick={() => { setIsLoginMode(true); setError(null); }}
                >
                  {t('loginBtn')}
                </button>
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default AuthPortal;
