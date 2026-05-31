// Semantic, accessible header component with multi-language and WCAG controls

import React from 'react';
import logo from '../assets/SRFTI_Logo_DTBU.jpg';

function Header({
  language,
  setLanguage,
  contrastMode,
  setContrastMode,
  fontSizeOffset,
  setFontSizeOffset,
  currentUser,
  handleLogout,
  t,
  setCurrentView,
  onHeaderLogin
}) {
  return (
    <header className="portal-header" role="banner">
      <div className="portal-header-inner">
        {/* Logo and Branding (Bilingual support) */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
          onClick={() => setCurrentView('landing')}
          role="link"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') setCurrentView('landing'); }}
          aria-label={t('portalTitle')}
        >
          <img
            src={logo}
            alt="SRFTI Logo"
            style={{ height: '45px', width: 'auto' }}
          />
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.5px', color: '#f3f4f6' }}>{t('portalTitle')}</h1>
            <p style={{ fontSize: '0.8rem', color: '#D4AF37', fontWeight: 600, letterSpacing: '1px' }}>{t('portalSubtitle')}</p>
          </div>
        </div>

        {/* Controls Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          {/* Home Icon */}
          <button
            className="btn btn-secondary"
            style={{ padding: '0.5rem', fontSize: '0.9rem', minWidth: '36px', minHeight: '36px', borderColor: '#D4AF37', color: '#f3f4f6' }}
            onClick={() => setCurrentView('landing')}
            aria-label={t('home')}
            title={t('home')}
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f3f4f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </button>

          {/* Accessibility Settings Bar */}
          <div className="a11y-bar" aria-label="Accessibility options" role="region">
            {/* Font Size Adjusters */}
            <div className="a11y-group">
              <span className="sr-only">Font Size Adjustments</span>
              <button
                className="btn"
                style={{ padding: '0.25rem 0.5rem', minWidth: '30px', fontSize: '0.8rem', background: fontSizeOffset === -2 ? 'var(--primary)' : 'transparent', color: fontSizeOffset === -2 ? 'white' : 'var(--text-main)', border: '1px solid var(--border-color)' }}
                onClick={() => setFontSizeOffset(-2)}
                aria-label="Decrease text size"
                title="Decrease Text Size"
              >
                {t('fontSizeSmall')}
              </button>
              <button
                className="btn"
                style={{ padding: '0.25rem 0.5rem', minWidth: '30px', fontSize: '0.85rem', background: fontSizeOffset === 0 ? 'var(--primary)' : 'transparent', color: fontSizeOffset === 0 ? 'white' : 'var(--text-main)', border: '1px solid var(--border-color)' }}
                onClick={() => setFontSizeOffset(0)}
                aria-label="Reset text size"
                title="Reset Text Size"
              >
                {t('fontSizeNormal')}
              </button>
              <button
                className="btn"
                style={{ padding: '0.25rem 0.5rem', minWidth: '30px', fontSize: '0.9rem', background: fontSizeOffset === 2 ? 'var(--primary)' : 'transparent', color: fontSizeOffset === 2 ? 'white' : 'var(--text-main)', border: '1px solid var(--border-color)' }}
                onClick={() => setFontSizeOffset(2)}
                aria-label="Increase text size"
                title="Increase Text Size"
              >
                {t('fontSizeLarge')}
              </button>
            </div>

            {/* Divider */}
            <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-color)' }}></div>

            {/* High Contrast Toggle */}
            <button
              className="btn"
              style={{
                padding: '0.25rem 0.75rem',
                fontSize: '0.8rem',
                backgroundColor: contrastMode === 'high' ? '#fcd34d' : 'transparent',
                color: contrastMode === 'high' ? '#000000' : 'var(--text-main)',
                border: '1px solid var(--border-color)'
              }}
              onClick={() => setContrastMode(contrastMode === 'normal' ? 'high' : 'normal')}
              aria-label={contrastMode === 'normal' ? 'Switch to High Contrast Dark Mode' : 'Switch to Normal Contrast Mode'}
            >
              {contrastMode === 'normal' ? t('contrastHigh') : t('contrastNormal')}
            </button>
          </div>

          {/* Language Switcher */}
          <button
            className="btn btn-secondary"
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
              borderColor: '#ffffff',
              color: '#ffffff',
              backgroundColor: 'rgba(255,255,255,0.1)'
            }}
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            aria-label={`Switch language to ${language === 'en' ? 'Hindi' : 'English'}`}
          >
            {t('langToggle')}
          </button>

          {/* User Section / Navigation Links */}
          <nav role="navigation" aria-label="User panel">
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }} className="sr-only">
                  {t('loggedInAs')} {currentUser.name} ({currentUser.role})
                </span>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-accent"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    onClick={() => setCurrentView('dashboard')}
                  >
                    {t('dashboard')}
                  </button>
                  <button
                    className="btn"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', backgroundColor: '#e11d48', color: 'white' }}
                    onClick={handleLogout}
                  >
                    {t('logout')}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-accent"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                  onClick={() => { if (onHeaderLogin) onHeaderLogin(); setCurrentView('auth'); }}
                >
                  {t('login')}
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;