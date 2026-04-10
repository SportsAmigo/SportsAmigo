import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import AdminLayout from '../../components/layout/AdminLayout';
import './AdminDashboard.css';
import axios from 'axios';

const AdminDashboard = () => {
    const user = useSelector(selectUser);
    const [stats, setStats] = useState({
        users: 0,
        events: 0,
        teams: 0,
        players: 0,
        managers: 0,
        organizers: 0
    });
    const [activities, setActivities] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/admin/dashboard', { withCredentials: true });
            if (response.data.success) {
                setStats(response.data.counts || {});
                setActivities(response.data.activities || []);
                setUpcomingEvents(response.data.upcomingEvents || []);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="dashboard-page-wrapper">
                {/* Header Section */}
                <div className="dashboard-header-section">
                    <div className="dashboard-welcome-card">
                        <div className="welcome-text">
                            <h1>🛡️ Admin Dashboard</h1>
                            <p>Platform overview and management tools</p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-card-content">
                            <div className="stat-icon admin">
                                <i className="fa fa-users"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-label">Total Users</div>
                                <div className="stat-value">{stats.users || 0}</div>
                            </div>
                        </div>
                        <Link to="/admin/users" className="stat-link">
                            View all users <i className="fa fa-arrow-right"></i>
                        </Link>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-content">
                            <div className="stat-icon blue">
                                <i className="fa fa-user-friends"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-label">Players</div>
                                <div className="stat-value">{stats.players || 0}</div>
                            </div>
                        </div>
                        <Link to="/admin/players" className="stat-link">
                            View players <i className="fa fa-arrow-right"></i>
                        </Link>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-content">
                            <div className="stat-icon yellow">
                                <i className="fa fa-user-tie"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-label">Managers</div>
                                <div className="stat-value">{stats.managers || 0}</div>
                            </div>
                        </div>
                        <Link to="/admin/managers" className="stat-link">
                            View managers <i className="fa fa-arrow-right"></i>
                        </Link>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-content">
                            <div className="stat-icon red">
                                <i className="fa fa-user-shield"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-label">Organizers</div>
                                <div className="stat-value">{stats.organizers || 0}</div>
                            </div>
                        </div>
                        <Link to="/admin/organizers" className="stat-link">
                            View organizers <i className="fa fa-arrow-right"></i>
                        </Link>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-content">
                            <div className="stat-icon purple">
                                <i className="fa fa-users"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-label">Teams</div>
                                <div className="stat-value">{stats.teams || 0}</div>
                            </div>
                        </div>
                        <Link to="/admin/teams" className="stat-link">
                            View teams <i className="fa fa-arrow-right"></i>
                        </Link>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-content">
                            <div className="stat-icon green">
                                <i className="fa fa-calendar-alt"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-label">Events</div>
                                <div className="stat-value">{stats.events || 0}</div>
                            </div>
                        </div>
                        <Link to="/admin/events" className="stat-link">
                            View events <i className="fa fa-arrow-right"></i>
                        </Link>
                    </div>
                </div>

                {/* Two Column Layout - Activities & Events */}
                <div className="two-column-layout">
                    {/* Recent Activities */}
                    <div className="content-section" style={{padding: 0}}>
                        <div className="section-header">
                            <h2>
                                <i className="fa fa-history"></i>
                                Recent Activities
                            </h2>
                            <Link to="/admin/activity-logs" className="view-all-link">View all</Link>
                        </div>
                        {activities && activities.length > 0 ? (
                            <div className="activity-list">
                                {activities.slice(0, 5).map((activity, index) => (
                                    <div key={index} className="activity-item">
                                        <div className="activity-icon">
                                            <i className="fa fa-bell"></i>
                                        </div>
                                        <div className="activity-details">
                                            <div className="activity-description">
                                                {activity.description || 'New activity'}
                                            </div>
                                            <div className="activity-time">
                                                {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Just now'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <i className="fa fa-history"></i>
                                <h3>No Activities Yet</h3>
                                <p>Platform activities will appear here</p>
                            </div>
                        )}
                    </div>

                    {/* Upcoming Events */}
                    <div className="content-section" style={{padding: 0}}>
                        <div className="section-header">
                            <h2>
                                <i className="fa fa-calendar-alt"></i>
                                Upcoming Events
                            </h2>
                            <Link to="/admin/events" className="view-all-link">View all</Link>
                        </div>
                        {upcomingEvents && upcomingEvents.length > 0 ? (
                            <div className="event-list">
                                {upcomingEvents.slice(0, 5).map((event, index) => (
                                    <div key={index} className="event-item">
                                        <div className="event-details">
                                            <h3>{event.name}</h3>
                                            <p>{new Date(event.start_date).toLocaleDateString()}</p>
                                        </div>
                                        <span className="event-status upcoming">Upcoming</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <i className="fa fa-calendar-alt"></i>
                                <h3>No Upcoming Events</h3>
                                <p>Events will appear here once created</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="quick-actions-grid">
                    <Link to="/admin/users" className="quick-action-card">
                        <div className="quick-action-icon">
                            <i className="fa fa-users-cog"></i>
                        </div>
                        <div className="quick-action-title">Manage Users</div>
                        <div className="quick-action-description">View and manage all platform users</div>
                    </Link>

                    <Link to="/admin/events" className="quick-action-card">
                        <div className="quick-action-icon">
                            <i className="fa fa-calendar-check"></i>
                        </div>
                        <div className="quick-action-title">Events</div>
                        <div className="quick-action-description">Monitor and manage events</div>
                    </Link>

                    <Link to="/admin/stats" className="quick-action-card">
                        <div className="quick-action-icon">
                            <i className="fa fa-chart-line"></i>
                        </div>
                        <div className="quick-action-title">Statistics</div>
                        <div className="quick-action-description">View platform analytics</div>
                    </Link>

                    <Link to="/admin/activity-logs" className="quick-action-card">
                        <div className="quick-action-icon">
                            <i className="fa fa-clipboard-list"></i>
                        </div>
                        <div className="quick-action-title">Activity Logs</div>
                        <div className="quick-action-description">Monitor system activities</div>
                    </Link>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
