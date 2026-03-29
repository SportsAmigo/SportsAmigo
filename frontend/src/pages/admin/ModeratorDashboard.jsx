import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import apiService from '../../services/apiService';

const ModeratorDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingOrganizers, setPendingOrganizers] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [selectedTab, setSelectedTab] = useState('organizers');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [action, setAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchPendingData = useCallback(async () => {
    try {
      setLoading(true);
      if (selectedTab === 'organizers') {
        const response = await apiService.get('/moderator/pending-organizers');
        if (response.success) setPendingOrganizers(response.data || []);
      } else {
        const response = await apiService.get('/moderator/pending-events');
        if (response.success) setPendingEvents(response.data || []);
      }
    } catch (err) {
      setError('Failed to load pending items');
      console.error('Error fetching pending data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedTab]);

  useEffect(() => { fetchPendingData(); }, [fetchPendingData]);

  const handleActionClick = (item, actionType) => {
    setSelectedItem(item);
    setAction(actionType);
    setShowApprovalModal(true);
  };

  const handleConfirmAction = async () => {
    try {
      setLoading(true);
      setError('');
      let response;
      if (selectedTab === 'organizers') {
        response = action === 'approve'
          ? await apiService.post(`/moderator/approve-organizer/${selectedItem._id}`)
          : await apiService.post(`/moderator/reject-organizer/${selectedItem._id}`, { reason: rejectionReason });
      } else {
        response = action === 'approve'
          ? await apiService.post(`/moderator/approve-event/${selectedItem._id}`)
          : await apiService.post(`/moderator/reject-event/${selectedItem._id}`, { reason: rejectionReason });
      }
      if (response.success) {
        setSuccess(`Successfully ${action}d ${selectedTab === 'organizers' ? 'organizer' : 'event'}!`);
        setShowApprovalModal(false);
        setRejectionReason('');
        fetchPendingData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || `Failed to ${action}`);
      }
    } catch (err) {
      setError(err.message || `Failed to ${action}`);
    } finally {
      setLoading(false);
    }
  };

  const items = selectedTab === 'organizers' ? pendingOrganizers : pendingEvents;

  return (
    <AdminLayout>
      <div className="dashboard-page-wrapper">
        {/* Hero Header */}
        <div className="dashboard-header-section">
          <div className="dashboard-welcome-card">
            <div className="welcome-text">
              <h1>🛡️ Coordinator Dashboard</h1>
              <p>Review and approve organizers and events pending verification</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-icon yellow">
                <i className="fa fa-user-clock"></i>
              </div>
              <div className="stat-info">
                <div className="stat-label">Pending Organizers</div>
                <div className="stat-value">{pendingOrganizers.length}</div>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-icon blue">
                <i className="fa fa-calendar-check"></i>
              </div>
              <div className="stat-info">
                <div className="stat-label">Pending Events</div>
                <div className="stat-value">{pendingEvents.length}</div>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-icon green">
                <i className="fa fa-check-circle"></i>
              </div>
              <div className="stat-info">
                <div className="stat-label">Status</div>
                <div className="stat-value" style={{ fontSize: '1.25rem' }}>Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div style={{ padding: '0 2.5rem', maxWidth: 1400, margin: '0 auto' }}>
          {error && (
            <div style={{ padding: '1rem 1.5rem', background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.3)', borderRadius: 12, color: '#dc3545', marginBottom: '1rem', fontWeight: 500, backdropFilter: 'blur(10px)' }}>
              <i className="fa fa-exclamation-circle" style={{ marginRight: 8 }}></i>{error}
            </div>
          )}
          {success && (
            <div style={{ padding: '1rem 1.5rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, color: '#10B981', marginBottom: '1rem', fontWeight: 500, backdropFilter: 'blur(10px)' }}>
              <i className="fa fa-check-circle" style={{ marginRight: 8 }}></i>{success}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="content-section">
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderRadius: 12, padding: '0.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <button
              onClick={() => setSelectedTab('organizers')}
              style={{
                flex: 1, padding: '0.875rem 1.5rem', border: 'none', borderRadius: 8,
                fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer',
                transition: 'all 0.2s',
                background: selectedTab === 'organizers' ? 'linear-gradient(135deg, #475569, #334155)' : 'transparent',
                color: selectedTab === 'organizers' ? 'white' : '#374151',
                boxShadow: selectedTab === 'organizers' ? '0 4px 12px rgba(71,85,105,0.3)' : 'none'
              }}
            >
              <i className="fa fa-users" style={{ marginRight: 8 }}></i>
              Pending Organizers ({pendingOrganizers.length})
            </button>
            <button
              onClick={() => setSelectedTab('events')}
              style={{
                flex: 1, padding: '0.875rem 1.5rem', border: 'none', borderRadius: 8,
                fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer',
                transition: 'all 0.2s',
                background: selectedTab === 'events' ? 'linear-gradient(135deg, #475569, #334155)' : 'transparent',
                color: selectedTab === 'events' ? 'white' : '#374151',
                boxShadow: selectedTab === 'events' ? '0 4px 12px rgba(71,85,105,0.3)' : 'none'
              }}
            >
              <i className="fa fa-calendar-alt" style={{ marginRight: 8 }}></i>
              Pending Events ({pendingEvents.length})
            </button>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.95)', borderRadius: 16, backdropFilter: 'blur(10px)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
              <i className="fa fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#475569', marginBottom: '1rem', display: 'block' }}></i>
              <p style={{ color: '#6B7280', fontWeight: 500 }}>Loading pending items...</p>
            </div>
          )}

          {!loading && items.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.95)', borderRadius: 16, backdropFilter: 'blur(10px)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
              <h3 style={{ color: '#111827', fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>All caught up!</h3>
              <p style={{ color: '#6B7280', fontSize: '1.0625rem' }}>
                No pending {selectedTab} to review at this time.
              </p>
            </div>
          )}

          {!loading && items.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1.5rem' }}>
              {items.map(item => (
                <div key={item._id} style={{
                  background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)', borderRadius: 16,
                  padding: '1.75rem', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  transition: 'all 0.3s'
                }}>
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '2px solid rgba(0,0,0,0.08)' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0, flex: 1 }}>
                      {selectedTab === 'organizers' ? `${item.first_name} ${item.last_name}` : item.title}
                    </h3>
                    <span style={{
                      padding: '0.375rem 0.875rem', background: '#FEF3C7', color: '#92400E',
                      borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap'
                    }}>
                      Pending
                    </span>
                  </div>

                  {/* Card Body */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    {selectedTab === 'organizers' ? (
                      <>
                        <p style={{ margin: '0.5rem 0', color: '#4B5563', fontSize: '0.9375rem' }}>
                          <strong style={{ color: '#111827' }}>Email:</strong> {item.email}
                        </p>
                        <p style={{ margin: '0.5rem 0', color: '#4B5563', fontSize: '0.9375rem' }}>
                          <strong style={{ color: '#111827' }}>Phone:</strong> {item.phone || 'N/A'}
                        </p>
                        <p style={{ margin: '0.5rem 0', color: '#4B5563', fontSize: '0.9375rem' }}>
                          <strong style={{ color: '#111827' }}>Organization:</strong> {item.profile?.organization_name || 'N/A'}
                        </p>
                        <p style={{ margin: '0.5rem 0', color: '#4B5563', fontSize: '0.9375rem' }}>
                          <strong style={{ color: '#111827' }}>Registered:</strong> {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </>
                    ) : (
                      <>
                        <p style={{ margin: '0.5rem 0', color: '#4B5563', fontSize: '0.9375rem' }}>
                          <strong style={{ color: '#111827' }}>Sport:</strong> {item.sport_type}
                        </p>
                        <p style={{ margin: '0.5rem 0', color: '#4B5563', fontSize: '0.9375rem' }}>
                          <strong style={{ color: '#111827' }}>Date:</strong> {new Date(item.event_date).toLocaleDateString()}
                        </p>
                        <p style={{ margin: '0.5rem 0', color: '#4B5563', fontSize: '0.9375rem' }}>
                          <strong style={{ color: '#111827' }}>Location:</strong> {item.location}
                        </p>
                        <p style={{ margin: '0.5rem 0', color: '#4B5563', fontSize: '0.9375rem' }}>
                          <strong style={{ color: '#111827' }}>Entry Fee:</strong> ₹{item.entry_fee || 0}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => handleActionClick(item, 'approve')}
                      disabled={loading}
                      style={{
                        flex: 1, padding: '0.75rem', border: 'none', borderRadius: 10,
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        color: 'white', fontWeight: 600, fontSize: '0.9375rem',
                        cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                      }}
                    >
                      <i className="fa fa-check" style={{ marginRight: 6 }}></i>Approve
                    </button>
                    <button
                      onClick={() => handleActionClick(item, 'reject')}
                      disabled={loading}
                      style={{
                        flex: 1, padding: '0.75rem', border: 'none', borderRadius: 10,
                        background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                        color: 'white', fontWeight: 600, fontSize: '0.9375rem',
                        cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
                      }}
                    >
                      <i className="fa fa-times" style={{ marginRight: 6 }}></i>Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approval/Rejection Modal */}
        {showApprovalModal && selectedItem && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center',
            alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(4px)'
          }} onClick={() => setShowApprovalModal(false)}>
            <div style={{
              background: 'white', borderRadius: 16, padding: '2rem', maxWidth: 500,
              width: '90%', boxShadow: '0 25px 60px rgba(0,0,0,0.4)'
            }} onClick={e => e.stopPropagation()}>
              <h2 style={{ textAlign: 'center', color: '#111827', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>
                {action === 'approve' ? '✅ Confirm Approval' : '❌ Confirm Rejection'}
              </h2>

              <div style={{ background: '#F9FAFB', padding: '1.25rem', borderRadius: 12, marginBottom: '1.5rem', textAlign: 'center' }}>
                <p style={{ color: '#4B5563', marginBottom: '0.5rem' }}>
                  {action === 'approve' ? 'Approve' : 'Reject'} this {selectedTab === 'organizers' ? 'organizer' : 'event'}?
                </p>
                <h4 style={{ color: '#111827', fontSize: '1.125rem', margin: 0 }}>
                  {selectedTab === 'organizers' ? `${selectedItem.first_name} ${selectedItem.last_name}` : selectedItem.title}
                </h4>
              </div>

              {action === 'reject' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', color: '#111827', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Rejection Reason:
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason..."
                    rows="3"
                    style={{
                      width: '100%', padding: '0.875rem', border: '2px solid #E5E7EB',
                      borderRadius: 10, fontSize: '0.9375rem', fontFamily: 'inherit',
                      resize: 'vertical', transition: 'border-color 0.2s', boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handleConfirmAction}
                  disabled={loading || (action === 'reject' && !rejectionReason)}
                  style={{
                    flex: 1, padding: '0.875rem', border: 'none', borderRadius: 10,
                    background: action === 'approve'
                      ? 'linear-gradient(135deg, #10B981, #059669)'
                      : 'linear-gradient(135deg, #EF4444, #DC2626)',
                    color: 'white', fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
                    opacity: (loading || (action === 'reject' && !rejectionReason)) ? 0.5 : 1
                  }}
                >
                  {loading ? 'Processing...' : `Confirm ${action === 'approve' ? 'Approval' : 'Rejection'}`}
                </button>
                <button
                  onClick={() => { setShowApprovalModal(false); setRejectionReason(''); }}
                  disabled={loading}
                  style={{
                    flex: 1, padding: '0.875rem', border: '1px solid #D1D5DB', borderRadius: 10,
                    background: 'white', color: '#374151', fontWeight: 600, fontSize: '1rem', cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ModeratorDashboard;
