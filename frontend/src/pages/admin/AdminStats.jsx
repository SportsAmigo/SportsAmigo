import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';

const COLORS = ['#2563eb', '#0f766e', '#7c3aed', '#d97706', '#dc2626', '#0891b2'];

const AdminStats = () => {
    const [stats, setStats] = useState({
        users: { total: 0, players: 0, managers: 0, organizers: 0, coordinators: 0 },
        teams: { total: 0 },
        events: { total: 0, upcoming: 0, past: 0 },
        subscriptions: { active: 0, expiringIn7Days: 0 },
        commissions: { pendingPayoutCount: 0 },
        verification: { pendingOrganizers: 0 },
        coordinator: { actionsToday: 0 }
    });
    const [financial, setFinancial] = useState({
        subscription: { monthlyRevenue: 0 },
        vas: { totalRevenue: 0 },
        commission: { totalCommission: 0 }
    });
    const [registrationTrend, setRegistrationTrend] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            const [statsRes, financialRes, extendedRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/admin/api/stats`, { withCredentials: true }),
                axios.get(`${API_BASE_URL}/api/admin/financial-overview`, { withCredentials: true }),
                axios.get(`${API_BASE_URL}/api/admin/stats/extended`, { withCredentials: true })
            ]);
            if (statsRes.data.success) setStats(statsRes.data.data || {});
            if (financialRes.data.success) setFinancial(financialRes.data.data || { subscription: { monthlyRevenue: 0 }, vas: { totalRevenue: 0 }, commission: { totalCommission: 0 } });
            if (extendedRes.data.success) setRegistrationTrend(extendedRes.data.data?.registrationTrend || []);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const userDistribution = [
        { name: 'Players', value: stats.users?.players || 0 },
        { name: 'Managers', value: stats.users?.managers || 0 },
        { name: 'Organizers', value: stats.users?.organizers || 0 },
        { name: 'Coordinators', value: stats.users?.coordinators || 0 }
    ];

    const platformVolume = [
        { name: 'Users', value: stats.users?.total || 0 },
        { name: 'Teams', value: stats.teams?.total || 0 },
        { name: 'Events', value: stats.events?.total || 0 },
        { name: 'Upcoming', value: stats.events?.upcoming || 0 },
        { name: 'Past', value: stats.events?.past || 0 }
    ];

    const financialMix = [
        { name: 'Subscription', value: Math.round(financial.subscription?.monthlyRevenue || 0) },
        { name: 'VAS', value: Math.round(financial.vas?.totalRevenue || 0) },
        { name: 'Commission', value: Math.round(financial.commission?.totalCommission || 0) }
    ];

    return (
        <AdminLayout>
            <div className="p-6 bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Platform Statistics</h1>
                    <p className="text-gray-600">Cross-domain analytics including financial performance signals.</p>
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
                            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
                                <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <i className="fas fa-users text-4xl text-slate-600"></i>
                                        <span className="text-3xl font-bold text-gray-800">{stats.users?.total || 0}</span>
                                    </div>
                                    <p className="text-gray-600 font-medium">Total Users</p>
                                </div>
                                <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <i className="fas fa-user-friends text-4xl text-violet-600"></i>
                                        <span className="text-3xl font-bold text-gray-800">{stats.users?.players || 0}</span>
                                    </div>
                                    <p className="text-gray-600 font-medium">Players</p>
                                </div>
                                <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <i className="fas fa-user-tie text-4xl text-amber-600"></i>
                                        <span className="text-3xl font-bold text-gray-800">{stats.users?.managers || 0}</span>
                                    </div>
                                    <p className="text-gray-600 font-medium">Managers</p>
                                </div>
                                <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <i className="fas fa-user-shield text-4xl text-rose-600"></i>
                                        <span className="text-3xl font-bold text-gray-800">{stats.users?.organizers || 0}</span>
                                    </div>
                                    <p className="text-gray-600 font-medium">Organizers</p>
                                </div>
                                <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <i className="fas fa-user-check text-4xl text-cyan-600"></i>
                                        <span className="text-3xl font-bold text-gray-800">{stats.users?.coordinators || 0}</span>
                                    </div>
                                    <p className="text-gray-600 font-medium">Coordinators</p>
                                </div>
                            </div>
                        </div>

                        {/* Team & Event Statistics */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Teams & Events</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <i className="fas fa-users-cog text-4xl text-blue-600"></i>
                                        <span className="text-3xl font-bold text-gray-800">{stats.teams?.total || 0}</span>
                                    </div>
                                    <p className="text-gray-600 font-medium">Total Teams</p>
                                </div>
                                <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <i className="fas fa-calendar-alt text-4xl text-emerald-600"></i>
                                        <span className="text-3xl font-bold text-gray-800">{stats.events?.total || 0}</span>
                                    </div>
                                    <p className="text-gray-600 font-medium">Total Events</p>
                                </div>
                                <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <i className="fas fa-calendar-check text-4xl text-purple-600"></i>
                                        <span className="text-3xl font-bold text-gray-800">{stats.events?.upcoming || 0}</span>
                                    </div>
                                    <p className="text-gray-600 font-medium">Upcoming Events</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 mb-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Operational KPIs</h2>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
                                    <p className="text-gray-600 font-medium">Active Subscriptions</p>
                                    <p className="text-3xl font-bold text-indigo-700 mt-2">{stats.subscriptions?.active || 0}</p>
                                </div>
                                <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
                                    <p className="text-gray-600 font-medium">Expiring in 7 Days</p>
                                    <p className="text-3xl font-bold text-amber-700 mt-2">{stats.subscriptions?.expiringIn7Days || 0}</p>
                                </div>
                                <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
                                    <p className="text-gray-600 font-medium">Pending Verifications</p>
                                    <p className="text-3xl font-bold text-cyan-700 mt-2">{stats.verification?.pendingOrganizers || 0}</p>
                                </div>
                                <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
                                    <p className="text-gray-600 font-medium">Coordinator Actions Today</p>
                                    <p className="text-3xl font-bold text-emerald-700 mt-2">{stats.coordinator?.actionsToday || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">User Distribution</h3>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={userDistribution} dataKey="value" nameKey="name" outerRadius={96} innerRadius={44}>
                                                {userDistribution.map((entry, index) => (
                                                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Platform Volumes</h3>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={platformVolume}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="value" fill="#2563eb" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Financial Mix</h3>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={financialMix} dataKey="value" nameKey="name" outerRadius={96} innerRadius={44}>
                                                {financialMix.map((entry, index) => (
                                                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => `INR ${Number(value || 0).toLocaleString()}`} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                        </div>

                        {/* Registration Trend Chart */}
                        {registrationTrend.length > 0 && (
                            <div className="mt-8 bg-white rounded-2xl p-6 shadow-md border border-slate-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Registration Trend (Last 6 Months)</h3>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={registrationTrend}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="period" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="players" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} name="Players" />
                                            <Line type="monotone" dataKey="managers" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} name="Managers" />
                                            <Line type="monotone" dataKey="organizers" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} name="Organizers" />
                                            <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} name="Total" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminStats;

