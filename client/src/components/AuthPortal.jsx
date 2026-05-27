// Combined Auth Login and Registration portal with email domain locks and simulator triggers

import React, { useState } from 'react';
import { API_URL } from '../App';

function AuthPortal({ t, handleLogin, setCurrentView, language }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emailExists, setEmailExists] = useState(false);

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

  // Input Validation
  const validateDomain = (emailVal) => {
    const domainRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]*\.)?srfti\.ac\.in$/;
    return domainRegex.test(emailVal);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setEmailExists(false);

    // 1. Validation checks
    if (!email || !password || (!isLoginMode && (!name || !confirmPassword))) {
      setError(t('errFieldsRequired'));
      return;
    }

    if (!isLoginMode && password !== confirmPassword) {
      setError(t('errPasswordMismatch'));
      return;
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
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed.');

        handleLogin(data.token, data.user);
      } else {
        // Registration API Call
        const regBody = { name, email, password, complainant_type: complainantType, phone };
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
                      <option value="Cinematography">Cinematography</option>
                      <option value="Direction & Screenplay Writing">Direction & Screenplay Writing</option>
                      <option value="Editing">Editing</option>
                      <option value="Sound Recording & Design">Sound Recording & Design</option>
                      <option value="Animation & Visual Effects">Animation & Visual Effects</option>
                      <option value="Producing">Producing</option>
                      <option value="Film Studies">Film Studies</option>
                      <option value="Acting">Acting</option>
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
            </>
          )}

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
        {isLoginMode && (
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

        {/* Registration Link */}
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

        {/* Local Simulation Bypass UI */}
        <div style={{ marginTop: '2rem', borderTop: '2px dashed var(--border-color)', paddingTop: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            {language === 'en' ? '🔒 Developer Simulation Portal' : '🔒 डेवलपर सिमुलेशन पोर्टल'}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1rem' }}>
            {language === 'en'
              ? 'Quickly jump to pre-configured accounts to preview dashboards instantly (ideal for review)'
              : 'डैशबोर्डों का तुरंत पूर्वावलोकन करने के लिए पूर्व-कॉन्फ़िगर खातों में सीधे प्रवेश करें (समीक्षा के लिए आदर्श)'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.5rem' }}
              onClick={() => handleSimulationLogin('complainant', 'rahul@student.srfti.ac.in', 'student')}
            >
              Rahul (Student)
            </button>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.5rem' }}
              onClick={() => handleSimulationLogin('nodal_officer', 'student_nodal@srfti.ac.in', 'student')}
            >
              Nodal (Student)
            </button>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.5rem' }}
              onClick={() => handleSimulationLogin('appellate_authority', 'ombudsman@srfti.ac.in', 'student')}
            >
              Ombudsman (Lokpal)
            </button>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.5rem' }}
              onClick={() => handleSimulationLogin('admin', 'admin@srfti.ac.in', null)}
            >
              System Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPortal;
