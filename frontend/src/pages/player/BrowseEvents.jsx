import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import PlayerLayout from '../../components/layout/PlayerLayout';
import axios from 'axios';
import './BrowseEvents.css';

const BrowseEvents = () => {
    const user = useSelector(selectUser);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sportFilter, setSportFilter] = useState('');

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/player/api/events/browse', { 
                withCredentials: true 
            });
            
            if (response.data.success) {
                setEvents(response.data.events);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (sportFilter) params.append('sport', sportFilter);

            const response = await axios.get(
                `http://localhost:5000/api/player/api/events/search?${params.toString()}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                setEvents(response.data.events);
            }
        } catch (error) {
            console.error('Error searching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusBadge = (event) => {
        const now = new Date();
        const eventDate = new Date(event.event_date);
        const deadline = new Date(event.registration_deadline);

        if (now > deadline) {
            return <span className="event-status-badge closed">Closed</span>;
        }
        if (event.current_participants >= event.max_participants) {
            return <span className="event-status-badge full">Full</span>;
        }
        return <span className="event-status-badge open">Open</span>;
    };

    return (
        <PlayerLayout>
            <div className="browse-wrapper">
                {/* Header */}
                <div className="events-page-header">
                    <div className="header-content-wrapper">
                        <div className="header-text">
                            <h1>
                                <i className="fa fa-calendar-alt"></i> Browse Events
                            </h1>
                            <p>Discover and register for upcoming sports events</p>
                        </div>
                        <Link to="/player/my-events" className="header-action-btn">
                            <i className="fa fa-calendar-check"></i> My Events
                        </Link>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="search-filters-section">
                    <div className="filters-grid">
                        <input
                            type="text"
                            className="filter-input"
                            placeholder="Search events by name or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <select
                            className="filter-select"
                            value={sportFilter}
                            onChange={(e) => setSportFilter(e.target.value)}
                        >
                            <option value="">All Sports</option>
                            <option value="Football">Football</option>
                            <option value="Basketball">Basketball</option>
                            <option value="Cricket">Cricket</option>
                            <option value="Tennis">Tennis</option>
                            <option value="Badminton">Badminton</option>
                            <option value="Volleyball">Volleyball</option>
                        </select>
                        <button 
                            className="search-button"
                            onClick={handleSearch}
                        >
                            <i className="fa fa-search"></i> Search
                        </button>
                    </div>
                </div>

                {/* Events Grid */}
                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p className="loading-text">Loading events...</p>
                    </div>
                ) : events && events.length > 0 ? (
                    <div className="events-grid">
                        {events.map((event) => (
                            <div key={event._id || event.id} className="event-card">
                                <div className="event-header">
                                    <h3 className="event-title">{event.name || event.title}</h3>
                                    {getStatusBadge(event)}
                                </div>

                                <span className="event-sport-badge">
                                    <i className="fa fa-futbol"></i>
                                    {event.sport || event.sport_type}
                                </span>

                                {event.description && (
                                    <p className="event-description">
                                        {event.description.length > 120
                                            ? `${event.description.substring(0, 120)}...`
                                            : event.description}
                                    </p>
                                )}

                                <div className="event-info-list">
                                    <div className="event-info-item">
                                        <i className="fa fa-calendar"></i>
                                        <span><strong>Date:</strong> {formatDate(event.date || event.event_date)}</span>
                                    </div>
                                    <div className="event-info-item">
                                        <i className="fa fa-map-marker-alt"></i>
                                        <span><strong>Location:</strong> {event.location}</span>
                                    </div>
                                    {event.organizer && (
                                        <div className="event-info-item">
                                            <i className="fa fa-user"></i>
                                            <span><strong>Organizer:</strong> {event.organizer}</span>
                                            {event.organizerTier === 'enterprise' && (
                                                <span className="organizer-tier-badge enterprise-badge">★ Enterprise</span>
                                            )}
                                            {event.organizerTier === 'pro' && (
                                                <span className="organizer-tier-badge pro-badge">⚡ Pro</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="event-footer">
                                    <Link
                                        to={`/player/event/${event._id || event.id}`}
                                        className="event-view-btn"
                                    >
                                        <i className="fa fa-info-circle"></i> View Details
                                    </Link>
                                    <span className="event-participants">
                                        {event.current_participants || 0} / {event.max_participants || 'Unlimited'} registered
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <i className="fa fa-info-circle"></i>
                        <h3>No Events Found</h3>
                        <p>
                            {searchTerm || sportFilter
                                ? 'No events found matching your search criteria.'
                                : 'No upcoming events available at the moment. Check back later!'}
                        </p>
                    </div>
                )}
            </div>
        </PlayerLayout>
    );
};

export default BrowseEvents;
