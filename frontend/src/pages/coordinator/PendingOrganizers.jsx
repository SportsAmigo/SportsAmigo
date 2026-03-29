import React, { useState, useEffect, useCallback } from 'react';
import { FaUsers, FaCheckCircle, FaExclamationTriangle, FaEnvelope, FaPhone, FaBuilding, FaClock, FaTimesCircle } from 'react-icons/fa';
import CoordinatorLayout from '../../components/layout/CoordinatorLayout';
import apiService from '../../services/apiService';

const PendingOrganizers = () => {
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filter, setFilter] = useState('all');
    const [actionLoading, setActionLoading] = useState(null);
    const [modal, setModal] = useState({ open: false, action: null, item: null });
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchOrganizers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await apiService.get('/coordinator/pending-organizers');
            if (res.success) setOrganizers(res.data || []);
        } catch (err) {
            setError('Failed to load pending organizers');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchOrganizers(); }, [fetchOrganizers]);

    const handleAction = (item, action) => {
        setModal({ open: true, action, item });
        setRejectionReason('');
    };

    const confirmAction = async () => {
        const { action, item } = modal;
        console.log('Confirm action called:', action, item._id);
        try {
            setActionLoading(item._id);
            setError('');
            let res;
            console.log('Making API call...');
            if (action === 'approve') {
                res = await apiService.post(`/coordinator/approve-organizer/${item._id}`);
            } else {
                res = await apiService.post(`/coordinator/reject-organizer/${item._id}`, { reason: rejectionReason });
            }
            console.log('API response:', res);
            if (res.success) {
                setSuccess(`Organizer ${action}d successfully!`);
                setModal({ open: false, action: null, item: null });
                fetchOrganizers();
                setTimeout(() => setSuccess(''), 4000);
            } else {
                const errorMsg = res.message || res.error || `Failed to ${action}`;
                console.error('Request failed:', errorMsg);
                setError(errorMsg);
                setModal({ open: false, action: null, item: null });
            }
        } catch (err) {
            console.error('Error in confirmAction:', err);
            const errorMsg = err.message || `Failed to ${action}`;
            setError(errorMsg);
            setModal({ open: false, action: null, item: null });
        } finally {
            setActionLoading(null);
        }
    };

    const daysSince = (date) => {
        if (!date) return 0;
        return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    };

    const filtered = filter === 'all' ? organizers
        : filter === 'urgent' ? organizers.filter(o => daysSince(o.created_at) >= 2)
            : organizers;

    return (
        <CoordinatorLayout>
            <div className="dashboard-page-wrapper">
                <div className="dashboard-header-section">
                    <div className="dashboard-welcome-card">
                        <div className="welcome-text">
                            <h1><FaUsers style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Pending Organizers ({organizers.length})</h1>
                            <p>Review and verify organizer registrations</p>
                        </div>
                    </div>
                </div>

                <div className="content-section">
                    {error && <div className="coord-alert error"><i className="fa fa-exclamation-circle" style={{ marginRight: 8 }}></i>{error}</div>}
                    {success && <div className="coord-alert success"><i className="fa fa-check-circle" style={{ marginRight: 8 }}></i>{success}</div>}

                    {/* Filters */}
                    <div className="filter-bar">
                        <select value={filter} onChange={e => setFilter(e.target.value)}>
                            <option value="all">All Applications</option>
                            <option value="urgent">Urgent ({'>'}48 hours)</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className="coord-loading"><i className="fa fa-spinner fa-spin"></i><p>Loading organizers...</p></div>
                    ) : filtered.length === 0 ? (
                        <div className="coord-empty">
                            <div className="empty-icon"><FaCheckCircle style={{ fontSize: '4rem', color: '#10B981' }} /></div>
                            <h3>All caught up!</h3>
                            <p>No pending organizer applications to review.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1.5rem' }}>
                            {filtered.map(org => {
                                const days = daysSince(org.created_at);
                                return (
                                    <div key={org._id} className="application-card">
                                        <div className="app-card-header">
                                            <h3>{org.first_name} {org.last_name}</h3>
                                            <span className={`status-pill ${days >= 2 ? 'flagged' : 'pending'}`}>
                                                {days >= 2 ? <><FaExclamationTriangle style={{ marginRight: '4px' }} /> URGENT</> : 'PENDING'}
                                            </span>
                                        </div>
                                        <div className="app-card-info">
                                            <p><strong><FaEnvelope style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Email:</strong> {org.email}</p>
                                            <p><strong><FaPhone style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Phone:</strong> {org.phone || 'N/A'}</p>
                                            <p><strong><FaBuilding style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Organization:</strong> {org.profile?.organization_name || 'N/A'}</p>
                                            <p><strong><FaClock style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Submitted:</strong> {days === 0 ? 'Today' : `${days} day(s) ago`}</p>
                                        </div>

                                        {org.verificationDocuments && (
                                            <div className="app-card-docs">
                                                {org.verificationDocuments.idProof && <span className="doc-badge"><FaCheckCircle style={{ marginRight: '4px', color: '#10B981' }} /> ID Proof</span>}
                                                {org.verificationDocuments.businessProof && <span className="doc-badge"><FaCheckCircle style={{ marginRight: '4px', color: '#10B981' }} /> Business Reg</span>}
                                                {org.verificationDocuments.addressProof && <span className="doc-badge"><FaCheckCircle style={{ marginRight: '4px', color: '#10B981' }} /> Address</span>}
                                                {!org.verificationDocuments.idProof && !org.verificationDocuments.businessProof && (
                                                    <span className="doc-badge"><FaExclamationTriangle style={{ marginRight: '4px', color: '#F59E0B' }} /> No documents</span>
                                                )}
                                            </div>
                                        )}

                                        <div className="app-card-actions">
                                            <button className="btn-coord approve" onClick={() => handleAction(org, 'approve')} disabled={actionLoading === org._id}>
                                                <i className="fa fa-check"></i> Approve
                                            </button>
                                            <button className="btn-coord reject" onClick={() => handleAction(org, 'reject')} disabled={actionLoading === org._id}>
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
                                    <><FaCheckCircle style={{ color: '#10B981', marginRight: '8px', verticalAlign: 'middle' }} /> Approve Organizer</> : 
                                    <><FaTimesCircle style={{ color: '#EF4444', marginRight: '8px', verticalAlign: 'middle' }} /> Reject Organizer</>
                                }
                            </h2>
                            <div className="coord-modal-summary">
                                <p style={{ color: '#6B7280', marginBottom: '0.5rem' }}>
                                    {modal.action === 'approve' ? 'Approve' : 'Reject'} this organizer?
                                </p>
                                <h4 style={{ color: '#111827', fontSize: '1.125rem', margin: 0 }}>
                                    {modal.item.first_name} {modal.item.last_name}
                                </h4>
                                <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>{modal.item.email}</p>
                            </div>
                            {modal.action === 'reject' && (
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#111827' }}>Rejection Reason:</label>
                                    <textarea className="coord-textarea" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                                        placeholder="Please provide a reason for rejection..." rows="3" />
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

export default PendingOrganizers;
