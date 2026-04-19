import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/layout/AdminLayout';
import AdminEntityModal from '../../components/admin/AdminEntityModal';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';
import { getCsrfToken } from '../../services/csrfService';
import useFuseSearch from '../../hooks/useFuseSearch';

const ROLE_COLORS = {
    player: { badge: 'bg-violet-100 text-violet-800', btn: 'bg-violet-600', icon: 'fa-user-friends' },
    manager: { badge: 'bg-amber-100 text-amber-800', btn: 'bg-amber-600', icon: 'fa-user-tie' },
    organizer: { badge: 'bg-rose-100 text-rose-800', btn: 'bg-rose-600', icon: 'fa-user-shield' },
    coordinator: { badge: 'bg-cyan-100 text-cyan-800', btn: 'bg-cyan-600', icon: 'fa-user-check' },
};

const Toast = ({ msg, type, onClose }) => (
    <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-white font-semibold animate-pulse ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
        <i className={`fas ${type === 'success' ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
        {msg}
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><i className="fas fa-times"></i></button>
    </div>
);

const UserDetailModal = ({ user, onClose }) => {
    if (!user) return null;
    const rc = ROLE_COLORS[user.role] || ROLE_COLORS.player;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className={`p-6 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-t-2xl flex items-center gap-4`}>
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                        <i className={`fas ${rc.icon} text-2xl`}></i>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">{user.name}</h2>
                        <p className="text-slate-300">{user.email}</p>
                        <span className="mt-1 inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase">{user.role}</span>
                    </div>
                    <button onClick={onClose} className="ml-auto text-white/70 hover:text-white text-xl"><i className="fas fa-times"></i></button>
                </div>
                <div className="p-6 space-y-5">
                    {/* Profile Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Phone</p>
                            <p className="font-medium text-gray-800">{user.phone || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Joined</p>
                            <p className="font-medium text-gray-800">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        {user.details?.age && <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs text-gray-500 uppercase font-semibold mb-1">Age</p><p className="font-medium text-gray-800">{user.details.age}</p></div>}
                        {user.details?.preferred_sports && <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs text-gray-500 uppercase font-semibold mb-1">Sport</p><p className="font-medium text-gray-800">{Array.isArray(user.details.preferred_sports) ? user.details.preferred_sports.join(', ') : user.details.preferred_sports}</p></div>}
                        {user.details?.region && <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs text-gray-500 uppercase font-semibold mb-1">Region</p><p className="font-medium text-gray-800">{user.details.region}</p></div>}
                        {user.details?.category && <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs text-gray-500 uppercase font-semibold mb-1">Category</p><p className="font-medium text-gray-800">{user.details.category}</p></div>}
                        {user.details?.verificationStatus && <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs text-gray-500 uppercase font-semibold mb-1">Verification</p><p className="font-medium text-gray-800 capitalize">{user.details.verificationStatus}</p></div>}
                        {user.details?.tier && <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs text-gray-500 uppercase font-semibold mb-1">Tier</p><p className="font-medium text-gray-800 capitalize">{user.details.tier}</p></div>}
                    </div>

                    {/* Subscription (organizer) */}
                    {user.subscription && (
                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                            <p className="text-xs font-bold uppercase text-blue-600 mb-2">Subscription</p>
                            <div className="flex flex-wrap gap-3 text-sm">
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">{user.subscription.plan}</span>
                                <span className="text-gray-600">{user.subscription.billing} billing</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${user.subscription.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>{user.subscription.status}</span>
                            </div>
                        </div>
                    )}

                    {/* Team(s) */}
                    {user.team && !user.managed_teams && (
                        <div className="rounded-xl border p-4">
                            <p className="text-xs font-bold uppercase text-gray-500 mb-2">Team</p>
                            <p className="font-semibold text-gray-800">{user.team}</p>
                        </div>
                    )}
                    {user.managed_teams && user.managed_teams.length > 0 && (
                        <div className="rounded-xl border p-4">
                            <p className="text-xs font-bold uppercase text-gray-500 mb-3">Managed Teams ({user.managed_teams.length})</p>
                            <div className="space-y-2">
                                {user.managed_teams.map((t, i) => (
                                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                        <span className="font-medium text-gray-800">{t.name}</span>
                                        <span className="text-xs text-gray-500">{t.sport} · {t.members_count} members</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {user.teams && user.teams.length > 0 && (
                        <div className="rounded-xl border p-4">
                            <p className="text-xs font-bold uppercase text-gray-500 mb-3">Teams Enrolled ({user.teams.length})</p>
                            <div className="flex flex-wrap gap-2">
                                {user.teams.map((t, i) => <span key={i} className="px-3 py-1 bg-violet-100 text-violet-800 rounded-full text-sm">{t.name}{t.sport ? ` (${t.sport})` : ''}</span>)}
                            </div>
                        </div>
                    )}

                    {/* Events */}
                    {user.events && user.events.length > 0 && (
                        <div className="rounded-xl border p-4">
                            <p className="text-xs font-bold uppercase text-gray-500 mb-3">Events ({user.events.length})</p>
                            <div className="space-y-2">
                                {user.events.slice(0, 5).map((e, i) => (
                                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                        <span className="font-medium text-gray-800">{e.name}</span>
                                        <div className="flex gap-2 items-center">
                                            {e.status && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.status === 'upcoming' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{e.status}</span>}
                                            <span className="text-xs text-gray-500">{e.date ? new Date(e.date).toLocaleDateString() : ''}</span>
                                        </div>
                                    </div>
                                ))}
                                {user.events.length > 5 && <p className="text-xs text-gray-500 text-center">+{user.events.length - 5} more events</p>}
                            </div>
                        </div>
                    )}

                    {/* Match history */}
                    {user.matches && user.matches.length > 0 && (
                        <div className="rounded-xl border p-4">
                            <p className="text-xs font-bold uppercase text-gray-500 mb-3">Recent Matches ({user.matches.length})</p>
                            <div className="space-y-2">
                                {user.matches.slice(0, 5).map((m, i) => (
                                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                        <span className="text-sm font-medium text-gray-800">{m.team_a} <span className="text-gray-400 mx-1">vs</span> {m.team_b}</span>
                                        <div className="flex gap-2 items-center">
                                            {m.score_a !== null && m.score_b !== null && <span className="text-sm font-bold text-indigo-700">{m.score_a}–{m.score_b}</span>}
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${m.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>{m.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Coordinator: reviewed events */}
                    {user.reviewed_events && user.reviewed_events.length > 0 && (
                        <div className="rounded-xl border p-4">
                            <p className="text-xs font-bold uppercase text-gray-500 mb-3">Events Reviewed ({user.reviewed_events.length})</p>
                            <div className="space-y-2">
                                {user.reviewed_events.slice(0, 5).map((e, i) => (
                                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                        <span className="font-medium text-gray-800">{e.name}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${e.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>{e.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* VAS purchases */}
                    {user.vas_purchases && user.vas_purchases.length > 0 && (
                        <div className="rounded-xl border p-4">
                            <p className="text-xs font-bold uppercase text-gray-500 mb-3">VAS Purchases ({user.vas_purchases.length})</p>
                            <div className="flex flex-wrap gap-2">
                                {user.vas_purchases.map((v, i) => <span key={i} className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-sm">{v.service} · ${v.amount}</span>)}
                            </div>
                        </div>
                    )}

                    {/* Commissions (organizer) */}
                    {user.commissions && user.commissions.length > 0 && (
                        <div className="rounded-xl border p-4">
                            <p className="text-xs font-bold uppercase text-gray-500 mb-3">Commission History ({user.commissions.length})</p>
                            <div className="space-y-2">
                                {user.commissions.slice(0, 4).map((c, i) => (
                                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                        <span className="text-sm font-medium text-gray-800">{c.event}</span>
                                        <div className="flex gap-2 items-center">
                                            <span className="text-sm text-gray-700">Commission: ${c.amount}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{c.status}</span>
                                        </div>
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

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [stats, setStats] = useState({ players: 0, managers: 0, organizers: 0, coordinators: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [searchPagination, setSearchPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [entityModal, setEntityModal] = useState(null);
    const [toast, setToast] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const isSearchMode = searchTerm.trim().length > 0;

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const fetchAllUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
                params: { limit: 5000 },
                withCredentials: true
            });
            if (response.data.success) {
                setUsers(response.data.users || []);
                setStats(response.data.breakdown || {});
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchAllUsers(); }, [fetchAllUsers]);

    // Debounced server-side Solr search — makes API calls visible in Network tab
    useEffect(() => {
        if (!isSearchMode) return; // skip if empty, use client-side filter
        const timer = setTimeout(async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${API_BASE_URL}/api/admin/users`, {
                    params: {
                        q: searchTerm,
                        role: roleFilter !== 'all' ? roleFilter : undefined,
                        page: currentPage,
                        limit: itemsPerPage
                    },
                    withCredentials: true
                });
                if (res.data.success) {
                    setUsers(res.data.users || []);
                    setSearchPagination(res.data.pagination || { page: 1, limit: itemsPerPage, total: res.data.total || 0, totalPages: 1 });
                }
            } catch (e) {
                console.error('Search error:', e);
            } finally { setLoading(false); }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm, roleFilter, currentPage, itemsPerPage, isSearchMode]);

    // Re-fetch all when search is cleared
    useEffect(() => {
        if (searchTerm === '') {
            setSearchPagination({ page: 1, limit: itemsPerPage, total: 0, totalPages: 1 });
            fetchAllUsers();
        }
    }, [searchTerm, fetchAllUsers, itemsPerPage]);

    const handleView = (user) => {
        setEntityModal({ type: user.role || 'user', id: user.id, name: user.name });
    };

    const handleDelete = async (user) => {
        try {
            const csrf = await getCsrfToken();
            const roleMap = { manager: 'manager', organizer: 'organizer', player: 'player', coordinator: 'coordinator' };
            const rolePath = roleMap[user.role] || 'any';
            await axios.delete(`${API_BASE_URL}/api/admin/users/${rolePath}/${user.id}`, {
                withCredentials: true,
                headers: { 'X-CSRF-Token': csrf }
            });
            showToast(`${user.name} deleted successfully`);
            setConfirmDelete(null);
            fetchAllUsers();
        } catch (e) {
            showToast(e.response?.data?.message || 'Delete failed', 'error');
        }
    };

    const roleFilteredUsers = users.filter((user) => roleFilter === 'all' || user.role === roleFilter);
    const filteredUsers = useFuseSearch(roleFilteredUsers, searchTerm, {
        keys: ['name', 'email', 'role', 'team', 'organization', 'sport'],
        threshold: 0.38
    });

    const indexOfLastItem = isSearchMode ? (searchPagination.page * searchPagination.limit) : (currentPage * itemsPerPage);
    const indexOfFirstItem = isSearchMode ? ((searchPagination.page - 1) * searchPagination.limit) : (indexOfLastItem - itemsPerPage);
    const currentUsers = isSearchMode ? filteredUsers : filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = isSearchMode ? (searchPagination.totalPages || 1) : Math.ceil(filteredUsers.length / itemsPerPage);
    const totalRows = isSearchMode ? (searchPagination.total || filteredUsers.length) : filteredUsers.length;
    const activePage = isSearchMode ? (searchPagination.page || 1) : currentPage;

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
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Delete User?</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete <strong>{confirmDelete.name}</strong>? This cannot be undone.</p>
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => setConfirmDelete(null)} className="px-6 py-2 border rounded-lg font-semibold text-gray-700 hover:bg-gray-100">Cancel</button>
                            <button onClick={() => handleDelete(confirmDelete)} className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">All Users</h1>
                    <p className="text-gray-600">Complete platform user management with cross-linked details</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Players', count: stats.players || 0, gradient: 'from-violet-500 to-purple-600', icon: 'fa-user-friends' },
                        { label: 'Managers', count: stats.managers || 0, gradient: 'from-amber-500 to-orange-600', icon: 'fa-user-tie' },
                        { label: 'Organizers', count: stats.organizers || 0, gradient: 'from-rose-500 to-red-600', icon: 'fa-user-shield' },
                        { label: 'Coordinators', count: stats.coordinators || 0, gradient: 'from-cyan-500 to-sky-600', icon: 'fa-user-check' },
                    ].map((card) => (
                        <div key={card.label} className={`bg-gradient-to-br ${card.gradient} rounded-xl p-5 text-white shadow-lg`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white/80 text-sm mb-1">{card.label}</p>
                                    <h3 className="text-3xl font-bold">{card.count}</h3>
                                </div>
                                <i className={`fas ${card.icon} text-4xl text-white/30`}></i>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search & Filter */}
                <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500" />
                            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {['all', 'player', 'manager', 'organizer', 'coordinator'].map(role => {
                                const colors = role === 'all' ? { active: 'bg-slate-700 text-white', inactive: 'bg-gray-100 text-gray-700' } : { active: ROLE_COLORS[role]?.btn + ' text-white', inactive: 'bg-gray-100 text-gray-700' };
                                return (
                                    <button key={role} onClick={() => { setRoleFilter(role); setCurrentPage(1); }}
                                        className={`px-4 py-2 rounded-lg font-semibold capitalize transition-colors ${roleFilter === role ? colors.active : colors.inactive}`}>
                                        {role}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-slate-50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Users Directory</h2>
                        <span className="px-4 py-2 bg-slate-700 text-white rounded-full text-sm font-semibold">{totalRows} Total</span>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center"><i className="fas fa-spinner fa-spin text-4xl text-gray-400"></i><p className="text-gray-600 mt-4">Loading users...</p></div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-12 text-center"><i className="fas fa-users text-6xl text-gray-300 mb-4"></i><p className="text-gray-600">No users found</p></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Details</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Joined</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {currentUsers.map((user) => {
                                        const rc = ROLE_COLORS[user.role] || ROLE_COLORS.player;
                                        return (
                                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${rc.badge}`}><i className={`fas ${rc.icon} text-sm`}></i></div>
                                                        <span className="font-medium text-gray-900">{user.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">{user.email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${rc.badge}`}>{user.role?.toUpperCase()}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">{user.team || user.organization || user.sport || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">{user.joinedDate || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.status === 'Suspended' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>{user.status || 'Active'}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleView(user)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1">
                                                            <i className="fas fa-eye"></i> View
                                                        </button>
                                                        <button onClick={() => setConfirmDelete(user)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors flex items-center gap-1">
                                                            <i className="fas fa-trash"></i> Delete
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

                    {/* Pagination */}
                    {!loading && totalPages > 1 && (
                        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                            <p className="text-sm text-gray-600">Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, totalRows)} of {totalRows}</p>
                            <div className="flex gap-2">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={activePage === 1} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100">Previous</button>
                                {[...Array(Math.min(totalPages, 7))].map((_, i) => (
                                    <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-9 h-9 rounded-lg text-sm font-medium ${activePage === i + 1 ? 'bg-slate-700 text-white' : 'border hover:bg-gray-100'}`}>{i + 1}</button>
                                ))}
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={activePage === totalPages} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100">Next</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {[
                        { to: '/admin/players', label: 'View Players', color: 'text-violet-600' },
                        { to: '/admin/managers', label: 'View Managers', color: 'text-amber-600' },
                        { to: '/admin/organizers', label: 'View Organizers', color: 'text-rose-600' },
                        { to: '/admin/coordinators', label: 'View Coordinators', color: 'text-cyan-600' },
                    ].map(l => (
                        <Link key={l.to} to={l.to} className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center justify-between">
                            <span className="font-semibold text-gray-800">{l.label}</span>
                            <i className={`fas fa-arrow-right ${l.color}`}></i>
                        </Link>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminUsers;
