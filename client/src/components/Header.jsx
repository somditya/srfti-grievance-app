// Semantic, accessible header component with multi-language and WCAG controls

import React from 'react';

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
  setCurrentView 
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
          {/* Typographic and aesthetic SVG emblem for SRFTI */}
          <svg width="45" height="45" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="48" fill="#1e1b18" stroke="#D4AF37" strokeWidth="4" />
            <path d="M30 40 C 30 25, 70 25, 70 40 C 70 55, 30 55, 30 70 C 30 85, 70 85, 70 70" fill="none" stroke="#9E1B32" strokeWidth="10" strokeLinecap="round" />
            <line x1="50" y1="20" x2="50" y2="80" stroke="#D4AF37" strokeWidth="4" strokeDasharray="5,5" />
          </svg>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.5px' }}>{t('portalTitle')}</h1>
            <p style={{ fontSize: '0.8rem', color: '#D4AF37', fontWeight: 600, letterSpacing: '1px' }}>{t('portalSubtitle')}</p>
          </div>
        </div>

        {/* Accessibility & Settings Controls Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
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
                  Logged in as {currentUser.name} ({currentUser.role})
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
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', color: '#ffffff', borderColor: '#ffffff' }}
                  onClick={() => { setCurrentView('auth'); }}
                >
                  {t('login')}
                </button>
                <button 
                  className="btn btn-accent"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                  onClick={() => { setCurrentView('auth'); }}
                >
                  {t('register')}
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
