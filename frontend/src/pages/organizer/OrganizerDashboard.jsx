import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, logoutUser } from '../../store/slices/authSlice';
import OrganizerLayout from '../../components/layout/OrganizerLayout';
import axios from 'axios';
import './OrganizerDashboard.css';

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
    const [recentEvents, setRecentEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsResponse, eventsResponse] = await Promise.all([
                axios.get('http://localhost:5000/api/organizer/stats', { withCredentials: true }),
                axios.get('http://localhost:5000/api/organizer/events?limit=5', { withCredentials: true })
            ]);

            if (statsResponse.data.success) {
                setStats(statsResponse.data.stats);
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
