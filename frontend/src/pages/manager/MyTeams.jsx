import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import ManagerLayout from '../../components/layout/ManagerLayout';
import axios from 'axios';
import './MyTeams.css';

const MyTeams = () => {
    const user = useSelector(selectUser);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/manager/my-teams', { withCredentials: true });
            if (response.data.success) {
                setTeams(response.data.teams || []);
            }
        } catch (error) {
            console.error('Error fetching teams:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTeam = async (teamId) => {
        if (!window.confirm('Are you sure you want to delete this team?')) {
            return;
        }

        try {
            const response = await axios.delete(`http://localhost:5000/api/manager/team/${teamId}`, { withCredentials: true });
            if (response.data.success) {
                setTeams(teams.filter(team => team._id !== teamId));
                alert('Team deleted successfully!');
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Error deleting team');
        }
    };

    return (
        <ManagerLayout>
            <div className="teams-wrapper">
                {/* Header */}
                <div className="page-header">
                        <div className="header-content">
                            <h1 className="page-title">
                                <i className="fa fa-users"></i>
                                My Teams
                            </h1>
                            <p className="page-subtitle">
                                You have {teams.length} team{teams.length !== 1 ? 's' : ''} • Manage and track performance
                            </p>
                        </div>
                        <Link to="/manager/create-team" className="create-btn">
                            <i className="fa fa-plus-circle"></i>
                            <span>Create New Team</span>
                        </Link>
                    </div>

                    {/* Teams List */}
                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <p>Loading teams...</p>
                        </div>
                    ) : teams.length > 0 ? (
                        <div className="teams-grid">
                            {teams.map(team => (
                                <div key={team._id} className="team-card">
                                    <div className="team-header">
                                        <div className="team-icon">
                                            <i className="fa fa-shield-alt"></i>
                                        </div>
                                        <span className="team-sport-badge">{team.sport_type}</span>
                                    </div>

                                    <h3 className="team-name">{team.name}</h3>

                                    <div className="team-stats">
                                        <div className="stat">
                                            <i className="fa fa-users"></i>
                                            <div>
                                                <span className="stat-value">{team.current_members || 0}/{team.max_members}</span>
                                                <span className="stat-label">Members</span>
                                            </div>
                                        </div>
                                        <div className="stat">
                                            <i className="fa fa-calendar-alt"></i>
                                            <div>
                                                <span className="stat-value">{team.events_participated || 0}</span>
                                                <span className="stat-label">Events</span>
                                            </div>
                                        </div>
                                        <div className="stat">
                                            <i className="fa fa-trophy"></i>
                                            <div>
                                                <span className="stat-value">{team.wins || 0}</span>
                                                <span className="stat-label">Wins</span>
                                            </div>
                                        </div>
                                    </div>

                                    {team.description && (
                                        <p className="team-description">{team.description}</p>
                                    )}

                                    <div className="team-actions">
                                        <Link 
                                            to={`/manager/team/${team._id}/manage`}
                                            className="btn-view"
                                            style={{ textDecoration: 'none' }}
                                        >
                                            <i className="fa fa-eye"></i>
                                            View
                                        </Link>
                                        <Link 
                                            to={`/manager/team/${team._id}/edit`}
                                            className="btn-edit"
                                            style={{ textDecoration: 'none' }}
                                        >
                                            <i className="fa fa-edit"></i>
                                            Edit
                                        </Link>
                                        <button 
                                            className="btn-delete"
                                            onClick={() => handleDeleteTeam(team._id)}
                                        >
                                            <i className="fa fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <i className="fa fa-users empty-icon"></i>
                            <h3>No teams yet</h3>
                            <p>Create your first team and start competing in events!</p>
                            <Link to="/manager/create-team" className="btn-create">
                                <i className="fa fa-plus-circle"></i>
                                Create Your First Team
                            </Link>
                        </div>
                    )}
                </div>
        </ManagerLayout>
    );
};

export default MyTeams;

