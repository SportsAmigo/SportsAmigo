import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import ViewModal from '../../components/admin/ViewModal';
import axios from 'axios';

const AdminManagers = () => {
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(7);
    
    // View Modal State
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedManager, setSelectedManager] = useState(null);
    const [loadingView, setLoadingView] = useState(false);

    useEffect(() => {
        fetchManagers();
    }, []);

    const fetchManagers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/admin/users/manager', { withCredentials: true });
            if (response.data.success) {
                setManagers(response.data.users || []);
            }
        } catch (error) {
            console.error('Error fetching managers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleView = async (managerId) => {
        try {
            setLoadingView(true);
            const response = await axios.get(`http://localhost:5000/api/admin/api/managers/${managerId}`, { withCredentials: true });
            if (response.data.success) {
                setSelectedManager(response.data.data);
                setViewModalOpen(true);
            }
        } catch (error) {
            console.error('Error fetching manager details:', error);
            alert('Failed to load manager details');
        } finally {
            setLoadingView(false);
        }
    };

    const handleDelete = async (managerId, managerName) => {
        if (!window.confirm(`Are you sure you want to delete ${managerName}? This action cannot be undone and will permanently remove this manager from the entire system.`)) return;
        try {
            const response = await axios.delete(`http://localhost:5000/api/admin/users/manager/${managerId}`, { withCredentials: true });
            if (response.data.success) {
                // Update state immediately - remove deleted manager from list
                setManagers(prevManagers => prevManagers.filter(manager => manager.id !== managerId));
                alert('Manager deleted successfully');
            }
        } catch (error) {
            console.error('Error deleting manager:', error);
            alert('Failed to delete manager: ' + (error.response?.data?.message || 'Server error'));
        }
    };

    const filteredManagers = managers.filter(manager =>
        manager.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manager.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentManagers = filteredManagers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredManagers.length / itemsPerPage);

    const goToNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const goToPrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const goToPage = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    return (
        <AdminLayout>
            {/* View Modal */}
            <ViewModal 
                isOpen={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                data={selectedManager}
                type="user"
            />
            
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Manager Management</h1>
                    <p className="text-gray-600">Manage and monitor all team managers</p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search managers..."
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-amber-50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Managers</h2>
                        <span className="px-4 py-2 bg-amber-600 text-white rounded-full text-sm font-semibold">
                            {filteredManagers.length} Total
                        </span>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <i className="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
                            <p className="text-gray-600">Loading managers...</p>
                        </div>
                    ) : filteredManagers.length === 0 ? (
                        <div className="p-12 text-center">
                            <i className="fas fa-user-tie text-6xl text-gray-300 mb-4"></i>
                            <p className="text-gray-600">No managers found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Team</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Joined</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {currentManagers.map((manager) => (
                                        <tr key={manager.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                                        <i className="fas fa-user-tie text-amber-600"></i>
                                                    </div>
                                                    <span className="ml-3 font-medium text-gray-900">{manager.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{manager.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{manager.team || 'No Team'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">{manager.joinedDate || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                                                    {manager.status || 'Active'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleView(manager.id)}
                                                        disabled={loadingView}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(manager.id, manager.name)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
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

                    {/* Pagination */}
                    {!loading && filteredManagers.length > 0 && totalPages > 1 && (
                        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredManagers.length)} of {filteredManagers.length} managers
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
                                                    ? 'bg-amber-600 text-white'
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
            </div>
        </AdminLayout>
    );
};

export default AdminManagers;
