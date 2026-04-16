import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';

const AdminMatches = () => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMatches();
    }, []);

    const fetchMatches = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/admin/matches`, { withCredentials: true });
            if (response.data.success) {
                setMatches(response.data.matches || []);
            }
        } catch (error) {
            console.error('Error fetching matches:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Match Management</h1>
                    <p className="text-gray-600">View and manage all scheduled matches</p>
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b bg-indigo-50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">All Matches</h2>
                        <span className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-semibold">
                            {matches.length} Total
                        </span>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <i className="fas fa-spinner fa-spin text-4xl text-gray-400"></i>
                            <p className="text-gray-600 mt-4">Loading matches...</p>
                        </div>
                    ) : matches.length === 0 ? (
                        <div className="p-12 text-center">
                            <i className="fas fa-futbol text-6xl text-gray-300 mb-4"></i>
                            <p className="text-gray-600">No matches scheduled yet</p>
                            <p className="text-gray-500 text-sm mt-2">Matches will appear here once events are created</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Match</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Event</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {matches.map((match) => (
                                        <tr key={match.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">
                                                    {match.team1_name} vs {match.team2_name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{match.event_name || 'N/A'}</td>
                                            <td className="px-6 py-4 text-gray-600 text-sm">
                                                {match.match_date ? new Date(match.match_date).toLocaleDateString() : 'TBD'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    match.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 
                                                    match.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {match.status || 'Scheduled'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {match.team1_score !== undefined ? `${match.team1_score} - ${match.team2_score}` : '-'}
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

export default AdminMatches;
