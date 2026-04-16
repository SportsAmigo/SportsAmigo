import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import PlayerLayout from '../../components/layout/PlayerLayout';
import axios from 'axios';
import './TeamDetail.css';
import { API_BASE_URL } from '../../utils/constants';

const TeamDetail = () => {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [requestStatus, setRequestStatus] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchTeamDetails();
    }, [teamId]);

    const fetchTeamDetails = async () => {
        try {
            console.log('TeamDetail - Fetching team with ID:', teamId);
            const response = await axios.get(`${API_BASE_URL}/api/player/team/${teamId}`, {
                withCredentials: true
            });

            if (response.data.success) {
                console.log('TeamDetail - Received team data:', response.data.team);
                setTeam(response.data.team);
                setRequestStatus(response.data.requestStatus);
            }
        } catch (error) {
            console.error('Error fetching team details:', error);
            setMessage({ type: 'error', text: 'Failed to load team details' });
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRequest = async () => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/player/teams/${teamId}/join`,
                {},
                { withCredentials: true }
            );

            if (response.data.success) {
                setMessage({ type: 'success', text: 'Join request sent successfully!' });
                setRequestStatus('pending');
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to send join request'
            });
        }
    };

    const handleLeaveTeam = async () => {
        if (!window.confirm('Are you sure you want to leave this team?')) return;

        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/player/teams/leave/${teamId}`,
                {},
                { withCredentials: true }
            );

            if (response.data.success) {
                navigate('/player/my-teams');
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to leave team'
            });
        }
    };


    if (loading) {
        return (
            <PlayerLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-600 mb-4"></div>
                        <p className="text-gray-700 text-lg font-medium">Loading team details...</p>
                    </div>
                </div>
            </PlayerLayout>
        );
    }

    if (!team) {
        return (
            <PlayerLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="bg-white rounded-xl shadow-xl p-12 text-center max-w-md">
                        <i className="fa fa-exclamation-circle text-6xl text-red-500 mb-4"></i>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Team Not Found</h2>
                        <p className="text-gray-600 mb-6">This team doesn't exist or has been removed.</p>
                        <Link
                            to="/player/browse-teams"
                            className="inline-block bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                        >
                            Back to Browse Teams
                        </Link>
                    </div>
                </div>
            </PlayerLayout>
        );
    }

    const current = Number(team.current_members)
        || (Array.isArray(team.members) ? team.members.length : 0);

    const max = Number(team.max_members) || 0;

    const isFull = team.current_members >= team.max_members;
    const isAlreadyMember = team.is_member === true;

    // Manager display: try many possible shapes the backend might return
    const managerDisplay =
        team.manager_name ||
        (team.manager && (
            team.manager.name ||
            [team.manager.firstName, team.manager.lastName].filter(Boolean).join(' ')
        )) ||
        team.manager ||
        team.manager_email ||
        'Team Manager';

    // Normalize members so rendering becomes predictable
    const membersProcessed = (team.members || []).map(m => {
        const name =
            m.name ||
            m.player_name ||
            m.fullName ||
            (m.player && (m.player.name || `${m.player.firstName || ''} ${m.player.lastName || ''}`.trim())) ||
            m.email ||
            (m.player_id && m.player_id.name) ||
            'Team Member';

        const role = m.role || m.position || m.designation || 'Player';

        return { ...m, displayName: name, displayRole: role };
    });



    return (
        <PlayerLayout>
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 py-8">
                <div className="container mx-auto px-4 max-w-7xl">
                    {/* Message Alert */}
                    {message.text && (
                        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
                            <div className="flex items-center justify-between">
                                <span className="font-medium">{message.text}</span>
                                <button onClick={() => setMessage({ type: '', text: '' })} className="text-gray-500 hover:text-gray-700">
                                    <i className="fa fa-times"></i>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Header */}
                    <div className="bg-white rounded-xl shadow-xl overflow-hidden mb-8">
                        <div className="bg-gradient-to-r from-orange-600 to-red-600 p-8 text-white">
                            <Link to="/player/browse-teams" className="text-white hover:text-orange-100 mb-4 inline-flex items-center text-sm font-medium">
                                <i className="fa fa-arrow-left mr-2"></i> Back to Browse Teams
                            </Link>
                            <h1 className="text-4xl font-bold mb-2 mt-2">{team.name}</h1>
                            <div className="flex items-center gap-4 mt-4">
                                <span className="text-white bg-white bg-opacity-20 px-4 py-2 rounded-full text-sm font-medium">
                                    <i className="fa fa-futbol mr-2"></i>{team.sport_type}
                                </span>
                                {isAlreadyMember && (
                                    <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                                        <i className="fa fa-check mr-2"></i>Member
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Team Details Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Details */}
                        <div className="lg:col-span-2 space-y-6">
                            {team.description && (
                                <div className="bg-white rounded-xl shadow-lg p-8">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                                        <i className="fa fa-align-left text-orange-600 mr-3"></i>
                                        About Team
                                    </h2>
                                    <p className="text-gray-700 leading-relaxed">{team.description}</p>
                                </div>
                            )}

                            {/* Team Members */}
                            <div className="bg-white rounded-xl shadow-lg p-8">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                    <i className="fa fa-users text-orange-600 mr-3"></i>
                                    Team Members ({team.current_members})
                                </h2>
                                {membersProcessed.length > 0 ? (
                                    <div className="space-y-3">
                                        {membersProcessed.map((member, index) => (
                                            <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-white font-bold mr-4">
                                                    {member.displayName ? member.displayName.charAt(0).toUpperCase() : 'P'}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-800">{member.displayName}</p>
                                                    <p className="text-sm text-gray-600">{member.displayRole}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-600">Member details not available</p>
                                )}
                            </div>

                            {/* Past Matches */}
                            {team.matches && team.matches.length > 0 && (
                                <div className="bg-white rounded-xl shadow-lg p-8">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                        <i className="fa fa-history text-orange-600 mr-3"></i>
                                        Recent Matches
                                    </h2>
                                    <div className="space-y-4">
                                        {team.matches.slice(0, 5).map((match, index) => (
                                            <div key={index} className="p-4 border border-gray-200 rounded-lg">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-gray-800">{match.opponent}</p>
                                                        <p className="text-sm text-gray-600">{new Date(match.date).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-lg font-bold text-gray-800">{match.score}</p>
                                                        <span className={`text-xs px-2 py-1 rounded-full ${match.result === 'win' ? 'bg-green-100 text-green-800' :
                                                            match.result === 'loss' ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {match.result}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Side Stats */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-6">Team Info</h3>

                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-600 font-medium mb-1">Manager</p>
                                    <p className="text-lg font-bold text-blue-700">{managerDisplay}</p>
                                </div>

                                <div className="p-4 bg-green-50 rounded-lg">
                                    <p className="text-sm text-green-600 font-medium mb-1">Members</p>
                                    <p className="text-lg font-bold text-green-700">{current} / {max || '—'}</p>
                                </div>

                                {team.wins !== undefined && (
                                    <div className="p-4 bg-purple-50 rounded-lg">
                                        <p className="text-sm text-purple-600 font-medium mb-1">Wins</p>
                                        <p className="text-lg font-bold text-purple-700">{team.wins || 0}</p>
                                    </div>
                                )}
                                {team.losses !== undefined && (
                                    <div className="p-4 bg-red-50 rounded-lg">
                                        <p className="text-sm text-red-600 font-medium mb-1">Losses</p>
                                        <p className="text-lg font-bold text-red-700">{team.losses || 0}</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <p className="text-sm text-gray-600 mb-2">Team Capacity</p>

                                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                                    <div
                                        className="bg-blue-600 h-3 rounded-full"
                                        style={{ width: `${max > 0 ? (current / max) * 100 : 0}%` }}
                                    />
                                </div>

                                <p className="text-xs text-gray-600 text-right">
                                    {max > 0 ? Math.round((current / max) * 100) : 0}% Full
                                </p>
                            </div>

                            <div className="mt-6">
                                {isAlreadyMember ? (
                                    <button
                                        onClick={handleLeaveTeam}
                                        className="w-full py-3 rounded-lg font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-all"
                                    >
                                        Leave Team
                                    </button>
                                ) : team.request_status === 'pending' ? (
                                    <button
                                        disabled
                                        className="w-full py-3 rounded-lg font-semibold bg-yellow-100 text-yellow-700 cursor-not-allowed"
                                    >
                                        Request Pending
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleJoinRequest}
                                        disabled={isFull}
                                        className={`w-full py-3 rounded-lg font-semibold transition-all
                ${isFull
                                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:shadow-lg'
                                            }`}
                                    >
                                        {isFull ? 'Team Full' : 'Join Team'}
                                    </button>
                                )}
                            </div>

                        </div>


                    </div>
                </div>
            </div>
        </PlayerLayout>
    );
};

export default TeamDetail;
