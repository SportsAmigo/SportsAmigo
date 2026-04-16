import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import ViewModal from '../../components/admin/ViewModal';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';

const AdminTeams = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // View Modal State
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [loadingView, setLoadingView] = useState(false);

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/admin/teams`, { withCredentials: true });
            if (response.data.success) {
                setTeams(response.data.teams || []);
            }
        } catch (error) {
            console.error('Error fetching teams:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleView = async (teamId) => {
        try {
            setLoadingView(true);
            const response = await axios.get(`${API_BASE_URL}/api/admin/api/teams/${teamId}`, { withCredentials: true });
            if (response.data.success) {
                setSelectedTeam(response.data.data);
                setViewModalOpen(true);
            }
        } catch (error) {
            console.error('Error fetching team details:', error);
            alert('Failed to load team details');
        } finally {
            setLoadingView(false);
        }
    };

    const handleDelete = async (teamId, teamName) => {
        if (!window.confirm(`Delete team: ${teamName}? This action cannot be undone and will permanently remove this team from the entire system.`)) return;
        try {
            const response = await axios.delete(`${API_BASE_URL}/api/admin/teams/${teamId}`, { withCredentials: true });
            if (response.data.success) {
                // Update state immediately - remove deleted team from list
                setTeams(prevTeams => prevTeams.filter(team => team.id !== teamId));
                alert('Team deleted successfully');
            }
        } catch (error) {
            console.error('Error deleting team:', error);
            alert('Failed to delete team: ' + (error.response?.data?.message || 'Server error'));
        }
    };

    const filteredTeams = teams.filter(team =>
        team.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout>
            {/* View Modal */}
            <ViewModal 
                isOpen={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                data={selectedTeam}
                type="team"
            />
            
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Team Management</h1>
                    <p className="text-gray-600">Manage all registered teams</p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                    <input
                        type="text"
                        placeholder="Search teams..."
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b bg-blue-50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Teams</h2>
                        <span className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold">
                            {filteredTeams.length} Total
                        </span>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <i className="fas fa-spinner fa-spin text-4xl text-gray-400"></i>
                            <p className="text-gray-600 mt-4">Loading teams...</p>
                        </div>
                    ) : filteredTeams.length === 0 ? (
                        <div className="p-12 text-center">
                            <i className="fas fa-users-cog text-6xl text-gray-300 mb-4"></i>
                            <p className="text-gray-600">No teams found</p>
                        </div>
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
                                    {filteredTeams.map((team) => (
                                        <tr key={team.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <i className="fas fa-users-cog text-blue-600"></i>
                                                    </div>
                                                    <span className="ml-3 font-medium text-gray-900">{team.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{team.sport_type || 'N/A'}</td>
                                            <td className="px-6 py-4 text-gray-600">{team.manager_name || 'N/A'}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                                    {team.current_members || 0} members
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 text-sm">{team.createdAt || 'N/A'}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleView(team.id)}
                                                        disabled={loadingView}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="View Details"
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(team.id, team.name)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete Team"
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
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminTeams;
