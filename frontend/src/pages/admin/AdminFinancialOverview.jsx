import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
    LineChart,
    Line
} from 'recharts';

const CHART_COLORS = ['#0f766e', '#2563eb', '#d97706', '#7c3aed', '#dc2626', '#0891b2'];

const AdminFinancialOverview = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(8);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        fetchFinancialOverview();
    }, []);

    const fetchFinancialOverview = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/admin/financial-overview`, { withCredentials: true });
            if (response.data.success) {
                setData(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch financial overview:', error);
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    const exportCSV = () => {
        if (!data) return;
        const rows = [
            ['Metric', 'Value'],
            ['Subscription Monthly Revenue', data.subscription?.monthlyRevenue || 0],
            ['VAS Total Revenue', data.vas?.totalRevenue || 0],
            ['Commission Total', data.commission?.totalCommission || 0],
            ['Pending Payouts', data.commission?.pendingCount || 0],
        ];
        if (data.ordersByStatus) {
            rows.push(['', ''], ['Order Status', 'Count', 'Total Amount']);
            data.ordersByStatus.forEach(o => rows.push([o.status || 'Unknown', o.count || 0, o.totalAmount || 0]));
        }
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'financial_overview.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const asCurrency = (value) => `INR ${(Number(value) || 0).toLocaleString()}`;
    const revenueMix = data?.charts?.revenueMix || [];
    const orderStatus = data?.charts?.orderStatus || [];
    const monthlyRevenue = data?.charts?.monthlyRevenue || [];
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = (data?.ordersByStatus || []).slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil((data?.ordersByStatus || []).length / itemsPerPage);

    return (
        <AdminLayout>
            <div className="p-6 bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen">
                <div className="mb-8 flex flex-wrap items-center gap-4 justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Financial Overview</h1>
                        <p className="text-gray-600">Unified subscriptions, VAS, commission, and order flow with visual analytics.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="text-sm text-gray-600">From: <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm ml-1" /></label>
                        <label className="text-sm text-gray-600">To: <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border rounded-lg px-2 py-1.5 text-sm ml-1" /></label>
                        <button onClick={exportCSV}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all text-sm shadow">
                            <i className="fas fa-download"></i> Export CSV
                        </button>
                        <button onClick={fetchFinancialOverview}
                            className="flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm hover:bg-gray-100">
                            <i className="fas fa-sync-alt"></i> Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="bg-white rounded-xl shadow-md p-10 text-center">
                        <i className="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
                        <p className="text-gray-600 mt-3">Loading financial metrics...</p>
                    </div>
                ) : !data ? (
                    <div className="bg-white rounded-xl shadow-md p-10 text-center text-gray-500">Unable to load financial metrics.</div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
                            <div className="bg-white rounded-2xl shadow-md p-5 border border-indigo-100">
                                <p className="text-sm text-gray-500">Subscription Monthly Revenue</p>
                                <p className="text-2xl font-bold text-indigo-700 mt-1">{asCurrency(data.subscription?.monthlyRevenue || 0)}</p>
                                <p className="text-xs text-indigo-500 mt-1">Recurring plan-based estimate</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-md p-5 border border-cyan-100">
                                <p className="text-sm text-gray-500">VAS Revenue</p>
                                <p className="text-2xl font-bold text-cyan-700 mt-1">{asCurrency(data.vas?.totalRevenue || 0)}</p>
                                <p className="text-xs text-cyan-600 mt-1">Total completed add-on purchases</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-md p-5 border border-emerald-100">
                                <p className="text-sm text-gray-500">Commission Revenue</p>
                                <p className="text-2xl font-bold text-emerald-700 mt-1">{asCurrency(data.commission?.totalCommission || 0)}</p>
                                <p className="text-xs text-emerald-600 mt-1">Platform commission earnings</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-md p-5 border border-amber-100">
                                <p className="text-sm text-gray-500">Pending Payouts</p>
                                <p className="text-2xl font-bold text-amber-700 mt-1">{data.commission?.pendingCount || 0}</p>
                                <p className="text-xs text-amber-600 mt-1">Awaiting organizer settlement</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                            <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
                                <h2 className="text-lg font-bold text-gray-800 mb-4">Revenue Mix</h2>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={revenueMix} dataKey="value" nameKey="name" outerRadius={100} innerRadius={48}>
                                                {revenueMix.map((entry, index) => (
                                                    <Cell key={`mix-${entry.name}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => asCurrency(value)} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
                                <h2 className="text-lg font-bold text-gray-800 mb-4">Order Status Distribution</h2>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={orderStatus}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="status" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="count" fill="#2563eb" name="Orders" />
                                            <Bar dataKey="totalAmount" fill="#0f766e" name="Order Value" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100 mb-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">Monthly Revenue Trend</h2>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthlyRevenue}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="period" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => asCurrency(value)} />
                                        <Legend />
                                        <Line type="monotone" dataKey="subscriptions" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                                        <Line type="monotone" dataKey="vas" stroke="#0f766e" strokeWidth={2} dot={{ r: 3 }} />
                                        <Line type="monotone" dataKey="total" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100">
                            <div className="px-6 py-4 border-b bg-slate-50">
                                <h2 className="text-xl font-bold text-gray-800">Shop Orders by Status</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Orders</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {currentOrders.map((row) => (
                                            <tr key={row.status || 'unknown'}>
                                                <td className="px-6 py-4 font-medium text-gray-900 uppercase">{row.status || 'Unknown'}</td>
                                                <td className="px-6 py-4 text-gray-700">{row.count || 0}</td>
                                                <td className="px-6 py-4 text-gray-700">{asCurrency(row.totalAmount || 0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                                    <div className="text-sm text-gray-600">
                                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, data.ordersByStatus.length)} of {data.ordersByStatus.length} statuses
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

export default AdminFinancialOverview;
