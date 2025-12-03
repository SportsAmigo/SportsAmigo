import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import ManagerLayout from '../../components/layout/ManagerLayout';
import axios from 'axios';
import './EventDetails.css';

const EventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const [event, setEvent] = useState(null);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchEventDetails();
    }, [id]);

    const fetchEventDetails = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/manager/event/${id}/details`, { 
                withCredentials: true 
            });
            if (response.data.success) {
                setEvent(response.data.event);
                setTeams(response.data.teams || []);
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
    
    // Check if a specific team is registered
    const isTeamRegistered = (teamId) => {
        if (!event || !event.teamRegistrations) return false;
        return event.teamRegistrations.some(reg => 
            reg.team_id?.toString() === teamId?.toString()
        );
    };

    if (loading) {
        return (
            <ManagerLayout>
                <div className="event-details-container">
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Loading event details...</p>
                    </div>
                </div>
            </ManagerLayout>
        );
    }

    if (error || !event) {
        return (
            <ManagerLayout>
                <div className="event-details-container">
                    <div className="error-container">
                        <i className="fa fa-exclamation-triangle"></i>
                        <h3>Error</h3>
                        <p>{error || 'Event not found'}</p>
                        <Link to="/manager/browse-events" className="btn-back">
                            <i className="fa fa-arrow-left"></i>
                            Back to Events
                        </Link>
                    </div>
                </div>
            </ManagerLayout>
        );
    }

    return (
        <ManagerLayout>
            <div className="event-details-container">
                <div className="details-wrapper">
                    {/* Header */}
                    <div className="page-header">
                        <Link to="/manager/browse-events" className="back-link">
                            <i className="fa fa-arrow-left"></i>
                            Back to Events
                        </Link>
                        <h1 className="page-title">Event Details</h1>
                    </div>

                    {/* Event Card */}
                    <div className="event-card-large">
                        <div className="event-card-header">
                            <div>
                                <span className="sport-badge">
                                    <i className="fa fa-futbol"></i>
                                    {event.sport || event.sport_type}
                                </span>
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

                        {teams.length > 0 && (
                            <div className="teams-registration-section">
                                <h3>Register Your Teams</h3>
                                <p>Select which teams you want to register for this event:</p>
                                <div className="teams-list">
                                    {teams.map((team) => {
                                        const registered = isTeamRegistered(team._id);
                                        return (
                                            <div key={team._id} className="team-registration-card">
                                                <div className="team-info">
                                                    <i className="fa fa-users"></i>
                                                    <div>
                                                        <h4>{team.name}</h4>
                                                        <p>{team.sport_type}</p>
                                                    </div>
                                                </div>
                                                {registered ? (
                                                    <div className="registered-badge">
                                                        <i className="fa fa-check-circle"></i>
                                                        Registered
                                                    </div>
                                                ) : (
                                                    <Link 
                                                        to={`/manager/event/${id}/register?teamId=${team._id}`}
                                                        className="btn-register-team"
                                                    >
                                                        <i className="fa fa-user-plus"></i>
                                                        Register
                                                    </Link>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {teams.length === 0 && (
                            <div className="no-teams-section">
                                <i className="fa fa-users"></i>
                                <h3>No Teams Available</h3>
                                <p>You need to create a team before registering for events.</p>
                                <Link to="/manager/create-team" className="btn-create-team">
                                    <i className="fa fa-plus-circle"></i>
                                    Create Your First Team
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ManagerLayout>
    );
};

export default EventDetails;
