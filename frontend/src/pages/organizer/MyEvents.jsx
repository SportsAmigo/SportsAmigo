import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, logoutUser } from '../../store/slices/authSlice';
import axios from 'axios';
import './OrganizerDashboard.css';

const MyEvents = () => {
    const user = useSelector(selectUser);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState(searchParams.get('filter') || 'all');
    const [sortBy, setSortBy] = useState('date_desc');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        fetchMyEvents();
    }, []);

    useEffect(() => {
        applyFiltersAndSort();
    }, [events, searchTerm, filterStatus, sortBy]);

    const fetchMyEvents = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/organizer/events', { 
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

    const applyFiltersAndSort = () => {
        let filtered = [...events];

        if (searchTerm) {
            filtered = filtered.filter(event =>
                event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.location.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterStatus !== 'all') {
            const now = new Date();
            filtered = filtered.filter(event => {
                const startDate = new Date(event.start_date);
                const endDate = new Date(event.end_date);

                if (filterStatus === 'upcoming') {
                    return startDate > now;
                } else if (filterStatus === 'ongoing') {
                    return startDate <= now && endDate >= now;
                } else if (filterStatus === 'completed') {
                    return endDate < now;
                }
                return true;
            });
        }

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'date_desc':
                    return new Date(b.start_date) - new Date(a.start_date);
                case 'date_asc':
                    return new Date(a.start_date) - new Date(b.start_date);
                case 'name_asc':
                    return a.name.localeCompare(b.name);
                case 'name_desc':
                    return b.name.localeCompare(a.name);
                case 'participants':
                    return (b.registered_teams || 0) - (a.registered_teams || 0);
                default:
                    return 0;
            }
        });

        setFilteredEvents(filtered);
    };

    const getEventStatus = (event) => {
        const now = new Date();
        const startDate = new Date(event.start_date);
        const endDate = new Date(event.end_date);

        if (endDate < now) return { label: 'Completed', color: 'bg-gray-100 text-gray-800' };
        if (startDate <= now && endDate >= now) return { label: 'Ongoing', color: 'bg-blue-100 text-blue-800' };
        if (startDate > now) return { label: 'Upcoming', color: 'bg-green-100 text-green-800' };
        return { label: 'Scheduled', color: 'bg-yellow-100 text-yellow-800' };
    };

    const handleDeleteEvent = async (eventId, eventName) => {
        if (!window.confirm(`Are you sure you want to delete "${eventName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await axios.delete(`http://localhost:5000/api/organizer/event/${eventId}`, {
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

    const getStatusCount = (status) => {
        const now = new Date();
        return events.filter(event => {
            const startDate = new Date(event.start_date);
            const endDate = new Date(event.end_date);

            if (status === 'upcoming') return startDate > now;
            if (status === 'ongoing') return startDate <= now && endDate >= now;
            if (status === 'completed') return endDate < now;
            return true;
        }).length;
    };

    const handleLogout = async () => {
        await dispatch(logoutUser()).unwrap();
        navigate('/');
    };

    return (
        <div className="organizer-dashboard">
            <div className="organizer-dashboard-content">
                {/* Sidebar */}
                <div className={`organizer-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
                    <div className="sidebar-header">
                        <Link to="/" className="sidebar-logo">
                            <div className="sidebar-logo-icon">
                                <i className="fa fa-trophy"></i>
                            </div>
                            <span>SportsAmigo</span>
                        </Link>
                    </div>

                    <div className="sidebar-user-profile">
                        <div className="sidebar-user-avatar">
                            {user?.profile_image ? (
                                <img src={`http://localhost:5000${user.profile_image}`} alt="Profile" />
                            ) : (
                                <i className="fa fa-user"></i>
                            )}
                        </div>
                        <div className="sidebar-user-name">{user?.organization || user?.first_name || 'Organizer'}</div>
                        <div className="sidebar-user-role">Event Organizer</div>
                    </div>

                    <nav className="sidebar-nav">
                        <Link to="/organizer/dashboard" className="sidebar-nav-item">
                            <i className="fa fa-tachometer-alt"></i>
                            Dashboard
                        </Link>
                        <Link to="/organizer/my-events" className="sidebar-nav-item active">
                            <i className="fa fa-calendar-alt"></i>
                            My Events
                        </Link>
                        <Link to="/organizer/create-event" className="sidebar-nav-item">
                            <i className="fa fa-plus-circle"></i>
                            Create Event
                        </Link>
                        <Link to="/organizer/profile" className="sidebar-nav-item">
                            <i className="fa fa-user"></i>
                            Profile
                        </Link>
                    </nav>

                    <div className="sidebar-footer">
                        <button onClick={handleLogout} className="sidebar-logout-btn">
                            <i className="fa fa-sign-out-alt"></i>
                            Logout
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className={`organizer-main-content ${sidebarOpen ? '' : 'expanded'}`}>
                    {/* Sidebar Toggle Button */}
                    <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <i className={`fa fa-${sidebarOpen ? 'times' : 'bars'}`}></i>
                    </button>

        <div className="min-h-screen py-8" style={{
            backgroundImage: 'url(/images/581A3451.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            position: 'relative'
        }}>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                zIndex: 0
            }}></div>
            <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="container mx-auto px-4">
                <div className="bg-white bg-opacity-95 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg p-8 mb-8" style={{ backdropFilter: 'blur(10px)' }}>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                                My Events
                            </h1>
                            <p className="text-gray-600 text-lg">
                                Manage all your organized events in one place
                            </p>
                        </div>
                        <Link 
                            to="/organizer/create-event"
                            className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                        >
                            <i className="fa fa-plus-circle mr-2"></i>
                            Create New Event
                        </Link>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                filterStatus === 'all'
                                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            All Events ({events.length})
                        </button>
                        <button
                            onClick={() => setFilterStatus('upcoming')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                filterStatus === 'upcoming'
                                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Upcoming ({getStatusCount('upcoming')})
                        </button>
                        <button
                            onClick={() => setFilterStatus('ongoing')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                filterStatus === 'ongoing'
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Ongoing ({getStatusCount('ongoing')})
                        </button>
                        <button
                            onClick={() => setFilterStatus('completed')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                filterStatus === 'completed'
                                    ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Completed ({getStatusCount('completed')})
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <i className="fa fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            <input
                                type="text"
                                placeholder="Search events by name, sport, or location..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                            />
                        </div>
                        <div className="relative">
                            <i className="fa fa-sort absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="pl-12 pr-8 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 appearance-none bg-white cursor-pointer"
                            >
                                <option value="date_desc">Newest First</option>
                                <option value="date_asc">Oldest First</option>
                                <option value="name_asc">Name (A-Z)</option>
                                <option value="name_desc">Name (Z-A)</option>
                                <option value="participants">Most Participants</option>
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-600"></div>
                        <p className="text-gray-600 mt-6 text-lg">Loading your events...</p>
                    </div>
                ) : filteredEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ backdropFilter: 'blur(10px)' }}>
                        {filteredEvents.map(event => {
                            const status = getEventStatus(event);
                            const participationRate = event.max_teams > 0 
                                ? ((event.registered_teams || 0) / event.max_teams * 100).toFixed(0)
                                : 0;

                            return (
                                <div 
                                    key={event._id} 
                                    className="bg-white bg-opacity-95 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg hover:shadow-2xl transition-all duration-200 overflow-hidden group" style={{ backdropFilter: 'blur(10px)' }}
                                >
                                    <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4">
                                        <div className="flex items-start justify-between">
                                            <h3 className="text-xl font-bold text-white line-clamp-2 flex-1">
                                                {event.name}
                                            </h3>
                                            <span className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </div>
                                        <p className="text-orange-100 text-sm mt-2 font-medium">
                                            <i className="fa fa-tag mr-1"></i>
                                            {event.sport}
                                        </p>
                                    </div>

                                    <div className="p-6">
                                        <div className="space-y-3 mb-4">
                                            <p className="text-gray-600 text-sm flex items-center">
                                                <i className="fa fa-calendar w-6 text-orange-600"></i>
                                                <span className="font-medium">Start:</span>
                                                <span className="ml-1">
                                                    {new Date(event.start_date).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </p>
                                            <p className="text-gray-600 text-sm flex items-center">
                                                <i className="fa fa-calendar-check w-6 text-orange-600"></i>
                                                <span className="font-medium">End:</span>
                                                <span className="ml-1">
                                                    {new Date(event.end_date).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </p>
                                            <p className="text-gray-600 text-sm flex items-center">
                                                <i className="fa fa-map-marker-alt w-6 text-orange-600"></i>
                                                {event.location}
                                            </p>
                                            <p className="text-gray-600 text-sm flex items-center">
                                                <i className="fa fa-users w-6 text-orange-600"></i>
                                                <span className="font-medium">Teams:</span>
                                                <span className="ml-1">
                                                    {event.registered_teams || 0} / {event.max_teams}
                                                </span>
                                            </p>
                                            {event.entry_fee && (
                                                <p className="text-gray-600 text-sm flex items-center">
                                                    <i className="fa fa-rupee-sign w-6 text-orange-600"></i>
                                                    <span className="font-medium">Entry Fee:</span>
                                                    <span className="ml-1">₹{event.entry_fee}</span>
                                                </p>
                                            )}
                                        </div>

                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                                                <span>Participation</span>
                                                <span className="font-semibold">{participationRate}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className={`h-2 rounded-full transition-all duration-500 ${
                                                        participationRate >= 80 
                                                            ? 'bg-gradient-to-r from-green-500 to-green-600' 
                                                            : participationRate >= 50
                                                            ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                                            : 'bg-gradient-to-r from-orange-500 to-red-500'
                                                    }`}
                                                    style={{ width: `${participationRate}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Link 
                                                to={`/organizer/event/${event._id}`}
                                                className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 rounded-lg text-center font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                                            >
                                                <i className="fa fa-eye mr-2"></i>
                                                View Details
                                            </Link>
                                            <div className="flex gap-2">
                                                <Link 
                                                    to={`/organizer/edit-event/${event._id}`}
                                                    className="flex-1 border-2 border-orange-600 text-orange-600 px-4 py-2 rounded-lg text-center font-medium hover:bg-orange-50 transition-all duration-200"
                                                >
                                                    <i className="fa fa-edit mr-1"></i>
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteEvent(event._id, event.name)}
                                                    className="flex-1 border-2 border-red-600 text-red-600 px-4 py-2 rounded-lg text-center font-medium hover:bg-red-50 transition-all duration-200"
                                                >
                                                    <i className="fa fa-trash mr-1"></i>
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white bg-opacity-95 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg p-12 text-center" style={{ backdropFilter: 'blur(10px)' }}>
                        <div className="text-8xl text-gray-300 mb-6">
                            <i className="fa fa-calendar-times"></i>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-3">
                            {searchTerm || filterStatus !== 'all' 
                                ? 'No events found' 
                                : 'No events yet'}
                        </h3>
                        <p className="text-gray-600 mb-6 text-lg">
                            {searchTerm || filterStatus !== 'all'
                                ? 'Try adjusting your search or filters'
                                : "You haven't created any events yet. Start organizing your first event!"}
                        </p>
                        {!searchTerm && filterStatus === 'all' && (
                            <Link 
                                to="/organizer/create-event"
                                className="inline-block bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-4 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                            >
                                <i className="fa fa-plus-circle mr-2"></i>
                                Create Your First Event
                            </Link>
                        )}
                        {(searchTerm || filterStatus !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setFilterStatus('all');
                                }}
                                className="inline-block bg-gray-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-gray-700 transition-all duration-200"
                            >
                                <i className="fa fa-times-circle mr-2"></i>
                                Clear Filters
                            </button>
                        )}
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
