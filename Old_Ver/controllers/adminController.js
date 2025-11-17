const User = require('../models/user');
const Team = require('../models/team');
const Event = require('../models/event');
const mongoose = require('mongoose');

/**
 * Admin controller to handle admin-specific operations
 */
module.exports = {
    /**
     * Get all users with role-specific information
     * @param {string} role - User role (player, manager, organizer)
     * @returns {Promise<Array>} - Promise resolving to array of users with role-specific info
     */
    getAllUsersByRole: async function(role) {
        try {
            // Validate role
            if (!['player', 'manager', 'organizer'].includes(role)) {
                throw new Error('Invalid role');
            }
            
            // Get users by role using our User model's getAllUsers method
            const users = await User.getAllUsers({ role });
            
            // Format users based on role
            const formattedUsers = [];
            
            for (const user of users) {
                // Common information
                const userInfo = {
                    id: user._id,
                    name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed',
                    email: user.email,
                    role: user.role,
                    profile_image: user.profile_image,
                    joinedDate: user.created_at,
                    status: 'Active', // Default status
                    isExample: false
                };
                
                // Role-specific information
                switch (role) {
                    case 'player':
                        userInfo.sport = user.profile && user.profile.preferred_sports 
                            ? user.profile.preferred_sports 
                            : 'Unspecified';
                            
                        // Try to find team info using the Team model
                        try {
                            const teamInfo = await Team.getTeamForPlayer(user._id);
                            userInfo.team = teamInfo ? teamInfo.name : 'Unassigned';
                        } catch (err) {
                            console.error('Error getting team for player:', err);
                            userInfo.team = 'Unassigned';
                        }
                        break;
                        
                    case 'manager':
                        // Get team info from profile or team collection
                        if (user.profile && user.profile.team_name) {
                            userInfo.team = user.profile.team_name;
                        } else {
                            try {
                                const teamInfo = await Team.getTeamsByManager(user._id);
                                userInfo.team = teamInfo && teamInfo.length > 0 ? teamInfo[0].name : 'No Team';
                            } catch (err) {
                                console.error('Error getting team for manager:', err);
                                userInfo.team = 'No Team';
                            }
                        }
                        break;
                        
                    case 'organizer':
                        userInfo.organization = user.profile && user.profile.organization_name 
                            ? user.profile.organization_name 
                            : 'Unspecified';
                            
                        // Get count of events organized using Event model
                        try {
                            const events = await Event.getEventsByOrganizer(user._id);
                            userInfo.eventsCount = events ? events.length : 0;
                        } catch (err) {
                            console.error('Error getting event count for organizer:', err);
                            userInfo.eventsCount = 0;
                        }
                        break;
                }
                
                formattedUsers.push(userInfo);
            }
            
            return formattedUsers;
        } catch (err) {
            console.error(`Error getting ${role}s:`, err);
            throw err;
        }
    },
    
    /**
     * Get user details by ID with role-specific information
     * @param {string} userId - User ID
     * @returns {Promise<object>} - Promise resolving to user details
     */
    getUserDetailsById: async function(userId) {
        try {
            // Use our User model's getUserById method
            const user = await User.getUserById(userId);
            
            if (!user) {
                throw new Error('User not found');
            }
            
            // Common user information
            const userDetails = {
                id: user._id,
                name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed',
                email: user.email,
                role: user.role,
                profile_image: user.profile_image,
                created_at: user.created_at,
                phone: user.phone || '',
                bio: user.bio || '',
                details: {
                    join_date: user.profile ? user.profile.join_date : user.created_at
                }
            };
            
            // Role-specific information
            switch (user.role) {
                case 'player':
                    userDetails.details.age = user.profile ? user.profile.age : null;
                    userDetails.details.address = user.profile ? user.profile.address : null;
                    userDetails.details.preferred_sports = user.profile ? user.profile.preferred_sports : null;
                    
                    // Try to find team info using the Team model
                    try {
                        const teamInfo = await Team.getTeamForPlayer(user._id);
                        userDetails.team = teamInfo ? teamInfo.name : 'Unassigned';
                    } catch (err) {
                        console.error('Error getting team for player:', err);
                        userDetails.team = 'Unassigned';
                    }
                    break;
                    
                case 'manager':
                    userDetails.details.team_name = user.profile ? user.profile.team_name : null;
                    
                    // Try to find team info using the Team model
                    try {
                        const teamInfo = await Team.getTeamsByManager(user._id);
                        userDetails.team = teamInfo && teamInfo.length > 0 ? teamInfo[0].name : 
                                           (user.profile ? user.profile.team_name : 'No Team');
                    } catch (err) {
                        console.error('Error getting team for manager:', err);
                        userDetails.team = user.profile ? user.profile.team_name : 'No Team';
                    }
                    break;
                    
                case 'organizer':
                    userDetails.details.organization_name = user.profile ? user.profile.organization_name : null;
                    userDetails.organization = user.profile ? user.profile.organization_name : 'Unspecified';
                    
                    // Get events organized using Event model
                    try {
                        const events = await Event.getEventsByOrganizer(user._id);
                        userDetails.events_count = events ? events.length : 0;
                        userDetails.events = events ? events.map(event => ({
                            id: event._id,
                            name: event.title || event.name,
                            date: event.event_date,
                            location: event.location
                        })) : [];
                    } catch (err) {
                        console.error('Error getting events for organizer:', err);
                        userDetails.events_count = 0;
                        userDetails.events = [];
                    }
                    break;
            }
            
            return userDetails;
        } catch (err) {
            console.error('Error getting user details:', err);
            throw err;
        }
    },
    
    /**
     * Get dashboard statistics for admin
     * @returns {Promise<object>} - Promise resolving to dashboard statistics
     */
    getDashboardStats: async function() {
        try {
            // User stats - get all users and count them
            const allUsers = await User.getAllUsers();
            const totalUsers = allUsers.length;
            
            // Count users by role
            const playerCount = allUsers.filter(user => user.role === 'player').length;
            const managerCount = allUsers.filter(user => user.role === 'manager').length;
            const organizerCount = allUsers.filter(user => user.role === 'organizer').length;
            
            // Team stats - get all teams and count them
            const allTeams = await Team.getAllTeams();
            const totalTeams = allTeams ? allTeams.length : 0;
            
            // Count teams by sport type
            const teamsByType = [];
            if (allTeams && allTeams.length > 0) {
                // Group teams by sport_type and count
                const sportTypeCount = {};
                allTeams.forEach(team => {
                    const sportType = team.sport_type || 'Unspecified';
                    sportTypeCount[sportType] = (sportTypeCount[sportType] || 0) + 1;
                });
                
                // Convert to array of {_id, count} for compatibility
                for (const [sportType, count] of Object.entries(sportTypeCount)) {
                    teamsByType.push({ _id: sportType, count });
                }
            }
            
            // Event stats - get all events
            const allEvents = await Event.getAllEvents();
            const totalEvents = allEvents ? allEvents.length : 0;
            
            // Count upcoming and past events
            const now = new Date();
            const upcomingEvents = allEvents ? 
                allEvents.filter(event => new Date(event.event_date) > now).length : 0;
            const pastEvents = allEvents ? 
                allEvents.filter(event => new Date(event.event_date) <= now).length : 0;
            
            return {
                users: {
                    total: totalUsers,
                    players: playerCount,
                    managers: managerCount,
                    organizers: organizerCount
                },
                teams: {
                    total: totalTeams,
                    byType: teamsByType
                },
                events: {
                    total: totalEvents,
                    upcoming: upcomingEvents,
                    past: pastEvents
                }
            };
        } catch (err) {
            console.error('Error getting dashboard stats:', err);
            throw err;
        }
    },
    
    /**
     * Get recent system activities for admin dashboard
     * @param {number} limit - Maximum number of activities to return
     * @returns {Promise<Array>} - Promise resolving to array of activity objects
     */
    getRecentActivities: async function(limit = 10) {
        try {
            // This is a placeholder function until a proper Activity model is implemented
            // In a real implementation, we'd query an Activity collection in MongoDB
            
            const activities = [];
            
            // Get recent user registrations
            const users = await User.getAllUsers();
            
            // Sort users by creation date, most recent first
            const sortedUsers = users.sort((a, b) => {
                const dateA = a.createdAt || a.joinedDate || new Date(0);
                const dateB = b.createdAt || b.joinedDate || new Date(0);
                return new Date(dateB) - new Date(dateA);
            });
            
            // Add user registration activities
            sortedUsers.slice(0, Math.min(5, limit)).forEach(user => {
                activities.push({
                    type: 'registration',
                    timestamp: user.createdAt || user.joinedDate || new Date(),
                    user: {
                        id: user._id,
                        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
                        role: user.role
                    },
                    description: `Registered as a new ${user.role}`,
                    route: `/admin/${user.role}s`
                });
            });
            
            // Get recent events
            const events = await Event.getAllEvents();
            
            // Sort events by creation date, most recent first
            const sortedEvents = events.sort((a, b) => {
                const dateA = a.created_at || new Date(0);
                const dateB = b.created_at || new Date(0);
                return new Date(dateB) - new Date(dateA);
            });
            
            // Add event creation activities
            sortedEvents.slice(0, Math.min(5, limit)).forEach(event => {
                activities.push({
                    type: 'event_creation',
                    timestamp: event.created_at || new Date(),
                    user: event.organizer_id ? {
                        id: event.organizer_id,
                        name: event.organizer_name || 'Unknown Organizer',
                        role: 'organizer'
                    } : null,
                    description: `Created a new event: ${event.title || event.name || 'Unnamed Event'}`,
                    route: '/admin/tournaments'
                });
            });
            
            // Get recent teams
            const teams = await Team.getAllTeams();
            
            // Sort teams by creation date, most recent first
            const sortedTeams = teams.sort((a, b) => {
                const dateA = a.created_at || new Date(0);
                const dateB = b.created_at || new Date(0);
                return new Date(dateB) - new Date(dateA);
            });
            
            // Add team creation activities
            sortedTeams.slice(0, Math.min(5, limit)).forEach(team => {
                activities.push({
                    type: 'team_creation',
                    timestamp: team.created_at || new Date(),
                    user: team.manager_id ? {
                        id: team.manager_id,
                        name: team.manager_name || 'Unknown Manager',
                        role: 'manager'
                    } : null,
                    description: `Created a new team: ${team.name || 'Unnamed Team'}`,
                    route: '/admin/teams'
                });
            });
            
            // Sort all activities by timestamp, most recent first
            activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            // Return only the requested number of activities
            return activities.slice(0, limit);
        } catch (err) {
            console.error('Error getting recent activities:', err);
            // Return empty array instead of throwing to avoid breaking the UI
            return [];
        }
    },

    /**
     * Get upcoming events for admin dashboard
     * @param {number} limit - Maximum number of events to return
     * @returns {Promise<Array>} - Promise resolving to array of upcoming events
     */
    getUpcomingEvents: async function(limit = 5) {
        try {
            const upcomingEvents = await Event.getAllEvents({
                filter: { 
                    event_date: { $gte: new Date() },
                    status: { $in: ['upcoming', 'in_progress'] }
                },
                sort: { event_date: 1 },
                limit: limit
            });
            
            // Format events with organizer info
            const formattedEvents = [];
            
            for (const event of upcomingEvents) {
                try {
                    // Get organizer details
                    let organizerName = 'Unknown Organizer';
                    if (event.organizer_id) {
                        const organizer = await User.getUserById(event.organizer_id);
                        if (organizer) {
                            organizerName = `${organizer.first_name || ''} ${organizer.last_name || ''}`.trim() || organizer.email.split('@')[0];
                        }
                    }
                    
                    // Get team registrations count
                    const teamCount = event.team_registrations ? event.team_registrations.length : 0;
                    const maxTeams = event.max_teams || 'unlimited';
                    
                    // Format event date
                    const eventDate = event.event_date ? new Date(event.event_date) : new Date();
                    const formattedDate = eventDate.toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    });
                    
                    formattedEvents.push({
                        id: event._id,
                        title: event.title || 'Unnamed Event',
                        date: formattedDate,
                        location: event.location || 'TBD',
                        teams: `${teamCount}/${maxTeams}`,
                        organizer: organizerName,
                        status: event.status === 'upcoming' ? 'Upcoming' : 'Active'
                    });
                } catch (err) {
                    console.error(`Error formatting event ${event._id}:`, err);
                }
            }
            
            return formattedEvents;
        } catch (err) {
            console.error('Error getting upcoming events:', err);
            return [];
        }
    }
}; 