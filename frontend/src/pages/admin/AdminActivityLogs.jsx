import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';

const AdminActivityLogs = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);
    const [selectedType, setSelectedType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => { fetchActivities(); }, []);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/admin/activity-logs`, {
                withCredentials: true,
                params: { limit: 200 }
            });
            if (response.data.success) {
                const rows = response.data.activities || response.data.data?.activities || [];
                setActivities(Array.isArray(rows) ? rows : []);
                setCurrentPage(1);
            }
        } catch (error) {
            console.error('Error fetching activities:', error);
            setActivities([]);
        } finally {
            setLoading(false);
        }
    };

    const getActivityIcon = (type) => {
        const icons = {
            registration: 'fa-user-plus', event_creation: 'fa-calendar-plus', event_update: 'fa-calendar-check',
            team_creation: 'fa-users', team_update: 'fa-users-cog', match_update: 'fa-futbol',
            login: 'fa-sign-in-alt', user_approval: 'fa-user-check', subscription_purchase: 'fa-id-card',
            subscription_cancelled: 'fa-id-badge', vas_purchase: 'fa-gem', payout_processed: 'fa-hand-holding-usd',
            commission_update: 'fa-coins', coordinator_action: 'fa-clipboard-check',
            cache_anomaly: 'fa-bolt', deploy_status_change: 'fa-rocket',
        };
        return icons[type] || 'fa-bell';
    };

    const getActivityColor = (type) => {
        const colors = {
            registration: 'bg-blue-100 text-blue-600', event_creation: 'bg-emerald-100 text-emerald-600',
            event_update: 'bg-teal-100 text-teal-600', team_creation: 'bg-violet-100 text-violet-600',
            team_update: 'bg-purple-100 text-purple-600', match_update: 'bg-amber-100 text-amber-600',
            login: 'bg-gray-100 text-gray-600', user_approval: 'bg-green-100 text-green-600',
            subscription_purchase: 'bg-indigo-100 text-indigo-600', vas_purchase: 'bg-cyan-100 text-cyan-600',
            payout_processed: 'bg-emerald-100 text-emerald-600', commission_update: 'bg-lime-100 text-lime-600',
            coordinator_action: 'bg-sky-100 text-sky-600', cache_anomaly: 'bg-yellow-100 text-yellow-700',
            deploy_status_change: 'bg-orange-100 text-orange-700',
        };
        return colors[type] || 'bg-gray-100 text-gray-600';
    };

    const filteredActivities = activities.filter((a) => {
        const matchType = selectedType === 'all' || a.type === selectedType;
        const matchSearch = !searchTerm || (
            (a.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.userName || a.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        const ts = a.timestamp ? new Date(a.timestamp) : null;
        const matchFrom = !dateFrom || (ts && ts >= new Date(dateFrom));
        const matchTo = !dateTo || (ts && ts <= new Date(dateTo + 'T23:59:59'));
        return matchType && matchSearch && matchFrom && matchTo;
    });

    useEffect(() => { setCurrentPage(1); }, [selectedType, searchTerm, dateFrom, dateTo]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentActivities = filteredActivities.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
    const uniqueTypes = ['all', ...new Set(activities.map((a) => a.type).filter(Boolean))];

    // CSV Export
    const exportCSV = () => {
        const headers = ['Type', 'User', 'Role', 'Description', 'Timestamp'];
        const rows = filteredActivities.map(a => [
            a.type || '',
            a.userName || a.user?.name || 'System',
            a.userRole || a.user?.role || '',
            (a.description || '').replace(/,/g, ';'),
            a.timestamp ? new Date(a.timestamp).toLocaleString() : ''
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'activity_logs.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <AdminLayout>
            <div className="p-6 bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen">
                <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-1">Activity Logs</h1>
                        <p className="text-gray-600">Recent platform activities and user actions</p>
                    </div>
                    <button onClick={exportCSV}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all text-sm shadow">
                        <i className="fas fa-download"></i> Export CSV
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Total Activities', count: activities.length, icon: 'fa-chart-line', color: 'from-slate-600 to-slate-800' },
                        { label: 'Registrations', count: activities.filter(a => a.type === 'registration').length, icon: 'fa-user-plus', color: 'from-blue-500 to-blue-700' },
                        { label: 'Events Created', count: activities.filter(a => a.type === 'event_creation').length, icon: 'fa-calendar-plus', color: 'from-emerald-500 to-emerald-700' },
                        { label: 'Teams Formed', count: activities.filter(a => a.type === 'team_creation').length, icon: 'fa-users', color: 'from-violet-500 to-violet-700' },
                    ].map(card => (
                        <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-xl p-4 text-white shadow`}>
                            <div className="flex items-center justify-between">
                                <i className={`fas ${card.icon} text-2xl text-white/70`}></i>
                                <span className="text-3xl font-black">{card.count}</span>
                            </div>
                            <p className="text-sm font-semibold text-white/80 mt-2">{card.label}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    {/* Filters bar */}
                    <div className="px-6 py-4 border-b bg-slate-50 flex flex-wrap gap-3 items-center">
                        <input
                            type="text"
                            placeholder="Search user or description..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="border rounded-xl px-4 py-2 text-sm flex-1 min-w-[180px] focus:ring-2 focus:ring-slate-400 outline-none"
                        />
                        <select
                            value={selectedType}
                            onChange={e => setSelectedType(e.target.value)}
                            className="border rounded-xl px-3 py-2 text-sm bg-white"
                        >
                            {uniqueTypes.map(t => (
                                <option key={t} value={t}>{t === 'all' ? 'All Types' : t.replaceAll('_', ' ')}</option>
                            ))}
                        </select>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>From:</span>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                                className="border rounded-xl px-3 py-2 text-sm" />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>To:</span>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                                className="border rounded-xl px-3 py-2 text-sm" />
                        </div>
                        <button onClick={() => { setSearchTerm(''); setSelectedType('all'); setDateFrom(''); setDateTo(''); }}
                            className="text-sm text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl border hover:bg-slate-100">
                            Clear
                        </button>
                        <button onClick={fetchActivities}
                            className="text-sm px-3 py-2 border rounded-xl hover:bg-gray-100">
                            <i className="fas fa-sync-alt mr-1"></i>Refresh
                        </button>
                        <span className="px-4 py-2 bg-slate-700 text-white rounded-full text-sm font-semibold ml-auto">
                            {filteredActivities.length} Activities
                        </span>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <i className="fas fa-spinner fa-spin text-4xl text-gray-400"></i>
                            <p className="text-gray-600 mt-4">Loading activities...</p>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="p-12 text-center">
                            <i className="fas fa-history text-6xl text-gray-300 mb-4"></i>
                            <p className="text-gray-600">No activities yet</p>
                        </div>
                    ) : filteredActivities.length === 0 ? (
                        <div className="p-12 text-center">
                            <i className="fas fa-search text-4xl text-gray-300 mb-4"></i>
                            <p className="text-gray-500">No activities match your filters</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {currentActivities.map((activity, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                                                        <i className={`fas ${getActivityIcon(activity.type)}`}></i>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-gray-900">{activity.userName || activity.user?.name || 'System'}</p>
                                                    <p className="text-sm text-gray-500 capitalize">{activity.userRole || activity.user?.role || 'System'}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-gray-800">{activity.description || 'New activity'}</p>
                                                    {activity.type && (
                                                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs capitalize">
                                                            {activity.type.replaceAll('_', ' ')}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                    {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Just now'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                                    <div className="text-sm text-gray-600">
                                        {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredActivities.length)} of {filteredActivities.length}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                            className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-100">
                                            <i className="fas fa-chevron-left mr-1"></i>Prev
                                        </button>
                                        <span className="text-sm text-gray-600">Page {currentPage} / {totalPages}</span>
                                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                            className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-100">
                                            Next<i className="fas fa-chevron-right ml-1"></i>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminActivityLogs;
