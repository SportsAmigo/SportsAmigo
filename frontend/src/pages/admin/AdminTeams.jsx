import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import axios from 'axios';

const AdminTeams = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/admin/teams', { withCredentials: true });
            if (response.data.success) {
                setTeams(response.data.teams || []);
            }
        } catch (error) {
            console.error('Error fetching teams:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (teamId, teamName) => {
        if (!window.confirm(`Delete team: ${teamName}?`)) return;
        try {
            const response = await axios.delete(`http://localhost:5000/api/admin/teams/${teamId}`, { withCredentials: true });
            if (response.data.success) {
                alert('Team deleted successfully');
                fetchTeams();
            }
        } catch (error) {
            alert('Failed to delete team');
        }
    };

    const filteredTeams = teams.filter(team =>
        team.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout>
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
                                                <button
                                                    onClick={() => handleDelete(team.id, team.name)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
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
