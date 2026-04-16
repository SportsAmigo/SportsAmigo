import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import OrganizerLayout from '../../components/layout/OrganizerLayout';
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
            const response = await axios.get(`${API_BASE_URL}/api/organizer/events`, { 
                withCredentials: true 
            });
            
            if (response.data.success) {
                console.log('Organizer MyEvents - Fetched events:', response.data.events);
                setEvents(response.data.events);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEvent = async (eventId, eventName) => {
        if (!window.confirm(`Are you sure you want to delete "${eventName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await axios.delete(`${API_BASE_URL}/api/organizer/event/${eventId}`, {
                withCredentials: true
            });

            if (response.data.success) {
                setEvents(events.filter(e => e._id !== eventId));
                alert('Event deleted successfully!');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Failed to delete event. Please try again.');
        }
    };

    return (
        <OrganizerLayout>
            <div className="organizer-my-events">
                <div className="my-events-content">
                    <div className="my-events-header">
                        <div className="my-events-header-content">
                            <div className="header-title-section">
                                <h1>
                                    <i className="fa fa-calendar-check"></i> My Events
                                </h1>
                                <p>Manage all your organized events</p>
                            </div>
                            <Link to="/organizer/create-event" className="create-event-btn">
                                <i className="fa fa-plus-circle"></i> Create New Event
                            </Link>
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
                                <div key={event._id} className="my-event-card">
                                    <div className="my-event-header">
                                        <h3 className="my-event-title">{event.name}</h3>
                                        <span className="my-event-sport-badge">{event.sport}</span>
                                    </div>
                                    
                                    <div className="my-event-info">
                                        <div className="my-event-info-item">
                                            <i className="fa fa-map-marker-alt"></i>
                                            <span>{event.location}</span>
                                        </div>
                                        <div className="my-event-info-item">
                                            <i className="fa fa-users"></i>
                                            <span>{event.registered_teams || 0} / {event.max_teams} Teams</span>
                                        </div>
                                    </div>

                                    <div className="my-event-footer">
                                        <Link to={`/organizer/event/${event._id}`} className="my-event-view-btn">
                                            <i className="fa fa-eye"></i> View Details
                                        </Link>
                                        <div className="my-event-actions">
                                            <Link to={`/organizer/edit-event/${event._id}`} className="my-event-edit-btn">
                                                <i className="fa fa-edit"></i>
                                            </Link>
                                            <button 
                                                onClick={() => handleDeleteEvent(event._id, event.name)}
                                                className="my-event-delete-btn"
                                            >
                                                <i className="fa fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="my-events-empty">
                            <i className="fa fa-calendar-times"></i>
                            <h3>No Events Yet</h3>
                            <p>You haven't created any events yet. Start organizing your first event!</p>
                            <div className="empty-actions">
                                <Link to="/organizer/create-event" className="empty-action-btn primary">
                                    <i className="fa fa-plus-circle"></i> Create Your First Event
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </OrganizerLayout>
    );
};

export default MyEvents;
