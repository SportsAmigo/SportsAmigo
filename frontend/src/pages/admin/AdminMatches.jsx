import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import AdminEntityModal from '../../components/admin/AdminEntityModal';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';
import { del as secureDelete } from '../../services/apiService';

const Toast = ({ msg, type, onClose }) => (
    <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-white font-semibold ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
        <i className={`fas ${type === 'success' ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
        {msg}
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><i className="fas fa-times"></i></button>
    </div>
);

const statusConfig = { scheduled: { label: 'Scheduled', bg: 'bg-blue-100', text: 'text-blue-800' }, in_progress: { label: 'In Progress', bg: 'bg-orange-100', text: 'text-orange-800' }, completed: { label: 'Completed', bg: 'bg-emerald-100', text: 'text-emerald-800' }, cancelled: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-800' } };

const AdminMatches = () => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(8);
    const [entityModal, setEntityModal] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const fetchMatches = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/admin/matches`, { withCredentials: true });
            if (res.data.success) setMatches(res.data.matches || []);
        } catch (e) { console.error('Error:', e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchMatches(); }, [fetchMatches]);

    const handleDelete = async (match) => {
        try {
            const response = await secureDelete(`/api/admin/matches/${match.id}`);
            if (response.success) { showToast('Match deleted'); setConfirmDelete(null); fetchMatches(); }
            else showToast(response.error || 'Delete failed', 'error');
        } catch (e) { showToast('Delete failed', 'error'); }
    };

    const filtered = matches.filter(m => {
        const textMatch = `${m.team1_name || m.team_a_name || ''} ${m.team2_name || m.team_b_name || ''} ${m.event_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
        const statusMatch = statusFilter === 'all' || (m.status || '').toLowerCase() === statusFilter;
        return textMatch && statusMatch;
    });

    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);
    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentRows = filtered.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    const stats = { scheduled: matches.filter(m => m.status === 'scheduled').length, in_progress: matches.filter(m => m.status === 'in_progress').length, completed: matches.filter(m => m.status === 'completed').length, cancelled: matches.filter(m => m.status === 'cancelled').length };

    return (
        <AdminLayout>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
            {entityModal && <AdminEntityModal entityType={entityModal.type} entityId={entityModal.id} entityName={entityModal.name} onClose={() => setEntityModal(null)} />}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i></div>
                        <h3 className="text-xl font-bold mb-2">Delete Match?</h3>
                        <p className="text-gray-600 mb-6">This cannot be undone.</p>
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => setConfirmDelete(null)} className="px-6 py-2 border rounded-lg font-semibold text-gray-700 hover:bg-gray-100">Cancel</button>
                            <button onClick={() => handleDelete(confirmDelete)} className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Match Management</h1>
                    <p className="text-gray-600">View match details: both teams (clickable → team members + manager), event (clickable), organizer (clickable), and scores</p>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Total', value: matches.length, from: 'from-gray-700', to: 'to-gray-800', icon: 'fa-futbol' },
                        { label: 'Scheduled', value: stats.scheduled, from: 'from-blue-500', to: 'to-indigo-600', icon: 'fa-calendar' },
                        { label: 'In Progress', value: stats.in_progress, from: 'from-orange-500', to: 'to-amber-600', icon: 'fa-play-circle' },
                        { label: 'Completed', value: stats.completed, from: 'from-emerald-500', to: 'to-green-600', icon: 'fa-check-circle' },
                    ].map((s, i) => (
                        <div key={i} className={`bg-gradient-to-br ${s.from} ${s.to} rounded-xl p-5 text-white shadow-lg`}>
                            <div className="flex items-center justify-between"><div><p className="text-white/80 text-sm mb-1">{s.label}</p><h3 className="text-3xl font-bold">{s.value}</h3></div><i className={`fas ${s.icon} text-4xl text-white/30`}></i></div>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                placeholder="Search by team or event..." />
                            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        </div>
                        <div className="flex gap-2">
                            {['all', 'scheduled', 'in_progress', 'completed', 'cancelled'].map(s => (
                                <button key={s} onClick={() => setStatusFilter(s)}
                                    className={`px-4 py-2 rounded-lg font-semibold capitalize text-sm transition-colors ${statusFilter === s ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                    {s.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b bg-amber-50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Matches</h2>
                        <span className="px-4 py-2 bg-amber-600 text-white rounded-full text-sm font-semibold">{filtered.length} Total</span>
                    </div>
                    {loading ? (
                        <div className="p-12 text-center"><i className="fas fa-spinner fa-spin text-4xl text-gray-400"></i><p className="text-gray-600 mt-4">Loading matches...</p></div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">No matches found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Teams</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Score</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Event</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Venue</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {currentRows.map(match => {
                                        const sc = statusConfig[match.status] || { label: match.status || 'Unknown', bg: 'bg-gray-100', text: 'text-gray-600' };
                                        const t1 = match.team1_name || match.team_a_name || 'Team A';
                                        const t2 = match.team2_name || match.team_b_name || 'Team B';
                                        const s1 = match.team1_score ?? match.score_a;
                                        const s2 = match.team2_score ?? match.score_b;
                                        return (
                                            <tr key={match.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-900 text-sm">{t1}</div>
                                                    <div className="text-gray-400 text-xs mt-1">vs</div>
                                                    <div className="font-semibold text-gray-900 text-sm">{t2}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {s1 != null && s2 != null
                                                        ? <span className="font-black text-lg text-gray-800">{s1}<span className="text-gray-400 mx-1">–</span>{s2}</span>
                                                        : <span className="text-gray-400 text-sm">—</span>}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 text-sm">{match.event_name || 'N/A'}</td>
                                                <td className="px-6 py-4 text-gray-500 text-sm">{match.match_date ? new Date(match.match_date).toLocaleDateString() : 'TBD'}</td>
                                                <td className="px-6 py-4 text-gray-600 text-sm">{match.venue || 'TBD'}</td>
                                                <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>{sc.label}</span></td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setEntityModal({ type: 'match', id: match.id, name: `${t1} vs ${t2}` })}
                                                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 flex items-center gap-1">
                                                            <i className="fas fa-eye"></i> View
                                                        </button>
                                                        <button onClick={() => setConfirmDelete(match)}
                                                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700">
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {!loading && totalPages > 1 && (
                        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                            <p className="text-sm text-gray-600">Showing {indexOfFirst + 1}–{Math.min(indexOfLast, filtered.length)} of {filtered.length}</p>
                            <div className="flex gap-2">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100">Previous</button>
                                <span className="px-4 py-2 text-sm">{currentPage} / {totalPages}</span>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100">Next</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminMatches;
