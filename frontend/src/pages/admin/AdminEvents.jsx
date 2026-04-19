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

const statusColor = (s) => ({ upcoming: 'bg-blue-100 text-blue-800', in_progress: 'bg-emerald-100 text-emerald-800', completed: 'bg-gray-100 text-gray-700', cancelled: 'bg-red-100 text-red-800', pending_approval: 'bg-amber-100 text-amber-800' })[s] || 'bg-gray-100 text-gray-600';

const AdminEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(8);
    const [searchPagination, setSearchPagination] = useState({ page: 1, limit: 8, total: 0, totalPages: 1 });
    const [entityModal, setEntityModal] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [toast, setToast] = useState(null);
    const isSearchMode = searchTerm.trim().length > 0;

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/api/admin/events`, {
                params: { limit: 5000 },
                withCredentials: true
            });
            if (res.data.success) setEvents(res.data.events || []);
        } catch (e) { console.error('Error:', e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    // Debounced server-side Solr search
    useEffect(() => {
        if (!isSearchMode) return;
        const timer = setTimeout(async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${API_BASE_URL}/api/admin/events`, {
                    params: {
                        q: searchTerm,
                        status: statusFilter !== 'all' ? statusFilter : undefined,
                        page: currentPage,
                        limit: itemsPerPage
                    },
                    withCredentials: true
                });
                if (res.data.success) {
                    setEvents(res.data.events || []);
                    setSearchPagination(res.data.pagination || { page: 1, limit: itemsPerPage, total: res.data.total || 0, totalPages: 1 });
                }
            } catch (e) { console.error('Search error:', e); }
            finally { setLoading(false); }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, currentPage, itemsPerPage, isSearchMode]);

    useEffect(() => {
        if (searchTerm === '') {
            setSearchPagination({ page: 1, limit: itemsPerPage, total: 0, totalPages: 1 });
            fetchEvents();
        }
    }, [searchTerm, fetchEvents, itemsPerPage]);

    const handleDelete = async (event) => {
        try {
            const response = await secureDelete(`/api/admin/events/${event.id}`);
            if (response.success) { showToast(`${event.title || event.name} deleted`); setConfirmDelete(null); fetchEvents(); }
            else showToast(response.error || 'Delete failed', 'error');
        } catch (e) { showToast('Delete failed', 'error'); }
    };

    const filtered = isSearchMode
        ? events
        : events.filter(e => {
            const statusMatch = statusFilter === 'all' || (e.status || '').toLowerCase() === statusFilter;
            return statusMatch;
        });

    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);
    const indexOfLast = isSearchMode ? (searchPagination.page * searchPagination.limit) : (currentPage * itemsPerPage);
    const indexOfFirst = isSearchMode ? ((searchPagination.page - 1) * searchPagination.limit) : (indexOfLast - itemsPerPage);
    const currentRows = isSearchMode ? filtered : filtered.slice(indexOfFirst, indexOfLast);
    const totalPages = isSearchMode ? (searchPagination.totalPages || 1) : Math.ceil(filtered.length / itemsPerPage);
    const totalRows = isSearchMode ? (searchPagination.total || filtered.length) : filtered.length;
    const activePage = isSearchMode ? (searchPagination.page || 1) : currentPage;

    const totalUpcoming = events.filter(e => e.status === 'upcoming').length;
    const totalCompleted = events.filter(e => e.status === 'completed').length;

    return (
        <AdminLayout>
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
            {entityModal && <AdminEntityModal entityType={entityModal.type} entityId={entityModal.id} entityName={entityModal.name} onClose={() => setEntityModal(null)} />}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i></div>
                        <h3 className="text-xl font-bold mb-2">Delete Event?</h3>
                        <p className="text-gray-600 mb-6">Delete <strong>{confirmDelete.title || confirmDelete.name}</strong>? This cannot be undone.</p>
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => setConfirmDelete(null)} className="px-6 py-2 border rounded-lg font-semibold text-gray-700 hover:bg-gray-100">Cancel</button>
                            <button onClick={() => handleDelete(confirmDelete)} className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Event Management</h1>
                    <p className="text-gray-600">View events with full details: organizer (clickable), teams (clickable → members + manager), and all scheduled/finished matches</p>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Total', value: events.length, icon: 'fa-calendar-alt', from: 'from-emerald-500', to: 'to-green-600' },
                        { label: 'Upcoming', value: totalUpcoming, icon: 'fa-calendar-check', from: 'from-blue-500', to: 'to-indigo-600' },
                        { label: 'Completed', value: totalCompleted, icon: 'fa-calendar-times', from: 'from-gray-500', to: 'to-gray-600' },
                        { label: 'Pending', value: events.filter(e => e.status === 'pending_approval').length, icon: 'fa-clock', from: 'from-amber-500', to: 'to-orange-600' },
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
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                placeholder="Search events..." />
                            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {['all', 'upcoming', 'in_progress', 'completed', 'cancelled', 'pending_approval'].map(s => (
                                <button key={s} onClick={() => setStatusFilter(s)}
                                    className={`px-4 py-2 rounded-lg font-semibold capitalize text-sm transition-colors ${statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                    {s.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b bg-emerald-50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Events</h2>
                        <span className="px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-semibold">{totalRows} Total</span>
                    </div>
                    {loading ? (
                        <div className="p-12 text-center"><i className="fas fa-spinner fa-spin text-4xl text-gray-400"></i><p className="text-gray-600 mt-4">Loading events...</p></div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">No events found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Event</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Sport</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Organizer</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {currentRows.map(event => (
                                        <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><i className="fas fa-calendar-alt"></i></div>
                                                    <p className="font-semibold text-gray-900">{event.title || event.name}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 capitalize">{event.sport_type || 'N/A'}</td>
                                            <td className="px-6 py-4 text-gray-600">{event.organizer_name || 'N/A'}</td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">{event.event_date ? new Date(event.event_date).toLocaleDateString() : 'N/A'}</td>
                                            <td className="px-6 py-4 text-gray-600">{event.location || 'TBD'}</td>
                                            <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor(event.status)}`}>{(event.status || 'active').replace('_', ' ')}</span></td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button onClick={() => setEntityModal({ type: 'event', id: event.id, name: event.title || event.name })}
                                                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 flex items-center gap-1">
                                                        <i className="fas fa-eye"></i> View
                                                    </button>
                                                    <button onClick={() => setConfirmDelete(event)}
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

export default AdminEvents;
