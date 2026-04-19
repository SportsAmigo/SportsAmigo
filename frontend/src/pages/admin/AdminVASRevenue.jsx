import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const VAS_COLORS = ['#0f766e', '#0e7490', '#7c3aed', '#d97706', '#2563eb', '#dc2626'];

const AdminVASRevenue = () => {
    const [summaryRows, setSummaryRows] = useState([]);
    const [categoryRows, setCategoryRows] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, limit: 10, total: 0 });
    const [page, setPage] = useState(1);
    const [summaryPage, setSummaryPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const fetchRevenue = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/admin/vas/overview`, {
                withCredentials: true,
                params: { page, limit: 10 }
            });

            if (response.data.success) {
                const payload = response.data.data || {};
                setSummaryRows(payload.summary || []);
                setCategoryRows(payload.revenueByCategory || []);
                setPurchases(payload.purchases || []);
                setPagination(payload.pagination || { page: 1, totalPages: 1, limit: 10, total: 0 });
                setSummaryPage(1);
            } else {
                setSummaryRows([]);
                setCategoryRows([]);
                setPurchases([]);
            }
        } catch (error) {
            console.error('Error loading VAS revenue:', error);
            setSummaryRows([]);
            setCategoryRows([]);
            setPurchases([]);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchRevenue();
    }, [fetchRevenue]);

    const totalRevenue = summaryRows.reduce((acc, row) => acc + (row.totalRevenue || 0), 0);
    const summaryPerPage = 6;
    const summaryStart = (summaryPage - 1) * summaryPerPage;
    const summaryRowsPage = summaryRows.slice(summaryStart, summaryStart + summaryPerPage);
    const summaryTotalPages = Math.ceil(summaryRows.length / summaryPerPage);

    const handleDownloadReceipt = (transactionId) => {
        if (!transactionId) return;
        window.open(`${API_BASE_URL}/api/admin/vas/receipt/${transactionId}`, '_blank');
    };

    return (
        <AdminLayout>
            <div className="p-6 bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">VAS Revenue</h1>
                    <p className="text-gray-600">Detailed VAS purchase ledger with service analytics and receipts.</p>
                </div>

                {loading ? (
                    <div className="bg-white rounded-xl shadow-md p-10 text-center">Loading VAS revenue...</div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="bg-white rounded-2xl shadow-md p-5 border border-cyan-100">
                                <p className="text-sm text-gray-500">Total VAS Revenue</p>
                                <p className="text-3xl font-bold text-cyan-700 mt-1">INR {totalRevenue.toLocaleString()}</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-md p-5 border border-indigo-100">
                                <p className="text-sm text-gray-500">Services Sold</p>
                                <p className="text-3xl font-bold text-indigo-700 mt-1">{pagination.total || 0}</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-md p-5 border border-emerald-100">
                                <p className="text-sm text-gray-500">Service Categories</p>
                                <p className="text-3xl font-bold text-emerald-700 mt-1">{categoryRows.length}</p>
                            </div>

                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                            <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
                                <h2 className="text-lg font-bold text-gray-800 mb-4">Revenue by Service Type</h2>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={summaryRows} dataKey="totalRevenue" nameKey="serviceName" outerRadius={100} innerRadius={45}>
                                                {summaryRows.map((entry, index) => (
                                                    <Cell key={entry.serviceType} fill={VAS_COLORS[index % VAS_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => `INR ${Number(value || 0).toLocaleString()}`} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
                                <h2 className="text-lg font-bold text-gray-800 mb-4">Revenue by Category</h2>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={categoryRows}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="category" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => `INR ${Number(value || 0).toLocaleString()}`} />
                                            <Legend />
                                            <Bar dataKey="totalRevenue" fill="#0f766e" name="Revenue" />
                                            <Bar dataKey="count" fill="#2563eb" name="Purchases" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100 mb-6">
                            <div className="px-6 py-4 border-b bg-cyan-50 font-bold text-gray-800">Service Revenue Breakdown</div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Service Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Purchases</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {summaryRowsPage.map((row) => (
                                            <tr key={row.serviceType}>
                                                <td className="px-6 py-4 text-gray-900 font-medium">{row.serviceName}</td>
                                                <td className="px-6 py-4 text-gray-700">{row.count || 0}</td>
                                                <td className="px-6 py-4 text-gray-700">INR {(row.totalRevenue || 0).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        {summaryRows.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-6 text-center text-gray-500">No VAS summary available.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {summaryTotalPages > 1 && (
                                <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Page {summaryPage} of {summaryTotalPages}</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setSummaryPage((prev) => Math.max(1, prev - 1))}
                                            disabled={summaryPage === 1}
                                            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setSummaryPage((prev) => Math.min(summaryTotalPages, prev + 1))}
                                            disabled={summaryPage === summaryTotalPages}
                                            className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100">
                            <div className="px-6 py-4 border-b bg-slate-50 font-bold text-gray-800">VAS Purchases (Detailed)</div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Purchaser</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Service</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Event</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Purchased At</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Receipt</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {purchases.map((item) => (
                                            <tr key={item._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-gray-900">{item.purchaserName}</p>
                                                    <p className="text-xs text-gray-500">{item.purchaserEmail}</p>
                                                </td>
                                                <td className="px-6 py-4 text-gray-800">{item.serviceName}</td>
                                                <td className="px-6 py-4 text-gray-700">{item.eventName || 'N/A'}</td>
                                                <td className="px-6 py-4 text-gray-700">{item.purchaseDate ? new Date(item.purchaseDate).toLocaleString() : 'N/A'}</td>
                                                <td className="px-6 py-4 text-gray-700 font-semibold">INR {(item.amount || 0).toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    {item.transactionId ? (
                                                        <button
                                                            onClick={() => handleDownloadReceipt(item.transactionId)}
                                                            className="px-3 py-1 rounded-md text-xs font-semibold border border-cyan-600 text-cyan-700 hover:bg-cyan-50"
                                                        >
                                                            Download PDF
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">Not available</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {purchases.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No purchase records found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {pagination.totalPages > 1 && (
                                <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                                    <p className="text-sm text-gray-600">Showing page {pagination.page} of {pagination.totalPages}</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                            disabled={pagination.page <= 1}
                                            className="px-4 py-2 rounded-md border text-sm disabled:opacity-50"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                                            disabled={pagination.page >= pagination.totalPages}
                                            className="px-4 py-2 rounded-md border text-sm disabled:opacity-50"
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

export default AdminVASRevenue;
