import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import ManagerLayout from '../../components/layout/ManagerLayout';
import axios from 'axios';
import './MyEvents.css';

const MyEvents = () => {
    const user = useSelector(selectUser);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchMyEvents();
    }, []);

    const fetchMyEvents = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/manager/my-events', { withCredentials: true });
            if (response.data.success) {
                setEvents(response.data.events || []);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEvents = events.filter(event => {
        if (filter === 'all') return true;
        if (filter === 'upcoming') return new Date(event.event_date) > new Date();
        if (filter === 'past') return new Date(event.event_date) <= new Date();
        return true;
    });

    return (
        <ManagerLayout>
            <div className="my-events-container">
                <div className="events-wrapper">
                    {/* Header */}
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">
                                <i className="fa fa-calendar-alt"></i>
                                My Events
                            </h1>
                            <p className="page-subtitle">
                                View all events your teams are registered for
                            </p>
                        </div>
                    </div>

                    {/* Filter Buttons */}
                    <div className="filter-section">
                        <button
                            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            <i className="fa fa-list"></i>
                            All Events
                        </button>
                        <button
                            className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
                            onClick={() => setFilter('upcoming')}
                        >
                            <i className="fa fa-clock"></i>
                            Upcoming
                        </button>
                        <button
                            className={`filter-btn ${filter === 'past' ? 'active' : ''}`}
                            onClick={() => setFilter('past')}
                        >
                            <i className="fa fa-history"></i>
                            Past Events
                        </button>
                    </div>

                    {/* Events List */}
                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <p>Loading events...</p>
                        </div>
                    ) : filteredEvents.length > 0 ? (
                        <div className="events-list">
                            {filteredEvents.map(event => (
                                <div key={event._id} className="event-card">
                                    <div className="event-main">
                                        <div className="event-date">
                                            <div className="date-box">
                                                <span className="day">{new Date(event.event_date).getDate()}</span>
                                                <span className="month">{new Date(event.event_date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                            </div>
                                        </div>

                                        <div className="event-details">
                                            <h3 className="event-name">{event.event_name || event.name}</h3>
                                            <div className="event-info-grid">
                                                <div className="info-item">
                                                    <i className="fa fa-users"></i>
                                                    <span>{event.team_name}</span>
                                                </div>
                                                <div className="info-item">
                                                    <i className="fa fa-futbol"></i>
                                                    <span>{event.sport_type || event.sport || 'Sport'}</span>
                                                </div>
                                                <div className="info-item">
                                                    <i className="fa fa-map-marker-alt"></i>
                                                    <span>{event.location || 'TBA'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="event-status">
                                            <span className={`status-badge ${new Date(event.event_date || event.start_date) > new Date() ? 'upcoming' : 'past'}`}>
                                                {new Date(event.event_date || event.start_date) > new Date() ? 'Upcoming' : 'Past'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="event-actions">
                                        <Link to={`/manager/event/${event.event_id || event._id}`} className="btn-view-details">
                                            <i className="fa fa-info-circle"></i>
                                            View Details
                                        </Link>
                                        <Link to={`/manager/team/${event.team_id}`} className="btn-team-roster">
                                            <i className="fa fa-users"></i>
                                            Team Roster
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <i className="fa fa-calendar-times empty-icon"></i>
                            <h3>No events found</h3>
                            <p>Your teams haven't registered for any events yet</p>
                            <Link to="/manager/browse-events" className="btn-browse">
                                <i className="fa fa-search"></i>
                                Browse Events
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </ManagerLayout>
    );
};

export default MyEvents;

