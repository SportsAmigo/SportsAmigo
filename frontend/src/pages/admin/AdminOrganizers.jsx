import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import axios from 'axios';

const AdminOrganizers = () => {
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(7);

    useEffect(() => {
        fetchOrganizers();
    }, []);

    const fetchOrganizers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/admin/users/organizer', { withCredentials: true });
            if (response.data.success) {
                setOrganizers(response.data.users || []);
            }
        } catch (error) {
            console.error('Error fetching organizers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (organizerId, organizerName) => {
        if (!window.confirm(`Are you sure you want to delete ${organizerName}?`)) return;
        try {
            const response = await axios.delete(`http://localhost:5000/api/admin/users/organizer/${organizerId}`, { withCredentials: true });
            if (response.data.success) {
                alert('Organizer deleted successfully');
                fetchOrganizers();
            }
        } catch (error) {
            console.error('Error deleting organizer:', error);
            alert('Failed to delete organizer');
        }
    };

    const filteredOrganizers = organizers.filter(organizer =>
        organizer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        organizer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrganizers = filteredOrganizers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrganizers.length / itemsPerPage);

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
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Organizer Management</h1>
                    <p className="text-gray-600">Manage and monitor all event organizers</p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search organizers..."
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-rose-50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Organizers</h2>
                        <span className="px-4 py-2 bg-rose-600 text-white rounded-full text-sm font-semibold">
                            {filteredOrganizers.length} Total
                        </span>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <i className="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
                            <p className="text-gray-600">Loading organizers...</p>
                        </div>
                    ) : filteredOrganizers.length === 0 ? (
                        <div className="p-12 text-center">
                            <i className="fas fa-user-shield text-6xl text-gray-300 mb-4"></i>
                            <p className="text-gray-600">No organizers found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Organization</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Events</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Joined</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {currentOrganizers.map((organizer) => (
                                        <tr key={organizer.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                                                        <i className="fas fa-user-shield text-rose-600"></i>
                                                    </div>
                                                    <span className="ml-3 font-medium text-gray-900">{organizer.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{organizer.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{organizer.organization || 'Unspecified'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                                    {organizer.eventsCount || 0} Events
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">{organizer.joinedDate || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                                                    {organizer.status || 'Active'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => window.alert('View feature coming soon!')}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(organizer.id, organizer.name)}
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
                    {!loading && filteredOrganizers.length > 0 && totalPages > 1 && (
                        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredOrganizers.length)} of {filteredOrganizers.length} organizers
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
                                                    ? 'bg-rose-600 text-white'
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

export default AdminOrganizers;
