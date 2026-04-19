import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import AdminEntityModal from '../../components/admin/AdminEntityModal';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';
import apiService from '../../services/apiService';
import { getCsrfToken } from '../../services/csrfService';

const Toast = ({ msg, type, onClose }) => (
    <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-white font-semibold ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
        <i className={`fas ${type === 'success' ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
        {msg}
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><i className="fas fa-times"></i></button>
    </div>
);

const CoordinatorDetailModal = ({ coordinator, onClose }) => {
    if (!coordinator) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 bg-gradient-to-r from-cyan-700 to-teal-600 text-white rounded-t-2xl flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                        <i className="fas fa-user-check text-2xl"></i>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">{coordinator.name}</h2>
                        <p className="text-cyan-200">{coordinator.email}</p>
                        <span className="mt-1 inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase">Coordinator</span>
                    </div>
                    <button onClick={onClose} className="ml-auto text-white/70 hover:text-white text-xl"><i className="fas fa-times"></i></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Region</p>
                            <p className="font-medium text-gray-800 capitalize">{coordinator.region || coordinator.details?.region || 'All'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Category</p>
                            <p className="font-medium text-gray-800 capitalize">{coordinator.category || coordinator.details?.category || 'All'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Status</p>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${(coordinator.verificationStatus || coordinator.details?.verificationStatus || 'verified') === 'suspended' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                {(coordinator.verificationStatus || coordinator.details?.verificationStatus || 'Verified').toUpperCase()}
                            </span>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Actions Performed</p>
                            <p className="font-bold text-gray-800 text-xl">{coordinator.actions_count ?? 'N/A'}</p>
                        </div>
                    </div>

                    {coordinator.reviewed_events && coordinator.reviewed_events.length > 0 && (
                        <div className="rounded-xl border p-4">
                            <p className="text-xs font-bold uppercase text-gray-500 mb-3">Events Reviewed ({coordinator.reviewed_events.length})</p>
                            <div className="space-y-2">
                                {coordinator.reviewed_events.slice(0, 8).map((e, i) => (
                                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                        <span className="font-medium text-gray-800">{e.name}</span>
                                        <div className="flex gap-2 items-center">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${e.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>{e.status}</span>
                                            {e.date && <span className="text-xs text-gray-400">{new Date(e.date).toLocaleDateString()}</span>}
                                        </div>
                                    </div>
                                ))}
                                {coordinator.reviewed_events.length > 8 && <p className="text-xs text-center text-gray-400">+{coordinator.reviewed_events.length - 8} more</p>}
                            </div>
                        </div>
                    )}

                    {coordinator.reviewed_organizers && coordinator.reviewed_organizers.length > 0 && (
                        <div className="rounded-xl border p-4">
                            <p className="text-xs font-bold uppercase text-gray-500 mb-3">Organizers Verified ({coordinator.reviewed_organizers.length})</p>
                            <div className="space-y-2">
                                {coordinator.reviewed_organizers.slice(0, 6).map((o, i) => (
                                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                        <div>
                                            <p className="font-medium text-gray-800">{o.name}</p>
                                            <p className="text-xs text-gray-500">{o.email}</p>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${o.status === 'verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>{o.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const AdminCoordinators = () => {
    const [coordinators, setCoordinators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [entityModal, setEntityModal] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const fetchCoordinators = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/admin/users/coordinator`, { withCredentials: true });
            if (response.data.success) setCoordinators(response.data.users || []);
        } catch (error) {
            console.error('Error fetching coordinators:', error);
            setCoordinators([]);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchCoordinators(); }, [fetchCoordinators]);

    const handleView = (coordinator) => {
        setEntityModal({ type: 'coordinator', id: coordinator.id, name: coordinator.name });
    };

    const handleUpdateStatus = async (coordinatorId, status) => {
        const result = await apiService.post(`/api/admin/users/coordinator/${coordinatorId}/status`, { status });
        if (result?.success) { showToast(`Coordinator ${status}`); fetchCoordinators(); }
        else showToast(result?.error || 'Failed to update status', 'error');
    };

    const handleDelete = async (coordinator) => {
        try {
            const csrf = await getCsrfToken();
            await axios.delete(`${API_BASE_URL}/api/admin/users/coordinator/${coordinator.id}`, {
                withCredentials: true, headers: { 'X-CSRF-Token': csrf }
            });
            showToast(`${coordinator.name} deleted successfully`);
            setConfirmDelete(null);
            fetchCoordinators();
        } catch (e) { showToast(e.response?.data?.message || 'Delete failed', 'error'); }
    };

    const filtered = coordinators.filter(c => {
        const fullText = `${c.name || ''} ${c.email || ''}`.toLowerCase();
        const matchesSearch = fullText.includes(searchTerm.toLowerCase());
        const normalizedStatus = (c.verificationStatus || '').toLowerCase();
        const matchesStatus = statusFilter === 'all' || normalizedStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentRows = filtered.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    const totalVerified = coordinators.filter(c => (c.verificationStatus || 'verified') !== 'suspended').length;
    const totalSuspended = coordinators.filter(c => c.verificationStatus === 'suspended').length;

    return (
        <AdminLayout>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
            {entityModal && <AdminEntityModal entityType={entityModal.type} entityId={entityModal.id} entityName={entityModal.name} onClose={() => setEntityModal(null)} />}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Coordinator?</h3>
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
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Coordinator Management</h1>
                    <p className="text-gray-600">Manage coordinators, monitor activity, and control access</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl p-5 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <div><p className="text-white/80 text-sm mb-1">Total</p><h3 className="text-3xl font-bold">{coordinators.length}</h3></div>
                            <i className="fas fa-user-check text-4xl text-white/30"></i>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <div><p className="text-white/80 text-sm mb-1">Active</p><h3 className="text-3xl font-bold">{totalVerified}</h3></div>
                            <i className="fas fa-check-circle text-4xl text-white/30"></i>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-5 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <div><p className="text-white/80 text-sm mb-1">Suspended</p><h3 className="text-3xl font-bold">{totalSuspended}</h3></div>
                            <i className="fas fa-ban text-4xl text-white/30"></i>
                        </div>
                    </div>
                </div>

                {/* Search + filter */}
                <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative col-span-2">
                            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                placeholder="Search by name or email" />
                            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        </div>
                        <div className="flex gap-2">
                            {['all', 'verified', 'suspended'].map(s => (
                                <button key={s} onClick={() => setStatusFilter(s)} className={`flex-1 px-4 py-3 rounded-lg font-semibold capitalize transition-colors ${statusFilter === s ? 'bg-cyan-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{s}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b bg-cyan-50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Coordinators</h2>
                        <span className="px-4 py-2 bg-cyan-700 text-white rounded-full text-sm font-semibold">{filtered.length} Total</span>
                    </div>

                    {loading ? (
                        <div className="p-10 text-center"><i className="fas fa-spinner fa-spin text-3xl text-gray-400"></i><p className="text-gray-600 mt-3">Loading coordinators...</p></div>
                    ) : filtered.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">No coordinators found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Region</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {currentRows.map((coordinator) => (
                                        <tr key={coordinator.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-cyan-100 flex items-center justify-center"><i className="fas fa-user-check text-cyan-700 text-sm"></i></div>
                                                    <span className="font-medium text-gray-900">{coordinator.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-700">{coordinator.email}</td>
                                            <td className="px-6 py-4 text-gray-700 capitalize">{coordinator.region || 'all'}</td>
                                            <td className="px-6 py-4 text-gray-700 capitalize">{coordinator.category || 'all'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${(coordinator.verificationStatus || 'verified') === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                    {(coordinator.verificationStatus || 'verified').toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    <button onClick={() => handleView(coordinator)} className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700 flex items-center gap-1">
                                                        <i className="fas fa-eye"></i> View
                                                    </button>
                                                    <button onClick={() => handleUpdateStatus(coordinator.id, 'verified')} className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700">
                                                        Activate
                                                    </button>
                                                    <button onClick={() => handleUpdateStatus(coordinator.id, 'suspended')} className="px-3 py-1 bg-amber-600 text-white rounded text-xs font-semibold hover:bg-amber-700">
                                                        Suspend
                                                    </button>
                                                    <button onClick={() => setConfirmDelete(coordinator)} className="px-3 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 flex items-center gap-1">
                                                        <i className="fas fa-trash"></i> Delete
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

export default AdminCoordinators;
