import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import PlayerLayout from '../../components/layout/PlayerLayout';
import axios from 'axios';
import './MyEvents.css';
import { API_BASE_URL } from '../../utils/constants';

const MyEvents = () => {
    const user = useSelector(selectUser);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyEvents();
    }, []);

    const fetchMyEvents = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/player/my-events`, { withCredentials: true });
            if (response.data.success) {
                console.log('MyEvents - Fetched events:', response.data.events);
                setEvents(response.data.events);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PlayerLayout>
            <div className="browse-wrapper">
                <div className="my-events-header">
                    <div className="my-events-header-content">
                        <div className="header-title-section">
                            <h1>
                                <i className="fa fa-calendar-check"></i> My Events
                            </h1>
                            <p>Events you have joined through your teams</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p className="loading-text">Loading events...</p>
                    </div>
                ) : events && events.length > 0 ? (
                    <div className="my-events-grid">
                        {events.map(event => (
                            <div key={event.id} className="my-event-card">
                                <div className="my-event-header">
                                    <h3 className="my-event-title">{event.name}</h3>
                                    <span className="my-event-sport-badge">{event.sport}</span>
                                </div>
                                
                                <div className="my-event-info">
                                    <div className="my-event-info-item">
                                        <i className="fa fa-calendar"></i>
                                        <span>{new Date(event.event_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="my-event-info-item">
                                        <i className="fa fa-map-marker-alt"></i>
                                        <span>{event.location}</span>
                                    </div>
                                </div>

                                <div className="my-event-team-info">
                                    <i className="fa fa-users"></i>
                                    <span>Team: <strong>{event.team_name || 'Unknown Team'}</strong></span>
                                </div>

                                <div className="my-event-footer">
                                    <Link to={`/player/event/${event.id}`} className="my-event-view-btn">
                                        <i className="fa fa-info-circle"></i> View Details
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="my-events-empty">
                        <i className="fa fa-info-circle"></i>
                        <h3>No Events Yet</h3>
                        <p>You haven't joined any events through your teams yet.</p>
                        <div className="empty-actions">
                            <Link to="/player/browse-teams" className="empty-action-btn primary">
                                <i className="fa fa-search"></i> Join a Team
                            </Link>
                            <Link to="/player/events" className="empty-action-btn secondary">
                                <i className="fa fa-calendar-alt"></i> Browse Events
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </PlayerLayout>
    );
};

export default MyEvents;
