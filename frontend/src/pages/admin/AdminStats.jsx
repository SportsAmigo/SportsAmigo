import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import axios from 'axios';

const AdminStats = () => {
    const [stats, setStats] = useState({
        users: { total: 0, players: 0, managers: 0, organizers: 0 },
        teams: { total: 0 },
        events: { total: 0, upcoming: 0, past: 0 }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/admin/dashboard', { withCredentials: true });
            if (response.data.success) {
                setStats(response.data.counts || {});
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Platform Statistics</h1>
                    <p className="text-gray-600">Comprehensive platform analytics and metrics</p>
                </div>

                {loading ? (
                    <div className="p-12 text-center bg-white rounded-xl shadow-md">
                        <i className="fas fa-spinner fa-spin text-4xl text-gray-400"></i>
                        <p className="text-gray-600 mt-4">Loading statistics...</p>
                    </div>
                ) : (
                    <>
                        {/* User Statistics */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">User Statistics</h2>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-white rounded-xl p-6 shadow-md">
                                    <div className="flex items-center justify-between mb-4">
                                        <i className="fas fa-users text-4xl text-slate-600"></i>
                                        <span className="text-3xl font-bold text-gray-800">{stats.users || 0}</span>
                                    </div>
                                    <p className="text-gray-600 font-medium">Total Users</p>
                                </div>
                                <div className="bg-white rounded-xl p-6 shadow-md">
                                    <div className="flex items-center justify-between mb-4">
                                        <i className="fas fa-user-friends text-4xl text-violet-600"></i>
                                        <span className="text-3xl font-bold text-gray-800">{stats.players || 0}</span>
                                    </div>
                                    <p className="text-gray-600 font-medium">Players</p>
                                </div>
                                <div className="bg-white rounded-xl p-6 shadow-md">
                                    <div className="flex items-center justify-between mb-4">
                                        <i className="fas fa-user-tie text-4xl text-amber-600"></i>
                                        <span className="text-3xl font-bold text-gray-800">{stats.managers || 0}</span>
                                    </div>
                                    <p className="text-gray-600 font-medium">Managers</p>
                                </div>
                                <div className="bg-white rounded-xl p-6 shadow-md">
                                    <div className="flex items-center justify-between mb-4">
                                        <i className="fas fa-user-shield text-4xl text-rose-600"></i>
                                        <span className="text-3xl font-bold text-gray-800">{stats.organizers || 0}</span>
                                    </div>
                                    <p className="text-gray-600 font-medium">Organizers</p>
                                </div>
                            </div>
                        </div>

                        {/* Team & Event Statistics */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Teams & Events</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-xl p-6 shadow-md">
                                    <div className="flex items-center justify-between mb-4">
                                        <i className="fas fa-users-cog text-4xl text-blue-600"></i>
                                        <span className="text-3xl font-bold text-gray-800">{stats.teams || 0}</span>
                                    </div>
                                    <p className="text-gray-600 font-medium">Total Teams</p>
                                </div>
                                <div className="bg-white rounded-xl p-6 shadow-md">
                                    <div className="flex items-center justify-between mb-4">
                                        <i className="fas fa-calendar-alt text-4xl text-emerald-600"></i>
                                        <span className="text-3xl font-bold text-gray-800">{stats.events || 0}</span>
                                    </div>
                                    <p className="text-gray-600 font-medium">Total Events</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminStats;
