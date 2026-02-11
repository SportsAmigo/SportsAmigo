import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import axios from 'axios';

const AdminActivityLogs = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(12);

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/admin/dashboard', { withCredentials: true });
            if (response.data.success) {
                // Generate sample activities with specific user actions
                const sampleActivities = generateSampleActivities();
                setActivities([...sampleActivities, ...(response.data.activities || [])]);
            }
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateSampleActivities = () => {
        const now = new Date();
        return [
            {
                type: 'team_creation',
                description: 'created team "Thunder Warriors"',
                userName: 'Alice Johnson',
                userRole: 'Manager',
                timestamp: new Date(now - 5 * 60000).toISOString()
            },
            {
                type: 'user_approval',
                description: 'approved player registration',
                userName: 'Dr. Smith',
                userRole: 'Manager',
                timestamp: new Date(now - 15 * 60000).toISOString()
            },
            {
                type: 'event_update',
                description: 'updated event "Summer League 2026"',
                userName: 'John Martinez',
                userRole: 'Organizer',
                timestamp: new Date(now - 30 * 60000).toISOString()
            },
            {
                type: 'login',
                description: 'logged into the system',
                userName: 'Sarah Williams',
                userRole: 'Player',
                timestamp: new Date(now - 45 * 60000).toISOString()
            },
            {
                type: 'event_creation',
                description: 'created event "Winter Championship"',
                userName: 'Mike Chen',
                userRole: 'Organizer',
                timestamp: new Date(now - 60 * 60000).toISOString()
            },
            {
                type: 'team_update',
                description: 'updated team roster for "Eagles FC"',
                userName: 'Robert Davis',
                userRole: 'Manager',
                timestamp: new Date(now - 90 * 60000).toISOString()
            },
            {
                type: 'registration',
                description: 'registered as a new player',
                userName: 'Emily Brown',
                userRole: 'Player',
                timestamp: new Date(now - 120 * 60000).toISOString()
            },
            {
                type: 'match_update',
                description: 'updated match scores',
                userName: 'James Wilson',
                userRole: 'Organizer',
                timestamp: new Date(now - 150 * 60000).toISOString()
            }
        ];
    };

    const getActivityIcon = (type) => {
        switch(type) {
            case 'registration': return 'fa-user-plus';
            case 'event_creation': return 'fa-calendar-plus';
            case 'event_update': return 'fa-calendar-check';
            case 'team_creation': return 'fa-users';
            case 'team_update': return 'fa-users-cog';
            case 'match_update': return 'fa-futbol';
            case 'login': return 'fa-sign-in-alt';
            case 'user_approval': return 'fa-user-check';
            default: return 'fa-bell';
        }
    };

    const getActivityColor = (type) => {
        switch(type) {
            case 'registration': return 'bg-blue-100 text-blue-600';
            case 'event_creation': return 'bg-emerald-100 text-emerald-600';
            case 'event_update': return 'bg-teal-100 text-teal-600';
            case 'team_creation': return 'bg-violet-100 text-violet-600';
            case 'team_update': return 'bg-purple-100 text-purple-600';
            case 'match_update': return 'bg-amber-100 text-amber-600';
            case 'login': return 'bg-gray-100 text-gray-600';
            case 'user_approval': return 'bg-green-100 text-green-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentActivities = activities.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(activities.length / itemsPerPage);

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const goToPage = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Activity Logs</h1>
                    <p className="text-gray-600">Recent platform activities and user actions</p>
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Recent Activities</h2>
                        <span className="px-4 py-2 bg-slate-700 text-white rounded-full text-sm font-semibold">
                            {activities.length} Total Activities
                        </span>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <i className="fas fa-spinner fa-spin text-4xl text-gray-400"></i>
                            <p className="text-gray-600 mt-4">Loading activities...</p>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="p-12 text-center">
                            <i className="fas fa-history text-6xl text-gray-300 mb-4"></i>
                            <p className="text-gray-600">No activities yet</p>
                            <p className="text-gray-500 text-sm mt-2">Platform activities will appear here</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {currentActivities.map((activity, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                                                        <i className={`fas ${getActivityIcon(activity.type)}`}></i>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{activity.userName || activity.user?.name || 'System'}</p>
                                                        <p className="text-sm text-gray-500">{activity.userRole || activity.user?.role || 'System'}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-gray-800">{activity.description || 'New activity'}</p>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Just now'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                                    <div className="text-sm text-gray-600">
                                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, activities.length)} of {activities.length} activities
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
                        </>
                    )}
                </div>

                {/* Activity Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
                    <div className="bg-white rounded-xl p-6 shadow-md text-center">
                        <i className="fas fa-user-plus text-4xl text-blue-600 mb-3"></i>
                        <h3 className="text-2xl font-bold text-gray-800 mb-1">
                            {activities.filter(a => a.type === 'registration').length}
                        </h3>
                        <p className="text-gray-600 text-sm">New Registrations</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-md text-center">
                        <i className="fas fa-calendar-plus text-4xl text-emerald-600 mb-3"></i>
                        <h3 className="text-2xl font-bold text-gray-800 mb-1">
                            {activities.filter(a => a.type === 'event_creation').length}
                        </h3>
                        <p className="text-gray-600 text-sm">Events Created</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-md text-center">
                        <i className="fas fa-users text-4xl text-violet-600 mb-3"></i>
                        <h3 className="text-2xl font-bold text-gray-800 mb-1">
                            {activities.filter(a => a.type === 'team_creation').length}
                        </h3>
                        <p className="text-gray-600 text-sm">Teams Formed</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-md text-center">
                        <i className="fas fa-chart-line text-4xl text-amber-600 mb-3"></i>
                        <h3 className="text-2xl font-bold text-gray-800 mb-1">
                            {activities.length}
                        </h3>
                        <p className="text-gray-600 text-sm">Total Activities</p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminActivityLogs;
