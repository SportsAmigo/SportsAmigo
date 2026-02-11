import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import axios from 'axios';

const AdminEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/admin/events', { withCredentials: true });
            if (response.data.success) {
                setEvents(response.data.events || []);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (eventId, eventName) => {
        if (!window.confirm(`Delete event: ${eventName}?`)) return;
        try {
            const response = await axios.delete(`http://localhost:5000/api/admin/events/${eventId}`, { withCredentials: true });
            if (response.data.success) {
                alert('Event deleted successfully');
                fetchEvents();
            }
        } catch (error) {
            alert('Failed to delete event');
        }
    };

    const filteredEvents = events.filter(event =>
        event.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Event Management</h1>
                    <p className="text-gray-600">Manage all platform events</p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                    <input
                        type="text"
                        placeholder="Search events..."
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b bg-emerald-50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Events</h2>
                        <span className="px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-semibold">
                            {filteredEvents.length} Total
                        </span>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <i className="fas fa-spinner fa-spin text-4xl text-gray-400"></i>
                            <p className="text-gray-600 mt-4">Loading events...</p>
                        </div>
                    ) : filteredEvents.length === 0 ? (
                        <div className="p-12 text-center">
                            <i className="fas fa-calendar-alt text-6xl text-gray-300 mb-4"></i>
                            <p className="text-gray-600">No events found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Event Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Sport</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Organizer</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredEvents.map((event) => (
                                        <tr key={event.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                                        <i className="fas fa-calendar-alt text-emerald-600"></i>
                                                    </div>
                                                    <span className="ml-3 font-medium text-gray-900">{event.title || event.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{event.sport_type || 'N/A'}</td>
                                            <td className="px-6 py-4 text-gray-600">{event.organizer_name || 'N/A'}</td>
                                            <td className="px-6 py-4 text-gray-600 text-sm">
                                                {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{event.location || 'TBD'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    event.status === 'upcoming' ? 'bg-blue-100 text-blue-800' : 
                                                    event.status === 'in_progress' ? 'bg-emerald-100 text-emerald-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {event.status || 'Active'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleDelete(event.id, event.title || event.name)}
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

export default AdminEvents;
