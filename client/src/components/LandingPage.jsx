// Landing page component featuring bilingual FAQs, timelines, and UGC instructions

import React, { useState } from 'react';

function LandingPage({ t, setCurrentView, systemSettings, appellateConfigs, language }) {
  const [activeFaq, setActiveFaq] = useState(null);

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

  return (
    <div>
      {/* Hero Section */}
      <section className="card" style={{ padding: '3rem 2rem', textHeight: '1.5', textAlign: 'center', marginBottom: '2.5rem', background: 'var(--bg-card)' }} aria-labelledby="hero-title">
        <h2 id="hero-title" style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>
          {t('welcomeTitle')}
        </h2>
        <p style={{ maxWidth: '800px', margin: '0 auto 2rem auto', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          {t('welcomeDesc')}
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary" 
            style={{ fontSize: '1.05rem', padding: '1rem 2rem' }}
            onClick={() => setCurrentView('auth')}
          >
            {t('fileNewGrievanceBtn')}
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ fontSize: '1.05rem', padding: '1rem 2rem' }}
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

      {/* SLA Timeline Grid */}
      <section aria-labelledby="timeline-grid-title">
        <h3 id="timeline-grid-title" style={{ fontSize: '1.6rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          {language === 'en' ? 'Redressal Timelines & Appellate Hierarchies' : 'निवारण समय-सीमा और अपीलीय पदानुक्रम'}
        </h3>
        
        <div className="landing-grid">
          {/* Student SLA Card */}
          <article className="card" style={{ borderLeft: '6px solid var(--primary)' }}>
            <h4 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{t('timelineStudentCard')}</span>
              <span className="status-badge resolved">{studentSla} {t('daysUnit')}</span>
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1rem' }}>
              {language === 'en' 
                ? 'Strict grievance monitoring in accordance with UGC Regulations. Direct escalations mapped to Ombudsman.' 
                : 'यूजीसी विनियमों के अनुसार सख्त शिकायत निगरानी। सीधे लोकपाल को अग्रेषित करने की सुविधा उपलब्ध।'}
            </p>
            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
              <strong>{t('appellateTitle')}:</strong> <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{t('studentAppellateBody')}</span>
            </div>
          </article>

          {/* Faculty SLA Card */}
          <article className="card" style={{ borderLeft: '6px solid #2563eb' }}>
            <h4 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{t('timelineFacultyCard')}</span>
              <span className="status-badge pending" style={{ color: '#2563eb', backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}>
                {facultySla} {t('daysUnit')}
              </span>
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1rem' }}>
              {language === 'en'
                ? 'Academic dispute resolution system covering coursework, duties, and professional standards.'
                : 'शैक्षणिक विवाद निवारण प्रणाली जिसमें पाठ्यक्रम, कर्तव्य और व्यावसायिक मानक शामिल हैं।'}
            </p>
            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
              <strong>{t('appellateTitle')}:</strong> <span style={{ color: '#2563eb', fontWeight: 600 }}>{t('facultyAppellateBody')}</span>
            </div>
          </article>

          {/* Staff SLA Card */}
          <article className="card" style={{ borderLeft: '6px solid #16a34a' }}>
            <h4 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{t('timelineStaffCard')}</span>
              <span className="status-badge pending" style={{ color: '#16a34a', backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                {staffSla} {t('daysUnit')}
              </span>
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1rem' }}>
              {language === 'en'
                ? 'Resolving administrative anomalies, working shifts, facilities, and staff welfare matters.'
                : 'प्रशासनिक विसंगतियों, कार्य पालियों, सुविधाओं और कर्मचारी कल्याण मामलों का निवारण।'}
            </p>
            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
              <strong>{t('appellateTitle')}:</strong> <span style={{ color: '#16a34a', fontWeight: 600 }}>{t('staffAppellateBody')}</span>
            </div>
          </article>
        </div>
      </section>

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
