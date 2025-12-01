import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import axios from 'axios';

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
            return <span className="badge bg-danger">Registration Closed</span>;
        }
        if (event.current_participants >= event.max_participants) {
            return <span className="badge bg-warning">Full</span>;
        }
        return <span className="badge bg-success">Open</span>;
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card bg-success text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h2 className="mb-0">
                                        <i className="fa fa-calendar-alt me-2"></i> Browse Events
                                    </h2>
                                    <p className="lead mt-2 mb-0">Discover and register for upcoming sports events</p>
                                </div>
                                <Link to="/player/my-events" className="btn btn-light btn-lg">
                                    <i className="fa fa-calendar-check me-2"></i> My Events
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-5">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search events by name or location..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <select
                                        className="form-select"
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
                                </div>
                                <div className="col-md-3">
                                    <button 
                                        className="btn btn-success w-100"
                                        onClick={handleSearch}
                                    >
                                        <i className="fa fa-search me-2"></i> Search
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Events Grid */}
            <div className="row row-cols-1 row-cols-md-2 g-4">
                {loading ? (
                    <div className="col-12 text-center py-5">
                        <div className="spinner-border text-success" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3 text-muted">Loading events...</p>
                    </div>
                ) : events && events.length > 0 ? (
                    events.map((event) => (
                        <div key={event._id || event.id} className="col">
                            <div className="card h-100 shadow-sm border-0">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <h5 className="card-title mb-0">{event.name || event.title}</h5>
                                        {getStatusBadge(event)}
                                    </div>

                                    <div className="mb-3">
                                        <span className="badge bg-primary me-2">
                                            <i className="fa fa-futbol me-1"></i>
                                            {event.sport || event.sport_type}
                                        </span>
                                    </div>

                                    {event.description && (
                                        <p className="card-text text-muted mb-3">
                                            {event.description.length > 120
                                                ? `${event.description.substring(0, 120)}...`
                                                : event.description}
                                        </p>
                                    )}

                                    <div className="mb-3">
                                        <p className="mb-2 small">
                                            <i className="fa fa-calendar me-2 text-success"></i>
                                            <strong>Date:</strong> {formatDate(event.date || event.event_date)}
                                        </p>
                                        <p className="mb-2 small">
                                            <i className="fa fa-map-marker-alt me-2 text-danger"></i>
                                            <strong>Location:</strong> {event.location}
                                        </p>
                                        {event.organizer && (
                                            <p className="mb-0 small">
                                                <i className="fa fa-user me-2 text-info"></i>
                                                <strong>Organizer:</strong> {event.organizer}
                                            </p>
                                        )}
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center">
                                        <Link
                                            to={`/player/event/${event._id || event.id}`}
                                            className="btn btn-success btn-sm"
                                        >
                                            <i className="fa fa-info-circle me-1"></i> View Details
                                        </Link>
                                        <small className="text-muted">
                                            {event.current_participants || 0} / {event.max_participants || 'Unlimited'} registered
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-12">
                        <div className="alert alert-info text-center">
                            <i className="fa fa-info-circle me-2"></i>
                            {searchTerm || sportFilter
                                ? 'No events found matching your search criteria.'
                                : 'No upcoming events available at the moment. Check back later!'}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BrowseEvents;
