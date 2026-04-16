import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import PlayerLayout from '../../components/layout/PlayerLayout';
import axios from 'axios';
import './EventDetail.css';
import { API_BASE_URL } from '../../utils/constants';

const EventDetail = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchEventDetails();
    }, [eventId]);

    const fetchEventDetails = async () => {
        try {
            console.log('EventDetail - Fetching event with ID:', eventId);
            const response = await axios.get(`${API_BASE_URL}/api/player/event/${eventId}`, {
                withCredentials: true
            });

            if (response.data.success) {
                console.log('EventDetail - Received event data:', response.data.event);
                setEvent(response.data.event);
            }
        } catch (error) {
            console.error('Error fetching event details:', error);
            setMessage({ type: 'error', text: 'Failed to load event details' });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <PlayerLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-600 mb-4"></div>
                        <p className="text-gray-700 text-lg font-medium">Loading event details...</p>
                    </div>
                </div>
            </PlayerLayout>
        );
    }

    if (!event) {
        return (
            <PlayerLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="bg-white rounded-xl shadow-xl p-12 text-center max-w-md">
                        <i className="fa fa-exclamation-circle text-6xl text-red-500 mb-4"></i>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Event Not Found</h2>
                        <p className="text-gray-600 mb-6">This event doesn't exist or has been removed.</p>
                        <Link
                            to="/player/my-events"
                            className="inline-block bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                        >
                            Back to My Events
                        </Link>
                    </div>
                </div>
            </PlayerLayout>
        );
    }

    return (
        <PlayerLayout>
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 py-8">
                <div className="container mx-auto px-4 max-w-7xl">
                    {/* Message Alert */}
                    {message.text && (
                        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
                            <div className="flex items-center justify-between">
                                <span className="font-medium">{message.text}</span>
                                <button onClick={() => setMessage({ type: '', text: '' })} className="text-gray-500 hover:text-gray-700">
                                    <i className="fa fa-times"></i>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Header */}
                    <div className="bg-white rounded-xl shadow-xl overflow-hidden mb-8">
                        <div className="bg-gradient-to-r from-orange-600 to-red-600 p-8 text-white">
                            <Link to="/player/my-events" className="text-white hover:text-orange-100 mb-4 inline-flex items-center text-sm font-medium">
                                <i className="fa fa-arrow-left mr-2"></i> Back to My Events
                            </Link>
                            <h1 className="text-4xl font-bold mb-2 mt-2">{event.name}</h1>
                            <div className="flex items-center gap-4 mt-4">
                                <span className="text-white bg-white bg-opacity-20 px-4 py-2 rounded-full text-sm font-medium">
                                    <i className="fa fa-futbol mr-2"></i>{event.sport}
                                </span>
                                {event.my_team && (
                                    <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                                        <i className="fa fa-users mr-2"></i>{event.my_team}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Event Details Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Details */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Event Information */}
                            <div className="bg-white rounded-xl shadow-lg p-8">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                    <i className="fa fa-calendar-alt text-orange-600 mr-3"></i>
                                    Event Information
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-500 font-medium">Start Date</p>
                                        <p className="text-lg text-gray-800 font-semibold">
                                            <i className="fa fa-calendar text-orange-600 mr-2"></i>
                                            {event.start_date ? new Date(event.start_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set'}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-500 font-medium">End Date</p>
                                        <p className="text-lg text-gray-800 font-semibold">
                                            <i className="fa fa-calendar-check text-orange-600 mr-2"></i>
                                            {event.end_date ? new Date(event.end_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set'}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-500 font-medium">Location</p>
                                        <p className="text-lg text-gray-800 font-semibold">
                                            <i className="fa fa-map-marker-alt text-orange-600 mr-2"></i>
                                            {event.location}
                                        </p>
                                    </div>
                                    {event.entry_fee && event.entry_fee > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-sm text-gray-500 font-medium">Entry Fee</p>
                                            <p className="text-lg text-gray-800 font-semibold">
                                                <i className="fa fa-rupee-sign text-orange-600 mr-2"></i>
                                                ₹{event.entry_fee}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {event.description && (
                                <div className="bg-white rounded-xl shadow-lg p-8">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                                        <i className="fa fa-align-left text-orange-600 mr-3"></i>
                                        Description
                                    </h2>
                                    <p className="text-gray-700 leading-relaxed">{event.description}</p>
                                </div>
                            )}

                            {/* Participating Teams */}
                            {event.teams && event.teams.length > 0 && (
                                <div className="bg-white rounded-xl shadow-lg p-8">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                        <i className="fa fa-users text-orange-600 mr-3"></i>
                                        Participating Teams ({event.teams.length})
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {event.teams.map((team, index) => (
                                            <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{team.name}</p>
                                                        <p className="text-sm text-gray-600">{team.manager || 'Manager'}</p>
                                                    </div>
                                                    {team.is_my_team && (
                                                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                                            Your Team
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Fixtures */}
                            {event.fixtures && event.fixtures.length > 0 && (
                                <div className="bg-white rounded-xl shadow-lg p-8">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                        <i className="fa fa-calendar-day text-orange-600 mr-3"></i>
                                        Fixtures & Schedule
                                    </h2>
                                    <div className="space-y-4">
                                        {event.fixtures.map((fixture, index) => (
                                            <div key={index} className="p-4 border border-gray-200 rounded-lg">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm text-gray-600">
                                                        {new Date(fixture.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </span>
                                                    {fixture.status && (
                                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                                            fixture.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            fixture.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {fixture.status}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 text-center">
                                                        <p className="font-semibold text-gray-800">{fixture.team_a}</p>
                                                    </div>
                                                    <div className="px-4 text-gray-500 font-bold">VS</div>
                                                    <div className="flex-1 text-center">
                                                        <p className="font-semibold text-gray-800">{fixture.team_b}</p>
                                                    </div>
                                                </div>
                                                {fixture.score && (
                                                    <div className="mt-2 text-center">
                                                        <span className="text-lg font-bold text-orange-600">{fixture.score}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Side Stats */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-6">Quick Stats</h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-blue-600 font-medium mb-1">Teams Registered</p>
                                        <p className="text-2xl font-bold text-blue-700">{event.registered_teams || 0} / {event.max_teams || 'N/A'}</p>
                                    </div>
                                    {event.total_matches !== undefined && (
                                        <div className="p-4 bg-green-50 rounded-lg">
                                            <p className="text-sm text-green-600 font-medium mb-1">Total Matches</p>
                                            <p className="text-2xl font-bold text-green-700">{event.total_matches}</p>
                                        </div>
                                    )}
                                    {event.completed_matches !== undefined && (
                                        <div className="p-4 bg-purple-50 rounded-lg">
                                            <p className="text-sm text-purple-600 font-medium mb-1">Completed</p>
                                            <p className="text-2xl font-bold text-purple-700">{event.completed_matches}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PlayerLayout>
    );
};

export default EventDetail;
