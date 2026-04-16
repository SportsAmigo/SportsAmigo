import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, logoutUser } from '../../store/slices/authSlice';
import OrganizerLayout from '../../components/layout/OrganizerLayout';
import axios from 'axios';
// recharts removed — using pure CSS charts for React 19 compatibility
import './OrganizerDashboard.css';
import { API_BASE_URL } from '../../utils/constants';

const OrganizerDashboard = () => {
    const user = useSelector(selectUser);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalEvents: 0,
        upcomingEvents: 0,
        totalParticipants: 0,
        completedEvents: 0
    });
    const [revenueStats, setRevenueStats] = useState(null);
    const [recentEvents, setRecentEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsResponse, eventsResponse] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/organizer/stats`, { withCredentials: true }),
                axios.get(`${API_BASE_URL}/api/organizer/events?limit=5`, { withCredentials: true })
            ]);

            if (statsResponse.data.success) {
                setStats(statsResponse.data.stats);
                if (statsResponse.data.stats.revenueStats) {
                    setRevenueStats(statsResponse.data.stats.revenueStats);
                }
            }

            if (eventsResponse.data.success) {
                setRecentEvents(eventsResponse.data.events);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await dispatch(logoutUser()).unwrap();
        navigate('/');
    };

    return (
        <OrganizerLayout>
            <div className="organizer-main-content">
                {/* Header Section with background styling from CSS */}
                <div className="dashboard-header-section">
                        <div className="dashboard-welcome-card">
                            <div className="welcome-text">
                                <h1>Welcome back, {user?.organization || user?.first_name || 'Organizer'}!</h1>
                                <p>Manage your events and track performance from your dashboard</p>
                            </div>
                            <Link to="/organizer/create-event" className="create-event-btn">
                                <i className="fa fa-plus-circle"></i>
                                Create New Event
                            </Link>
                        </div>

                    {/* Pending Verification Banner */}
                    {user?.verificationStatus && user.verificationStatus !== 'verified' && (
                        <div style={{
                            background: user.verificationStatus === 'rejected' ? 'linear-gradient(135deg, #FEE2E2, #FECACA)' : 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                            border: `1px solid ${user.verificationStatus === 'rejected' ? '#FCA5A5' : '#F59E0B'}`,
                            borderRadius: 12,
                            padding: '1rem 1.5rem',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}>
                            <i className={`fa ${user.verificationStatus === 'rejected' ? 'fa-times-circle' : 'fa-clock'}`}
                               style={{ fontSize: '1.5rem', color: user.verificationStatus === 'rejected' ? '#DC2626' : '#D97706' }}></i>
                            <div>
                                <strong style={{ color: user.verificationStatus === 'rejected' ? '#991B1B' : '#92400E', fontSize: '0.95rem' }}>
                                    {user.verificationStatus === 'rejected' ? 'Account Rejected' : 'Account Pending Verification'}
                                </strong>
                                <p style={{ color: user.verificationStatus === 'rejected' ? '#B91C1C' : '#A16207', fontSize: '0.8rem', margin: '2px 0 0' }}>
                                    {user.verificationStatus === 'rejected'
                                        ? 'Your organizer account has been rejected. Please contact support for more information.'
                                        : 'Your account is awaiting moderator approval. You cannot create events until your account is verified.'}
                                </p>
                            </div>
                        </div>
                    )}
                    </div>

                    {/* Stats Grid */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-card-content">
                                <div className="stat-icon blue">
                                    <i className="fa fa-calendar-alt"></i>
                                </div>
                                <div className="stat-info">
                                    <div className="stat-label">Total Events</div>
                                    <div className="stat-value">{stats.totalEvents}</div>
                                </div>
                            </div>
                            <Link to="/organizer/my-events" className="stat-link">
                                View all <i className="fa fa-arrow-right"></i>
                            </Link>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card-content">
                                <div className="stat-icon orange">
                                    <i className="fa fa-calendar-check"></i>
                                </div>
                                <div className="stat-info">
                                    <div className="stat-label">Upcoming Events</div>
                                    <div className="stat-value">{stats.upcomingEvents}</div>
                                </div>
                            </div>
                            <Link to="/organizer/my-events?filter=upcoming" className="stat-link">
                                View upcoming <i className="fa fa-arrow-right"></i>
                            </Link>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card-content">
                                <div className="stat-icon green">
                                    <i className="fa fa-users"></i>
                                </div>
                                <div className="stat-info">
                                    <div className="stat-label">Total Participants</div>
                                    <div className="stat-value">{stats.totalParticipants}</div>
                                </div>
                            </div>
                            <div className="stat-link" style={{cursor: 'default'}}>
                                Across all events
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card-content">
                                <div className="stat-icon purple">
                                    <i className="fa fa-check-circle"></i>
                                </div>
                                <div className="stat-info">
                                    <div className="stat-label">Completed</div>
                                    <div className="stat-value">{stats.completedEvents}</div>
                                </div>
                            </div>
                            <Link to="/organizer/my-events?filter=completed" className="stat-link">
                                View history <i className="fa fa-arrow-right"></i>
                            </Link>
                        </div>
                    </div>

                    {/* Revenue Summary Section */}
                    <div className="recent-events-section" style={{ marginTop: '1.5rem' }}>
                        <div className="recent-events-header">
                            <h2><i className="fa fa-chart-bar"></i> Revenue Summary</h2>
                            <Link to="/organizer/subscription" className="view-all-link">Manage Plan</Link>
                        </div>

                        {(user?.subscription?.plan === 'pro' || user?.subscription?.plan === 'enterprise') ? (
                                <div>
                                    {/* Revenue Stat Cards */}
                                    <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                                        <div className="stat-card">
                                            <div className="stat-card-content">
                                                <div className="stat-icon green">
                                                    <i className="fa fa-rupee-sign"></i>
                                                </div>
                                                <div className="stat-info">
                                                    <div className="stat-label">Total Revenue</div>
                                                    <div className="stat-value">₹{(revenueStats?.totalRevenue || 0).toLocaleString()}</div>
                                                </div>
                                            </div>
                                            <div className="stat-link" style={{ cursor: 'default' }}>Gross entry fees collected</div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-card-content">
                                                <div className="stat-icon blue">
                                                    <i className="fa fa-percentage"></i>
                                                </div>
                                                <div className="stat-info">
                                                    <div className="stat-label">Platform Commission</div>
                                                    <div className="stat-value">{revenueStats?.commissionRate || 0}%</div>
                                                </div>
                                            </div>
                                            <div className="stat-link" style={{ cursor: 'default' }}>Your plan rate</div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-card-content">
                                                <div className="stat-icon purple">
                                                    <i className="fa fa-wallet"></i>
                                                </div>
                                                <div className="stat-info">
                                                    <div className="stat-label">Your Earnings</div>
                                                    <div className="stat-value">₹{(revenueStats?.yourEarnings || 0).toLocaleString()}</div>
                                                </div>
                                            </div>
                                            <div className="stat-link" style={{ cursor: 'default' }}>After commission</div>
                                        </div>
                                    </div>

                                    {/* Bar Chart: Revenue by Event — pure CSS */}
                                    {revenueStats?.revenueByEvent && revenueStats.revenueByEvent.length > 0 && (() => {
                                        const maxVal = Math.max(...revenueStats.revenueByEvent.map(e => e.gross || 0), 1);
                                        return (
                                            <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: '1rem' }}>
                                                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '1rem' }}>
                                                    <i className="fa fa-chart-bar" style={{ marginRight: 8, color: '#2563EB' }}></i>Revenue by Event
                                                </h3>
                                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 200, padding: '0 8px 0' }}>
                                                    {revenueStats.revenueByEvent.map((ev, i) => (
                                                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                                                            <div style={{ fontSize: '0.65rem', color: '#6B7280', fontWeight: 600 }}>₹{(ev.gross||0).toLocaleString()}</div>
                                                            <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', height: 160 }}>
                                                                <div title={`Gross: ₹${(ev.gross||0).toLocaleString()}`} style={{ flex: 1, background: '#93C5FD', borderRadius: '4px 4px 0 0', height: `${Math.round(((ev.gross||0)/maxVal)*100)}%`, minHeight: 4, transition: 'height 0.3s' }} />
                                                                <div title={`Net: ₹${(ev.net||0).toLocaleString()}`} style={{ flex: 1, background: '#10B981', borderRadius: '4px 4px 0 0', height: `${Math.round(((ev.net||0)/maxVal)*100)}%`, minHeight: 4, transition: 'height 0.3s' }} />
                                                            </div>
                                                            <div style={{ fontSize: '0.6rem', color: '#9CA3AF', textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.name}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.75rem', color: '#6B7280' }}>
                                                    <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#93C5FD', borderRadius: 2, marginRight: 4 }}></span>Gross</span>
                                                    <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#10B981', borderRadius: 2, marginRight: 4 }}></span>Your Earnings</span>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Revenue Split — pure CSS donut */}
                                    {(revenueStats?.totalRevenue > 0) && (() => {
                                        const total = revenueStats.totalRevenue || 1;
                                        const earnPct = Math.round(((revenueStats.yourEarnings || 0) / total) * 100);
                                        const feePct = 100 - earnPct;
                                        return (
                                            <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
                                                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '1rem' }}>
                                                    <i className="fa fa-chart-pie" style={{ marginRight: 8, color: '#7C3AED' }}></i>Revenue Split
                                                </h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                                                    {/* CSS conic-gradient donut */}
                                                    <div style={{
                                                        width: 120, height: 120, borderRadius: '50%', flexShrink: 0,
                                                        background: `conic-gradient(#10B981 0% ${earnPct}%, #E5E7EB ${earnPct}% 100%)`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        boxShadow: 'inset 0 0 0 30px #fff'
                                                    }}>
                                                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>{earnPct}%</span>
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ marginBottom: 10 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                                                                <span style={{ color: '#6B7280' }}><span style={{ display: 'inline-block', width: 8, height: 8, background: '#10B981', borderRadius: '50%', marginRight: 6 }}></span>Your Earnings</span>
                                                                <span style={{ fontWeight: 600, color: '#111827' }}>₹{(revenueStats?.yourEarnings||0).toLocaleString()} ({earnPct}%)</span>
                                                            </div>
                                                            <div style={{ height: 8, borderRadius: 4, background: '#E5E7EB', overflow: 'hidden' }}>
                                                                <div style={{ width: `${earnPct}%`, height: '100%', background: '#10B981', borderRadius: 4 }} />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                                                                <span style={{ color: '#6B7280' }}><span style={{ display: 'inline-block', width: 8, height: 8, background: '#D1D5DB', borderRadius: '50%', marginRight: 6 }}></span>Platform Fee</span>
                                                                <span style={{ fontWeight: 600, color: '#111827' }}>₹{(revenueStats?.platformCut||0).toLocaleString()} ({feePct}%)</span>
                                                            </div>
                                                            <div style={{ height: 8, borderRadius: 4, background: '#E5E7EB', overflow: 'hidden' }}>
                                                                <div style={{ width: `${feePct}%`, height: '100%', background: '#D1D5DB', borderRadius: 4 }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                        ) : (
                            <div style={{ background: '#F9FAFB', border: '2px dashed #E5E7EB', borderRadius: 12, padding: '2.5rem', textAlign: 'center' }}>
                                <i className="fa fa-lock" style={{ fontSize: '2.5rem', color: '#D1D5DB', display: 'block', marginBottom: '0.75rem' }}></i>
                                <h3 style={{ color: '#374151', fontWeight: 600, marginBottom: '0.5rem' }}>Revenue Charts — Pro Feature</h3>
                                <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                                    Upgrade to Pro or Enterprise to unlock revenue analytics, charts, and earnings breakdown.
                                </p>
                                <Link to="/organizer/subscription"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.5rem', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: '#fff', borderRadius: 10, fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem' }}
                                >
                                    <i className="fa fa-arrow-up"></i> Upgrade Now
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Recent Events Section */}
                    <div className="recent-events-section">
                        <div className="recent-events-header">
                            <h2><i className="fa fa-star"></i> Recent Events</h2>
                            <Link to="/organizer/my-events" className="view-all-link">View all</Link>
                        </div>

                        {loading ? (
                            <div className="no-events">
                                <i className="fa fa-spinner fa-spin"></i>
                                <p>Loading events...</p>
                            </div>
                        ) : recentEvents.length === 0 ? (
                            <div className="no-events">
                                <i className="fa fa-calendar-times"></i>
                                <p>You haven't created any events yet</p>
                            </div>
                        ) : (
                            <div className="events-list">
                                {recentEvents.map((event) => (
                                    <div key={event._id} className="event-item">
                                        <div className="event-icon">
                                            <i className="fa fa-calendar"></i>
                                        </div>
                                        <div className="event-details">
                                            <h3>{event.name}</h3>
                                            <p>{event.sport} • {new Date(event.start_date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="event-actions">
                                            <Link to={`/organizer/event/${event._id}`} className="event-action-btn">
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
        </OrganizerLayout>
    );
};

export default OrganizerDashboard;
