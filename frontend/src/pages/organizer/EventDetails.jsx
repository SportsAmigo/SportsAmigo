import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import OrganizerLayout from '../../components/layout/OrganizerLayout';
import axios from 'axios';

const EventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const [event, setEvent] = useState(null);
    const [teamRequests, setTeamRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [activeTab, setActiveTab] = useState('details');

    useEffect(() => {
        fetchEventDetails();
    }, [id]);

    // Refresh data when returning to page
    useEffect(() => {
        const handleFocus = () => {
            fetchEventDetails();
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [id]);

    const fetchEventDetails = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/organizer/event/${id}`, {
                withCredentials: true
            });

            if (response.data.success) {
                setEvent(response.data.event);
                setTeamRequests(response.data.event.team_registrations || []);
            }
        } catch (error) {
            console.error('Error fetching event details:', error);
            setMessage({ type: 'error', text: 'Failed to load event details' });
        } finally {
            setLoading(false);
        }
    };

    const handleApproveRequest = async (teamId) => {
        try {
            // Ensure teamId is a string, not an object
            const teamIdString = typeof teamId === 'object' ? teamId._id || teamId.id : teamId;
            
            const response = await axios.put(
                `http://localhost:5000/api/organizer/event/${id}/approve-team/${teamIdString}`,
                {},
                { withCredentials: true }
            );

            if (response.data.success) {
                setMessage({ type: 'success', text: 'Team request approved!' });
                fetchEventDetails(); // Refresh data
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to approve request' });
        }
    };

    const handleRejectRequest = async (teamId) => {
        if (!window.confirm('Are you sure you want to reject this team request?')) return;

        try {
            // Ensure teamId is a string, not an object
            const teamIdString = typeof teamId === 'object' ? teamId._id || teamId.id : teamId;
            
            const response = await axios.put(
                `http://localhost:5000/api/organizer/event/${id}/reject-team/${teamIdString}`,
                {},
                { withCredentials: true }
            );

            if (response.data.success) {
                setMessage({ type: 'success', text: 'Team request rejected' });
                fetchEventDetails();
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to reject request' });
        }
    };

    const handleDeleteEvent = async () => {
        if (!window.confirm(`Are you sure you want to delete "${event?.name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await axios.delete(`http://localhost:5000/api/organizer/event/${id}`, {
                withCredentials: true
            });

            if (response.data.success) {
                navigate('/organizer/my-events');
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to delete event' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-600 mb-4"></div>
                    <p className="text-gray-700 text-lg font-medium">Loading event details...</p>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-xl p-12 text-center max-w-md">
                    <i className="fa fa-exclamation-circle text-6xl text-red-500 mb-4"></i>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Event Not Found</h2>
                    <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been deleted.</p>
                    <Link
                        to="/organizer/my-events"
                        className="inline-block bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                    >
                        Back to My Events
                    </Link>
                </div>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'upcoming': return 'bg-green-100 text-green-800';
            case 'ongoing': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    const pendingRequests = teamRequests.filter(req => req.status === 'pending');
    const approvedTeams = teamRequests.filter(req => req.status === 'approved' || req.status === 'confirmed');

    return (
        <OrganizerLayout>
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
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <Link to="/organizer/my-events" className="text-white hover:text-orange-100 mb-4 inline-flex items-center text-sm font-medium">
                                    <i className="fa fa-arrow-left mr-2"></i> Back to My Events
                                </Link>
                                <h1 className="text-4xl font-bold mb-2 mt-2">{event.name}</h1>
                                <div className="flex items-center gap-4 mt-4">
                                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(event.status)}`}>
                                        {event.status}
                                    </span>
                                    <span className="text-white bg-white bg-opacity-20 px-4 py-2 rounded-full text-sm font-medium">
                                        <i className="fa fa-tag mr-2"></i>{event.sport}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Link
                                    to={`/organizer/event/${event._id}/matches`}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg"
                                >
                                    <i className="fa fa-futbol mr-2"></i>Manage Matches
                                </Link>
                                <Link
                                    to={`/organizer/event/${event._id}/leaderboard`}
                                    className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all duration-200 shadow-lg"
                                >
                                    <i className="fa fa-trophy mr-2"></i>Leaderboard
                                </Link>
                                <Link
                                    to={`/organizer/edit-event/${event._id}`}
                                    className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-all duration-200 shadow-lg"
                                >
                                    <i className="fa fa-edit mr-2"></i>Edit Event
                                </Link>
                                <button
                                    onClick={handleDeleteEvent}
                                    className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-all duration-200 shadow-lg"
                                >
                                    <i className="fa fa-trash mr-2"></i>Delete
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 bg-gray-50">
                        <div className="flex">
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`px-8 py-4 font-semibold transition-all ${activeTab === 'details' ? 'text-orange-600 border-b-4 border-orange-600 bg-white' : 'text-gray-600 hover:text-orange-600 hover:bg-white'}`}
                            >
                                <i className="fa fa-info-circle mr-2"></i>Event Details
                            </button>
                            <button
                                onClick={() => setActiveTab('teams')}
                                className={`px-8 py-4 font-semibold transition-all relative ${activeTab === 'teams' ? 'text-orange-600 border-b-4 border-orange-600 bg-white' : 'text-gray-600 hover:text-orange-600 hover:bg-white'}`}
                            >
                                <i className="fa fa-users mr-2"></i>Teams & Requests
                                {pendingRequests.length > 0 && (
                                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                        {pendingRequests.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'details' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Details */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-xl shadow-lg p-8">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                    <i className="fa fa-calendar-alt text-orange-600 mr-3"></i>
                                    Event Information
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-500 font-medium">Location</p>
                                        <p className="text-lg text-gray-800 font-semibold">
                                            <i className="fa fa-map-marker-alt text-orange-600 mr-2"></i>
                                            {event.location}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-500 font-medium">Registration Deadline</p>
                                        <p className="text-lg text-gray-800 font-semibold">
                                            <i className="fa fa-clock text-orange-600 mr-2"></i>
                                            {event.registration_deadline ? new Date(event.registration_deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set'}
                                        </p>
                                    </div>
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
                        </div>

                        {/* Side Stats */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-6">Quick Stats</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                                        <div>
                                            <p className="text-sm text-blue-600 font-medium">Max Teams</p>
                                            <p className="text-2xl font-bold text-blue-700">{event.max_teams}</p>
                                        </div>
                                        <i className="fa fa-users text-4xl text-blue-300"></i>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                                        <div>
                                            <p className="text-sm text-green-600 font-medium">Registered</p>
                                            <p className="text-2xl font-bold text-green-700">{approvedTeams.length}</p>
                                        </div>
                                        <i className="fa fa-check-circle text-4xl text-green-300"></i>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                                        <div>
                                            <p className="text-sm text-yellow-600 font-medium">Pending</p>
                                            <p className="text-2xl font-bold text-yellow-700">{pendingRequests.length}</p>
                                        </div>
                                        <i className="fa fa-hourglass-half text-4xl text-yellow-300"></i>
                                    </div>
                                    {event.entry_fee && (
                                        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                                            <div>
                                                <p className="text-sm text-purple-600 font-medium">Entry Fee</p>
                                                <p className="text-2xl font-bold text-purple-700">₹{event.entry_fee}</p>
                                            </div>
                                            <i className="fa fa-rupee-sign text-4xl text-purple-300"></i>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <p className="text-sm text-gray-600 mb-2">Registration Progress</p>
                                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                                        <div
                                            className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-500"
                                            style={{ width: `${event.max_teams > 0 ? (approvedTeams.length / event.max_teams * 100) : 0}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-600 text-right">
                                        {event.max_teams > 0 ? Math.round(approvedTeams.length / event.max_teams * 100) : 0}% Full
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'teams' && (
                    <div className="space-y-8">
                        {/* Pending Requests */}
                        {pendingRequests.length > 0 && (
                            <div className="bg-white rounded-xl shadow-lg p-8">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                    <i className="fa fa-hourglass-half text-yellow-600 mr-3"></i>
                                    Pending Team Requests ({pendingRequests.length})
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {pendingRequests.map((request) => (
                                        <div key={request.team_id} className="border-2 border-yellow-200 rounded-lg p-6 bg-yellow-50 hover:shadow-lg transition-all">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-800">{request.team_name}</h3>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        <i className="fa fa-user mr-1"></i> Manager: {request.manager_name || 'Unknown'}
                                                    </p>
                                                </div>
                                                <span className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-semibold">
                                                    PENDING
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-4">
                                                <i className="fa fa-calendar mr-1"></i> Requested: {new Date(request.registration_date).toLocaleDateString()}
                                            </p>
                                            {request.players && request.players.length > 0 && (
                                                <div className="mb-4 p-3 bg-white rounded-lg">
                                                    <p className="text-sm font-semibold text-gray-700 mb-2">
                                                        <i className="fa fa-users mr-1"></i> Players ({request.players.length})
                                                    </p>
                                                    <ul className="space-y-1">
                                                        {request.players.slice(0, 5).map((player, idx) => (
                                                            <li key={idx} className="text-sm text-gray-600">• {player.name}</li>
                                                        ))}
                                                        {request.players.length > 5 && (
                                                            <li className="text-sm text-gray-500 italic">+ {request.players.length - 5} more...</li>
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleApproveRequest(request.team_id)}
                                                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                                                >
                                                    <i className="fa fa-check mr-2"></i>Approve
                                                </button>
                                                <button
                                                    onClick={() => handleRejectRequest(request.team_id)}
                                                    className="flex-1 border-2 border-red-500 text-red-600 py-3 rounded-lg font-semibold hover:bg-red-50 transition-all"
                                                >
                                                    <i className="fa fa-times mr-2"></i>Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Approved Teams */}
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                <i className="fa fa-check-circle text-green-600 mr-3"></i>
                                Approved Teams ({approvedTeams.length})
                            </h2>
                            {approvedTeams.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {approvedTeams.map((team) => (
                                        <div key={team.team_id} className="border border-green-200 rounded-lg p-6 bg-green-50 hover:shadow-lg transition-all">
                                            <div className="flex items-start justify-between mb-3">
                                                <h3 className="text-lg font-bold text-gray-800">{team.team_name || 'Unknown Team'}</h3>
                                                <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-semibold">
                                                    APPROVED
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">
                                                <i className="fa fa-user mr-1"></i> Manager: {team.manager_name || 'Unknown Manager'}
                                            </p>
                                            {team.players && team.players.length > 0 && (
                                                <div className="mt-3 p-3 bg-white rounded-lg">
                                                    <p className="text-xs font-semibold text-gray-700 mb-2">
                                                        <i className="fa fa-users mr-1"></i> Players ({team.players.length})
                                                    </p>
                                                    <ul className="space-y-1">
                                                        {team.players.slice(0, 3).map((player, idx) => (
                                                            <li key={idx} className="text-xs text-gray-600">• {player.name}</li>
                                                        ))}
                                                        {team.players.length > 3 && (
                                                            <li className="text-xs text-gray-500 italic">+ {team.players.length - 3} more...</li>
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <i className="fa fa-users text-6xl text-gray-300 mb-4"></i>
                                    <p className="text-gray-600 text-lg">No teams approved yet</p>
                                    <p className="text-gray-500 text-sm mt-2">Pending requests will appear above for approval</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
        </OrganizerLayout>
    );
};

export default EventDetails;
