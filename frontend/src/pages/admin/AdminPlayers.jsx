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

const AdminPlayers = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [entityModal, setEntityModal] = useState(null); // { type, id, name }
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const fetchPlayers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/admin/users/player`, { withCredentials: true });
            if (res.data.success) setPlayers(res.data.users || []);
        } catch (e) { console.error('Error:', e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

    const handleDelete = async (player) => {
        try {
            const response = await secureDelete(`/api/admin/users/player/${player.id}`);
            if (response.success) { showToast(`${player.name} deleted`); setConfirmDelete(null); fetchPlayers(); }
            else showToast(response.error || 'Delete failed', 'error');
        } catch (e) { showToast('Delete failed', 'error'); }
    };

    const filteredPlayers = players.filter(p => {
        const match = `${p.name} ${p.email}`.toLowerCase().includes(searchTerm.toLowerCase());
        const statusOk = filterStatus === 'all' || (p.status || 'active').toLowerCase() === filterStatus;
        return match && statusOk;
    });

    useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus]);

    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentRows = filteredPlayers.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);

    return (
        <AdminLayout>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
            {entityModal && <AdminEntityModal entityType={entityModal.type} entityId={entityModal.id} entityName={entityModal.name} onClose={() => setEntityModal(null)} />}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i></div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Player?</h3>
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
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Player Management</h1>
                    <p className="text-gray-600">View player profiles, teams, match history and more</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-5 text-white shadow-lg">
                        <div className="flex items-center justify-between"><div><p className="text-white/80 text-sm mb-1">Total Players</p><h3 className="text-3xl font-bold">{players.length}</h3></div><i className="fas fa-running text-4xl text-white/30"></i></div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
                        <div className="flex items-center justify-between"><div><p className="text-white/80 text-sm mb-1">With Teams</p><h3 className="text-3xl font-bold">{players.filter(p => p.team && p.team !== 'Unassigned').length}</h3></div><i className="fas fa-users text-4xl text-white/30"></i></div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-5 text-white shadow-lg">
                        <div className="flex items-center justify-between"><div><p className="text-white/80 text-sm mb-1">Unassigned</p><h3 className="text-3xl font-bold">{players.filter(p => !p.team || p.team === 'Unassigned').length}</h3></div><i className="fas fa-user-times text-4xl text-white/30"></i></div>
                    </div>
                </div>

                {/* Search + filter */}
                <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Search by name or email" />
                            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        </div>
                        <div className="flex gap-2">
                            {['all', 'active', 'inactive'].map(s => (
                                <button key={s} onClick={() => setFilterStatus(s)}
                                    className={`px-4 py-2 rounded-lg font-semibold capitalize transition-colors ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{s}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b bg-blue-50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Players</h2>
                        <span className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold">{filteredPlayers.length} Total</span>
                    </div>
                    {loading ? (
                        <div className="p-12 text-center"><i className="fas fa-spinner fa-spin text-4xl text-gray-400"></i><p className="text-gray-600 mt-4">Loading players...</p></div>
                    ) : filteredPlayers.length === 0 ? (
                        <div className="p-12 text-center"><i className="fas fa-running text-6xl text-gray-300 mb-4"></i><p className="text-gray-500">No players found</p></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Player</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Sport</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Team</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Joined</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {currentRows.map(player => (
                                        <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {player.profile_image
                                                        ? <img src={player.profile_image.startsWith('http') ? player.profile_image : `http://localhost:5000${player.profile_image}`} alt={player.name} className="w-10 h-10 rounded-full object-cover" onError={e => e.target.style.display = 'none'} />
                                                        : <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">{(player.name || '?')[0].toUpperCase()}</div>}
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{player.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 text-sm">{player.email}</td>
                                            <td className="px-6 py-4 text-gray-600 capitalize">{player.sport || 'N/A'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${player.team && player.team !== 'Unassigned' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                                                    {player.team || 'Unassigned'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">{player.joinedDate ? new Date(player.joinedDate).toLocaleDateString() : 'N/A'}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button onClick={() => setEntityModal({ type: 'player', id: player.id, name: player.name })}
                                                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 flex items-center gap-1">
                                                        <i className="fas fa-eye"></i> View
                                                    </button>
                                                    <button onClick={() => setConfirmDelete(player)}
                                                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 flex items-center gap-1">
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
                            <p className="text-sm text-gray-600">Showing {indexOfFirst + 1}–{Math.min(indexOfLast, filteredPlayers.length)} of {filteredPlayers.length}</p>
                            <div className="flex gap-2">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100">Previous</button>
                                <span className="px-4 py-2 text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100">Next</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminPlayers;
