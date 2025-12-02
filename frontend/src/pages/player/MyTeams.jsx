import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import PlayerLayout from '../../components/layout/PlayerLayout';
import axios from 'axios';
import './MyTeams.css';

const MyTeams = () => {
    const user = useSelector(selectUser);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyTeams();
    }, []);

    const fetchMyTeams = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/player/my-teams', { withCredentials: true });
            if (response.data.success) {
                setTeams(response.data.teams);
            }
        } catch (error) {
            console.error('Error fetching teams:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveTeam = async (teamId) => {
        if (!window.confirm('Are you sure you want to leave this team?')) return;
        
        try {
            const response = await axios.post(`http://localhost:5000/api/player/teams/leave/${teamId}`, {}, { withCredentials: true });
            if (response.data.success) {
                alert('Left team successfully');
                fetchMyTeams();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Error leaving team');
        }
    };

    return (
        <PlayerLayout>
            <div className="browse-wrapper">
                <div className="my-teams-header">
                    <div className="my-teams-header-content">
                        <div className="header-title-section">
                            <h1><i className="fa fa-users"></i> My Teams</h1>
                            <p>Teams you're currently a member of</p>
                        </div>
                        <Link to="/player/browse-teams" className="header-action-btn">
                            <i className="fa fa-search"></i> Browse Teams
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p className="loading-text">Loading teams...</p>
                    </div>
                ) : teams && teams.length > 0 ? (
                    teams.map(team => (
                        <div key={team.id} className="my-team-card">
                            <div className="my-team-card-header">
                                <div className="team-header-content">
                                    <div className="team-title">
                                        <h3>{team.name}</h3>
                                        <span className="sport-badge">{team.sport}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleLeaveTeam(team.id)} 
                                        className="leave-team-btn"
                                    >
                                        <i className="fa fa-sign-out"></i> Leave Team
                                    </button>
                                </div>
                            </div>
                            <div className="my-team-card-body">
                                <div className="team-info-row">
                                    <div className="team-info-section">
                                        <div className="info-item">
                                            <strong>Manager:</strong>
                                            <span>{team.manager_name || team.manager_email}</span>
                                        </div>
                                        <div className="info-item">
                                            <strong>Members:</strong>
                                            <span>{team.current_members} of {team.members}</span>
                                        </div>
                                    </div>
                                    <div className="team-progress-section">
                                        <div className="team-progress">
                                            <div 
                                                className="team-progress-fill" 
                                                style={{ width: `${Math.min(100, (team.current_members / team.members) * 100)}%` }}
                                            >
                                                <span className="progress-text">
                                                    {team.current_members} / {team.members} Players
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="team-members-section">
                                    <h5 className="section-title">
                                        <i className="fa fa-users"></i> Team Members
                                    </h5>
                                    
                                    <div className="table-container">
                                        <table className="team-members-table">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Join Date</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {team.team_members && team.team_members.length > 0 ? (
                                                    team.team_members.map((member, idx) => (
                                                        <tr key={idx}>
                                                            <td>
                                                                {member.first_name} {member.last_name}
                                                                {user?.id === member.player_id && (
                                                                    <span className="you-badge">You</span>
                                                                )}
                                                            </td>
                                                            <td>{member.email}</td>
                                                            <td>{new Date(member.joined_date).toLocaleDateString()}</td>
                                                            <td>
                                                                <span className={`member-status-badge ${member.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                                                                    {member.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="4" className="no-members-msg">
                                                            No team members information available
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <i className="fa fa-users"></i>
                        </div>
                        <h3>No Teams Yet</h3>
                        <p>You're not part of any teams yet. Browse teams to find one to join!</p>
                        <Link to="/player/browse-teams" className="empty-state-btn">
                            <i className="fa fa-search"></i> Browse Available Teams
                        </Link>
                    </div>
                )}
            </div>
        </PlayerLayout>
    );
};

export default MyTeams;
