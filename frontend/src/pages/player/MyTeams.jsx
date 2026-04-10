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
                console.log('MyTeams - Fetched teams:', response.data.teams);
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
                    <div className="my-teams-grid">
                        {teams.map(team => (
                            <div key={team.id} className="my-team-card">
                                <div className="my-team-card-header">
                                    <div className="team-header-content">
                                        <div className="team-title">
                                            <h3>{team.name}</h3>
                                            <span className="sport-badge">{team.sport}</span>
                                        </div>
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
                                                <span>{team.current_members} / {team.members}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="team-progress-section">
                                        <div className="team-progress">
                                            <div 
                                                className="team-progress-fill" 
                                                style={{ width: `${Math.min(100, (team.current_members / team.members) * 100)}%` }}
                                            ></div>
                                        </div>
                                        <span className="progress-text">
                                            {team.current_members} / {team.members} Players
                                        </span>
                                    </div>
                                    
                                    <div className="team-actions">
                                        <Link to={`/player/team/${team.id}`} className="team-view-btn">
                                            <i className="fa fa-info-circle"></i> View Details
                                        </Link>
                                        <button 
                                            onClick={() => handleLeaveTeam(team.id)} 
                                            className="leave-team-btn"
                                        >
                                            <i className="fa fa-sign-out"></i> Leave
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
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
