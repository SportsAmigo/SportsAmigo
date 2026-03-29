import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaClipboardList } from 'react-icons/fa';
import CoordinatorLayout from '../../components/layout/CoordinatorLayout';
import apiService from '../../services/apiService';

const ApprovedEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchApproved = async () => {
            try {
                const res = await apiService.get('/coordinator/approved-events');
                if (res.success) setEvents(res.data || []);
            } catch (err) {
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchApproved();
    }, []);

    const now = new Date();
    const filtered = filter === 'all' ? events
        : filter === 'upcoming' ? events.filter(e => new Date(e.event_date) > now)
            : filter === 'completed' ? events.filter(e => e.status === 'completed')
                : events.filter(e => e.status === 'ongoing');

    return (
        <CoordinatorLayout>
            <div className="dashboard-page-wrapper">
                <div className="dashboard-header-section">
                    <div className="dashboard-welcome-card">
                        <div className="welcome-text">
                            <h1><FaCalendarAlt style={{ verticalAlign: 'middle', marginRight: '8px', color: '#3B82F6' }} /> Approved Events ({events.length})</h1>
                            <p>Monitor live and upcoming events on the platform</p>
                        </div>
                    </div>
                </div>

                <div className="content-section">
                    <div className="coord-tabs">
                        {['all', 'upcoming', 'ongoing', 'completed'].map(f => (
                            <button key={f} className={`coord-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                                {f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? events.length : (f === 'upcoming' ? events.filter(e => new Date(e.event_date) > now).length : events.filter(e => e.status === f).length)})
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="coord-loading"><i className="fa fa-spinner fa-spin"></i><p>Loading...</p></div>
                    ) : filtered.length === 0 ? (
                        <div className="coord-empty">
                            <div className="empty-icon"><FaClipboardList style={{ fontSize: '4rem', color: '#9CA3AF' }} /></div>
                            <h3>No events found</h3>
                            <p>No {filter !== 'all' ? filter : ''} events to display.</p>
                        </div>
                    ) : (
                        <div className="section-card" style={{ overflow: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Event</th>
                                        <th>Sport</th>
                                        <th>Date</th>
                                        <th>Organizer</th>
                                        <th>Entry Fee</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(evt => (
                                        <tr key={evt._id}>
                                            <td><strong>{evt.title}</strong></td>
                                            <td>{evt.sport_type || '—'}</td>
                                            <td>{evt.event_date ? new Date(evt.event_date).toLocaleDateString() : '—'}</td>
                                            <td>{evt.organizer_id?.first_name ? `${evt.organizer_id.first_name} ${evt.organizer_id.last_name}` : '—'}</td>
                                            <td>₹{evt.entry_fee || 0}</td>
                                            <td>
                                                <span className={`status-pill ${evt.status === 'upcoming' ? 'verified' : evt.status === 'completed' ? 'approved' : 'pending'}`}>
                                                    {evt.status || 'Active'}
                                                </span>
                                            </td>
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

export default ApprovedEvents;
