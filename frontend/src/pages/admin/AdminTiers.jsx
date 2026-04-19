import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';
import apiService from '../../services/apiService';
import AdminEntityModal from '../../components/admin/AdminEntityModal';

const TIER_COLORS = {
    new: { bg: 'bg-gray-100', text: 'text-gray-700', badge: 'bg-gray-500' },
    bronze: { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-600' },
    silver: { bg: 'bg-slate-50', text: 'text-slate-700', badge: 'bg-slate-500' },
    gold: { bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-500' },
    platinum: { bg: 'bg-indigo-50', text: 'text-indigo-700', badge: 'bg-indigo-600' },
};

const AdminTiers = () => {
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [modal, setModal] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => { fetchOrganizers(); }, []);

    const fetchOrganizers = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/admin/tiers/organizers`, { withCredentials: true });
            if (response.data.success) setOrganizers(response.data.data || []);
        } catch (error) {
            console.error('Error fetching organizer tier list:', error);
            setOrganizers([]);
        } finally { setLoading(false); }
    };

    const updateTier = async (organizerId) => {
        const result = await apiService.post(`/api/tier/update/${organizerId}`, {});
        if (result?.success) fetchOrganizers();
        else alert(result?.error || 'Tier update failed');
    };

    const batchUpdate = async () => {
        const result = await apiService.post('/api/tier/batch-update', {});
        if (result?.success) { alert('Batch update completed'); fetchOrganizers(); }
        else alert(result?.error || 'Batch update failed');
    };

    const tierCounts = organizers.reduce((acc, o) => {
        const t = o.organizerTier || 'new';
        acc[t] = (acc[t] || 0) + 1;
        return acc;
    }, {});

    const filtered = organizers.filter(o =>
        searchTerm === '' ||
        `${o.first_name} ${o.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRows = filtered.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    return (
        <AdminLayout>
            <div className="p-6 bg-gradient-to-b from-slate-50 to-slate-100 min-h-screen">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-1">Organizer Tier Management</h1>
                        <p className="text-gray-600">Review quality scores, tier progression, and run manual updates.</p>
                    </div>
                    <button onClick={batchUpdate}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow transition-all text-sm">
                        <i className="fas fa-sync-alt"></i> Run Batch Update
                    </button>
                </div>

                {/* Tier Distribution Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
                    {['new', 'bronze', 'silver', 'gold', 'platinum'].map(tier => {
                        const c = TIER_COLORS[tier] || TIER_COLORS.new;
                        return (
                            <div key={tier} className={`rounded-2xl p-4 border ${c.bg} shadow-sm text-center`}>
                                <div className={`inline-block px-3 py-1 rounded-full text-white text-xs font-bold uppercase mb-2 ${c.badge}`}>{tier}</div>
                                <p className={`text-3xl font-black ${c.text}`}>{tierCounts[tier] || 0}</p>
                                <p className="text-xs text-gray-500 mt-1">Organizers</p>
                            </div>
                        );
                    })}
                </div>

                <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100">
                    <div className="px-6 py-4 border-b bg-indigo-50 flex items-center justify-between gap-4 flex-wrap">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <i className="fas fa-layer-group text-indigo-500"></i> Organizer Tier Table
                        </h2>
                        <input type="text" placeholder="Search by name or email..."
                            value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none min-w-[220px]" />
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <i className="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
                            <p className="text-gray-500 mt-3">Loading organizers...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Organizer</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tier</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Quality Score</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Completed Events</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rating</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {currentRows.map(item => {
                                        const tier = item.organizerTier || 'new';
                                        const tc = TIER_COLORS[tier] || TIER_COLORS.new;
                                        return (
                                            <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-gray-900">{item.first_name} {item.last_name}</p>
                                                    <p className="text-sm text-gray-500">{item.email}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${tc.badge} text-white`}>{tier}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-[60px]">
                                                            <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min(100, (item.organizerStats?.qualityScore || 0))}%` }}></div>
                                                        </div>
                                                        <span className="text-sm font-semibold text-gray-700">{item.organizerStats?.qualityScore || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-700 font-semibold">{item.organizerStats?.completedEvents || 0}</td>
                                                <td className="px-6 py-4 text-gray-700">
                                                    <span className="flex items-center gap-1">
                                                        <i className="fas fa-star text-amber-400 text-xs"></i>
                                                        {(item.organizerStats?.rating || 0).toFixed(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 flex gap-2 flex-wrap">
                                                    <button onClick={() => setModal({ type: 'organizer', id: String(item._id), name: `${item.first_name} ${item.last_name}` })}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-all">
                                                        <i className="fas fa-eye mr-1"></i>View
                                                    </button>
                                                    <button onClick={() => updateTier(item._id)}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all">
                                                        Recalculate
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filtered.length === 0 && (
                                        <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                            {searchTerm ? 'No organizers match your search.' : 'No organizers found.'}
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && filtered.length > 0 && totalPages > 1 && (
                        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                            <p className="text-sm text-gray-600">Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filtered.length)} of {filtered.length}</p>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100">Prev</button>
                                <span className="text-sm text-gray-600">Page {currentPage}/{totalPages}</span>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100">Next</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {modal && <AdminEntityModal entityType={modal.type} entityId={modal.id} entityName={modal.name} onClose={() => setModal(null)} />}
        </AdminLayout>
    );
};

export default AdminTiers;
