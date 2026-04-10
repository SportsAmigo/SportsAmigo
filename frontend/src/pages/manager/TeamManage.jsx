import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import ManagerLayout from '../../components/layout/ManagerLayout';
import axios from 'axios';
import './TeamManage.css';

const TeamManage = () => {
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
            const response = await axios.get(`http://localhost:5000/api/manager/team/${id}`, { 
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

    const handleApproveRequest = async (requestId, playerId) => {
        try {
            console.log('Approving request:', { requestId, playerId, teamId: id });
            const url = `http://localhost:5000/api/manager/team/${id}/approve-request`;
            console.log('Request URL:', url);
            
            const response = await axios.post(
                url,
                { requestId, playerId },
                { withCredentials: true }
            );
            
            console.log('Response:', response.data);
            
            if (response.data.success) {
                alert('Join request approved successfully!');
                fetchTeamDetails(); // Refresh team data
            } else {
                alert(response.data.message || 'Failed to approve request');
            }
        } catch (error) {
            console.error('Error approving request:', error);
            console.error('Error response:', error.response);
            console.error('Error message:', error.message);
            alert(error.response?.data?.message || error.message || 'Error approving request');
        }
    };

    const handleRejectRequest = async (requestId) => {
        if (!window.confirm('Are you sure you want to reject this request?')) {
            return;
        }

        try {
            const response = await axios.post(
                `http://localhost:5000/api/manager/team/${id}/reject-request`,
                { requestId },
                { withCredentials: true }
            );
            
            if (response.data.success) {
                alert('Join request rejected');
                fetchTeamDetails(); // Refresh team data
            } else {
                alert(response.data.message || 'Failed to reject request');
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            alert(error.response?.data?.message || 'Error rejecting request');
        }
    };

    const handleRemoveMember = async (playerId) => {
        if (!window.confirm('Are you sure you want to remove this member?')) {
            return;
        }

        try {
            const response = await axios.post(
                `http://localhost:5000/api/manager/team/${id}/remove-member`,
                { playerId },
                { withCredentials: true }
            );
            
            if (response.data.success) {
                alert('Member removed successfully');
                fetchTeamDetails(); // Refresh team data
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Error removing member');
        }
    };

    if (loading) {
        return (
            <ManagerLayout>
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading team details...</p>
                </div>
            </ManagerLayout>
        );
    }

    if (error) {
        return (
            <ManagerLayout>
                <div className="error-container">
                    <i className="fa fa-exclamation-triangle"></i>
                    <h3>Error</h3>
                    <p>{error}</p>
                    <Link to="/manager/my-teams" className="btn-back">
                        <i className="fa fa-arrow-left"></i>
                        Back to My Teams
                    </Link>
                </div>
            </ManagerLayout>
        );
    }

    if (!team) {
        return (
            <ManagerLayout>
                <div className="error-container">
                    <i className="fa fa-users"></i>
                    <h3>Team Not Found</h3>
                    <p>The team you're looking for doesn't exist.</p>
                    <Link to="/manager/my-teams" className="btn-back">
                        <i className="fa fa-arrow-left"></i>
                        Back to My Teams
                    </Link>
                </div>
            </ManagerLayout>
        );
    }

    return (
        <ManagerLayout>
            <div className="team-manage-container">
                <div className="manage-wrapper">
                    {/* Header */}
                    <div className="page-header">
                        <Link to="/manager/my-teams" className="back-link">
                            <i className="fa fa-arrow-left"></i>
                            Back to Teams
                        </Link>
                        <div>
                            <h1 className="page-title">
                                <i className="fa fa-shield-alt"></i>
                                {team.name}
                            </h1>
                            <p className="page-subtitle">
                                Manage team members and details
                            </p>
                        </div>
                        <Link to={`/manager/team/${id}/edit`} className="edit-btn">
                            <i className="fa fa-edit"></i>
                            Edit Team
                        </Link>
                    </div>

                    {/* Team Info Card */}
                    <div className="info-card">
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
                                    <span className="info-value">{team.member_count || 0} / {team.max_members}</span>
                                </div>
                            </div>
                            <div className="info-item">
                                <i className="fa fa-trophy"></i>
                                <div>
                                    <span className="info-label">Wins</span>
                                    <span className="info-value">{team.wins || 0}</span>
                                </div>
                            </div>
                            <div className="info-item">
                                <i className="fa fa-calendar"></i>
                                <div>
                                    <span className="info-label">Created</span>
                                    <span className="info-value">
                                        {team.created_at
                                            ? new Date(team.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })
                                            : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {team.description && (
                            <div className="description-section">
                                <h3>Description</h3>
                                <p>{team.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Members Section */}
                    <div className="members-section">
                        <div className="section-header">
                            <h2>
                                <i className="fa fa-users"></i>
                                Team Members ({team.member_count || 0})
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
                                        <button 
                                            className="btn-remove"
                                            onClick={() => handleRemoveMember(member.player_id)}
                                        >
                                            <i className="fa fa-times"></i>
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-members">
                                <i className="fa fa-user-plus"></i>
                                <p>No members yet. Players can request to join your team!</p>
                            </div>
                        )}
                    </div>

                    {/* Join Requests Section */}
                    {team.join_requests && team.join_requests.filter(req => req.status === 'pending').length > 0 && (
                        <div className="requests-section">
                            <div className="section-header">
                                <h2>
                                    <i className="fa fa-user-clock"></i>
                                    Pending Join Requests
                                </h2>
                            </div>
                            <div className="requests-list">
                                {team.join_requests
                                    .filter(req => req.status === 'pending')
                                    .map(request => (
                                        <div key={request._id} className="request-card">
                                            <div className="request-info">
                                                <h4>New Join Request</h4>
                                                <p className="request-player">
                                                    Player: {request.player_name || request.player_email || 'Unknown'}
                                                </p>
                                                <p>Requested: {new Date(request.request_date).toLocaleDateString()}</p>
                                            </div>
                                            <div className="request-actions">
                                                <button 
                                                    className="btn-approve"
                                                    onClick={() => handleApproveRequest(request._id, request.player_id)}
                                                >
                                                    <i className="fa fa-check"></i>
                                                    Approve
                                                </button>
                                                <button 
                                                    className="btn-reject"
                                                    onClick={() => handleRejectRequest(request._id)}
                                                >
                                                    <i className="fa fa-times"></i>
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ManagerLayout>
    );
};

export default TeamManage;
