import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';

const AdminVerificationHub = () => {
    const [overview, setOverview] = useState(null);
    const [summary, setSummary] = useState({ verified: 0, rejected: 0 });
    const [decisions, setDecisions] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [overviewRes, decisionsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/admin/verification/overview`, { withCredentials: true }),
                axios.get(`${API_BASE_URL}/api/admin/verification/decisions`, {
                    withCredentials: true,
                    params: {
                        page,
                        limit,
                        status: statusFilter !== 'all' ? statusFilter : undefined,
                        search: search || undefined
                    }
                })
            ]);

            if (overviewRes.data.success) {
                setOverview(overviewRes.data.data || null);
            }

            if (decisionsRes.data.success) {
                const data = decisionsRes.data.data || {};
                setSummary(data.summary || { verified: 0, rejected: 0 });
                setDecisions(data.decisions || []);
                setPagination(data.pagination || { page: 1, limit, total: 0, totalPages: 1 });
            }
        } catch (error) {
            console.error('Error fetching verification data:', error);
            setOverview(null);
            setSummary({ verified: 0, rejected: 0 });
            setDecisions([]);
            setPagination({ page: 1, limit, total: 0, totalPages: 1 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, statusFilter]);

    const applySearch = () => {
        setPage(1);
        fetchData();
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setPage(1);
        setTimeout(fetchData, 0);
    };

    return (
        <AdminLayout>
            <div className="p-6 bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Verification Hub</h1>
                    <p className="text-gray-600">Verified and rejected organizer decisions by coordinators.</p>
                </div>

                {loading ? (
                    <div className="bg-white rounded-xl shadow-md p-10 text-center">Loading verification decisions...</div>
                ) : !overview ? (
                    <div className="bg-white rounded-xl shadow-md p-10 text-center text-gray-500">Unable to load verification data.</div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white rounded-2xl shadow-md p-5 border border-amber-100 min-h-[90px]">
                                <p className="text-sm text-gray-500">Pending</p>
                                <p className="text-2xl font-bold text-amber-700 mt-1">{overview.organizerStatus?.pending || 0}</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-md p-5 border border-emerald-100 min-h-[90px]">
                                <p className="text-sm text-gray-500">Verified (By Coordinators)</p>
                                <p className="text-2xl font-bold text-emerald-700 mt-1">{summary.verified || 0}</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-md p-5 border border-red-100 min-h-[90px]">
                                <p className="text-sm text-gray-500">Rejected (By Coordinators)</p>
                                <p className="text-2xl font-bold text-red-700 mt-1">{summary.rejected || 0}</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-md p-5 border border-indigo-100 min-h-[90px]">
                                <p className="text-sm text-gray-500">Pending Events</p>
                                <p className="text-2xl font-bold text-indigo-700 mt-1">{overview.pendingEvents || 0}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-4 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="md:col-span-2">
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                        placeholder="Search organizer name, email, organization"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    {['all', 'verified', 'rejected'].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => { setStatusFilter(s); setPage(1); }}
                                            className={`px-3 py-2 rounded-lg text-sm font-semibold capitalize ${statusFilter === s ? 'bg-cyan-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button onClick={applySearch} className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-semibold hover:bg-cyan-700">Search</button>
                                    <button onClick={clearFilters} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-100">Reset</button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100">
                            <div className="px-6 py-4 border-b bg-cyan-50 font-bold text-gray-800">Coordinator Verification Decisions</div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Organizer</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Organization</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Decision</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Coordinator</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reviewed At</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {decisions.map((item) => (
                                            <tr key={`${item.organizerId}-${item.reviewedAt || ''}`} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-900">{item.organizerName}</div>
                                                    <div className="text-xs text-gray-500">{item.organizerEmail}</div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-700">{item.organization || 'N/A'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                        {String(item.status || '').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-800 font-medium">{item.reviewedBy || 'Coordinator'}</td>
                                                <td className="px-6 py-4 text-gray-600">{item.reviewedAt ? new Date(item.reviewedAt).toLocaleString() : 'N/A'}</td>
                                                <td className="px-6 py-4 text-gray-600">{item.rejectionReason || '-'}</td>
                                            </tr>
                                        ))}
                                        {decisions.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No verified/rejected organizer decisions found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {pagination.totalPages > 1 && (
                                <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                                    <div className="text-sm text-gray-600">
                                        Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                            disabled={pagination.page === 1}
                                            className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                        >
                                            Previous
                                        </button>
                                        <span className="text-sm text-gray-600">Page {pagination.page} of {pagination.totalPages}</span>
                                        <button
                                            onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                                            disabled={pagination.page === pagination.totalPages}
                                            className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
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
