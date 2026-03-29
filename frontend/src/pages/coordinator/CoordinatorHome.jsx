import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdSecurity, MdGpsFixed } from 'react-icons/md';
import { FaCircle, FaClipboardList, FaCheckCircle, FaBolt } from 'react-icons/fa';
import CoordinatorLayout from '../../components/layout/CoordinatorLayout';
import apiService from '../../services/apiService';

const CoordinatorHome = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ pendingOrganizers: 0, pendingEvents: 0, todayActions: 0, avgResponseTime: '—' });
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [orgRes, evtRes] = await Promise.all([
                apiService.get('/coordinator/pending-organizers').catch(() => ({ success: false })),
                apiService.get('/coordinator/pending-events').catch(() => ({ success: false }))
            ]);

            const pendingOrgs = orgRes.success ? (orgRes.data || []) : [];
            const pendingEvts = evtRes.success ? (evtRes.data || []) : [];

            setStats({
                pendingOrganizers: pendingOrgs.length,
                pendingEvents: pendingEvts.length,
                todayActions: 0,
                avgResponseTime: '< 24 hrs'
            });

            // Build recent activity from pending items
            const combined = [
                ...pendingOrgs.map(o => ({
                    type: 'pending',
                    text: `${o.first_name || ''} ${o.last_name || ''} — Organizer pending review`,
                    time: o.created_at ? new Date(o.created_at).toLocaleDateString() : 'Recently'
                })),
                ...pendingEvts.map(e => ({
                    type: 'pending',
                    text: `${e.title || 'Event'} — Event pending approval`,
                    time: e.created_at ? new Date(e.created_at).toLocaleDateString() : 'Recently'
                }))
            ].slice(0, 8);

            setRecentActivity(combined);
        } catch (err) {
            console.error('Dashboard data error:', err);
        } finally {
            setLoading(false);
        }
    };

    const urgentOrganizers = stats.pendingOrganizers;
    const urgentEvents = stats.pendingEvents;

    return (
        <CoordinatorLayout>
            <div className="dashboard-page-wrapper">
                {/* Header */}
                <div className="dashboard-header-section">
                    <div className="dashboard-welcome-card">
                        <div className="welcome-text">
                            <h1><MdSecurity style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Coordinator Dashboard</h1>
                            <p>Quality control center — Review organizers and events to maintain platform integrity</p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card" onClick={() => navigate('/coordinator/pending-organizers')} style={{ cursor: 'pointer' }}>
                        <div className="stat-card-content">
                            <div className="stat-icon yellow"><i className="fa fa-user-clock"></i></div>
                            <div className="stat-info">
                                <div className="stat-label">Pending Organizers</div>
                                <div className="stat-value">{stats.pendingOrganizers}</div>
                            </div>
                        </div>
                    </div>
                    <div className="stat-card" onClick={() => navigate('/coordinator/pending-events')} style={{ cursor: 'pointer' }}>
                        <div className="stat-card-content">
                            <div className="stat-icon blue"><i className="fa fa-calendar-check"></i></div>
                            <div className="stat-info">
                                <div className="stat-label">Pending Events</div>
                                <div className="stat-value">{stats.pendingEvents}</div>
                            </div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-content">
                            <div className="stat-icon green"><i className="fa fa-check-double"></i></div>
                            <div className="stat-info">
                                <div className="stat-label">Today's Actions</div>
                                <div className="stat-value">{stats.todayActions}</div>
                            </div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-content">
                            <div className="stat-icon purple"><i className="fa fa-clock"></i></div>
                            <div className="stat-info">
                                <div className="stat-label">Avg Response</div>
                                <div className="stat-value" style={{ fontSize: '1.25rem' }}>{stats.avgResponseTime}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="content-section">
                    {/* Priority Queue */}
                    {(urgentOrganizers > 0 || urgentEvents > 0) && (
                        <div className="section-card">
                            <h2><MdGpsFixed style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Priority Queue</h2>
                            {urgentOrganizers > 0 && (
                                <div className="priority-alert urgent">
                                    <span><FaCircle style={{ color: '#EF4444', fontSize: '10px', marginRight: '8px', verticalAlign: 'middle' }} /> {urgentOrganizers} organizer(s) awaiting review</span>
                                    <button className="alert-link" onClick={() => navigate('/coordinator/pending-organizers')}>Review Now →</button>
                                </div>
                            )}
                            {urgentEvents > 0 && (
                                <div className="priority-alert warning">
                                    <span><FaCircle style={{ color: '#F59E0B', fontSize: '10px', marginRight: '8px', verticalAlign: 'middle' }} /> {urgentEvents} event(s) need approval</span>
                                    <button className="alert-link" onClick={() => navigate('/coordinator/pending-events')}>Review Now →</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Recent Activity */}
                    <div className="section-card">
                        <h2><FaClipboardList style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Recent Activity</h2>
                        {loading ? (
                            <div className="coord-loading">
                                <i className="fa fa-spinner fa-spin"></i>
                                <p>Loading activity...</p>
                            </div>
                        ) : recentActivity.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                                <p><FaCheckCircle style={{ color: '#10B981', verticalAlign: 'middle', marginRight: '8px' }} /> No pending items — all caught up!</p>
                            </div>
                        ) : (
                            recentActivity.map((item, idx) => (
                                <div key={idx} className="activity-item">
                                    <div className={`activity-dot ${item.type}`}></div>
                                    <div className="activity-text">{item.text}</div>
                                    <div className="activity-time">{item.time}</div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="section-card">
                        <h2><FaBolt style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Quick Actions</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <button className="btn-coord approve" onClick={() => navigate('/coordinator/pending-organizers')} style={{ padding: '1rem' }}>
                                <i className="fa fa-user-check"></i> Review Organizers
                            </button>
                            <button className="btn-coord" onClick={() => navigate('/coordinator/pending-events')} style={{ padding: '1rem', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: 'white' }}>
                                <i className="fa fa-calendar-check"></i> Review Events
                            </button>
                            <button className="btn-coord secondary" onClick={() => navigate('/coordinator/approved-organizers')} style={{ padding: '1rem' }}>
                                <i className="fa fa-list"></i> View Approved
                            </button>
                            <button className="btn-coord secondary" onClick={() => navigate('/coordinator/activity-log')} style={{ padding: '1rem' }}>
                                <i className="fa fa-history"></i> Activity Log
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </CoordinatorLayout>
    );
};

export default CoordinatorHome;
