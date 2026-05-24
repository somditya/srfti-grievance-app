// Complainant Dashboard enabling filing of new grievances, step trackers, file attachments, and escalations

import React, { useState, useEffect } from 'react';
import { API_URL } from '../App';

function ComplainantDashboard({ t, currentUser, authToken, systemSettings, appellateConfigs, language }) {
  const [grievances, setGrievances] = useState([]);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [grievanceHistory, setGrievanceHistory] = useState([]);
  
  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Academic Matter');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState(null);
  
  // Action states
  const [actionRemarks, setActionRemarks] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);

  // Fetch Complainant's grievances on load
  const fetchGrievances = async () => {
    try {
      const res = await fetch(`${API_URL}/grievances`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGrievances(data);
      }
    } catch (err) {
      console.warn('[API Fetch] Failed to load grievances. Initializing with simulated local database.');
      // Local Mock DB hydrate if server offline
      const localGrievances = JSON.parse(localStorage.getItem('srfti_sim_grievances')) || [];
      // Filter for this user
      setGrievances(localGrievances.filter(g => g.complainant_id === currentUser.id));
    }
  };

  useEffect(() => {
    fetchGrievances();
  }, [authToken]);

  // Load specific grievance details & audit trail
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
      } else {
        throw new Error('Fallback to local');
      }
    } catch (err) {
      // Local mock history
      const localHistory = JSON.parse(localStorage.getItem(`srfti_sim_history_${g.id}`)) || [
        {
          id: 1,
          action_by_name: currentUser.name,
          action_by_role: 'complainant',
          action_type: 'submitted',
          remarks: 'Grievance registered and routed to respective Nodal Officer.',
          created_at: g.created_at
        }
      ];
      setGrievanceHistory(localHistory);
    }
  };

  // Submit new grievance
  const handleSubmitGrievance = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!title || !description) {
      setError(t('errFieldsRequired'));
      setLoading(false);
      return;
    }

    try {
      // Use FormData to support file attachments
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('description', description);
      if (attachment) {
        formData.append('attachment', attachment);
      }

      const res = await fetch(`${API_URL}/grievances`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: formData
      });

      if (res.ok) {
        setSuccess('Grievance filed successfully!');
        setTitle('');
        setDescription('');
        setAttachment(null);
        setShowNewForm(false);
        fetchGrievances();
      } else {
        const data = await res.json();
        throw new Error(data.message || 'Submission failed');
      }
    } catch (err) {
      console.warn('[API Submit] Server unreachable. Writing to simulated local state.');
      
      // Simulate Local Storage DB insert
      const localGrievances = JSON.parse(localStorage.getItem('srfti_sim_grievances')) || [];
      const newId = localGrievances.length + 101;
      
      const timelineDays = parseInt(systemSettings[`${currentUser.complainant_type}_resolution_days`]) || 30;
      
      const newG = {
        id: newId,
        complainant_id: currentUser.id,
        category,
        title,
        description,
        attachment_path: attachment ? URL.createObjectURL(attachment) : null,
        status: 'pending',
        nodal_officer_id: null,
        timeline_days: timelineDays,
        created_at: new Date().toISOString(),
        resolved_at: null,
        nodal_name: `Nodal Officer (${currentUser.complainant_type})`
      };
      
      localGrievances.unshift(newG);
      localStorage.setItem('srfti_sim_grievances', JSON.stringify(localGrievances));
      
      // Seed audit history
      const initialHistory = [{
        id: 1,
        grievance_id: newId,
        action_by: currentUser.id,
        action_by_name: currentUser.name,
        action_by_role: 'complainant',
        action_type: 'submitted',
        remarks: 'Grievance registered in system and routed to respective Nodal Officer.',
        created_at: new Date().toISOString()
      }];
      localStorage.setItem(`srfti_sim_history_${newId}`, JSON.stringify(initialHistory));
      
      setSuccess('Grievance filed successfully (Simulated Local Mode).');
      setTitle('');
      setDescription('');
      setAttachment(null);
      setShowNewForm(false);
      fetchGrievances();
    } finally {
      setLoading(false);
    }
  };

  // Accept resolution or File Appeal (Escalate)
  const handleAction = async (actionType) => {
    if (actionType === 'appeal' && !actionRemarks) {
      setError(t('labelAppealRemarks'));
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
        body: JSON.stringify({ action: actionType, remarks: actionRemarks })
      });

      if (res.ok) {
        setSuccess(t('successAction'));
        setActionRemarks('');
        setSelectedGrievance(null);
        fetchGrievances();
      } else {
        throw new Error('API Action failed');
      }
    } catch (err) {
      console.warn('[API Action] Offline mode simulation.');
      
      // Update local storage values
      const localGrievances = JSON.parse(localStorage.getItem('srfti_sim_grievances')) || [];
      const index = localGrievances.findIndex(g => g.id === selectedGrievance.id);
      
      if (index !== -1) {
        localGrievances[index].status = actionType === 'appeal' ? 'escalated' : 'resolved';
        if (actionType === 'resolve') {
          localGrievances[index].resolved_at = new Date().toISOString();
        }
        localStorage.setItem('srfti_sim_grievances', JSON.stringify(localGrievances));
      }

      // Append Audit Trail history
      const localHistory = JSON.parse(localStorage.getItem(`srfti_sim_history_${selectedGrievance.id}`)) || [];
      localHistory.push({
        id: localHistory.length + 1,
        grievance_id: selectedGrievance.id,
        action_by: currentUser.id,
        action_by_name: currentUser.name,
        action_by_role: 'complainant',
        action_type: actionType === 'appeal' ? 'appealed' : 'resolved',
        remarks: actionRemarks || 'Resolution accepted by complainant.',
        created_at: new Date().toISOString()
      });
      localStorage.setItem(`srfti_sim_history_${selectedGrievance.id}`, JSON.stringify(localHistory));

      setSuccess(t('successAction'));
      setActionRemarks('');
      setSelectedGrievance(null);
      fetchGrievances();
    } finally {
      setLoading(false);
    }
  };

  // SLA Timeline Calculation Helper
  const getTimelineStats = (g) => {
    const start = new Date(g.created_at);
    const limit = g.timeline_days;
    const elapsed = Math.floor((new Date() - start) / (1000 * 60 * 60 * 24));
    const remaining = limit - elapsed;
    return {
      elapsed,
      remaining,
      isOverdue: remaining < 0
    };
  };

  const pendingCount = grievances.filter(g => g.status === 'pending' || g.status === 'in_progress').length;
  const resolvedCount = grievances.filter(g => g.status === 'resolved').length;
  const escalatedCount = grievances.filter(g => g.status === 'escalated').length;

  return (
    <div>
      {/* Complainant stats header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem' }}>{t('dashWelcome')} {currentUser.name}</h2>
          <p style={{ color: 'var(--text-muted)' }}>{t('fieldComplainantType')}: <strong>{t(`select${currentUser.complainant_type.charAt(0).toUpperCase() + currentUser.complainant_type.slice(1)}`)}</strong> | {currentUser.email}</p>
        </div>
        <button 
          className="btn btn-primary animate-pulse"
          onClick={() => setShowNewForm(!showNewForm)}
          aria-expanded={showNewForm}
        >
          {showNewForm ? (language === 'hi' ? 'कतार देखें' : 'View Queue') : t('fileNewGrievanceBtn')}
        </button>
      </div>

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

      {/* Lodge Grievance Form */}
      {showNewForm ? (
        <section className="card" aria-labelledby="form-heading" style={{ maxWidth: '750px', margin: '0 auto' }}>
          <h3 id="form-heading" className="card-header" style={{ fontSize: '1.25rem' }}>
            {t('fileGrievanceTitle')}
          </h3>
          <form onSubmit={handleSubmitGrievance}>
            <div className="form-group">
              <label className="form-label" htmlFor="g-title">{t('fieldTitle')} *</label>
              <input 
                type="text" 
                id="g-title" 
                className="form-control" 
                placeholder="Brief subject summary"
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="g-cat">{t('fieldCategory')} *</label>
              <select 
                id="g-cat" 
                className="form-control" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Academic Matter">{t('selectCategoryAcademic')}</option>
                <option value="Hostel & Campus Facilities">{t('selectCategoryFacilities')}</option>
                <option value="Administrative Issues">{t('selectCategoryAdmin')}</option>
                <option value="Harassment / Safety (High Priority)">{t('selectCategoryHarassment')}</option>
                <option value="Other Matters">{t('selectCategoryOther')}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="g-desc">{t('fieldDescription')} *</label>
              <textarea 
                id="g-desc" 
                className="form-control" 
                rows="6" 
                placeholder="Detail your grievance, specifying dates, names and course details if applicable..."
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="g-file">{t('fieldAttachment')}</label>
              <input 
                type="file" 
                id="g-file" 
                className="form-control" 
                onChange={(e) => setAttachment(e.target.files[0])}
              />
              <p className="form-help" id="file-help">{t('fieldAttachmentHelp')}</p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? t('loading') : t('submitGrievanceBtn')}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowNewForm(false)}>
                {language === 'en' ? 'Cancel' : 'रद्द करें'}
              </button>
            </div>
          </form>
        </section>
      ) : (
        /* Grievances Queue List */
        <div>
          {/* Summary counters grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <div className="card" style={{ textAlign: 'center', borderBottom: '4px solid var(--primary)' }}>
              <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Active</h4>
              <p style={{ fontSize: '2rem', fontWeight: 800 }}>{pendingCount}</p>
            </div>
            <div className="card" style={{ textAlign: 'center', borderBottom: '4px solid #16a34a' }}>
              <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Resolved</h4>
              <p style={{ fontSize: '2rem', fontWeight: 800 }}>{resolvedCount}</p>
            </div>
            <div className="card" style={{ textAlign: 'center', borderBottom: '4px solid #dc2626' }}>
              <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Escalated (Appealed)</h4>
              <p style={{ fontSize: '2rem', fontWeight: 800 }}>{escalatedCount}</p>
            </div>
          </div>

          {/* Grievances list card */}
          <section className="card" aria-labelledby="queue-heading">
            <h3 id="queue-heading" className="card-header" style={{ fontSize: '1.25rem' }}>{t('myGrievances')}</h3>
            
            {grievances.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>{t('noGrievances')}</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }} role="table">
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', fontWeight: 700 }}>
                      <th style={{ padding: '0.75rem' }}>ID</th>
                      <th style={{ padding: '0.75rem' }}>{t('fieldTitle')}</th>
                      <th style={{ padding: '0.75rem' }}>{t('fieldCategory')}</th>
                      <th style={{ padding: '0.75rem' }}>{t('filedOn')}</th>
                      <th style={{ padding: '0.75rem' }}>SLA Timer</th>
                      <th style={{ padding: '0.75rem' }}>Status</th>
                      <th style={{ padding: '0.75rem' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grievances.map((g) => {
                      const stats = getTimelineStats(g);
                      const isClosed = g.status === 'resolved';
                      
                      return (
                        <tr key={g.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 700 }}>#{g.id}</td>
                          <td style={{ padding: '0.75rem', fontWeight: 600 }}>{g.title}</td>
                          <td style={{ padding: '0.75rem' }}><span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{g.category}</span></td>
                          <td style={{ padding: '0.75rem' }}>{new Date(g.created_at).toLocaleDateString()}</td>
                          <td style={{ padding: '0.75rem' }}>
                            {isClosed ? (
                              <span style={{ color: 'var(--status-resolved-text)' }}>Resolved</span>
                            ) : (
                              stats.isOverdue ? (
                                <span style={{ color: 'red', fontWeight: 700 }}>{t('timelineDaysOverdue')}: {Math.abs(stats.remaining)}d</span>
                              ) : (
                                <span style={{ color: 'green', fontWeight: 600 }}>{stats.remaining}d left</span>
                              )
                            )}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <span className={`status-badge ${g.status}`}>
                              {t(`status${g.status.charAt(0).toUpperCase() + g.status.slice(1).replace('_', '')}`)}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                              onClick={() => handleSelectGrievance(g)}
                            >
                              {language === 'en' ? 'Track / Details' : 'ट्रैक / विवरण'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Specific Grievance Details Modal */}
      {selectedGrievance && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }} role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="card" style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'var(--bg-app)', border: '2px solid var(--primary)' }}>
            
            <div className="card-header">
              <h3 id="modal-title" style={{ fontSize: '1.25rem' }}>
                Grievance Tracking: #{selectedGrievance.id}
              </h3>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.25rem 0.5rem', border: 'none', fontSize: '1.2rem', color: 'var(--text-main)' }}
                onClick={() => setSelectedGrievance(null)}
                aria-label="Close details"
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{selectedGrievance.title}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Category: <strong>{selectedGrievance.category}</strong> | Filed On: {new Date(selectedGrievance.created_at).toLocaleString()}
                </p>
                <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
                  {selectedGrievance.description}
                </div>

                {selectedGrievance.attachment_path && (
                  <div style={{ margin: '1rem 0' }}>
                    <strong>Reference Attachment:</strong>{' '}
                    <a href={`http://localhost:5000${selectedGrievance.attachment_path}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>
                      View Uploaded Reference Document
                    </a>
                  </div>
                )}

                {selectedGrievance.resolution_report_path && (
                  <div style={{ margin: '1rem 0', padding: '0.75rem', border: '2px solid var(--status-resolved-text)', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(22, 163, 74, 0.05)' }}>
                    <strong style={{ color: 'var(--status-resolved-text)' }}>📋 Nodal Officer Resolution Report:</strong>{' '}
                    <a href={`http://localhost:5000${selectedGrievance.resolution_report_path}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>
                      View Resolution Report
                    </a>
                  </div>
                )}
              </div>

              {/* A11y Visual Redressal Timeline Step Indicator */}
              <div className="card" style={{ padding: '1rem', background: 'var(--bg-card)' }}>
                <h5 style={{ fontWeight: 700, marginBottom: '1rem' }}>{t('timelineTrackerTitle')}</h5>
                
                {/* Visual Step-Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--status-resolved-text)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>✓</div>
                    <div>
                      <h6 style={{ fontSize: '0.85rem', fontWeight: 700 }}>{t('originalComplaint')}</h6>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(selectedGrievance.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '50%', 
                      backgroundColor: selectedGrievance.status !== 'pending' ? 'var(--status-resolved-text)' : 'var(--border-color)', 
                      color: selectedGrievance.status !== 'pending' ? 'white' : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' 
                    }}>
                      {selectedGrievance.status !== 'pending' ? '✓' : '2'}
                    </div>
                    <div>
                      <h6 style={{ fontSize: '0.85rem', fontWeight: 700 }}>{t('statusInProgress')}</h6>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned to Nodal Officer</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '50%', 
                      backgroundColor: selectedGrievance.status === 'resolved' || selectedGrievance.status === 'escalated' ? 'var(--status-resolved-text)' : 'var(--border-color)', 
                      color: selectedGrievance.status === 'resolved' || selectedGrievance.status === 'escalated' ? 'white' : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' 
                    }}>
                      {selectedGrievance.status === 'resolved' || selectedGrievance.status === 'escalated' ? '✓' : '3'}
                    </div>
                    <div>
                      <h6 style={{ fontSize: '0.85rem', fontWeight: 700 }}>{t('resolutionProposed')}</h6>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Proposed findings</p>
                    </div>
                  </div>

                  {selectedGrievance.status === 'escalated' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#b91c1c', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>!</div>
                      <div>
                        <h6 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#b91c1c' }}>{t('appealToOmbudsman')}</h6>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Referred to Appellate Authority</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Audit History / Remarks log */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>{t('actionHistory')}</h4>
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

            {/* Response Section (If grievance is in Proposed RESOLVED state) */}
            {selectedGrievance.status === 'resolved' && !selectedGrievance.resolved_at && (
              <div style={{ padding: '1.25rem', border: '2px solid #86efac', background: '#f0fdf4', borderRadius: 'var(--radius-sm)', marginTop: '1.5rem' }}>
                <h4 style={{ color: '#166534', fontWeight: 700, marginBottom: '0.5rem', fontSize: '1rem' }}>
                  {language === 'en' ? '⚠️ Nodal Officer Resolution Review Action Required' : '⚠️ नोडल अधिकारी समाधान समीक्षा कार्रवाई आवश्यक'}
                </h4>
                <p style={{ fontSize: '0.9rem', color: '#166534', marginBottom: '1rem' }}>
                  {language === 'en'
                    ? 'The Nodal Officer has proposed a resolution. Please review and decide whether to accept and close the case, or reject it and escalate to the Appellate Authority.'
                    : 'नोडल अधिकारी ने एक समाधान प्रस्तावित किया है। कृपया समीक्षा करें और तय करें कि क्या इसे स्वीकार कर मामला बंद करना है, या इसे अस्वीकार कर अपीलीय निकाय को अपील करना है।'}
                </p>

                <div className="form-group">
                  <label className="form-label" htmlFor="complainant-remarks" style={{ color: '#166534' }}>
                    Remarks / Feedback (Required if rejecting/appealing)
                  </label>
                  <textarea
                    id="complainant-remarks"
                    className="form-control"
                    rows="3"
                    value={actionRemarks}
                    onChange={(e) => setActionRemarks(e.target.value)}
                    placeholder="Provide your feedback or grounds for appeal here..."
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    className="btn" 
                    style={{ backgroundColor: '#16a34a', color: 'white' }}
                    onClick={() => handleAction('resolve')}
                    disabled={loading}
                  >
                    {t('btnAccept')}
                  </button>
                  <button 
                    className="btn" 
                    style={{ backgroundColor: '#dc2626', color: 'white' }}
                    onClick={() => handleAction('appeal')}
                    disabled={loading}
                  >
                    {t('btnAppeal')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ComplainantDashboard;
