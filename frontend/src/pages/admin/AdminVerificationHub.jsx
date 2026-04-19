import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const STATUS_COLORS = ['#d97706', '#059669', '#dc2626', '#6b7280'];

const AdminVerificationHub = () => {
    const [overview, setOverview] = useState(null);
    const [activity, setActivity] = useState({ actionsToday: 0, actions: [] });
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        fetchOverview();
    }, []);

    const fetchOverview = async () => {
        try {
            setLoading(true);
            const [overviewRes, activityRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/admin/verification/overview`, { withCredentials: true }),
                axios.get(`${API_BASE_URL}/api/admin/coordinator-activity`, { withCredentials: true })
            ]);
            if (overviewRes.data.success) {
                setOverview(overviewRes.data.data);
            }
            if (activityRes.data.success) {
                setActivity(activityRes.data.data || { actionsToday: 0, actions: [] });
                setCurrentPage(1);
            }
        } catch (error) {
            console.error('Error fetching verification overview:', error);
            setOverview(null);
            setActivity({ actionsToday: 0, actions: [] });
        } finally {
            setLoading(false);
        }
    };

    const organizerStatusData = overview
        ? [
            { name: 'Pending', value: overview.organizerStatus?.pending || 0 },
            { name: 'Verified', value: overview.organizerStatus?.verified || 0 },
            { name: 'Rejected', value: overview.organizerStatus?.rejected || 0 },
            { name: 'Suspended', value: overview.organizerStatus?.suspended || 0 }
        ]
        : [];

    const activityTypeData = (activity.actions || []).reduce((acc, row) => {
        const key = row.subtype || 'other';
        const existing = acc.find((item) => item.subtype === key);
        if (existing) {
            existing.count += 1;
        } else {
            acc.push({ subtype: key, count: 1 });
        }
        return acc;
    }, []);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentActions = (activity.actions || []).slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil((activity.actions || []).length / itemsPerPage);

    return (
        <AdminLayout>
            <div className="p-6 bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Verification Hub</h1>
                    <p className="text-gray-600">Verification queue health, coordinator throughput, and action ledger.</p>
                </div>

                {loading ? (
                    <div className="bg-white rounded-xl shadow-md p-10 text-center">Loading verification hub...</div>
                ) : !overview ? (
                    <div className="bg-white rounded-xl shadow-md p-10 text-center text-gray-500">Unable to load verification overview.</div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                            <div className="bg-white rounded-2xl shadow-md p-5 border border-amber-100 min-h-[90px]">
                                <p className="text-sm text-gray-500">Pending</p>
                                <p className="text-2xl font-bold text-amber-700 mt-1">{overview.organizerStatus?.pending || 0}</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-md p-5 border border-emerald-100 min-h-[90px]">
                                <p className="text-sm text-gray-500">Verified</p>
                                <p className="text-2xl font-bold text-emerald-700 mt-1">{overview.organizerStatus?.verified || 0}</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-md p-5 border border-red-100 min-h-[90px]">
                                <p className="text-sm text-gray-500">Rejected</p>
                                <p className="text-2xl font-bold text-red-700 mt-1">{overview.organizerStatus?.rejected || 0}</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-md p-5 border border-slate-200 min-h-[90px]">
                                <p className="text-sm text-gray-500">Suspended</p>
                                <p className="text-2xl font-bold text-gray-700 mt-1">{overview.organizerStatus?.suspended || 0}</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-md p-5 border border-indigo-100 min-h-[90px]">
                                <p className="text-sm text-gray-500">Pending Events</p>
                                <p className="text-2xl font-bold text-indigo-700 mt-1">{overview.pendingEvents || 0}</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-md p-5 border border-cyan-100 min-h-[90px]">
                                <p className="text-sm text-gray-500">Coordinator Actions Today</p>
                                <p className="text-2xl font-bold text-cyan-700 mt-1">{activity.actionsToday || 0}</p>
                            </div>
                        </div>


                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                            <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
                                <h2 className="text-lg font-bold text-gray-800 mb-4">Organizer Verification Status Mix</h2>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={organizerStatusData} dataKey="value" nameKey="name" outerRadius={98} innerRadius={44}>
                                                {organizerStatusData.map((entry, index) => (
                                                    <Cell key={entry.name} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
                                <h2 className="text-lg font-bold text-gray-800 mb-4">Coordinator Activity Type</h2>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={activityTypeData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="subtype" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="count" fill="#0891b2" name="Actions" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100">
                            <div className="px-6 py-4 border-b bg-cyan-50 font-bold text-gray-800">Coordinator Action Table</div>
                            <div className="overflow-x-auto max-h-[520px]">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b sticky top-0">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Coordinator</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Target</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Result</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {currentActions.map((item, index) => (
                                            <tr key={`${item.timestamp}-${index}`} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-gray-900 font-semibold">{item.coordinator || 'Unknown'}</td>
                                                <td className="px-6 py-4 text-gray-700 capitalize">{(item.subtype || 'action').replace('_', ' ')}</td>
                                                <td className="px-6 py-4 text-gray-700">{item.targetName || item.eventTitle || 'N/A'}</td>
                                                <td className="px-6 py-4 text-gray-700 uppercase">{item.result || 'N/A'}</td>
                                                <td className="px-6 py-4 text-gray-600">{item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Unknown time'}</td>
                                            </tr>
                                        ))}
                                        {(activity.actions || []).length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No coordinator actions found yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                                    <div className="text-sm text-gray-600">
                                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, activity.actions.length)} of {activity.actions.length} actions
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                                        >
                                            Previous
                                        </button>
                                        <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                                        <button
                                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminVerificationHub;
