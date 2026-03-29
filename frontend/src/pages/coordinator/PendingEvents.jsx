import React, { useState, useEffect, useCallback } from 'react';
import { FaCalendarAlt, FaCheckCircle, FaExclamationTriangle, FaBullseye, FaMapMarkerAlt, FaMoneyBillWave, FaUsers, FaUser, FaFileAlt, FaTimesCircle } from 'react-icons/fa';
import CoordinatorLayout from '../../components/layout/CoordinatorLayout';
import apiService from '../../services/apiService';

const PendingEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const [modal, setModal] = useState({ open: false, action: null, item: null });
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            const res = await apiService.get('/coordinator/pending-events');
            if (res.success) setEvents(res.data || []);
        } catch (err) {
            setError('Failed to load pending events');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    const handleAction = (item, action) => {
        setModal({ open: true, action, item });
        setRejectionReason('');
    };

    const confirmAction = async () => {
        const { action, item } = modal;
        try {
            setActionLoading(item._id);
            setError('');
            let res;
            if (action === 'approve') {
                res = await apiService.post(`/coordinator/approve-event/${item._id}`);
            } else {
                res = await apiService.post(`/coordinator/reject-event/${item._id}`, { reason: rejectionReason });
            }
            if (res.success) {
                setSuccess(`Event ${action}d successfully!`);
                setModal({ open: false, action: null, item: null });
                fetchEvents();
                setTimeout(() => setSuccess(''), 4000);
            } else {
                setError(res.message || `Failed to ${action}`);
            }
        } catch (err) {
            setError(err.message || `Failed to ${action}`);
        } finally {
            setActionLoading(null);
        }
    };

    const daysUntil = (date) => {
        if (!date) return null;
        return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    };

    return (
        <CoordinatorLayout>
            <div className="dashboard-page-wrapper">
                <div className="dashboard-header-section">
                    <div className="dashboard-welcome-card">
                        <div className="welcome-text">
                            <h1><FaCalendarAlt style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Pending Events ({events.length})</h1>
                            <p>Review and approve event submissions before they go live</p>
                        </div>
                    </div>
                </div>

                <div className="content-section">
                    {error && <div className="coord-alert error"><i className="fa fa-exclamation-circle" style={{ marginRight: 8 }}></i>{error}</div>}
                    {success && <div className="coord-alert success"><i className="fa fa-check-circle" style={{ marginRight: 8 }}></i>{success}</div>}

                    {loading ? (
                        <div className="coord-loading"><i className="fa fa-spinner fa-spin"></i><p>Loading events...</p></div>
                    ) : events.length === 0 ? (
                        <div className="coord-empty">
                            <div className="empty-icon"><FaCheckCircle style={{ fontSize: '4rem', color: '#10B981' }} /></div>
                            <h3>No pending events</h3>
                            <p>All event submissions have been reviewed.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1.5rem' }}>
                            {events.map(evt => {
                                const days = daysUntil(evt.event_date);
                                const isUrgent = days !== null && days <= 3;
                                return (
                                    <div key={evt._id} className="application-card">
                                        <div className="app-card-header">
                                            <h3>{evt.title || 'Untitled Event'}</h3>
                                            <span className={`status-pill ${isUrgent ? 'flagged' : 'pending'}`}>
                                                {isUrgent ? <><FaExclamationTriangle style={{ marginRight: '4px' }} /> {days}d LEFT</> : 'PENDING'}
                                            </span>
                                        </div>
                                        <div className="app-card-info">
                                            <p><strong><FaBullseye style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Sport:</strong> {evt.sport_type || 'N/A'}</p>
                                            <p><strong><FaCalendarAlt style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Date:</strong> {evt.event_date ? new Date(evt.event_date).toLocaleDateString() : 'TBD'}</p>
                                            <p><strong><FaMapMarkerAlt style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Venue:</strong> {evt.location || 'N/A'}</p>
                                            <p><strong><FaMoneyBillWave style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Entry Fee:</strong> ₹{evt.entry_fee || 0}</p>
                                            <p><strong><FaUsers style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Max Teams:</strong> {evt.max_teams || 'Unlimited'}</p>
                                            {evt.organizer_id && (
                                                <p><strong><FaUser style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Organizer:</strong> {evt.organizer_id.first_name} {evt.organizer_id.last_name}
                                                    {evt.organizer_id.verificationStatus === 'verified' && <span style={{ color: '#10B981', marginLeft: 6, fontSize: '0.8rem' }}><FaCheckCircle style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Verified</span>}
                                                </p>
                                            )}
                                            {evt.description && (
                                                <p><strong><FaFileAlt style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Description:</strong> {evt.description.substring(0, 120)}{evt.description.length > 120 ? '...' : ''}</p>
                                            )}
                                        </div>

                                        <div className="app-card-actions">
                                            <button className="btn-coord approve" onClick={() => handleAction(evt, 'approve')} disabled={actionLoading === evt._id}>
                                                <i className="fa fa-check"></i> Approve
                                            </button>
                                            <button className="btn-coord reject" onClick={() => handleAction(evt, 'reject')} disabled={actionLoading === evt._id}>
                                                <i className="fa fa-times"></i> Reject
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Modal */}
                {modal.open && modal.item && (
                    <div className="coord-modal-overlay" onClick={() => setModal({ open: false, action: null, item: null })}>
                        <div className="coord-modal" onClick={e => e.stopPropagation()}>
                            <h2>
                                {modal.action === 'approve' ? 
                                    <><FaCheckCircle style={{ color: '#10B981', marginRight: '8px', verticalAlign: 'middle' }} /> Approve Event</> : 
                                    <><FaTimesCircle style={{ color: '#EF4444', marginRight: '8px', verticalAlign: 'middle' }} /> Reject Event</>
                                }
                            </h2>
                            <div className="coord-modal-summary">
                                <p style={{ color: '#6B7280', marginBottom: '0.5rem' }}>
                                    {modal.action === 'approve' ? 'This event will go live immediately.' : 'Reject this event submission?'}
                                </p>
                                <h4 style={{ color: '#111827', fontSize: '1.125rem', margin: 0 }}>{modal.item.title}</h4>
                                <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                    {modal.item.sport_type} • {modal.item.event_date ? new Date(modal.item.event_date).toLocaleDateString() : 'TBD'}
                                </p>
                            </div>
                            {modal.action === 'reject' && (
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#111827' }}>Rejection Reason:</label>
                                    <textarea className="coord-textarea" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                                        placeholder="Specify what needs to be fixed..." rows="3" />
                                </div>
                            )}
                            <div className="coord-modal-actions">
                                <button className={`btn-coord ${modal.action}`} onClick={confirmAction}
                                    disabled={actionLoading || (modal.action === 'reject' && !rejectionReason)}>
                                    {actionLoading ? 'Processing...' : `Confirm ${modal.action === 'approve' ? 'Approval' : 'Rejection'}`}
                                </button>
                                <button className="btn-coord secondary" onClick={() => setModal({ open: false, action: null, item: null })}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </CoordinatorLayout>
    );
};

export default PendingEvents;
