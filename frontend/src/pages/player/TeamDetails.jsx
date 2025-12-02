import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import PlayerLayout from '../../components/layout/PlayerLayout';
import axios from 'axios';
import './TeamDetails.css';

const TeamDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTeamDetails();
    }, [id]);

    const fetchTeamDetails = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/player/team/${id}`, { 
                withCredentials: true 
            });
            if (response.data.success) {
                setTeam(response.data.team);
            } else {
                setError(response.data.message || 'Failed to load team details');
            }
        } catch (error) {
            console.error('Error fetching team details:', error);
            setError(error.response?.data?.message || 'Error loading team details');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRequest = async () => {
        try {
            const response = await axios.post(
                `http://localhost:5000/api/player/teams/${id}/join`,
                {},
                { withCredentials: true }
            );

            if (response.data.success) {
                alert(response.data.message || 'Request to join sent successfully!');
                fetchTeamDetails(); // Refresh team data
            } else {
                alert(response.data.message || 'Failed to send join request');
            }
        } catch (error) {
            console.error('Error sending join request:', error);
            alert(error.response?.data?.message || 'Error sending join request');
        }
    };

    const getJoinButton = () => {
        if (team.already_joined) {
            return (
                <span className="status-badge joined">
                    <i className="fa fa-check-circle"></i> Already Joined
                </span>
            );
        }

        if (team.request_status === 'pending') {
            return (
                <span className="status-badge pending">
                    <i className="fa fa-clock"></i> Request Pending
                </span>
            );
        }

        const isFull = team.current_members >= team.max_members;

        return (
            <button
                onClick={handleJoinRequest}
                className="join-team-btn"
                disabled={isFull}
            >
                <i className="fa fa-user-plus"></i>
                {isFull ? 'Team Full' : 'Request to Join'}
            </button>
        );
    };

    if (loading) {
        return (
            <PlayerLayout>
                <div className="team-details-wrapper">
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Loading team details...</p>
                    </div>
                </div>
            </PlayerLayout>
        );
    }

    if (error) {
        return (
            <PlayerLayout>
                <div className="team-details-wrapper">
                    <div className="error-container">
                        <i className="fa fa-exclamation-triangle"></i>
                        <h3>Error</h3>
                        <p>{error}</p>
                        <Link to="/player/browse-teams" className="btn-back">
                            <i className="fa fa-arrow-left"></i>
                            Back to Browse Teams
                        </Link>
                    </div>
                </div>
            </PlayerLayout>
        );
    }

    if (!team) {
        return (
            <PlayerLayout>
                <div className="team-details-wrapper">
                    <div className="error-container">
                        <i className="fa fa-users"></i>
                        <h3>Team Not Found</h3>
                        <p>The team you're looking for doesn't exist.</p>
                        <Link to="/player/browse-teams" className="btn-back">
                            <i className="fa fa-arrow-left"></i>
                            Back to Browse Teams
                        </Link>
                    </div>
                </div>
            </PlayerLayout>
        );
    }

    return (
        <PlayerLayout>
            <div className="team-details-wrapper">
                {/* Header */}
                <div className="page-header">
                    <Link to="/player/browse-teams" className="back-link">
                        <i className="fa fa-arrow-left"></i>
                        Back to Browse Teams
                    </Link>
                    <div>
                        <h1 className="page-title">
                            <i className="fa fa-shield-alt"></i>
                            {team.name}
                        </h1>
                        <p className="page-subtitle">
                            View team details and information
                        </p>
                    </div>
                    {getJoinButton()}
                </div>

                {/* Team Info Card */}
                <div className="info-card">
                    {team.description && (
                        <div className="description-section">
                            <h3>Description</h3>
                            <p>{team.description}</p>
                        </div>
                    )}

                    <div className="info-grid">
                        <div className="info-item">
                            <i className="fa fa-futbol"></i>
                            <div>
                                <span className="info-label">Sport Type</span>
                                <span className="info-value">{team.sport_type}</span>
                            </div>
                        </div>
                        <div className="info-item">
                            <i className="fa fa-users"></i>
                            <div>
                                <span className="info-label">Members</span>
                                <span className="info-value">{team.current_members || 0} / {team.max_members}</span>
                            </div>
                        </div>
                        <div className="info-item">
                            <i className="fa fa-user-tie"></i>
                            <div>
                                <span className="info-label">Manager</span>
                                <span className="info-value">{team.manager_name || 'Unknown'}</span>
                            </div>
                        </div>
                        <div className="info-item">
                            <i className="fa fa-calendar"></i>
                            <div>
                                <span className="info-label">Created</span>
                                <span className="info-value">
                                    {new Date(team.created_at).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Members Section */}
                <div className="members-section">
                    <div className="section-header">
                        <h2>
                            <i className="fa fa-users"></i>
                            Team Members ({team.current_members || 0})
                        </h2>
                    </div>

                    {team.members && team.members.length > 0 ? (
                        <div className="members-grid">
                            {team.members.map(member => (
                                <div key={member.player_id} className="member-card">
                                    <div className="member-avatar">
                                        {member.photo_url ? (
                                            <img src={member.photo_url} alt={member.first_name} />
                                        ) : (
                                            <i className="fa fa-user"></i>
                                        )}
                                    </div>
                                    <div className="member-info">
                                        <h4>{member.first_name} {member.last_name}</h4>
                                        <p className="member-email">{member.email}</p>
                                        <p className="member-joined">
                                            Joined: {new Date(member.joined_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-members">
                            <i className="fa fa-user-plus"></i>
                            <p>No members yet. Be the first to join this team!</p>
                        </div>
                    )}
                </div>

                {/* Team Stats */}
                {team.wins !== undefined && (
                    <div className="stats-section">
                        <div className="section-header">
                            <h2>
                                <i className="fa fa-chart-line"></i>
                                Team Statistics
                            </h2>
                        </div>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <i className="fa fa-trophy"></i>
                                <div className="stat-value">{team.wins || 0}</div>
                                <div className="stat-label">Wins</div>
                            </div>
                            <div className="stat-card">
                                <i className="fa fa-users"></i>
                                <div className="stat-value">{team.current_members || 0}</div>
                                <div className="stat-label">Active Members</div>
                            </div>
                            <div className="stat-card">
                                <i className="fa fa-percent"></i>
                                <div className="stat-value">
                                    {Math.round((team.current_members / team.max_members) * 100)}%
                                </div>
                                <div className="stat-label">Team Capacity</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PlayerLayout>
    );
};

export default TeamDetails;
