// Main App Shell - React coordinator with A11y, bilingual translations, and backend sync

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import AuthPortal from './components/AuthPortal';
import ComplainantDashboard from './components/ComplainantDashboard';
import NodalDashboard from './components/NodalDashboard';
import AppellateDashboard from './components/AppellateDashboard';
import AdminDashboard from './components/AdminDashboard';
import { translations } from './translations';

export const API_URL = 'http://localhost:5000/api';

function App() {
  // Global States
  const [currentView, setCurrentView] = useState('landing'); // landing, auth, dashboard
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('srfti_token') || null);
  
  // Accessibility & Localization Settings
  const [language, setLanguage] = useState(localStorage.getItem('srfti_lang') || 'en');
  const [contrastMode, setContrastMode] = useState(localStorage.getItem('srfti_contrast') || 'normal');
  const [fontSizeOffset, setFontSizeOffset] = useState(parseInt(localStorage.getItem('srfti_font_size')) || 0);
  
  // App Config & Settings
  const [systemSettings, setSystemSettings] = useState({
    student_resolution_days: '22',
    faculty_resolution_days: '15',
    staff_resolution_days: '30'
  });
  const [appellateConfigs, setAppellateConfigs] = useState([]);
  const [backendError, setBackendError] = useState(null);

  // Sync state variables with DOM & LocalStorage
  useEffect(() => {
    localStorage.setItem('srfti_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('srfti_contrast', contrastMode);
    document.documentElement.setAttribute('data-contrast', contrastMode);
  }, [contrastMode]);

  useEffect(() => {
    localStorage.setItem('srfti_font_size', fontSizeOffset);
    // Dynamic base font adjustments: 0 offset is 16px, +2 is 18px, -2 is 14px
    document.documentElement.style.setProperty('--font-base', `${16 + fontSizeOffset}px`);
  }, [fontSizeOffset]);

  // Load configuration from Express API on boot
  useEffect(() => {
    async function loadConfig() {
      try {
        const settingsRes = await fetch(`${API_URL}/settings`);
        if (!settingsRes.ok) throw new Error('Failed to load system timelines');
        const settingsData = await settingsRes.json();
        setSystemSettings(settingsData);
        
        const appellateRes = await fetch(`${API_URL}/appellate`);
        if (appellateRes.ok) {
          const appellateData = await appellateRes.json();
          setAppellateConfigs(appellateData);
        }
        setBackendError(null);
      } catch (err) {
        console.warn('[API Sync] Backend not available yet. Operating with standard configuration defaults.', err.message);
        setBackendError('Backend Service offline. Local UI features running in simulation mode.');
      }
    }
    loadConfig();
  }, []);

  // Hydrate User Session
  useEffect(() => {
    if (authToken) {
      localStorage.setItem('srfti_token', authToken);
      // Decode JWT token basic details (safely)
      try {
        const base64Url = authToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const decoded = JSON.parse(jsonPayload);
        // Check expiry
        if (decoded.exp * 1000 < Date.now()) {
          handleLogout();
        } else {
          setCurrentUser(decoded);
          setCurrentView('dashboard');
        }
      } catch (e) {
        handleLogout();
      }
    } else {
      localStorage.removeItem('srfti_token');
    }
  }, [authToken]);

  const handleLogin = (token, userDetails) => {
    setCurrentUser(userDetails);
    setAuthToken(token);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem('srfti_token');
    setCurrentView('landing');
  };

  // Safe Localization Lookup Helper
  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <div className="app-container gradient-bg">
      <a href="#main-content-anchor" className="sr-only focus-visible:not-sr-only btn btn-primary" style={{ position: 'absolute', zIndex: 9999 }}>
        {language === 'en' ? 'Skip to Content' : 'मुख्य सामग्री पर जाएं'}
      </a>
      
      <Header 
        language={language}
        setLanguage={setLanguage}
        contrastMode={contrastMode}
        setContrastMode={setContrastMode}
        fontSizeOffset={fontSizeOffset}
        setFontSizeOffset={setFontSizeOffset}
        currentUser={currentUser}
        handleLogout={handleLogout}
        t={t}
        setCurrentView={setCurrentView}
      />
      
      <main id="main-content-anchor" className="main-content">
        {backendError && (
          <div className="alert-banner warning" role="alert">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
            </svg>
            <span>{backendError}</span>
          </div>
        )}
        
        {currentView === 'landing' && (
          <LandingPage 
            t={t} 
            setCurrentView={setCurrentView} 
            systemSettings={systemSettings}
            appellateConfigs={appellateConfigs}
            language={language}
          />
        )}
        
        {currentView === 'auth' && (
          <AuthPortal 
            t={t} 
            handleLogin={handleLogin} 
            setCurrentView={setCurrentView}
            language={language}
          />
        )}
        
        {currentView === 'dashboard' && currentUser && (
          <>
            {currentUser.role === 'complainant' && (
              <ComplainantDashboard
                t={t}
                currentUser={currentUser}
                authToken={authToken}
                systemSettings={systemSettings}
                appellateConfigs={appellateConfigs}
                language={language}
              />
            )}
            
            {currentUser.role === 'nodal_officer' && (
              <NodalDashboard 
                t={t} 
                currentUser={currentUser} 
                authToken={authToken}
              />
            )}
            
            {currentUser.role === 'appellate_authority' && (
              <AppellateDashboard 
                t={t} 
                currentUser={currentUser} 
                authToken={authToken}
              />
            )}
            
            {currentUser.role === 'admin' && (
              <AdminDashboard 
                t={t} 
                currentUser={currentUser} 
                authToken={authToken}
                systemSettings={systemSettings}
                setSystemSettings={setSystemSettings}
              />
            )}
          </>
        )}
      </main>
      
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        <p>© 2026 Satyajit Ray Film & Television Institute (SRFTI). All rights reserved. Accessibility and UGC Complaint.</p>
        <p style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>Designed and maintained by Internal Quality Assurance Cell (IQAC).</p>
      </footer>
    </div>
  );
}

export default App;
