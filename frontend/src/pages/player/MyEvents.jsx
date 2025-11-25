import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import axios from 'axios';

const MyEvents = () => {
    const user = useSelector(selectUser);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyEvents();
    }, []);

    const fetchMyEvents = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/player/my-events', { withCredentials: true });
            if (response.data.success) {
                setEvents(response.data.events);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-container">
            <div className="row mb-4">
                <div className="col">
                    <div className="card">
                        <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
                            <h3 className="mb-0">My Events</h3>
                            <Link to="/player/browse-events" className="btn btn-light">Browse Events</Link>
                        </div>
                        <div className="card-body">
                            <p className="lead mb-4">Here are the events you have joined through your teams:</p>
                            
                            <div className="row row-cols-1 row-cols-md-2 g-4">
                                {events && events.length > 0 ? (
                                    events.map(event => (
                                        <div key={event.id} className="col">
                                            <div className="card h-100 border-0 shadow-sm">
                                                <div className="card-body">
                                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                                        <h4 className="card-title mb-0">{event.name}</h4>
                                                        <span className="badge bg-primary">{event.sport}</span>
                                                    </div>
                                                    <p className="text-muted mb-2">
                                                        <i className="fa fa-calendar me-1"></i> 
                                                        {new Date(event.event_date).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-muted mb-2">
                                                        <i className="fa fa-map-marker me-1"></i> {event.location}
                                                    </p>
                                                    <p className="text-muted mb-3">
                                                        <i className="fa fa-users me-1"></i> Team: 
                                                        <strong className="text-success"> {event.team_name || 'Unknown Team'}</strong>
                                                    </p>
                                                    <div className="d-flex justify-content-between">
                                                        <Link to={`/player/event/${event.id}`} className="btn btn-sm btn-primary">
                                                            View Details
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-12 text-center">
                                        <div className="alert alert-info">
                                            <p className="mb-0">
                                                <i className="fa fa-info-circle me-2"></i>
                                                You haven't joined any events through your teams yet.
                                            </p>
                                            <p className="mt-3 mb-0">
                                                <Link to="/player/browse-teams" className="btn btn-sm btn-outline-primary me-2">
                                                    Join a Team
                                                </Link>
                                                <Link to="/player/browse-events" className="btn btn-sm btn-outline-success">
                                                    Browse Events
                                                </Link>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyEvents;
