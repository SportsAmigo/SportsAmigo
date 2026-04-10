/**
 * Example Component: Using CSRF-Protected API Service
 * 
 * This example demonstrates how to use the apiService for secure API calls
 * in your React components.
 */

import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { clearCsrfToken } from '../services/csrfService';

const ExampleSecureComponent = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Example 1: Fetching data (GET request - no CSRF needed)
    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await apiService.get('/api/events');
            
            if (response.success) {
                setEvents(response.data);
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError('Failed to fetch events');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Example 2: Creating data (POST request - CSRF protected automatically)
    const handleCreateEvent = async (eventData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiService.post('/api/events', eventData);
            
            if (response.success) {
                // Event created successfully
                console.log('Event created:', response.data);
                
                // Refresh the list
                await fetchEvents();
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError('Failed to create event');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Example 3: Updating data (PUT request - CSRF protected automatically)
    const handleUpdateEvent = async (eventId, updates) => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiService.put(`/api/events/${eventId}`, updates);
            
            if (response.success) {
                console.log('Event updated:', response.data);
                await fetchEvents();
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError('Failed to update event');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Example 4: Deleting data (DELETE request - CSRF protected automatically)
    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm('Are you sure you want to delete this event?')) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await apiService.delete(`/api/events/${eventId}`);
            
            if (response.success) {
                console.log('Event deleted');
                await fetchEvents();
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError('Failed to delete event');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Example 5: Form submission with CSRF protection
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        
        const formData = {
            name: e.target.eventName.value,
            date: e.target.eventDate.value,
            location: e.target.eventLocation.value
        };

        await handleCreateEvent(formData);
    };

    // Example 6: Logout - Clear CSRF token
    const handleLogout = async () => {
        try {
            await apiService.post('/api/auth/logout');
            
            // Clear CSRF token from cache
            clearCsrfToken();
            
            // Redirect to login
            window.location.href = '/login';
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Secure API Example</h1>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Example Form */}
            <form onSubmit={handleFormSubmit} className="mb-6 space-y-4">
                <h2 className="text-xl font-semibold">Create New Event</h2>
                
                <input
                    type="text"
                    name="eventName"
                    placeholder="Event Name"
                    className="w-full px-4 py-2 border rounded"
                    required
                />
                
                <input
                    type="date"
                    name="eventDate"
                    className="w-full px-4 py-2 border rounded"
                    required
                />
                
                <input
                    type="text"
                    name="eventLocation"
                    placeholder="Location"
                    className="w-full px-4 py-2 border rounded"
                    required
                />
                
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                    {loading ? 'Creating...' : 'Create Event'}
                </button>
            </form>

            {/* Events List */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Events List</h2>
                
                {loading ? (
                    <p>Loading...</p>
                ) : events.length === 0 ? (
                    <p>No events found</p>
                ) : (
                    <ul className="space-y-2">
                        {events.map(event => (
                            <li key={event._id} className="border p-4 rounded flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold">{event.name}</h3>
                                    <p className="text-sm text-gray-600">{event.date} - {event.location}</p>
                                </div>
                                <div className="space-x-2">
                                    <button
                                        onClick={() => handleUpdateEvent(event._id, { status: 'active' })}
                                        className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600"
                                    >
                                        Activate
                                    </button>
                                    <button
                                        onClick={() => handleDeleteEvent(event._id)}
                                        className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Logout Button */}
            <button
                onClick={handleLogout}
                className="mt-6 bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            >
                Logout
            </button>
        </div>
    );
};

export default ExampleSecureComponent;


// ============================================================================
// ADVANCED USAGE EXAMPLES
// ============================================================================

/**
 * Example 7: File Upload with CSRF Protection
 */
export const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        // For file uploads, you need to handle headers differently
        const token = await apiService.getCsrfToken();
        
        const response = await fetch('http://localhost:5000/api/upload', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'X-CSRF-Token': token
                // Don't set Content-Type for FormData - browser will set it automatically
            },
            body: formData
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Upload failed:', error);
        throw error;
    }
};

/**
 * Example 8: Batch Operations with CSRF
 */
export const handleBatchDelete = async (eventIds) => {
    try {
        const response = await apiService.post('/api/events/batch-delete', {
            ids: eventIds
        });
        
        return response;
    } catch (error) {
        console.error('Batch delete failed:', error);
        throw error;
    }
};

/**
 * Example 9: Custom Hook for Secure API Calls
 */
export const useSecureApi = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const callApi = async (method, endpoint, data = null) => {
        setLoading(true);
        setError(null);

        try {
            let response;
            
            switch (method.toUpperCase()) {
                case 'GET':
                    response = await apiService.get(endpoint);
                    break;
                case 'POST':
                    response = await apiService.post(endpoint, data);
                    break;
                case 'PUT':
                    response = await apiService.put(endpoint, data);
                    break;
                case 'DELETE':
                    response = await apiService.delete(endpoint);
                    break;
                default:
                    throw new Error(`Unsupported method: ${method}`);
            }

            setLoading(false);
            return response;
        } catch (err) {
            setError(err.message);
            setLoading(false);
            throw err;
        }
    };

    return { callApi, loading, error };
};

/**
 * Example 10: Using the Custom Hook
 */
export const ExampleWithHook = () => {
    const { callApi, loading, error } = useSecureApi();
    const [events, setEvents] = useState([]);

    const loadEvents = async () => {
        try {
            const response = await callApi('GET', '/api/events');
            if (response.success) {
                setEvents(response.data);
            }
        } catch (err) {
            console.error('Failed to load events:', err);
        }
    };

    const createEvent = async (eventData) => {
        try {
            const response = await callApi('POST', '/api/events', eventData);
            if (response.success) {
                await loadEvents(); // Refresh list
            }
        } catch (err) {
            console.error('Failed to create event:', err);
        }
    };

    return (
        <div>
            {loading && <p>Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {/* Rest of component */}
        </div>
    );
};
