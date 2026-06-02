// Nodal Officer Dashboard with role-specific queues, investigation triggers, resolutions, and simulated email notifications

import React, { useState, useEffect } from 'react';
import { API_URL } from '../App';

function NodalDashboard({ t, currentUser, authToken }) {
  const [grievances, setGrievances] = useState([]);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [grievanceHistory, setGrievanceHistory] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  
  const [actionRemarks, setActionRemarks] = useState('');
  const [resolutionReport, setResolutionReport] = useState(null);
  const [activeTab, setActiveTab] = useState('queue'); // queue, emails
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch Nodal sector grievances
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
      console.warn('[API Fetch] Failed. Running in local simulation mode.');
      // Local Mock DB hydrate if server offline
      const localGrievances = JSON.parse(localStorage.getItem('srfti_sim_grievances')) || [];
      // Filter for this nodal sector (complainant_type)
      setGrievances(localGrievances.filter(g => g.complainant_id !== currentUser.id && g.category.toLowerCase().includes(currentUser.complainant_type.slice(0, 3))));
    }
  };

  // Fetch simulated email notification logs
  const fetchEmailLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/reminders/nodal`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter logs corresponding to this nodal officer's sector
        setEmailLogs(data.filter(log => log.category === currentUser.complainant_type));
      }
    } catch (err) {
      // Offline local simulation logs
      const simLogs = [
        {
          id: 1,
          priority: 'low',
          message: `Daily reminder: Grievance #102 submitted is currently pending. 15 days remaining.`,
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          priority: 'high',
          message: `URGENT S.O.S: Grievance #101 is nearing its timeline. Only 3 days left to resolve!`,
          timestamp: new Date().toISOString()
        }
      ];
      setEmailLogs(simLogs);
    }
  };

  useEffect(() => {
    fetchGrievances();
    fetchEmailLogs();
  }, [authToken]);

  // Load audit trail for selected case
  const handleSelectGrievance = async (g) => {
    setSelectedGrievance(g);
    setGrievanceHistory([]);
    setActionRemarks('');
    setResolutionReport(null);
    
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

  // Submit action note (Acknowledge Investigation, Intermediate Reply, or Resolve)
  const handleAction = async (actionType) => {
    console.log('[handleAction] Called with actionType:', actionType, 'remarks:', actionRemarks);
    if (!actionRemarks) {
      setError(t('labelActionRemarks'));
      return;
    }

    // Require resolution report only when submitting final resolution
    if (actionType === 'resolve' && !resolutionReport) {
      setError('Please attach a resolution report before submitting.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('action', actionType);
      formData.append('remarks', actionRemarks);
      if (resolutionReport) {
        formData.append('resolution_report', resolutionReport);
      }

      const url = `${API_URL}/grievances/${selectedGrievance.id}/action`;
      console.log('[handleAction] POST URL:', url, 'grievanceId:', selectedGrievance.id);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      console.log('[handleAction] Response status:', res.status, res.ok);

      if (res.ok) {
        const data = await res.json();
        console.log('[handleAction] Success response:', data);
        setSuccess(t('successAction'));
        setActionRemarks('');
        setResolutionReport(null);
        setSelectedGrievance(null);
        fetchGrievances();
        fetchEmailLogs();
      } else {
        const data = await res.json().catch(() => ({}));
        console.error('[handleAction] Error response:', res.status, data);
        if (res.status === 403) {
          setError('Session expired. Please log in again.');
          setTimeout(() => {
            localStorage.removeItem('srfti_token');
            window.location.reload();
          }, 2000);
        } else {
          setError(data.message || `Action failed (HTTP ${res.status})`);
        }
      }
    } catch (err) {
      console.error('[API Action] Failed:', err.message);
      setError('Unable to process action. Server connection failed.');
      return; // Don't proceed with simulation - show error instead
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
      isOverdue: remaining < 0,
      isWarning: remaining >= 0 && remaining <= 4
    };
  };

  // Counters
  const activeCount = grievances.filter(g => g.status === 'pending' || g.status === 'in_progress').length;
  const resolvedCount = grievances.filter(g => g.status === 'resolved').length;
  
  // Breaches count
  const breachCount = grievances.filter(g => {
    if (g.status === 'resolved') return false;
    const stats = getTimelineStats(g);
    return stats.isOverdue;
  }).length;

  return (
    <div>
      {/* Header and profile summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem' }}>{t('nodalQueue')}</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            {t('nodalSector')}: <strong style={{ textTransform: 'capitalize' }}>{t(`select${currentUser.complainant_type.charAt(0).toUpperCase() + currentUser.complainant_type.slice(1)}`)} Sector</strong> | {currentUser.email}
          </p>
        </div>

        {/* Tab Selection Navigation */}
        <div className="a11y-group">
          <button 
            className={`btn ${activeTab === 'queue' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            onClick={() => setActiveTab('queue')}
          >
            Resolution Queue
          </button>
          <button 
            className={`btn ${activeTab === 'emails' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            onClick={() => setActiveTab('emails')}
          >
            Email Reminders ({emailLogs.length})
          </button>
        </div>
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

      {activeTab === 'queue' ? (
        /* Queue System view */
        <div>
          {/* Dashboard SLA Counters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <div className="card" style={{ textAlign: 'center', borderBottom: '4px solid var(--primary)' }}>
              <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Active Cases</h4>
              <p style={{ fontSize: '2rem', fontWeight: 800 }}>{activeCount}</p>
            </div>
            <div className="card" style={{ textAlign: 'center', borderBottom: '4px solid #16a34a' }}>
              <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Resolved</h4>
              <p style={{ fontSize: '2rem', fontWeight: 800 }}>{resolvedCount}</p>
            </div>
            <div className="card" style={{ textAlign: 'center', borderBottom: '4px solid #dc2626' }}>
              <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>SLA Breaches</h4>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: breachCount > 0 ? '#dc2626' : 'var(--text-main)' }}>{breachCount}</p>
            </div>
          </div>

          {/* Grievance list panel */}
          <section className="card" aria-labelledby="nodal-grid-heading">
            <h3 id="nodal-grid-heading" className="card-header" style={{ fontSize: '1.25rem' }}>Active Grievance Tickets</h3>
            
            {grievances.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No grievances assigned to your sector.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }} role="table">
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', fontWeight: 700 }}>
                      <th style={{ padding: '0.75rem' }}>ID</th>
                      <th style={{ padding: '0.75rem' }}>Subject / Title</th>
                      <th style={{ padding: '0.75rem' }}>Complainant Name</th>
                      <th style={{ padding: '0.75rem' }}>Filed On</th>
                      <th style={{ padding: '0.75rem' }}>Days Elapsed</th>
                      <th style={{ padding: '0.75rem' }}>SLA Alerts</th>
                      <th style={{ padding: '0.75rem' }}>Status</th>
                      <th style={{ padding: '0.75rem' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grievances.map((g) => {
                      const stats = getTimelineStats(g);
                      const isClosed = g.status === 'resolved';
                      
                      return (
                        <tr key={g.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: !isClosed && stats.isOverdue ? 'rgba(239, 68, 68, 0.03)' : 'inherit' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 700 }}>{g.case_id}</td>
                          <td style={{ padding: '0.75rem', fontWeight: 600 }}>{g.title}</td>
                          <td style={{ padding: '0.75rem' }}>{g.complainant_name || 'Rahul Banerjee'}</td>
                          <td style={{ padding: '0.75rem' }}>{new Date(g.created_at).toLocaleDateString()}</td>
                          <td style={{ padding: '0.75rem' }}>{stats.elapsed} {t('daysUnit')}</td>
                          <td style={{ padding: '0.75rem' }}>
                            {isClosed ? (
                              <span style={{ color: 'var(--status-resolved-text)' }}>Resolved</span>
                            ) : (
                              stats.isOverdue ? (
                                <span className="status-badge escalated" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                                  {t('overdueWarning')}
                                </span>
                              ) : stats.isWarning ? (
                                <span className="status-badge pending" style={{ fontSize: '0.75rem', backgroundColor: '#fef3c7', color: '#b45309', borderColor: '#fde68a', fontWeight: 800 }}>
                                  {t('actionRequiredWarning')}
                                </span>
                              ) : (
                                <span style={{ color: 'green', fontSize: '0.85rem', fontWeight: 600 }}>SLA OK ({stats.remaining}d remaining)</span>
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
                              Review & Resolve
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
      ) : (
        /* Email Logs Reminder System */
        <section className="card" aria-labelledby="emails-heading">
          <div className="card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
            <h3 id="emails-heading" style={{ fontSize: '1.25rem' }}>{t('emailRemindersSimulator')}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('emailRemindersHelp')}</p>
          </div>
          
          <div className="notification-inbox">
            {emailLogs.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No automated alerts triggered yet. SLA compliance is currently clear.</p>
            ) : (
              emailLogs.map((log, i) => (
                <div key={i} className={`notification-item ${log.priority}`} role="log">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: '0.25rem' }}>
                    <span style={{ textTransform: 'uppercase', color: log.priority === 'critical' ? 'red' : (log.priority === 'high' ? 'orange' : 'var(--text-muted)') }}>
                      [{log.priority} alert] Official Reminder Notification
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
                    To: {currentUser.name} &lt;{currentUser.email}&gt;<br/>
                    Subject: Action Required - Grievance Timelines Compliance Warning<br/>
                    Message: <strong>{log.message}</strong>
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* Action details Drawer / Modal */}
      {selectedGrievance && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }} role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="card" style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'var(--bg-card)', border: '2px solid var(--primary)' }}>
            
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 id="modal-title" style={{ fontSize: '1.25rem' }}>
                {t('modalActionTitle')}: {selectedGrievance.case_id}
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

            {/* Modal-level error/success messages */}
            {error && (
              <div className="alert-banner error" role="alert" style={{ marginBottom: '1rem' }}>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="alert-banner success" role="alert" style={{ marginBottom: '1rem' }}>
                <span>{success}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{selectedGrievance.title}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Category: <strong>{selectedGrievance.category}</strong> | Filed On: {new Date(selectedGrievance.created_at).toLocaleString()}
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '1rem' }}>
                  Complainant: <strong>{selectedGrievance.complainant_name || 'Rahul Banerjee'}</strong> ({selectedGrievance.complainant_email || 'rahul@student.srfti.ac.in'})
                </p>
                
                <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '1.25rem', whiteSpace: 'pre-wrap' }}>
                  {selectedGrievance.description}
                </div>

                {selectedGrievance.attachment_path && (
                  <div style={{ margin: '1rem 0' }}>
                    <strong>Reference Attachment:</strong>{' '}
                    <a href={`${selectedGrievance.attachment_path}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>
                      Open Reference Document Link
                    </a>
                  </div>
                )}

                {selectedGrievance.resolution_report_path && (
                  <div style={{ margin: '1rem 0', padding: '0.75rem', border: '2px solid var(--status-resolved-text)', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(22, 163, 74, 0.05)' }}>
                    <strong style={{ color: 'var(--status-resolved-text)' }}>📋 Resolution Report:</strong>{' '}
                    <a href={`${selectedGrievance.resolution_report_path}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>
                      View Submitted Resolution Report
                    </a>
                  </div>
                )}
              </div>

              {/* Status and timer card */}
              <div className="card" style={{ padding: '1rem', background: 'var(--bg-card)' }}>
                <h5 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>SLA Compliance Audit</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                  <div>
                    Status: <span className={`status-badge ${selectedGrievance.status}`}>{selectedGrievance.status}</span>
                  </div>
                  <div>
                    Timeline Duration: <strong>{selectedGrievance.timeline_days} Days</strong>
                  </div>
                  <div>
                    Days Elapsed: <strong>{getTimelineStats(selectedGrievance).elapsed} Days</strong>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                    {getTimelineStats(selectedGrievance).isOverdue ? (
                      <span style={{ color: 'red', fontWeight: 700 }}>Breached by {Math.abs(getTimelineStats(selectedGrievance).remaining)} days!</span>
                    ) : (
                      <span style={{ color: 'green', fontWeight: 600 }}>{getTimelineStats(selectedGrievance).remaining} days remaining</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* History logs */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Grievance Action Logs</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {grievanceHistory.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.5rem 0' }}>No action logs recorded yet.</p>
                ) : (
                  grievanceHistory.map((h, i) => {
                    const isIntermediate = h.action_type === 'intermediate_reply';
                    return (
                      <div key={i} style={{ padding: '0.75rem 1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', borderLeft: `3px solid ${isIntermediate ? '#f59e0b' : 'var(--primary)'}`, fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: '0.25rem', alignItems: 'center' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(h.created_at).toLocaleString()}</span>
                        </div>
                        <div style={{ color: 'var(--text-main)', fontStyle: 'italic' }}>"{h.remarks}"</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Action form (If case is not resolved) */}
            {(selectedGrievance.status === 'pending' || selectedGrievance.status === 'in_progress') && (
              <div style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-card)' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '1rem' }}>Submit Case Progress Remarks</h4>

                <div className="form-group">
                  <label className="form-label" htmlFor="nodal-remarks">{t('labelActionRemarks')} *</label>
                  <textarea
                    id="nodal-remarks"
                    className="form-control"
                    rows="3"
                    value={actionRemarks}
                    onChange={(e) => setActionRemarks(e.target.value)}
                    placeholder="Enter investigation updates, information requests, interim updates, or resolution proposals..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="resolution-report">
                    Attachment (Optional)
                    <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                      (Required only when submitting final resolution – PDF, DOC, or Image)
                    </span>
                  </label>
                  <input
                    type="file"
                    id="resolution-report"
                    className="form-control"
                    onChange={(e) => setResolutionReport(e.target.files[0])}
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  />
                  {resolutionReport && (
                    <p style={{ fontSize: '0.8rem', color: 'green', marginTop: '0.25rem' }}>
                      ✓ Attached: {resolutionReport.name}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {selectedGrievance.status === 'pending' && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleAction('in_progress')}
                      disabled={loading}
                    >
                      {t('btnStartInvestigation')}
                    </button>
                  )}
                  {selectedGrievance.status === 'in_progress' && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleAction('intermediate_reply')}
                      disabled={loading}
                    >
                      {t('btnIntermediateReply')}
                    </button>
                  )}
                  <button
                    className="btn btn-primary"
                    onClick={() => handleAction('resolve')}
                    disabled={loading}
                  >
                    {t('btnResolveGrievance')}
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

export default NodalDashboard;
