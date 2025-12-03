import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import PlayerLayout from '../../components/layout/PlayerLayout';
import axios from 'axios';
import './EventDetails.css';

const EventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchEventDetails();
    }, [id]);

    const fetchEventDetails = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/player/event/${id}`, { 
                withCredentials: true 
            });
            if (response.data.success) {
                setEvent(response.data.event);
            } else {
                setError(response.data.message || 'Failed to load event details');
            }
        } catch (error) {
            console.error('Error fetching event details:', error);
            setError(error.response?.data?.message || 'Error loading event details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <PlayerLayout>
                <div className="event-details-wrapper">
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Loading event details...</p>
                    </div>
                </div>
            </PlayerLayout>
        );
    }

    if (error || !event) {
        return (
            <PlayerLayout>
                <div className="event-details-wrapper">
                    <div className="error-container">
                        <i className="fa fa-exclamation-triangle"></i>
                        <h3>Error</h3>
                        <p>{error || 'Event not found'}</p>
                        <Link to="/player/my-events" className="btn-back">
                            <i className="fa fa-arrow-left"></i>
                            Back to My Events
                        </Link>
                    </div>
                </div>
            </PlayerLayout>
        );
    }

    return (
        <PlayerLayout>
            <div className="event-details-wrapper">
                {/* Header */}
                <div className="page-header">
                    <Link to="/player/my-events" className="back-link">
                        <i className="fa fa-arrow-left"></i>
                        Back to My Events
                    </Link>
                    <div>
                        <h1 className="page-title">Event Details</h1>
                        <p className="page-subtitle">View complete event information</p>
                    </div>
                </div>

                {/* Event Card */}
                <div className="event-card-large">
                    <div className="event-card-header">
                        <div>
                            <span className="sport-badge">
                                <i className="fa fa-futbol"></i>
                                {event.sport || event.sport_type}
                            </span>
                            {event.is_registered && (
                                <span className="status-badge registered">
                                    <i className="fa fa-check-circle"></i> Your Team is Registered
                                </span>
                            )}
                        </div>
                    </div>

                    <h2 className="event-title">{event.name}</h2>

                    <div className="event-info-grid">
                        <div className="info-card">
                            <i className="fa fa-calendar"></i>
                            <div>
                                <span className="info-label">Event Date</span>
                                <span className="info-value">
                                    {new Date(event.date || event.event_date).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>

                        {event.time && (
                            <div className="info-card">
                                <i className="fa fa-clock"></i>
                                <div>
                                    <span className="info-label">Time</span>
                                    <span className="info-value">{event.time}</span>
                                </div>
                            </div>
                        )}

                        <div className="info-card">
                            <i className="fa fa-map-marker-alt"></i>
                            <div>
                                <span className="info-label">Location</span>
                                <span className="info-value">{event.location}</span>
                            </div>
                        </div>

                        <div className="info-card">
                            <i className="fa fa-users"></i>
                            <div>
                                <span className="info-label">Participants</span>
                                <span className="info-value">
                                    {event.current_participants || 0} / {event.max_participants || 'Unlimited'}
                                </span>
                            </div>
                        </div>

                        <div className="info-card">
                            <i className="fa fa-user-tie"></i>
                            <div>
                                <span className="info-label">Organizer</span>
                                <span className="info-value">{event.organizer || 'Unknown'}</span>
                            </div>
                        </div>

                        {event.registration_deadline && (
                            <div className="info-card">
                                <i className="fa fa-calendar-check"></i>
                                <div>
                                    <span className="info-label">Registration Deadline</span>
                                    <span className="info-value">
                                        {new Date(event.registration_deadline).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {event.description && (
                        <div className="description-section">
                            <h3>About This Event</h3>
                            <p>{event.description}</p>
                        </div>
                    )}

                    {event.team_name && (
                        <div className="team-participation-section">
                            <div className="participation-card">
                                <i className="fa fa-users"></i>
                                <div>
                                    <h3>Your Participating Team</h3>
                                    <p className="team-name">{event.team_name}</p>
                                    {event.registered_date && (
                                        <p className="registered-date">
                                            Registered on: {new Date(event.registered_date).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {event.rules && (
                        <div className="rules-section">
                            <h3><i className="fa fa-gavel"></i> Event Rules</h3>
                            <p>{event.rules}</p>
                        </div>
                    )}

                    {event.prize_details && (
                        <div className="prize-section">
                            <h3><i className="fa fa-trophy"></i> Prizes & Awards</h3>
                            <p>{event.prize_details}</p>
                        </div>
                    )}
                </div>
            </div>
        </PlayerLayout>
    );
};

export default EventDetails;
