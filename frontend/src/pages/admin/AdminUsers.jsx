import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/layout/AdminLayout';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [stats, setStats] = useState({ players: 0, managers: 0, organizers: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(7);

    useEffect(() => {
        fetchAllUsers();
    }, []);

    const fetchAllUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/admin/users`, { withCredentials: true });
            if (response.data.success) {
                setUsers(response.data.users || []);
                setStats(response.data.breakdown || {});
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    const goToNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const goToPrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const goToPage = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const getRoleBadgeColor = (role) => {
        switch(role) {
            case 'player': return 'bg-violet-100 text-violet-800';
            case 'manager': return 'bg-amber-100 text-amber-800';
            case 'organizer': return 'bg-rose-100 text-rose-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getRoleIcon = (role) => {
        switch(role) {
            case 'player': return 'fa-user-friends';
            case 'manager': return 'fa-user-tie';
            case 'organizer': return 'fa-user-shield';
            default: return 'fa-user';
        }
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">All Users</h1>
                    <p className="text-gray-600">Comprehensive view of all platform users</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm mb-1">Players</p>
                                <h3 className="text-3xl font-bold">{stats.players || 0}</h3>
                            </div>
                            <i className="fas fa-user-friends text-4xl text-white/30"></i>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm mb-1">Managers</p>
                                <h3 className="text-3xl font-bold">{stats.managers || 0}</h3>
                            </div>
                            <i className="fas fa-user-tie text-4xl text-white/30"></i>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm mb-1">Organizers</p>
                                <h3 className="text-3xl font-bold">{stats.organizers || 0}</h3>
                            </div>
                            <i className="fas fa-user-shield text-4xl text-white/30"></i>
                        </div>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setRoleFilter('all')} className={`px-6 py-3 rounded-lg font-semibold ${roleFilter === 'all' ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-700'}`}>All</button>
                            <button onClick={() => setRoleFilter('player')} className={`px-6 py-3 rounded-lg font-semibold ${roleFilter === 'player' ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Players</button>
                            <button onClick={() => setRoleFilter('manager')} className={`px-6 py-3 rounded-lg font-semibold ${roleFilter === 'manager' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Managers</button>
                            <button onClick={() => setRoleFilter('organizer')} className={`px-6 py-3 rounded-lg font-semibold ${roleFilter === 'organizer' ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Organizers</button>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-slate-50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Users Directory</h2>
                        <span className="px-4 py-2 bg-slate-700 text-white rounded-full text-sm font-semibold">
                            {filteredUsers.length} Total
                        </span>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <i className="fas fa-spinner fa-spin text-4xl text-gray-400"></i>
                            <p className="text-gray-600 mt-4">Loading users...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-12 text-center">
                            <i className="fas fa-users text-6xl text-gray-300 mb-4"></i>
                            <p className="text-gray-600">No users found</p>
                        </div>
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
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {currentUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRoleBadgeColor(user.role)}`}>
                                                        <i className={`fas ${getRoleIcon(user.role)}`}></i>
                                                    </div>
                                                    <span className="ml-3 font-medium text-gray-900">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{user.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                                    {user.role?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">
                                                {user.team || user.organization || user.sport || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">{user.joinedDate || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                                                    {user.status || 'Active'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && filteredUsers.length > 0 && totalPages > 1 && (
                        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} users
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={goToPrevPage}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                                >
                                    <i className="fas fa-chevron-left mr-2"></i>
                                    Previous
                                </button>
                                
                                <div className="flex gap-1">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => goToPage(i + 1)}
                                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                                                currentPage === i + 1
                                                    ? 'bg-slate-700 text-white'
                                                    : 'border hover:bg-gray-100'
                                            }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                                >
                                    Next
                                    <i className="fas fa-chevron-right ml-2"></i>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <Link to="/admin/players" className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center justify-between">
                        <span className="font-semibold text-gray-800">View Players</span>
                        <i className="fas fa-arrow-right text-violet-600"></i>
                    </Link>
                    <Link to="/admin/managers" className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center justify-between">
                        <span className="font-semibold text-gray-800">View Managers</span>
                        <i className="fas fa-arrow-right text-amber-600"></i>
                    </Link>
                    <Link to="/admin/organizers" className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center justify-between">
                        <span className="font-semibold text-gray-800">View Organizers</span>
                        <i className="fas fa-arrow-right text-rose-600"></i>
                    </Link>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminUsers;
