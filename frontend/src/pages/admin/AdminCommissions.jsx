import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';
import apiService from '../../services/apiService';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import AdminEntityModal from '../../components/admin/AdminEntityModal';

const AdminCommissions = () => {
    const [overview, setOverview] = useState([]);
    const [eligiblePayouts, setEligiblePayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [overviewPage, setOverviewPage] = useState(1);
    const [payoutPage, setPayoutPage] = useState(1);
    const [modal, setModal] = useState(null);
    const overviewPerPage = 8;
    const payoutsPerPage = 10;

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [overviewRes, eligibleRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/admin/commissions/overview`, { withCredentials: true }),
                axios.get(`${API_BASE_URL}/api/commission/payouts/eligible`, { withCredentials: true })
            ]);
            setOverview(overviewRes.data?.data?.overview || []);
            setEligiblePayouts(eligibleRes.data?.data || overviewRes.data?.data?.eligiblePayouts || []);
            setOverviewPage(1); setPayoutPage(1);
        } catch (error) {
            console.error('Error loading commission data:', error);
            setOverview([]); setEligiblePayouts([]);
        } finally {
            setLoading(false);
        }
    };

    const totalCommission = useMemo(() => overview.reduce((sum, row) => sum + (row.totalCommission || 0), 0), [overview]);
    const pendingCount = useMemo(() => overview.find(r => r._id === 'pending')?.count || 0, [overview]);
    const paidCount = useMemo(() => overview.find(r => r._id === 'paid')?.count || 0, [overview]);

    const overviewStart = (overviewPage - 1) * overviewPerPage;
    const overviewRows = overview.slice(overviewStart, overviewStart + overviewPerPage);
    const overviewTotalPages = Math.ceil(overview.length / overviewPerPage);

    const payoutStart = (payoutPage - 1) * payoutsPerPage;
    const payoutRows = eligiblePayouts.slice(payoutStart, payoutStart + payoutsPerPage);
    const payoutTotalPages = Math.ceil(eligiblePayouts.length / payoutsPerPage);

    const processBulk = async () => {
        const ids = eligiblePayouts.map(item => item._id);
        if (!ids.length) { alert('No eligible payouts to process'); return; }
        const result = await apiService.post('/api/commission/payouts/bulk-process', { commissionIds: ids, payoutMethod: 'bank_transfer' });
        if (result?.success) { alert('Bulk payout processing completed'); fetchData(); }
        else alert(result?.error || 'Bulk payout processing failed');
    };

    const markPaid = async (commissionId) => {
        const result = await apiService.post(`/api/commission/${commissionId}/update-status`, { status: 'paid', payoutMethod: 'bank_transfer' });
        if (result?.success) fetchData();
        else alert(result?.error || 'Failed to mark as paid');
    };

    const chartData = overview.map(r => ({ status: (r._id || 'unknown').toUpperCase(), count: r.count || 0, amount: r.totalCommission || 0 }));

    return (
        <AdminLayout>
            <div className="p-6 bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-1">Commissions & Payouts</h1>
                        <p className="text-gray-600">Track commission buckets and process payout actions.</p>
                    </div>
                    <button onClick={processBulk}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 shadow transition-all text-sm">
                        <i className="fas fa-bolt"></i> Process Bulk Payout
                    </button>
                </div>

                {loading ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <i className="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
                        <p className="text-gray-600 mt-4">Loading commission dashboard...</p>
                    </div>
                ) : (
                    <>
                        {/* Summary KPI Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                            {[
                                { label: 'Total Commission', value: `INR ${totalCommission.toLocaleString()}`, icon: 'fa-coins', gradient: 'from-emerald-500 to-teal-600' },
                                { label: 'Pending Payouts', value: pendingCount, icon: 'fa-hourglass-half', gradient: 'from-amber-500 to-orange-600' },
                                { label: 'Eligible to Pay', value: eligiblePayouts.length, icon: 'fa-check-circle', gradient: 'from-blue-500 to-indigo-600' },
                            ].map(card => (
                                <div key={card.label} className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-5 text-white shadow-lg`}>
                                    <div className="flex items-center justify-between">
                                        <i className={`fas ${card.icon} text-3xl text-white/70`}></i>
                                        <span className="text-3xl font-black">{card.value}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-white/80 mt-3">{card.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Chart */}
                        {chartData.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100 mb-6">
                                <h2 className="text-lg font-bold text-gray-800 mb-4">Commission by Status</h2>
                                <div className="h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="status" />
                                            <YAxis yAxisId="left" orientation="left" />
                                            <YAxis yAxisId="right" orientation="right" />
                                            <Tooltip formatter={(value, name) => name === 'amount' ? `INR ${Number(value).toLocaleString()}` : value} />
                                            <Legend />
                                            <Bar yAxisId="left" dataKey="count" fill="#0f766e" name="Count" />
                                            <Bar yAxisId="right" dataKey="amount" fill="#2563eb" name="Amount (INR)" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Status Overview table */}
                            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100">
                                <div className="px-6 py-4 border-b bg-slate-50 font-bold text-gray-800 flex items-center gap-2">
                                    <i className="fas fa-chart-bar text-slate-500"></i> Commission Status Buckets
                                </div>
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Count</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total Commission</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {overviewRows.map(row => (
                                            <tr key={row._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${row._id === 'paid' ? 'bg-emerald-100 text-emerald-700' : row._id === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                                                        {row._id || 'Unknown'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-700 font-semibold">{row.count}</td>
                                                <td className="px-6 py-4 text-gray-700 font-semibold">INR {(row.totalCommission || 0).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        {overview.length === 0 && <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">No commission data available.</td></tr>}
                                    </tbody>
                                </table>
                                {overviewTotalPages > 1 && (
                                    <div className="px-6 py-3 border-t bg-gray-50 flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Page {overviewPage}/{overviewTotalPages}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => setOverviewPage(p => Math.max(1, p - 1))} disabled={overviewPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
                                            <button onClick={() => setOverviewPage(p => Math.min(overviewTotalPages, p + 1))} disabled={overviewPage === overviewTotalPages} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Eligible Payouts Queue */}
                            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-amber-100">
                                <div className="px-6 py-4 border-b bg-amber-50 font-bold text-gray-800 flex items-center gap-2">
                                    <i className="fas fa-hand-holding-usd text-amber-500"></i> Eligible Payout Queue
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Organizer</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Commission</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {payoutRows.map(item => (
                                                <tr key={item._id} className="hover:bg-amber-50">
                                                    <td className="px-6 py-4">
                                                        <p className="font-semibold text-gray-900">{item.organizer?.first_name} {item.organizer?.last_name}</p>
                                                        <p className="text-xs text-gray-500">{item.organizer?.email}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-700 font-semibold">INR {(item.commissionAmount || 0).toLocaleString()}</td>
                                                    <td className="px-6 py-4 flex gap-2 flex-wrap">
                                                        {item.organizer?._id && (
                                                            <button onClick={() => setModal({ type: 'organizer', id: String(item.organizer._id), name: `${item.organizer.first_name} ${item.organizer.last_name}` })}
                                                                className="px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-300 text-indigo-700 text-xs font-semibold hover:bg-indigo-100">
                                                                <i className="fas fa-eye mr-1"></i>View
                                                            </button>
                                                        )}
                                                        <button onClick={() => markPaid(item._id)} className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700">
                                                            Mark Paid
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {eligiblePayouts.length === 0 && <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">No payouts eligible at the moment.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                                {payoutTotalPages > 1 && (
                                    <div className="px-6 py-3 border-t bg-gray-50 flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Page {payoutPage}/{payoutTotalPages}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => setPayoutPage(p => Math.max(1, p - 1))} disabled={payoutPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
                                            <button onClick={() => setPayoutPage(p => Math.min(payoutTotalPages, p + 1))} disabled={payoutPage === payoutTotalPages} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {modal && <AdminEntityModal entityType={modal.type} entityId={modal.id} entityName={modal.name} onClose={() => setModal(null)} />}
        </AdminLayout>
    );
};

export default AdminCommissions;
