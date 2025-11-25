import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import ManagerLayout from '../../components/layout/ManagerLayout';
import axios from 'axios';
import './BrowseEvents.css';

const BrowseEvents = () => {
    const user = useSelector(selectUser);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/manager/browse-events', { withCredentials: true });
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
        const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (event.sport || event.sport_type || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || (event.sport || event.sport_type) === filter;
        return matchesSearch && matchesFilter;
    });

    const sports = ['all', ...new Set(events.map(e => e.sport || e.sport_type))];

    return (
        <ManagerLayout>
            <div className="browse-wrapper">
                {/* Header */}
                <div className="page-header">
                        <div className="header-content">
                            <h1 className="page-title">
                                <i className="fa fa-calendar-alt"></i>
                                Browse Events
                            </h1>
                            <p className="page-subtitle">
                                {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} available • Register your teams to compete
                            </p>
                        </div>
                    </div>

                    {/* Search and Filter */}
                    <div className="filter-section">
                        <div className="search-box">
                            <i className="fa fa-search"></i>
                            <input
                                type="text"
                                placeholder="Search events by name or sport..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="filter-buttons">
                            {sports.map(sport => (
                                <button
                                    key={sport}
                                    className={`filter-btn ${filter === sport ? 'active' : ''}`}
                                    onClick={() => setFilter(sport)}
                                >
                                    {sport.charAt(0).toUpperCase() + sport.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Events Grid */}
                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <p>Loading events...</p>
                        </div>
                    ) : filteredEvents.length > 0 ? (
                        <div className="events-grid">
                            {filteredEvents.map(event => (
                                <div key={event._id || event.id} className="event-card">
                                    <div className="event-card-header">
                                        <span className="sport-badge">
                                            <i className="fa fa-futbol"></i>
                                            {event.sport || event.sport_type || 'Sport'}
                                        </span>
                                        <span className={`status-badge ${event.isRegistered ? 'registered' : 'open'}`}>
                                            {event.isRegistered ? 'Registered' : 'Open'}
                                        </span>
                                    </div>

                                    <h3 className="event-title">{event.name || 'Event'}</h3>

                                    <div className="event-info">
                                        <div className="info-row">
                                            <i className="fa fa-calendar"></i>
                                            <span>{new Date(event.date || event.event_date).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}</span>
                                        </div>
                                        <div className="info-row">
                                            <i className="fa fa-map-marker-alt"></i>
                                            <span>{event.location || 'TBD'}</span>
                                        </div>
                                        <div className="info-row">
                                            <i className="fa fa-users"></i>
                                            <span>{event.current_participants || 0} / {event.max_participants || 'Unlimited'}</span>
                                        </div>
                                        {event.organizer && (
                                            <div className="info-row">
                                                <i className="fa fa-user-tie"></i>
                                                <span>{event.organizer}</span>
                                            </div>
                                        )}
                                    </div>

                                    {event.description && (
                                        <p className="event-description">{event.description}</p>
                                    )}

                                    <div className="event-footer">
                                        {!event.isRegistered ? (
                                            <Link 
                                                to={`/manager/event/${event.id || event._id}/register`}
                                                className="btn-primary"
                                            >
                                                <i className="fa fa-user-plus"></i>
                                                Register Team
                                            </Link>
                                        ) : (
                                            <button className="btn-registered" disabled>
                                                <i className="fa fa-check-circle"></i>
                                                Registered
                                            </button>
                                        )}
                                        <Link 
                                            to={`/manager/event/${event.id || event._id}/details`}
                                            className="btn-secondary"
                                        >
                                            <i className="fa fa-info-circle"></i>
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <i className="fa fa-calendar-times empty-icon"></i>
                            <h3>No events found</h3>
                            <p>
                                {searchTerm || filter !== 'all' 
                                    ? 'Try adjusting your search or filters' 
                                    : 'There are no events available at the moment'}
                            </p>
                        </div>
                    )}
                </div>
        </ManagerLayout>
    );
};

export default BrowseEvents;

