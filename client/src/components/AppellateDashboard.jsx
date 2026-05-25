// Appellate Authority dashboard, featuring the Student Ombudsman Lokpal Tribunal and final binding rulings

import React, { useState, useEffect } from 'react';
import { API_URL } from '../App';

function AppellateDashboard({ t, currentUser, authToken }) {
  const [grievances, setGrievances] = useState([]);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [grievanceHistory, setGrievanceHistory] = useState([]);
  
  const [actionRemarks, setActionRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch escalated grievances assigned to their sector
  const fetchEscalations = async () => {
    try {
      const res = await fetch(`${API_URL}/grievances`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGrievances(data);
      }
    } catch (err) {
      console.warn('[API Fetch] Failed. Running in local simulation mode.');
      // Local Mock DB hydrate if server offline
      const localGrievances = JSON.parse(localStorage.getItem('srfti_sim_grievances')) || [];
      // Filter for escalated status and matching sector
      setGrievances(localGrievances.filter(g => g.status === 'escalated' && g.category.toLowerCase().includes(currentUser.complainant_type.slice(0, 3))));
    }
  };

  useEffect(() => {
    fetchEscalations();
  }, [authToken]);

  // Load audit trail for review
  const handleSelectGrievance = async (g) => {
    setSelectedGrievance(g);
    setGrievanceHistory([]);
    setActionRemarks('');
    
    try {
      const res = await fetch(`${API_URL}/grievances/${g.id}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedGrievance(data.grievance);
        setGrievanceHistory(data.history);
      }
    } catch (err) {
      // Local mock history
      const localHistory = JSON.parse(localStorage.getItem(`srfti_sim_history_${g.id}`)) || [];
      setGrievanceHistory(localHistory);
    }
  };

  // Submit final binding ruling
  const handleFinalize = async (e) => {
    e.preventDefault();
    if (!actionRemarks) {
      setError(t('labelFinalRemarks'));
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/grievances/${selectedGrievance.id}/action`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'finalize', remarks: actionRemarks })
      });

      if (res.ok) {
        setSuccess('Final binding ruling issued successfully and case closed.');
        setActionRemarks('');
        setSelectedGrievance(null);
        fetchEscalations();
      } else {
        const data = await res.json();
        throw new Error(data.message || 'Action execution failed');
      }
    } catch (err) {
      console.warn('[API Action] Offline mode simulation.');
      
      // Update local storage values
      const localGrievances = JSON.parse(localStorage.getItem('srfti_sim_grievances')) || [];
      const index = localGrievances.findIndex(g => g.id === selectedGrievance.id);
      
      if (index !== -1) {
        localGrievances[index].status = 'resolved';
        localGrievances[index].resolved_at = new Date().toISOString();
        localStorage.setItem('srfti_sim_grievances', JSON.stringify(localGrievances));
      }

      // Append Audit Trail history
      const localHistory = JSON.parse(localStorage.getItem(`srfti_sim_history_${selectedGrievance.id}`)) || [];
      localHistory.push({
        id: localHistory.length + 1,
        grievance_id: selectedGrievance.id,
        action_by: currentUser.id,
        action_by_name: currentUser.name,
        action_by_role: 'appellate_authority',
        action_type: 'finalize',
        remarks: actionRemarks,
        created_at: new Date().toISOString()
      });
      localStorage.setItem(`srfti_sim_history_${selectedGrievance.id}`, JSON.stringify(localHistory));

      setSuccess('Final binding ruling issued successfully (Simulated Local Mode).');
      setActionRemarks('');
      setSelectedGrievance(null);
      fetchEscalations();
    } finally {
      setLoading(false);
    }
  };

  // Check if this is the student ombudsman
  const isStudentOmbudsman = currentUser.complainant_type === 'student';

  return (
    <div>
      {/* Dynamic branding header */}
      <section className="card" style={{ padding: '2rem', borderBottom: '5px solid var(--secondary)', background: 'var(--bg-card)', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.6rem', color: isStudentOmbudsman ? 'var(--primary)' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isStudentOmbudsman && (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--secondary)' }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          )}
          {isStudentOmbudsman ? t('appellateHeadingStudent') : t('appellateQueue')}
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Logged in: <strong>{currentUser.name}</strong> | Title: <strong>{isStudentOmbudsman ? 'Ombudsman (Lokpal)' : t(`select${currentUser.complainant_type.charAt(0).toUpperCase() + currentUser.complainant_type.slice(1)}`) + ' Appellate Authority'}</strong>
        </p>
      </section>

      {success && (
        <div className="alert-banner success" role="alert">
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert-banner error" role="alert">
          <span>{error}</span>
        </div>
      )}

      {/* Escalated grievances queue */}
      <section className="card" aria-labelledby="appellate-grid-heading">
        <h3 id="appellate-grid-heading" className="card-header" style={{ fontSize: '1.25rem' }}>
          Escalated Hearing Docket
        </h3>
        
        {grievances.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
            No escalated cases pending in your jurisdiction.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }} role="table">
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', fontWeight: 700 }}>
                  <th style={{ padding: '0.75rem' }}>ID</th>
                  <th style={{ padding: '0.75rem' }}>Grievance Subject</th>
                  <th style={{ padding: '0.75rem' }}>Category</th>
                  <th style={{ padding: '0.75rem' }}>Complainant Name</th>
                  <th style={{ padding: '0.75rem' }}>Original Submission</th>
                  <th style={{ padding: '0.75rem' }}>Current Status</th>
                  <th style={{ padding: '0.75rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {grievances.map((g) => (
                  <tr key={g.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>{g.case_id}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{g.title}</td>
                    <td style={{ padding: '0.75rem' }}>{g.category}</td>
                    <td style={{ padding: '0.75rem' }}>{g.complainant_name || 'Rahul Banerjee'}</td>
                    <td style={{ padding: '0.75rem' }}>{new Date(g.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="status-badge escalated">Escalated</span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        onClick={() => handleSelectGrievance(g)}
                      >
                        Convene Hearing
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Hearing review & decision making drawer */}
      {selectedGrievance && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }} role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="card" style={{ maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'var(--bg-app)', border: '2px solid var(--primary)' }}>
            
            <div className="card-header">
              <h3 id="modal-title" style={{ fontSize: '1.25rem' }}>
                Tribunal Audit and Ruling Board: {selectedGrievance.case_id}
              </h3>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.25rem 0.5rem', border: 'none', fontSize: '1.2rem', color: 'var(--text-main)' }}
                onClick={() => setSelectedGrievance(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <h4 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>{selectedGrievance.title}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Complainant: <strong>{selectedGrievance.complainant_name || 'Rahul Banerjee'}</strong> | Sector: <strong>{selectedGrievance.complainant_type}</strong>
                </p>
                <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
                  {selectedGrievance.description}
                </div>

                {selectedGrievance.attachment_path && (
                  <div style={{ margin: '1rem 0' }}>
                    <strong>Evidentiary Reference Uploads:</strong>{' '}
                    <a href={`${selectedGrievance.attachment_path}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>
                      Open File Attachment
                    </a>
                  </div>
                )}

                {selectedGrievance.resolution_report_path && (
                  <div style={{ margin: '1rem 0', padding: '0.75rem', border: '2px solid var(--status-resolved-text)', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(22, 163, 74, 0.05)' }}>
                    <strong style={{ color: 'var(--status-resolved-text)' }}>📋 Nodal Officer Resolution Report:</strong>{' '}
                    <a href={`${selectedGrievance.resolution_report_path}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>
                      View Resolution Report
                    </a>
                  </div>
                )}
              </div>

              {/* Case details snapshot */}
              <div className="card" style={{ padding: '1rem', background: 'var(--bg-card)' }}>
                <h5 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Docket Overview</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div>Case ID: <strong>{selectedGrievance.case_id}</strong></div>
                  <div>Assigned Nodal: <strong>{selectedGrievance.nodal_name || 'Nodal Officer'}</strong></div>
                  <div>Original Limit: <strong>{selectedGrievance.timeline_days} Days</strong></div>
                  <div>SLA Timer status: <span className="status-badge escalated">Timeline Breached</span></div>
                </div>
              </div>
            </div>

            {/* Audit Logs trail */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Full History & Audit Trail</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {grievanceHistory.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.5rem 0' }}>No action logs recorded yet.</p>
                ) : (
                  grievanceHistory.map((h, i) => {
                    const isIntermediate = h.action_type === 'intermediate_reply';
                    return (
                      <div key={i} style={{ padding: '0.75rem 1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', borderLeft: `3px solid ${isIntermediate ? '#f59e0b' : 'var(--primary)'}`, fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: '0.25rem', alignItems: 'center' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {h.action_by_name} ({h.action_by_role})
                            {isIntermediate && (
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                                INTERMEDIATE REPLY
                              </span>
                            )}
                            {h.action_type === 'resolved' && (
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>
                                RESOLVED
                              </span>
                            )}
                            {h.action_type === 'in_progress' && (
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                                INVESTIGATION
                              </span>
                            )}
                            {h.action_type === 'appealed' && (
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
                                APPEALED
                              </span>
                            )}
                            {h.action_type === 'finalize' && (
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe' }}>
                                FINAL RULING
                              </span>
                            )}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem', flexShrink: 0 }}>{new Date(h.created_at).toLocaleString()}</span>
                        </div>
                        <div style={{ color: 'var(--text-main)', fontStyle: 'italic' }}>"{h.remarks}"</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Final Ruling Form */}
            <form onSubmit={handleFinalize} style={{ padding: '1.25rem', border: '2px solid var(--secondary)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-card)' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '1rem', color: 'var(--primary)' }}>
                {isStudentOmbudsman ? '⚖️ Issue Final Binding Lokpal Judgment' : '⚖️ Issue Final Appellate Directive'}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                {language === 'en'
                  ? 'Your judgment is binding under UGC guidelines and institute regulations. Write the decision remarks clearly. This will finalize the case.'
                  : 'आपका निर्णय यूजीसी के दिशानिर्देशों और संस्थान के नियमों के तहत बाध्यकारी है। निर्णय की टिप्पणियों को स्पष्ट रूप से लिखें। इससे मामला समाप्त हो जाएगा।'}
              </p>

              <div className="form-group">
                <label className="form-label" htmlFor="appellate-remarks">{t('labelFinalRemarks')} *</label>
                <textarea
                  id="appellate-remarks"
                  className="form-control"
                  rows="4"
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  placeholder="Enter the final ruling directives, timelines, and binding resolution instructions here..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-accent" disabled={loading}>
                  {loading ? t('loading') : t('btnFinalizeAppellate')}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedGrievance(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppellateDashboard;
