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

const AdminOrganizers = () => {
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [entityModal, setEntityModal] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const fetchOrganizers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/admin/users/organizer`, { withCredentials: true });
            if (res.data.success) setOrganizers(res.data.users || []);
        } catch (e) { console.error('Error:', e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchOrganizers(); }, [fetchOrganizers]);

    const handleDelete = async (organizer) => {
        try {
            const response = await secureDelete(`/api/admin/users/organizer/${organizer.id}`);
            if (response.success) { showToast(`${organizer.name} deleted`); setConfirmDelete(null); fetchOrganizers(); }
            else showToast(response.error || 'Delete failed', 'error');
        } catch (e) { showToast('Delete failed', 'error'); }
    };

    const filtered = organizers.filter(o => {
        const textMatch = `${o.name} ${o.email}`.toLowerCase().includes(searchTerm.toLowerCase());
        const statusMatch = statusFilter === 'all' || (o.verificationStatus || '').toLowerCase() === statusFilter;
        return textMatch && statusMatch;
    });

    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);
    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentRows = filtered.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    const statusColor = (s) => ({ verified: 'bg-emerald-100 text-emerald-800', pending: 'bg-amber-100 text-amber-800', rejected: 'bg-red-100 text-red-800' })[s] || 'bg-gray-100 text-gray-600';

    return (
        <AdminLayout>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
            {entityModal && <AdminEntityModal entityType={entityModal.type} entityId={entityModal.id} entityName={entityModal.name} onClose={() => setEntityModal(null)} />}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i></div>
                        <h3 className="text-xl font-bold mb-2">Delete Organizer?</h3>
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
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Organizer Management</h1>
                    <p className="text-gray-600">View organizer profiles, their events (clickable), teams, revenue, and verification status</p>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl p-5 text-white shadow-lg">
                        <div className="flex items-center justify-between"><div><p className="text-white/80 text-sm mb-1">Total</p><h3 className="text-3xl font-bold">{organizers.length}</h3></div><i className="fas fa-user-shield text-4xl text-white/30"></i></div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
                        <div className="flex items-center justify-between"><div><p className="text-white/80 text-sm mb-1">Verified</p><h3 className="text-3xl font-bold">{organizers.filter(o => o.verificationStatus === 'verified').length}</h3></div><i className="fas fa-check-circle text-4xl text-white/30"></i></div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-5 text-white shadow-lg">
                        <div className="flex items-center justify-between"><div><p className="text-white/80 text-sm mb-1">Pending</p><h3 className="text-3xl font-bold">{organizers.filter(o => o.verificationStatus === 'pending').length}</h3></div><i className="fas fa-clock text-4xl text-white/30"></i></div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                                placeholder="Search by name, email, or organization" />
                            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        </div>
                        <div className="flex gap-2">
                            {['all', 'verified', 'pending', 'rejected'].map(s => (
                                <button key={s} onClick={() => setStatusFilter(s)}
                                    className={`px-4 py-2 rounded-lg font-semibold capitalize transition-colors ${statusFilter === s ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{s}</button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b bg-rose-50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Organizers</h2>
                        <span className="px-4 py-2 bg-rose-600 text-white rounded-full text-sm font-semibold">{filtered.length} Total</span>
                    </div>
                    {loading ? (
                        <div className="p-12 text-center"><i className="fas fa-spinner fa-spin text-4xl text-gray-400"></i><p className="text-gray-600 mt-4">Loading...</p></div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">No organizers found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Organizer</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Organization</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Events</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Tier</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {currentRows.map(organizer => (
                                        <tr key={organizer.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {organizer.profile_image
                                                        ? <img src={organizer.profile_image.startsWith('http') ? organizer.profile_image : `http://localhost:5000${organizer.profile_image}`} alt={organizer.name} className="w-10 h-10 rounded-full object-cover" onError={e => e.target.style.display = 'none'} />
                                                        : <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center font-bold text-rose-700">{(organizer.name || '?')[0].toUpperCase()}</div>}
                                                    <p className="font-semibold text-gray-900">{organizer.name}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 text-sm">{organizer.email}</td>
                                            <td className="px-6 py-4 text-gray-600">{organizer.organization || 'N/A'}</td>
                                            <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">{organizer.eventsCount || 0} events</span></td>
                                            <td className="px-6 py-4 capitalize"><span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">{organizer.tier || 'new'}</span></td>
                                            <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor(organizer.verificationStatus)}`}>{organizer.verificationStatus || 'N/A'}</span></td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button onClick={() => setEntityModal({ type: 'organizer', id: organizer.id, name: organizer.name })}
                                                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 flex items-center gap-1">
                                                        <i className="fas fa-eye"></i> View
                                                    </button>
                                                    <button onClick={() => setConfirmDelete(organizer)}
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

export default AdminOrganizers;
