import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, logoutUser } from '../../store/slices/authSlice';
import PlayerLayout from '../../components/layout/PlayerLayout';
import axios from 'axios';
import './Dashboard.css';

const PlayerDashboard = () => {
    const user = useSelector(selectUser);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState({
        teamCount: 0,
        eventCount: 0,
        upcomingEvents: [],
        teams: []
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/player/dashboard', { withCredentials: true });
            if (response.data.success) {
                setDashboardData({
                    teamCount: response.data.teamCount || 0,
                    eventCount: response.data.eventCount || 0,
                    upcomingEvents: response.data.upcomingEvents || [],
                    teams: response.data.teams || []
                });
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await dispatch(logoutUser()).unwrap();
        navigate('/');
    };

    return (
        <PlayerLayout>
            <div className="dashboard-page-wrapper">
                {/* Header Section with Overlay */}
                <div className="dashboard-header-section">
                    <div className="dashboard-welcome-card">
                        <div className="welcome-text">
                            <h1>Welcome back, {user?.first_name || 'Player'}!</h1>
                            <p>Track your teams and participate in exciting events</p>
                        </div>
                        <Link to="/player/browse-teams" className="create-team-btn">
                            <i className="fa fa-user-plus"></i>
                            Join a Team
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-card-content">
                                <div className="stat-icon blue">
                                    <i className="fa fa-users"></i>
                                </div>
                                <div className="stat-info">
                                    <div className="stat-label">My Teams</div>
                                    <div className="stat-value">{dashboardData.teamCount}</div>
                                </div>
                            </div>
                            <Link to="/player/my-teams" className="stat-link">
                                View teams <i className="fa fa-arrow-right"></i>
                            </Link>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card-content">
                                <div className="stat-icon green">
                                    <i className="fa fa-calendar-alt"></i>
                                </div>
                                <div className="stat-info">
                                    <div className="stat-label">My Events</div>
                                    <div className="stat-value">{dashboardData.eventCount}</div>
                                </div>
                            </div>
                            <Link to="/player/my-events" className="stat-link">
                                View events <i className="fa fa-arrow-right"></i>
                            </Link>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card-content">
                                <div className="stat-icon yellow">
                                    <i className="fa fa-futbol"></i>
                                </div>
                                <div className="stat-info">
                                    <div className="stat-label">My Matches</div>
                                    <div className="stat-value">--</div>
                                </div>
                            </div>
                            <Link to="/player/my-matches" className="stat-link">
                                View matches <i className="fa fa-arrow-right"></i>
                            </Link>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card-content">
                                <div className="stat-icon purple">
                                    <i className="fa fa-chart-bar"></i>
                                </div>
                                <div className="stat-info">
                                    <div className="stat-label">Statistics</div>
                                    <div className="stat-value">--</div>
                                </div>
                            </div>
                            <Link to="/player/stats" className="stat-link">
                                View stats <i className="fa fa-arrow-right"></i>
                            </Link>
                        </div>
                    </div>

                    {/* Teams Section */}
                    {dashboardData.teams && dashboardData.teams.length > 0 ? (
                        <div className="teams-section">
                            <div className="section-header">
                                <h2><i className="fa fa-users"></i> My Teams</h2>
                                <Link to="/player/my-teams" className="view-all-link">View all</Link>
                            </div>
                            <div className="teams-list">
                                {dashboardData.teams.map((team) => (
                                    <div key={team._id} className="team-item">
                                        <div className="team-icon">
                                            <i className="fa fa-users"></i>
                                        </div>
                                        <div className="team-details">
                                            <h3>{team.name}</h3>
                                            <p>{team.sport_type} • {team.current_members || 0} players</p>
                                        </div>
                                        <div className="team-actions">
                                            <Link to={`/player/team/${team._id}`} className="team-action-btn">
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="no-teams-section">
                            <i className="fa fa-users"></i>
                            <h3>No Teams Yet</h3>
                            <p>Join a team to start competing in events</p>
                            <Link to="/player/browse-teams" className="create-first-team-btn">
                                <i className="fa fa-search"></i>
                                Browse Teams
                            </Link>
                        </div>
                    )}
            </div>
        </PlayerLayout>
    );
};

export default PlayerDashboard;
