import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import axios from 'axios';

const AdminDashboard = () => {
    const user = useSelector(selectUser);
    const [stats, setStats] = useState({
        users: 0,
        events: 0,
        teams: 0,
        players: 0,
        managers: 0,
        organizers: 0
    });
    const [activities, setActivities] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/admin/dashboard', { withCredentials: true });
            if (response.data.success) {
                setStats(response.data.counts || {});
                setActivities(response.data.activities || []);
                setUpcomingEvents(response.data.upcomingEvents || []);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    const StatCard = ({ title, value, subtitle, icon, gradient }) => (
        <div className={`relative overflow-hidden rounded-2xl p-6 shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl ${gradient}`}>
            <div className="relative z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-white/80 text-sm font-medium uppercase tracking-wide">{title}</p>
                        <h3 className="text-5xl font-bold text-white mt-2">{value}</h3>
                        <p className="text-white/70 text-xs mt-2">{subtitle}</p>
                    </div>
                    <div className="text-white/30 text-6xl">
                        <i className={`fas ${icon}`}></i>
                    </div>
                </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full -ml-10 -mb-10"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-100 to-zinc-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-700 to-gray-900 bg-clip-text text-transparent mb-2">
                        🛡️ Admin Dashboard
                    </h1>
                    <p className="text-gray-600">Welcome back, {user?.first_name || user?.email}! Platform overview and management.</p>
                </div>

                {/* Stats Grid - 6 Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <StatCard 
                        title="Total Users"
                        value={stats.users || 0}
                        subtitle="Platform users"
                        icon="fa-users"
                        gradient="bg-gradient-to-br from-slate-600 to-gray-800"
                    />
                    <StatCard 
                        title="Active Events"
                        value={stats.events || 0}
                        subtitle="All events"
                        icon="fa-calendar-alt"
                        gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                    />
                    <StatCard 
                        title="Teams"
                        value={stats.teams || 0}
                        subtitle="Registered teams"
                        icon="fa-users-cog"
                        gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
                    />
                    <StatCard 
                        title="Players"
                        value={stats.players || 0}
                        subtitle="Active players"
                        icon="fa-user-friends"
                        gradient="bg-gradient-to-br from-violet-500 to-purple-600"
                    />
                    <StatCard 
                        title="Managers"
                        value={stats.managers || 0}
                        subtitle="Team managers"
                        icon="fa-user-tie"
                        gradient="bg-gradient-to-br from-amber-500 to-orange-600"
                    />
                    <StatCard 
                        title="Organizers"
                        value={stats.organizers || 0}
                        subtitle="Event organizers"
                        icon="fa-user-shield"
                        gradient="bg-gradient-to-br from-rose-500 to-red-600"
                    />
                </div>

                {/* Welcome Card */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        👋 System Overview
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Platform is running smoothly with <span className="font-bold text-slate-600">{stats.users}</span> total users and <span className="font-bold text-emerald-600">{stats.events}</span> active events.
                    </p>
                    <div className="flex gap-4">
                        <Link 
                            to="/admin/users" 
                            className="inline-block bg-gradient-to-r from-slate-700 to-gray-900 text-white px-8 py-3 rounded-full font-semibold hover:from-slate-800 hover:to-black transform hover:scale-105 transition-all duration-300 shadow-lg"
                        >
                            Manage Users 👥
                        </Link>
                        <Link 
                            to="/admin/events" 
                            className="inline-block bg-white text-emerald-600 border-2 border-emerald-600 px-8 py-3 rounded-full font-semibold hover:bg-emerald-50 transform hover:scale-105 transition-all duration-300"
                        >
                            View Events 📅
                        </Link>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Recent Activities */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-700 to-gray-900 p-6">
                            <h3 className="text-xl font-bold text-white flex items-center">
                                <i className="fas fa-history mr-3"></i>
                                Recent Activities
                            </h3>
                        </div>
                        <div className="p-6">
                            {activities && activities.length > 0 ? (
                                <div className="space-y-4">
                                    {activities.slice(0, 5).map((activity, index) => (
                                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <i className="fas fa-bell text-slate-600"></i>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-800">{activity.description || 'New activity'}</p>
                                                <p className="text-xs text-gray-500 mt-1">{activity.timestamp || 'Just now'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <i className="fas fa-history text-6xl text-gray-300 mb-4"></i>
                                    <p className="text-gray-500">No recent activities</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upcoming Events */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6">
                            <h3 className="text-xl font-bold text-white flex items-center">
                                <i className="fas fa-calendar-alt mr-3"></i>
                                Upcoming Events
                            </h3>
                        </div>
                        <div className="p-6">
                            {upcomingEvents && upcomingEvents.length > 0 ? (
                                <div className="space-y-4">
                                    {upcomingEvents.slice(0, 5).map((event, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl hover:from-emerald-100 hover:to-teal-100 transition-all">
                                            <div>
                                                <h4 className="font-semibold text-gray-800">{event.name}</h4>
                                                <p className="text-sm text-gray-600">{new Date(event.start_date).toLocaleDateString()}</p>
                                            </div>
                                            <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
                                                Active
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <i className="fas fa-calendar-alt text-6xl text-gray-300 mb-4"></i>
                                    <p className="text-gray-500">No upcoming events</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Link to="/admin/users" className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-gray-800 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <i className="fas fa-users-cog text-3xl text-white"></i>
                            </div>
                            <h3 className="font-bold text-gray-800 mb-2">Manage Users</h3>
                            <p className="text-sm text-gray-600">View all users</p>
                        </div>
                    </Link>

                    <Link to="/admin/events" className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <i className="fas fa-calendar-check text-3xl text-white"></i>
                            </div>
                            <h3 className="font-bold text-gray-800 mb-2">Events</h3>
                            <p className="text-sm text-gray-600">Manage events</p>
                        </div>
                    </Link>

                    <Link to="/admin/reports" className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <i className="fas fa-chart-line text-3xl text-white"></i>
                            </div>
                            <h3 className="font-bold text-gray-800 mb-2">Reports</h3>
                            <p className="text-sm text-gray-600">Analytics</p>
                        </div>
                    </Link>

                    <Link to="/admin/settings" className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <i className="fas fa-cog text-3xl text-white"></i>
                            </div>
                            <h3 className="font-bold text-gray-800 mb-2">Settings</h3>
                            <p className="text-sm text-gray-600">System config</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
