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

const AdminTeams = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sportFilter, setSportFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [searchPagination, setSearchPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [entityModal, setEntityModal] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [toast, setToast] = useState(null);
    const isSearchMode = searchTerm.trim().length > 0;

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const fetchTeams = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/admin/teams`, {
                params: { limit: 5000 },
                withCredentials: true
            });
            if (res.data.success) setTeams(res.data.teams || []);
        } catch (e) { console.error('Error:', e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchTeams(); }, [fetchTeams]);

    // Debounced server-side Solr search
    useEffect(() => {
        if (!isSearchMode) return;
        const timer = setTimeout(async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${API_BASE_URL}/api/admin/teams`, {
                    params: {
                        q: searchTerm,
                        sportType: sportFilter !== 'all' ? sportFilter : undefined,
                        page: currentPage,
                        limit: itemsPerPage
                    },
                    withCredentials: true
                });
                if (res.data.success) {
                    setTeams(res.data.teams || []);
                    setSearchPagination(res.data.pagination || { page: 1, limit: itemsPerPage, total: res.data.total || 0, totalPages: 1 });
                }
            } catch (e) { console.error('Search error:', e); }
            finally { setLoading(false); }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm, sportFilter, currentPage, itemsPerPage, isSearchMode]);

    useEffect(() => {
        if (searchTerm === '') {
            setSearchPagination({ page: 1, limit: itemsPerPage, total: 0, totalPages: 1 });
            fetchTeams();
        }
    }, [searchTerm, fetchTeams, itemsPerPage]);

    const handleDelete = async (team) => {
        try {
            const response = await secureDelete(`/api/admin/teams/${team.id}`);
            if (response.success) { showToast(`${team.name} deleted`); setConfirmDelete(null); fetchTeams(); }
            else showToast(response.error || 'Delete failed', 'error');
        } catch (e) { showToast('Delete failed', 'error'); }
    };

    const sportTypes = ['all', ...new Set(teams.map(t => t.sport_type).filter(Boolean))];

    const filtered = isSearchMode
        ? teams
        : teams.filter(t => {
            const sportMatch = sportFilter === 'all' || t.sport_type === sportFilter;
            return sportMatch;
        });

    useEffect(() => { setCurrentPage(1); }, [searchTerm, sportFilter]);
    const indexOfLast = isSearchMode ? (searchPagination.page * searchPagination.limit) : (currentPage * itemsPerPage);
    const indexOfFirst = isSearchMode ? ((searchPagination.page - 1) * searchPagination.limit) : (indexOfLast - itemsPerPage);
    const currentRows = isSearchMode ? filtered : filtered.slice(indexOfFirst, indexOfLast);
    const totalPages = isSearchMode ? (searchPagination.totalPages || 1) : Math.ceil(filtered.length / itemsPerPage);
    const totalRows = isSearchMode ? (searchPagination.total || filtered.length) : filtered.length;
    const activePage = isSearchMode ? (searchPagination.page || 1) : currentPage;

    return (
        <AdminLayout>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
            {entityModal && <AdminEntityModal entityType={entityModal.type} entityId={entityModal.id} entityName={entityModal.name} onClose={() => setEntityModal(null)} />}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i></div>
                        <h3 className="text-xl font-bold mb-2">Delete Team?</h3>
                        <p className="text-gray-600 mb-6">Delete <strong>{confirmDelete.name}</strong>? This cannot be undone.</p>
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => setConfirmDelete(null)} className="px-6 py-2 border rounded-lg font-semibold text-gray-700 hover:bg-gray-100">Cancel</button>
                            <button onClick={() => handleDelete(confirmDelete)} className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Team Management</h1>
                    <p className="text-gray-600">View team details, members (clickable → player profile), manager (clickable → manager profile), matches, and events</p>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-5 text-white shadow-lg">
                        <div className="flex items-center justify-between"><div><p className="text-white/80 text-sm mb-1">Total Teams</p><h3 className="text-3xl font-bold">{teams.length}</h3></div><i className="fas fa-users text-4xl text-white/30"></i></div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 text-white shadow-lg">
                        <div className="flex items-center justify-between"><div><p className="text-white/80 text-sm mb-1">Active</p><h3 className="text-3xl font-bold">{teams.filter(t => t.status !== 'inactive' && t.status !== 'disbanded').length}</h3></div><i className="fas fa-check-circle text-4xl text-white/30"></i></div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-5 text-white shadow-lg">
                        <div className="flex items-center justify-between"><div><p className="text-white/80 text-sm mb-1">Sport Types</p><h3 className="text-3xl font-bold">{new Set(teams.map(t => t.sport_type).filter(Boolean)).size}</h3></div><i className="fas fa-futbol text-4xl text-white/30"></i></div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Search teams..." />
                            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {sportTypes.slice(0, 6).map(s => (
                                <button key={s} onClick={() => setSportFilter(s)}
                                    className={`px-4 py-2 rounded-lg font-semibold capitalize transition-colors ${sportFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{s}</button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b bg-blue-50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Teams</h2>
                        <span className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold">{totalRows} Total</span>
                    </div>
                    {loading ? (
                        <div className="p-12 text-center"><i className="fas fa-spinner fa-spin text-4xl text-gray-400"></i><p className="text-gray-600 mt-4">Loading teams...</p></div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">No teams found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Team Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Sport</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Manager</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Members</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {currentRows.map(team => (
                                        <tr key={team.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm">{(team.name || '?')[0].toUpperCase()}</div>
                                                    <p className="font-semibold text-gray-900">{team.name}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 capitalize">{team.sport_type || 'N/A'}</td>
                                            <td className="px-6 py-4 text-gray-700">{team.manager_name || 'N/A'}</td>
                                            <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">{team.current_members || 0} members</span></td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">{team.createdAt ? new Date(team.createdAt).toLocaleDateString() : 'N/A'}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button onClick={() => setEntityModal({ type: 'team', id: team.id, name: team.name })}
                                                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 flex items-center gap-1">
                                                        <i className="fas fa-eye"></i> View
                                                    </button>
                                                    <button onClick={() => setConfirmDelete(team)}
                                                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700">
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {!loading && totalPages > 1 && (
                        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                            <p className="text-sm text-gray-600">Showing {indexOfFirst + 1}–{Math.min(indexOfLast, totalRows)} of {totalRows}</p>
                            <div className="flex gap-2">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={activePage === 1} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100">Previous</button>
                                <span className="px-4 py-2 text-sm">{activePage} / {totalPages}</span>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={activePage === totalPages} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100">Next</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminTeams;
