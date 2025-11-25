import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import axios from 'axios';

const PlayerDashboard = () => {
    const user = useSelector(selectUser);
    const [stats, setStats] = useState({
        totalEvents: 0,
        activeTeams: 0,
        walletBalance: 0,
        upcomingMatches: 0
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // TODO: Implement API calls to fetch actual player data
            setStats({
                totalEvents: 0,
                activeTeams: 0,
                walletBalance: 0,
                upcomingMatches: 0
            });
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                        ⚽ Player Dashboard
                    </h1>
                    <p className="text-gray-600">Welcome back, {user?.first_name || user?.name}! Ready to play?</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard 
                        title="My Events"
                        value={stats.totalEvents}
                        subtitle="Registered"
                        icon="fa-calendar-check"
                        gradient="bg-gradient-to-br from-blue-500 to-blue-700"
                    />
                    <StatCard 
                        title="My Teams"
                        value={stats.activeTeams}
                        subtitle="Active teams"
                        icon="fa-users"
                        gradient="bg-gradient-to-br from-cyan-500 to-teal-600"
                    />
                    <StatCard 
                        title="Wallet"
                        value={`₹${stats.walletBalance}`}
                        subtitle="Balance"
                        icon="fa-wallet"
                        gradient="bg-gradient-to-br from-emerald-500 to-green-600"
                    />
                    <StatCard 
                        title="Matches"
                        value={stats.upcomingMatches}
                        subtitle="Upcoming"
                        icon="fa-trophy"
                        gradient="bg-gradient-to-br from-violet-500 to-purple-600"
                    />
                </div>

                {/* Welcome Card */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        👋 Welcome back, Champion!
                    </h2>
                    {stats.totalEvents > 0 ? (
                        <>
                            <p className="text-gray-600 mb-6">
                                You're registered for <span className="font-bold text-blue-600">{stats.totalEvents}</span> events. Keep training hard!
                            </p>
                            <Link 
                                to="/player/my-events" 
                                className="inline-block bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-cyan-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
                            >
                                View My Events 🏆
                            </Link>
                        </>
                    ) : (
                        <>
                            <p className="text-gray-600 mb-6">
                                Start your journey! Browse events and join a team to get started.
                            </p>
                            <div className="flex gap-4">
                                <Link 
                                    to="/player/browse-events" 
                                    className="inline-block bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-cyan-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
                                >
                                    Browse Events 🚀
                                </Link>
                                <Link 
                                    to="/player/find-teams" 
                                    className="inline-block bg-white text-emerald-600 border-2 border-emerald-600 px-8 py-3 rounded-full font-semibold hover:bg-emerald-50 transform hover:scale-105 transition-all duration-300"
                                >
                                    Find Teams 👥
                                </Link>
                            </div>
                        </>
                    )}
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* My Teams */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6">
                            <h3 className="text-xl font-bold text-white flex items-center">
                                <i className="fas fa-users mr-3"></i>
                                My Teams
                            </h3>
                        </div>
                        <div className="p-6">
                            {stats.activeTeams > 0 ? (
                                <div className="space-y-4">
                                    <div className="text-center py-8">
                                        <i className="fas fa-users text-6xl text-blue-500 mb-4"></i>
                                        <p className="text-gray-600 mb-4">You're part of {stats.activeTeams} teams</p>
                                        <Link to="/player/my-teams" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                                            View My Teams
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <i className="fas fa-users text-6xl text-gray-300 mb-4"></i>
                                    <p className="text-gray-500 mb-4">Not part of any team yet</p>
                                    <Link to="/player/find-teams" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                                        Find Teams
                                    </Link>
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
                            {stats.totalEvents > 0 ? (
                                <div className="space-y-4">
                                    <div className="text-center py-8">
                                        <i className="fas fa-calendar-check text-6xl text-emerald-500 mb-4"></i>
                                        <p className="text-gray-600 mb-4">{stats.totalEvents} events coming up</p>
                                        <Link to="/player/my-events" className="inline-block bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                                            View Events
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <i className="fas fa-calendar-alt text-6xl text-gray-300 mb-4"></i>
                                    <p className="text-gray-500 mb-4">No upcoming events</p>
                                    <Link to="/player/browse-events" className="inline-block bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                                        Browse Events
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Link to="/player/browse-events" className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <i className="fas fa-search text-3xl text-white"></i>
                            </div>
                            <h3 className="font-bold text-gray-800 mb-2">Browse Events</h3>
                            <p className="text-sm text-gray-600">Find competitions</p>
                        </div>
                    </Link>

                    <Link to="/player/my-teams" className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <i className="fas fa-users text-3xl text-white"></i>
                            </div>
                            <h3 className="font-bold text-gray-800 mb-2">My Teams</h3>
                            <p className="text-sm text-gray-600">View your teams</p>
                        </div>
                    </Link>

                    <Link to="/player/wallet" className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <i className="fas fa-wallet text-3xl text-white"></i>
                            </div>
                            <h3 className="font-bold text-gray-800 mb-2">My Wallet</h3>
                            <p className="text-sm text-gray-600">Manage balance</p>
                        </div>
                    </Link>

                    <Link to="/player/profile" className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <i className="fas fa-user-edit text-3xl text-white"></i>
                            </div>
                            <h3 className="font-bold text-gray-800 mb-2">Edit Profile</h3>
                            <p className="text-sm text-gray-600">Update settings</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PlayerDashboard;
