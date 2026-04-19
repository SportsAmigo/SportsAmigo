import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts';

const PLAN_COLORS = ['#0f766e', '#2563eb', '#7c3aed'];

const AdminSubscriptions = () => {
    const [active, setActive] = useState([]);
    const [expiring, setExpiring] = useState([]);
    const [planBreakdown, setPlanBreakdown] = useState({ free: 0, pro: 0, enterprise: 0 });
    const [monthlyRevenueTrend, setMonthlyRevenueTrend] = useState([]);
    const [activeTab, setActiveTab] = useState('active');
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 8;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/admin/subscriptions/overview`, { withCredentials: true });
            const payload = response.data?.data || {};
            setActive(payload.active || []);
            setExpiring(payload.expiring || []);
            setPlanBreakdown(payload.planBreakdown || { free: 0, pro: 0, enterprise: 0 });
            setMonthlyRevenueTrend(payload.monthlyRevenueTrend || []);
        } catch (error) {
            console.error('Error fetching subscription admin data:', error);
            setActive([]);
            setExpiring([]);
            setPlanBreakdown({ free: 0, pro: 0, enterprise: 0 });
            setMonthlyRevenueTrend([]);
        } finally {
            setLoading(false);
        }
    };

    const rows = activeTab === 'active' ? active : expiring;
    const indexOfLast = currentPage * rowsPerPage;
    const indexOfFirst = indexOfLast - rowsPerPage;
    const currentRows = rows.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));

    const planData = [
        { name: 'Free', value: planBreakdown.free || 0 },
        { name: 'Pro', value: planBreakdown.pro || 0 },
        { name: 'Enterprise', value: planBreakdown.enterprise || 0 }
    ];

    const handleDownloadReceipt = (transactionId) => {
        if (!transactionId) return;
        window.open(`${API_BASE_URL}/api/admin/subscriptions/receipt/${transactionId}`, '_blank');
    };

    const changeTab = (nextTab) => {
        setActiveTab(nextTab);
        setCurrentPage(1);
    };

    return (
        <AdminLayout>
            <div className="p-6 bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Subscriptions</h1>
                    <p className="text-gray-600">Subscription ledger with plan mix analytics and receipt downloads.</p>
                </div>

                {loading ? (
                    <div className="bg-white rounded-xl shadow-md p-10 text-center">Loading subscriptions...</div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                            <div className="bg-white rounded-2xl shadow-md p-5 border border-indigo-100">
                                <p className="text-sm text-gray-500">Active Subscriptions</p>
                                <p className="text-2xl font-bold text-blue-700 mt-1">{active.length}</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-md p-5 border border-amber-100">
                                <p className="text-sm text-gray-500">Expiring in 7 Days</p>
                                <p className="text-2xl font-bold text-amber-700 mt-1">{expiring.length}</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-md p-5 border border-violet-100">
                                <p className="text-sm text-gray-500">Pro Plan</p>
                                <p className="text-2xl font-bold text-indigo-700 mt-1">{planBreakdown.pro || 0}</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-md p-5 border border-emerald-100">
                                <p className="text-sm text-gray-500">Enterprise Plan</p>
                                <p className="text-2xl font-bold text-emerald-700 mt-1">{planBreakdown.enterprise || 0}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                            <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
                                <h2 className="text-lg font-bold text-gray-800 mb-4">Plan Distribution</h2>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={planData} dataKey="value" nameKey="name" outerRadius={96} innerRadius={46}>
                                                {planData.map((entry, index) => (
                                                    <Cell key={entry.name} fill={PLAN_COLORS[index % PLAN_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
                                <h2 className="text-lg font-bold text-gray-800 mb-4">Monthly Subscription Revenue</h2>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={monthlyRevenueTrend}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="period" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => `INR ${Number(value || 0).toLocaleString()}`} />
                                            <Legend />
                                            <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100">
                            <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between gap-4">
                                <h2 className="text-xl font-bold text-gray-800">Subscription Table</h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => changeTab('active')}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'active' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border'}`}
                                    >
                                        Active ({active.length})
                                    </button>
                                    <button
                                        onClick={() => changeTab('expiring')}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'expiring' ? 'bg-amber-600 text-white' : 'bg-white text-gray-700 border'}`}
                                    >
                                        Expiring ({expiring.length})
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Organizer</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Plan</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Billing</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">End Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Receipt</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {currentRows.map((item) => (
                                            <tr key={item._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-gray-900">{item.userName}</p>
                                                    <p className="text-sm text-gray-600">{item.email}</p>
                                                </td>
                                                <td className="px-6 py-4 text-gray-800 uppercase font-semibold">{item.plan}</td>
                                                <td className="px-6 py-4 text-gray-700 capitalize">{item.billingCycle}</td>
                                                <td className="px-6 py-4 text-gray-700">
                                                    {item.endDate ? new Date(item.endDate).toLocaleDateString() : 'N/A'}
                                                    {item.daysToExpiry !== null && item.daysToExpiry !== undefined && (
                                                        <p className="text-xs text-gray-500 mt-1">{item.daysToExpiry} days left</p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-gray-700 font-semibold">INR {(item.latestAmount || 0).toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    {item.latestTransactionId ? (
                                                        <button
                                                            onClick={() => handleDownloadReceipt(item.latestTransactionId)}
                                                            className="px-3 py-1 rounded-md text-xs font-semibold border border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                                                        >
                                                            Download PDF
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">Not available</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {currentRows.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No records available in this view.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {rows.length > rowsPerPage && (
                                <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                                    <p className="text-sm text-gray-600">Page {currentPage} of {totalPages}</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 rounded-md border text-sm disabled:opacity-50"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
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

export default AdminSubscriptions;
