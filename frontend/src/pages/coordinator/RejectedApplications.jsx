import React, { useState, useEffect } from 'react';
import { FaTimesCircle, FaClipboardList } from 'react-icons/fa';
import CoordinatorLayout from '../../components/layout/CoordinatorLayout';
import apiService from '../../services/apiService';

const RejectedApplications = () => {
    const [tab, setTab] = useState('organizers');
    const [organizers, setOrganizers] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRejected = async () => {
            try {
                const res = await apiService.get('/coordinator/rejected');
                if (res.success) {
                    setOrganizers(res.data?.organizers || []);
                    setEvents(res.data?.events || []);
                }
            } catch (err) {
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchRejected();
    }, []);

    const items = tab === 'organizers' ? organizers : events;

    return (
        <CoordinatorLayout>
            <div className="dashboard-page-wrapper">
                <div className="dashboard-header-section">
                    <div className="dashboard-welcome-card">
                        <div className="welcome-text">
                            <h1><FaTimesCircle style={{ verticalAlign: 'middle', marginRight: '8px', color: '#EF4444' }} /> Rejected Applications</h1>
                            <p>Track rejected organizers and events with reasons</p>
                        </div>
                    </div>
                </div>

                <div className="content-section">
                    <div className="coord-tabs">
                        <button className={`coord-tab ${tab === 'organizers' ? 'active' : ''}`} onClick={() => setTab('organizers')}>
                            Rejected Organizers ({organizers.length})
                        </button>
                        <button className={`coord-tab ${tab === 'events' ? 'active' : ''}`} onClick={() => setTab('events')}>
                            Rejected Events ({events.length})
                        </button>
                    </div>

                    {loading ? (
                        <div className="coord-loading"><i className="fa fa-spinner fa-spin"></i><p>Loading...</p></div>
                    ) : items.length === 0 ? (
                        <div className="coord-empty">
                            <div className="empty-icon"><FaClipboardList style={{ fontSize: '4rem', color: '#9CA3AF' }} /></div>
                            <h3>No rejected {tab}</h3>
                            <p>No rejected {tab} found in the system.</p>
                        </div>
                    ) : (
                        <div className="section-card" style={{ overflow: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>{tab === 'organizers' ? 'Name' : 'Event'}</th>
                                        <th>{tab === 'organizers' ? 'Email' : 'Sport'}</th>
                                        <th>Rejection Reason</th>
                                        <th>Rejected On</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item._id}>
                                            <td>
                                                <strong>
                                                    {tab === 'organizers' ? `${item.first_name} ${item.last_name}` : item.title}
                                                </strong>
                                            </td>
                                            <td>{tab === 'organizers' ? item.email : (item.sport_type || '—')}</td>
                                            <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {tab === 'organizers'
                                                    ? (item.verificationDocuments?.rejectionReason || 'No reason')
                                                    : (item.approvalStatus?.rejectionReason || 'No reason')
                                                }
                                            </td>
                                            <td>
                                                {tab === 'organizers'
                                                    ? (item.verificationDocuments?.reviewedAt ? new Date(item.verificationDocuments.reviewedAt).toLocaleDateString() : '—')
                                                    : (item.approvalStatus?.reviewedAt ? new Date(item.approvalStatus.reviewedAt).toLocaleDateString() : '—')
                                                }
                                            </td>
                                            <td><span className="status-pill rejected">Rejected</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </CoordinatorLayout>
    );
};

export default RejectedApplications;
