import React from 'react';

/**
 * Universal ViewModal Component for Admin Dashboard
 * Displays detailed information for Users, Teams, and Events
 */
const ViewModal = ({ isOpen, onClose, data, type }) => {
    if (!isOpen || !data) return null;

    const renderUserDetails = () => (
        <div className="space-y-6">
            {/* Header with Profile */}
            <div className="flex items-start gap-4 pb-4 border-b">
                <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {data.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-800">{data.name || 'Unnamed User'}</h3>
                    <p className="text-gray-600">{data.email}</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${
                        data.role === 'player' ? 'bg-violet-100 text-violet-800' :
                        data.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                        'bg-emerald-100 text-emerald-800'
                    }`}>
                        {data.role?.toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Phone</p>
                    <p className="font-semibold text-gray-800">{data.phone || 'Not provided'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Join Date</p>
                    <p className="font-semibold text-gray-800">
                        {data.details?.join_date ? new Date(data.details.join_date).toLocaleDateString() : 'N/A'}
                    </p>
                </div>
            </div>

            {/* Role-Specific Information */}
            {data.role === 'player' && (
                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                    <h4 className="font-bold text-blue-900 flex items-center gap-2">
                        <i className="fas fa-user-tag"></i>
                        Player Information
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-sm text-blue-700">Sport</p>
                            <p className="font-semibold text-blue-900">{data.details?.preferred_sports || 'Unspecified'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-blue-700">Team</p>
                            <p className="font-semibold text-blue-900">{data.team || 'Unassigned'}</p>
                        </div>
                        {data.details?.age && (
                            <div>
                                <p className="text-sm text-blue-700">Age</p>
                                <p className="font-semibold text-blue-900">{data.details.age}</p>
                            </div>
                        )}
                        {data.details?.address && (
                            <div className="col-span-2">
                                <p className="text-sm text-blue-700">Address</p>
                                <p className="font-semibold text-blue-900">{data.details.address}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {data.role === 'manager' && (
                <div className="bg-indigo-50 p-4 rounded-lg space-y-3">
                    <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                        <i className="fas fa-users-cog"></i>
                        Manager Information
                    </h4>
                    <div>
                        <p className="text-sm text-indigo-700">Team Name</p>
                        <p className="font-semibold text-indigo-900">{data.team || data.details?.team_name || 'No Team'}</p>
                    </div>
                </div>
            )}

            {data.role === 'organizer' && (
                <div className="bg-emerald-50 p-4 rounded-lg space-y-3">
                    <h4 className="font-bold text-emerald-900 flex items-center gap-2">
                        <i className="fas fa-calendar-alt"></i>
                        Organizer Information
                    </h4>
                    <div className="space-y-2">
                        <div>
                            <p className="text-sm text-emerald-700">Organization</p>
                            <p className="font-semibold text-emerald-900">{data.organization || 'Unspecified'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-emerald-700">Events Organized</p>
                            <p className="font-semibold text-emerald-900">{data.events_count || 0} Events</p>
                        </div>
                        {data.events && data.events.length > 0 && (
                            <div className="mt-3">
                                <p className="text-sm text-emerald-700 mb-2">Recent Events:</p>
                                <div className="space-y-2">
                                    {data.events.slice(0, 5).map((event, index) => (
                                        <div key={index} className="bg-white p-2 rounded border border-emerald-200">
                                            <p className="font-semibold text-sm">{event.name}</p>
                                            <p className="text-xs text-gray-600">{event.location} • {new Date(event.date).toLocaleDateString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Bio */}
            {data.bio && (
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold text-gray-900 mb-2">Bio</h4>
                    <p className="text-gray-700 leading-relaxed">{data.bio}</p>
                </div>
            )}
        </div>
    );

    const renderTeamDetails = () => (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4 pb-4 border-b">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white text-3xl">
                    <i className="fas fa-users-cog"></i>
                </div>
                <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-800">{data.name || 'Unnamed Team'}</h3>
                    <p className="text-gray-600">{data.sport_type || 'Sport not specified'}</p>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold mt-2">
                        {data.current_members || 0} Members
                    </span>
                </div>
            </div>

            {/* Team Information */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Manager</p>
                    <p className="font-semibold text-gray-800">{data.manager_name || 'No Manager'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Created</p>
                    <p className="font-semibold text-gray-800">
                        {data.created_at ? new Date(data.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Max Members</p>
                    <p className="font-semibold text-gray-800">{data.max_members || 'Unlimited'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <p className="font-semibold text-gray-800">{data.status || 'Active'}</p>
                </div>
            </div>

            {/* Team Members */}
            {data.members && data.members.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                        <i className="fas fa-users"></i>
                        Team Members ({data.members.length})
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {data.members.map((member, index) => (
                            <div key={index} className="bg-white p-3 rounded border border-blue-200 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-gray-900">{member.name || `Player ${index + 1}`}</p>
                                    <p className="text-sm text-gray-600">{member.position || 'Position not set'}</p>
                                </div>
                                {member.jersey_number && (
                                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                        {member.jersey_number}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Description */}
            {data.description && (
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-700 leading-relaxed">{data.description}</p>
                </div>
            )}
        </div>
    );

    const renderEventDetails = () => (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4 pb-4 border-b">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-3xl">
                    <i className="fas fa-calendar-alt"></i>
                </div>
                <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-800">{data.title || data.name || 'Unnamed Event'}</h3>
                    <p className="text-gray-600">{data.sport_type || 'Sport not specified'}</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${
                        data.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                        data.status === 'in_progress' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                        {data.status?.toUpperCase() || 'ACTIVE'}
                    </span>
                </div>
            </div>

            {/* Event Information */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1"><i className="fas fa-calendar mr-2"></i>Event Date</p>
                    <p className="font-semibold text-gray-800">
                        {data.event_date ? new Date(data.event_date).toLocaleDateString('en-US', { 
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                        }) : 'TBD'}
                    </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1"><i className="fas fa-map-marker-alt mr-2"></i>Location</p>
                    <p className="font-semibold text-gray-800">{data.location || 'TBD'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1"><i className="fas fa-user mr-2"></i>Organizer</p>
                    <p className="font-semibold text-gray-800">{data.organizer_name || 'Unknown'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1"><i className="fas fa-users mr-2"></i>Teams Registered</p>
                    <p className="font-semibold text-gray-800">
                        {data.registered_teams || data.team_registrations?.length || 0} / {data.max_teams || 'Unlimited'}
                    </p>
                </div>
            </div>

            {/* Registration Details */}
            {(data.registration_start || data.registration_end) && (
                <div className="bg-emerald-50 p-4 rounded-lg">
                    <h4 className="font-bold text-emerald-900 mb-3 flex items-center gap-2">
                        <i className="fas fa-clipboard-list"></i>
                        Registration Period
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        {data.registration_start && (
                            <div>
                                <p className="text-sm text-emerald-700">Start Date</p>
                                <p className="font-semibold text-emerald-900">
                                    {new Date(data.registration_start).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                        {data.registration_end && (
                            <div>
                                <p className="text-sm text-emerald-700">End Date</p>
                                <p className="font-semibold text-emerald-900">
                                    {new Date(data.registration_end).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Registered Teams */}
            {data.team_registrations && data.team_registrations.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                        <i className="fas fa-users-cog"></i>
                        Registered Teams ({data.team_registrations.length})
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {data.team_registrations.map((team, index) => (
                            <div key={index} className="bg-white p-3 rounded border border-blue-200">
                                <p className="font-semibold text-gray-900">{team.team_name || `Team ${index + 1}`}</p>
                                <p className="text-sm text-gray-600">
                                    Registered: {team.registration_date ? new Date(team.registration_date).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Description */}
            {data.description && (
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-700 leading-relaxed">{data.description}</p>
                </div>
            )}

            {/* Additional Details */}
            {(data.entry_fee || data.prize_pool || data.rules) && (
                <div className="bg-amber-50 p-4 rounded-lg space-y-3">
                    <h4 className="font-bold text-amber-900 flex items-center gap-2">
                        <i className="fas fa-info-circle"></i>
                        Additional Details
                    </h4>
                    {data.entry_fee && (
                        <div>
                            <p className="text-sm text-amber-700">Entry Fee</p>
                            <p className="font-semibold text-amber-900">${data.entry_fee}</p>
                        </div>
                    )}
                    {data.prize_pool && (
                        <div>
                            <p className="text-sm text-amber-700">Prize Pool</p>
                            <p className="font-semibold text-amber-900">${data.prize_pool}</p>
                        </div>
                    )}
                    {data.rules && (
                        <div>
                            <p className="text-sm text-amber-700">Rules</p>
                            <p className="font-semibold text-amber-900">{data.rules}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-out scale-100">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <i className={`fas ${
                            type === 'user' ? 'fa-user-circle' :
                            type === 'team' ? 'fa-users-cog' :
                            'fa-calendar-alt'
                        }`}></i>
                        {type === 'user' ? 'User Details' :
                         type === 'team' ? 'Team Details' :
                         'Event Details'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all"
                    >
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                    {type === 'user' && renderUserDetails()}
                    {type === 'team' && renderTeamDetails()}
                    {type === 'event' && renderEventDetails()}
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end border-t">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-all font-semibold"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewModal;
