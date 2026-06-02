// Landing page component featuring bilingual FAQs, procedure flow, UGC instructions,
// and SGRC committee constitution panel.

import React, { useState } from 'react';

function LandingPage({ t, setCurrentView, systemSettings, appellateConfigs, language, members = [] }) {
  const [activeFaq, setActiveFaq] = useState(null);

  // ─── SGRC Constitution ────────────────────────────────────────────────────────
  // Default members list (used when no admin-provided members)
  const defaultMembers = [
    { name_en: 'Prof. Sudeshna Lahiri',        name_hi: 'प्रो. सुदेशना लाहिड़ी',          role_en: 'Chairperson',    role_hi: 'अध्यक्ष', designation_en: 'Professor', designation_hi: 'प्रोफेसर', mobile: '+91 98765 43210' },
    { name_en: 'Prof. Sanjit Dey',             name_hi: 'प्रो. संजीत डे',                role_en: 'Member',         role_hi: 'सदस्य', designation_en: 'Professor', designation_hi: 'प्रोफेसर', mobile: '+91 98765 43211' },
    { name_en: 'Prof. Siddhartha Sankar Saha', name_hi: 'प्रो. सिद्धार्थ शंकर साहा',    role_en: 'Member',         role_hi: 'सदस्य', designation_en: 'Professor', designation_hi: 'प्रोफेसर', mobile: '+91 98765 43212' },
    { name_en: 'Prof. Sandip Mondal',          name_hi: 'प्रो. संदीप मंडल',              role_en: 'Member',         role_hi: 'सदस्य', designation_en: 'Professor', designation_hi: 'प्रोफेसर', mobile: '+91 98765 43213' },
    { name_en: 'Prof. Diptendu Chatterjee',    name_hi: 'प्रो. दीप्तेंदु चटर्जी',       role_en: 'Member',         role_hi: 'सदस्य', designation_en: 'Professor', designation_hi: 'प्रोफेसर', mobile: '+91 98765 43214' },
    { name_en: 'Student Nominee',              name_hi: 'छात्र नामिती',                  role_en: 'Invitee Member', role_hi: 'आमंत्रित सदस्य', designation_en: 'Student Representative', designation_hi: 'छात्र प्रतिनिधि', mobile: '+91 98765 43215' },
  ];

  // Merge backend members with default values for missing fields
  // Use defaultMembers if backend returns empty array or null
  const hasValidMembers = Array.isArray(members) && members.length > 0;
  const sgrcMembers = hasValidMembers ? members.map(member => ({
    ...member,
    designation_en: member.designation_en || '',
    designation_hi: member.designation_hi || '',
    mobile: member.mobile || '',
  })) : defaultMembers;

  // Dynamic values based on settings loaded from API or local defaults
  const studentSla = systemSettings.student_resolution_days || 22;
  const facultySla = systemSettings.faculty_resolution_days || 15;
  const staffSla = systemSettings.staff_resolution_days || 30;

  // Localized FAQ seeds
  const faqs = [
    {
      q_en: "Who can file a grievance on this portal?",
      q_hi: "इस पोर्टल पर कौन शिकायत दर्ज कर सकता है?",
      a_en: "Any registered student, teaching faculty member, or non-teaching staff member of SRFTI with an official '@srfti.ac.in' email address can log in and file a grievance.",
      a_hi: "एसआरएफटीआई का कोई भी पंजीकृत छात्र, शिक्षण संकाय सदस्य, या गैर-शिक्षण कर्मचारी सदस्य जिसके पास आधिकारिक '@srfti.ac.in' ईमेल पता है, लॉग इन कर शिकायत दर्ज कर सकता है।"
    },
    {
      q_en: "What are the standard resolution timelines?",
      q_hi: "मानक निवारण समय-सीमा क्या है?",
      a_en: `As per university guidelines, Student complaints must be addressed within ${studentSla} days, Teaching Faculty within ${facultySla} days, and Non-Teaching Staff within ${staffSla} days.`,
      a_hi: `विश्वविद्यालय के दिशानिर्देशों के अनुसार, छात्रों की शिकायतों का निवारण ${studentSla} दिनों के भीतर, शिक्षण संकाय का ${facultySla} दिनों के भीतर, और गैर-शिक्षण कर्मचारियों का ${staffSla} दिनों के भीतर किया जाना चाहिए।`
    },
    {
      q_en: "What happens if I am not satisfied with the Nodal Officer's resolution?",
      q_hi: "यदि मैं नोडल अधिकारी के समाधान से संतुष्ट नहीं हूं तो क्या होगा?",
      a_en: "You have the right to reject the resolution and appeal. Student appeals go directly to the Ombudsman (Lokpal). Faculty appeals route to the Dean of Academic Affairs, and Staff appeals route to the Registrar.",
      a_hi: "आपको समाधान को अस्वीकार करने और अपील करने का अधिकार है। छात्रों की अपील सीधे लोकपाल (Ombudsman) के पास जाती है। संकाय की अपील डीन (शैक्षणिक मामले) और कर्मचारियों की अपील कुलसचिव (Registrar) के पास जाती है।"
    },
    {
      q_en: "Can students upload references or supporting documents?",
      q_hi: "क्या छात्र संदर्भ या सहायक दस्तावेज अपलोड कर सकते हैं?",
      a_en: "Yes, students can upload supporting documents (PDFs, Images, letters) up to 5MB while filing a grievance to serve as evidentiary references.",
      a_hi: "हाँ, छात्र शिकायत दर्ज करते समय साक्ष्य के रूप में संदर्भ के लिए 5MB तक के सहायक दस्तावेज (पीडीएफ, चित्र, पत्र) अपलोड कर सकते हैं।"
    }
  ];

  // ─── Procedure flow steps (bilingual) ────────────────────────────────────────
  // Each step may be linear OR branch into two parallel paths.
  // Shape: { id, icon, label_en, label_hi, branch?: { left, right } }
  const procedureSteps = [
    {
      id: 'submit',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      ),
      label_en: 'Submit Complaint via Web Portal',
      label_hi: 'वेब पोर्टल के माध्यम से शिकायत दर्ज करें',
    },
    {
      id: 'sgrc',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      label_en: 'Discussion in SGRC Meetings',
      label_hi: 'एसजीआरसी बैठकों में चर्चा',
    },
    {
      id: 'branch-process',
      icon: null,
      label_en: '',
      label_hi: '',
      branch: {
        left: {
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          ),
          label_en: 'Referred to Sections / Departments',
          label_hi: 'अनुभागों / विभागों को भेजा गया',
        },
        right: {
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          ),
          label_en: 'Hearing / Personal Appearances',
          label_hi: 'सुनवाई / व्यक्तिगत उपस्थिति',
        },
      },
    },
    {
      id: 'status',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
      ),
      label_en: 'Status Update Communicated to Complainant',
      label_hi: 'शिकायतकर्ता को स्थिति अपडेट सूचित किया गया',
    },
    {
      id: 'branch-outcome',
      icon: null,
      label_en: '',
      label_hi: '',
      branch: {
        left: {
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ),
          label_en: 'Satisfied — Feedback & Close Complaint',
          label_hi: 'संतुष्ट — प्रतिक्रिया दें एवं शिकायत बंद करें',
          accent: '#16a34a',
          bg: '#f0fdf4',
          border: '#86efac',
        },
        right: {
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          ),
          label_en: 'Not Satisfied — Escalate to Ombudsperson',
          label_hi: 'असंतुष्ट — लोकपाल को अग्रेषित करें',
          accent: '#dc2626',
          bg: '#fef2f2',
          border: '#fca5a5',
        },
      },
    },
  ];

  // ─── Inline styles for the flow ──────────────────────────────────────────────
  const flowStyles = {
    wrapper: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0,
      maxWidth: '700px',
      margin: '0 auto',
    },
    stepBox: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      background: 'var(--bg-card)',
      border: '1.5px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '0.9rem 1.4rem',
      width: '100%',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    },
    iconCircle: {
      flexShrink: 0,
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: 'var(--primary-light, #e8f5e9)',
      color: 'var(--primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepLabel: {
      fontWeight: 600,
      fontSize: '0.97rem',
      color: 'var(--text-main)',
    },
    arrow: {
      width: '2px',
      height: '28px',
      background: 'var(--primary)',
      margin: '0 auto',
      position: 'relative',
    },
    branchRow: {
      display: 'flex',
      gap: '1rem',
      width: '100%',
    },
    branchBox: (accent, bg, border) => ({
      flex: 1,
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.65rem',
      background: bg || 'var(--bg-card)',
      border: `1.5px solid ${border || 'var(--border-color)'}`,
      borderRadius: 'var(--radius-md)',
      padding: '0.85rem 1rem',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }),
    branchIcon: (accent) => ({
      flexShrink: 0,
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      background: accent ? `${accent}18` : 'var(--primary-light, #e8f5e9)',
      color: accent || 'var(--primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    branchLabel: (accent) => ({
      fontWeight: 600,
      fontSize: '0.9rem',
      color: accent || 'var(--text-main)',
      lineHeight: 1.35,
    }),
    // The horizontal bridge lines above a branch row
    bridgeWrapper: {
      display: 'flex',
      width: '100%',
      alignItems: 'flex-start',
      justifyContent: 'center',
      height: '28px',
    },
  };

  // Helper: vertical down-arrow divider
  const Arrow = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 auto' }}>
      <div style={flowStyles.arrow} />
      {/* arrowhead */}
      <svg width="12" height="7" viewBox="0 0 12 7" fill="var(--primary)" style={{ marginTop: '-1px' }}>
        <path d="M6 7L0 0h12z" />
      </svg>
    </div>
  );

  // Helper: Y-split — two vertical lines diverging
  const YSplit = () => (
    <svg width="200" height="28" viewBox="0 0 200 28" style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}>
      <line x1="100" y1="0" x2="100" y2="14" stroke="var(--primary)" strokeWidth="2" />
      <line x1="100" y1="14" x2="40" y2="28" stroke="var(--primary)" strokeWidth="2" />
      <line x1="100" y1="14" x2="160" y2="28" stroke="var(--primary)" strokeWidth="2" />
    </svg>
  );

  // Helper: Y-merge — two lines converging back
  const YMerge = () => (
    <svg width="200" height="28" viewBox="0 0 200 28" style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}>
      <line x1="40" y1="0" x2="100" y2="14" stroke="var(--primary)" strokeWidth="2" />
      <line x1="160" y1="0" x2="100" y2="14" stroke="var(--primary)" strokeWidth="2" />
      <line x1="100" y1="14" x2="100" y2="28" stroke="var(--primary)" strokeWidth="2" />
      <polygon points="94,24 106,24 100,28" fill="var(--primary)" />
    </svg>
  );

  return (
    <div>
      {/* Hero Section */}
      <section className="card landing-hero" aria-labelledby="hero-title">
        <h2 id="hero-title" className="landing-hero-title">
          {t('welcomeTitle')}
        </h2>
        <p className="landing-hero-desc">
          {t('welcomeDesc')}
        </p>
        <div className="landing-hero-btns">
          <button
            className="btn btn-primary"
            onClick={() => setCurrentView('auth')}
          >
            {t('fileNewGrievanceBtn')}
          </button>
          <span className="landing-hero-divider">/</span>
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentView('auth')}
          >
            {t('trackGrievanceBtn')}
          </button>
        </div>
      </section>

      {/* UGC Regulations banner */}
      <section className="alert-banner warning" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '2.5rem' }}>
        <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01" />
        </svg>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{t('ugcNoticeTitle')}</h3>
          <p style={{ fontSize: '0.95rem' }}>{t('ugcNoticeText')}</p>
        </div>
      </section>

      {/*
       * ─────────────────────────────────────────────────────────────────────────
       * COMMENTED OUT: SLA Timeline Grid (Redressal Timelines & Appellate
       * Hierarchies). Replaced below with the Grievance Redressal Procedure Flow.
       * ─────────────────────────────────────────────────────────────────────────
       *
       * <section aria-labelledby="timeline-grid-title">
       *   <h3 id="timeline-grid-title" ...>
       *     {language === 'en' ? 'Redressal Timelines & Appellate Hierarchies' : '...'}
       *   </h3>
       *   <div className="landing-grid">
       *     [Student SLA Card]
       *     [Faculty SLA Card]
       *     [Staff SLA Card]
       *   </div>
       * </section>
       */}

      {/* ── Grievance Redressal Procedure Flow + SGRC Committee (side-by-side) ── */}
      <section aria-labelledby="procedure-flow-title" style={{ marginBottom: '3.5rem' }}>

        {/* Section heading — full width above both columns */}
        <h3
          id="procedure-flow-title"
          style={{ fontSize: '1.6rem', textAlign: 'center', marginBottom: '0.5rem' }}
        >
          {language === 'en' ? 'Grievance Redressal Procedure' : 'शिकायत निवारण प्रक्रिया'}
        </h3>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          {language === 'en'
            ? 'As defined under Provision 3(f) — UGC Gazette Notification, 11 April 2023'
            : 'प्रावधान 3(एफ) के अनुसार — यूजीसी राजपत्र अधिसूचना, 11 अप्रैल 2023'}
        </p>

        {/* Two-column wrapper */}
        <div style={{
          display: 'flex',
          gap: '1.75rem',
          alignItems: 'flex-start',
        }}>

          {/* ── LEFT: Procedure flow ─────────────────────────────────────────── */}
          <div style={{ flex: '1 1 0', minWidth: 0, ...flowStyles.wrapper }}>

            {/* Step 1 — Submit */}
            <div style={{ ...flowStyles.stepBox, borderLeftColor: 'var(--primary)', borderLeftWidth: '4px' }}>
              <div style={flowStyles.iconCircle}>{procedureSteps[0].icon}</div>
              <span style={flowStyles.stepLabel}>
                {language === 'en' ? procedureSteps[0].label_en : procedureSteps[0].label_hi}
              </span>
            </div>

            <Arrow />

            {/* Step 2 — SGRC */}
            <div style={{ ...flowStyles.stepBox, borderLeftColor: 'var(--primary)', borderLeftWidth: '4px' }}>
              <div style={flowStyles.iconCircle}>{procedureSteps[1].icon}</div>
              <span style={flowStyles.stepLabel}>
                {language === 'en' ? procedureSteps[1].label_en : procedureSteps[1].label_hi}
              </span>
            </div>

            {/* Fork: Y-split into two parallel paths */}
            <YSplit />

            {/* Branch row: Departments | Hearings */}
            <div style={flowStyles.branchRow}>
              <div style={flowStyles.branchBox()}>
                <div style={flowStyles.branchIcon()}>{procedureSteps[2].branch.left.icon}</div>
                <span style={flowStyles.branchLabel()}>
                  {language === 'en'
                    ? procedureSteps[2].branch.left.label_en
                    : procedureSteps[2].branch.left.label_hi}
                </span>
              </div>
              <div style={flowStyles.branchBox()}>
                <div style={flowStyles.branchIcon()}>{procedureSteps[2].branch.right.icon}</div>
                <span style={flowStyles.branchLabel()}>
                  {language === 'en'
                    ? procedureSteps[2].branch.right.label_en
                    : procedureSteps[2].branch.right.label_hi}
                </span>
              </div>
            </div>

            {/* Merge back */}
            <YMerge />

            {/* Step 4 — Status Update */}
            <div style={{ ...flowStyles.stepBox, borderLeftColor: 'var(--primary)', borderLeftWidth: '4px' }}>
              <div style={flowStyles.iconCircle}>{procedureSteps[3].icon}</div>
              <span style={flowStyles.stepLabel}>
                {language === 'en' ? procedureSteps[3].label_en : procedureSteps[3].label_hi}
              </span>
            </div>

            {/* Fork: Y-split into Satisfied | Not Satisfied */}
            <YSplit />

            {/* Outcome branch row */}
            <div style={flowStyles.branchRow}>
              {/* Satisfied */}
              <div style={flowStyles.branchBox(
                procedureSteps[4].branch.left.accent,
                procedureSteps[4].branch.left.bg,
                procedureSteps[4].branch.left.border
              )}>
                <div style={flowStyles.branchIcon(procedureSteps[4].branch.left.accent)}>
                  {procedureSteps[4].branch.left.icon}
                </div>
                <span style={flowStyles.branchLabel(procedureSteps[4].branch.left.accent)}>
                  {language === 'en'
                    ? procedureSteps[4].branch.left.label_en
                    : procedureSteps[4].branch.left.label_hi}
                </span>
              </div>

              {/* Not Satisfied */}
              <div style={flowStyles.branchBox(
                procedureSteps[4].branch.right.accent,
                procedureSteps[4].branch.right.bg,
                procedureSteps[4].branch.right.border
              )}>
                <div style={flowStyles.branchIcon(procedureSteps[4].branch.right.accent)}>
                  {procedureSteps[4].branch.right.icon}
                </div>
                <span style={flowStyles.branchLabel(procedureSteps[4].branch.right.accent)}>
                  {language === 'en'
                    ? procedureSteps[4].branch.right.label_en
                    : procedureSteps[4].branch.right.label_hi}
                </span>
              </div>
            </div>

          </div>
          {/* ── END LEFT column ──────────────────────────────────────────────── */}

          {/* ── RIGHT: SGRC Constitution card (sticky) ───────────────────────── */}
          <aside
            aria-labelledby="sgrc-panel-heading"
            style={{
              flex: '0 0 300px',
              position: 'sticky',
              top: '1.5rem',
              alignSelf: 'flex-start',
              background: 'var(--bg-card)',
              border: '1.5px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}
          >
            {/* Card header */}
            <div className="sgrc-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <h4
                id="sgrc-panel-heading"
              >
                {language === 'en' ? 'Constitution of the SGRC' : 'एसजीआरसी का गठन'}
              </h4>
            </div>

            {/* Member rows */}
            <div style={{ padding: '0.25rem 0' }}>
              {sgrcMembers.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0.75rem 1.1rem',
                    gap: '0.25rem',
                    borderBottom: i < sgrcMembers.length - 1 ? '1px solid var(--border-color)' : 'none',
                    background: m.role_en === 'Chairperson' ? 'var(--primary-light, #e8f5e9)' : 'transparent',
                  }}
                >
                  {/* Name & Role row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: m.role_en === 'Chairperson' ? 700 : 500, fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.3 }}>
                        {language === 'en' ? m.name_en : m.name_hi}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {m.designation_en ? (language === 'en' ? m.designation_en : m.designation_hi) : '-'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        {m.mobile || '-'}
                      </span>
                    </div>
                    <span style={{
                      flexShrink: 0,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: m.role_en === 'Chairperson' ? 'var(--primary)' : 'var(--text-muted)',
                      background: m.role_en === 'Chairperson' ? 'var(--primary-light, #e8f5e9)' : 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '999px',
                      padding: '0.15rem 0.6rem',
                      whiteSpace: 'nowrap',
                    }}>
                      {language === 'en' ? m.role_en : m.role_hi}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </aside>
          {/* ── END RIGHT column ─────────────────────────────────────────────── */}

        </div>{/* end two-column wrapper */}
      </section>
      {/* ── End Grievance Redressal Procedure Flow ─────────────────────────────── */}

      {/* FAQs Section */}
      <section style={{ marginTop: '3.5rem' }} aria-labelledby="faq-title">
        <h3 id="faq-title" style={{ fontSize: '1.6rem', textAlign: 'center', marginBottom: '2rem' }}>
          {language === 'en' ? 'Frequently Asked Questions (FAQ)' : 'अक्सर पूछे जाने वाले प्रश्न (FAQ)'}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '800px', margin: '0 auto' }}>
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            const qText = language === 'en' ? faq.q_en : faq.q_hi;
            const aText = language === 'en' ? faq.a_en : faq.a_hi;

            return (
              <div
                key={index}
                className="card"
                style={{ padding: '0', overflow: 'hidden' }}
              >
                <button
                  style={{
                    width: '100%',
                    padding: '1.25rem 1.5rem',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '1.05rem',
                    color: 'var(--text-main)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-content-${index}`}
                >
                  <span>{qText}</span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {isOpen && (
                  <div
                    id={`faq-content-${index}`}
                    style={{
                      padding: '0 1.5rem 1.5rem 1.5rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.95rem',
                      borderTop: '1px solid var(--border-color)',
                      paddingTop: '1rem',
                      backgroundColor: 'var(--bg-app)'
                    }}
                    role="region"
                  >
                    {aText}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default LandingPage;