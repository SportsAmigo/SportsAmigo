import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, logoutUser } from '../../store/slices/authSlice';
import axios from 'axios';
import './ManagerDashboard.css';

const ManagerDashboard = () => {
    const user = useSelector(selectUser);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState({
        teamCount: 0,
        playerCount: 0,
        eventCount: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        registeredEvents: [],
        teams: []
    });
    const [matchHistory, setMatchHistory] = useState([]);
    const [upcomingMatches, setUpcomingMatches] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [loadingUpcoming, setLoadingUpcoming] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        fetchDashboardData();
        fetchMatchHistory();
        // Temporarily disabled until matches are scheduled
        // fetchUpcomingMatches();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/manager/dashboard', { withCredentials: true });
            if (response.data.success) {
                setDashboardData({
                    teamCount: response.data.teamCount || 0,
                    playerCount: response.data.playerCount || 0,
                    eventCount: response.data.eventCount || 0,
                    wins: response.data.wins || 0,
                    losses: response.data.losses || 0,
                    draws: response.data.draws || 0,
                    registeredEvents: response.data.registeredEvents || [],
                    teams: response.data.teams || []
                });
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    const fetchMatchHistory = async () => {
        try {
            setLoadingHistory(true);
            const response = await axios.get('http://localhost:5000/api/manager/dashboard', { withCredentials: true });
            if (response.data.success && response.data.teams && response.data.teams.length > 0) {
                // Fetch match history for the first team (or all teams)
                const teamId = response.data.teams[0]._id;
                const historyResponse = await axios.get(`http://localhost:5000/api/matches/team/${teamId}/history`, {
                    withCredentials: true
                });
                
                if (historyResponse.data.success) {
                    setMatchHistory(historyResponse.data.history.slice(0, 5)); // Show only last 5 matches
                }
            }
        } catch (error) {
            console.error('Error fetching match history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const fetchUpcomingMatches = async () => {
        try {
            setLoadingUpcoming(true);
            const response = await axios.get('http://localhost:5000/api/manager/dashboard', { withCredentials: true });
            if (response.data.success && response.data.teams && response.data.teams.length > 0) {
                // Fetch upcoming matches for all teams
                const allUpcoming = [];
                for (const team of response.data.teams) {
                    try {
                        const upcomingResponse = await axios.get(`http://localhost:5000/api/matches/team/${team._id}/upcoming`, {
                            withCredentials: true
                        });
                        
                        if (upcomingResponse.data.success && upcomingResponse.data.upcomingMatches) {
                            // Add team name to each match
                            const matchesWithTeam = upcomingResponse.data.upcomingMatches.map(match => ({
                                ...match,
                                teamName: team.name
                            }));
                            allUpcoming.push(...matchesWithTeam);
                        }
                    } catch (err) {
                        console.error(`Error fetching upcoming matches for team ${team._id}:`, err);
                    }
                }
                // Sort by date and take first 5
                allUpcoming.sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
                setUpcomingMatches(allUpcoming.slice(0, 5));
            }
        } catch (error) {
            console.error('Error fetching upcoming matches:', error);
        } finally {
            setLoadingUpcoming(false);
        }
    };

    const handleLogout = async () => {
        await dispatch(logoutUser()).unwrap();
        navigate('/');
    };

    return (
        <div className="manager-dashboard">
            <div className="manager-dashboard-content">
                {/* Sidebar */}
                <div className={`manager-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
                    <div className="sidebar-header">
                        <Link to="/" className="sidebar-logo">
                            <div className="sidebar-logo-icon">
                                <i className="fa fa-trophy"></i>
                            </div>
                            <span>SportsAmigo</span>
                        </Link>
                    </div>

                    <div className="sidebar-user-profile">
                        <div className="sidebar-user-avatar">
                            {user?.profile_image ? (
                                <img src={`http://localhost:5000${user.profile_image}`} alt="Profile" />
                            ) : (
                                <i className="fa fa-user"></i>
                            )}
                        </div>
                        <div className="sidebar-user-name">{user?.first_name || 'Manager'}</div>
                        <div className="sidebar-user-role">Team Manager</div>
                    </div>

                    <nav className="sidebar-nav">
                        <Link to="/manager/dashboard" className="sidebar-nav-item active">
                            <i className="fa fa-tachometer-alt"></i>
                            Dashboard
                        </Link>
                        <Link to="/manager/my-teams" className="sidebar-nav-item">
                            <i className="fa fa-users"></i>
                            My Teams
                        </Link>
                        <Link to="/manager/create-team" className="sidebar-nav-item">
                            <i className="fa fa-plus-circle"></i>
                            Create Team
                        </Link>
                        <Link to="/manager/browse-events" className="sidebar-nav-item">
                            <i className="fa fa-search"></i>
                            Browse Events
                        </Link>
                        <Link to="/manager/profile" className="sidebar-nav-item">
                            <i className="fa fa-user"></i>
                            Profile
                        </Link>
                    </nav>

                    <div className="sidebar-footer">
                        <button onClick={handleLogout} className="sidebar-logout-btn">
                            <i className="fa fa-sign-out-alt"></i>
                            Logout
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className={`manager-main-content ${sidebarOpen ? '' : 'expanded'}`}>
                    {/* Sidebar Toggle Button */}
                    <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <i className={`fa fa-${sidebarOpen ? 'times' : 'bars'}`}></i>
                    </button>
                    
                    {/* Header Section with Overlay */}
                    <div className="dashboard-header-section">
                        <div className="dashboard-welcome-card">
                            <div className="welcome-text">
                                <h1>Welcome back, {user?.first_name || 'Manager'}!</h1>
                                <p>Manage your teams and compete in exciting events</p>
                            </div>
                            <Link to="/manager/create-team" className="create-team-btn">
                                <i className="fa fa-plus-circle"></i>
                                Create New Team
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
                            <Link to="/manager/my-teams" className="stat-link">
                                Manage teams <i className="fa fa-arrow-right"></i>
                            </Link>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card-content">
                                <div className="stat-icon green">
                                    <i className="fa fa-trophy"></i>
                                </div>
                                <div className="stat-info">
                                    <div className="stat-label">Wins</div>
                                    <div className="stat-value">{dashboardData.wins}</div>
                                </div>
                            </div>
                            <div className="stat-link" style={{cursor: 'default'}}>
                                Total victories
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card-content">
                                <div className="stat-icon red">
                                    <i className="fa fa-times-circle"></i>
                                </div>
                                <div className="stat-info">
                                    <div className="stat-label">Losses</div>
                                    <div className="stat-value">{dashboardData.losses}</div>
                                </div>
                            </div>
                            <div className="stat-link" style={{cursor: 'default'}}>
                                Total defeats
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card-content">
                                <div className="stat-icon yellow">
                                    <i className="fa fa-handshake"></i>
                                </div>
                                <div className="stat-info">
                                    <div className="stat-label">Draws</div>
                                    <div className="stat-value">{dashboardData.draws}</div>
                                </div>
                            </div>
                            <div className="stat-link" style={{cursor: 'default'}}>
                                Tied matches
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card-content">
                                <div className="stat-icon purple">
                                    <i className="fa fa-calendar-check"></i>
                                </div>
                                <div className="stat-info">
                                    <div className="stat-label">Registered Events</div>
                                    <div className="stat-value">{dashboardData.eventCount}</div>
                                </div>
                            </div>
                            <Link to="/manager/browse-events" className="stat-link">
                                Browse events <i className="fa fa-arrow-right"></i>
                            </Link>
                        </div>
                    </div>

                    {/* Upcoming Matches Section */}
                    {upcomingMatches && upcomingMatches.length > 0 && (
                        <div className="upcoming-matches-section">
                            <div className="section-header">
                                <h2><i className="fa fa-calendar-check"></i> Upcoming Matches</h2>
                            </div>
                            <div className="upcoming-matches-list">
                                {loadingUpcoming ? (
                                    <div className="loading-history">Loading upcoming matches...</div>
                                ) : (
                                    upcomingMatches.map((match, index) => (
                                        <div key={index} className="upcoming-match-card">
                                            <div className="match-date-badge">
                                                <div className="date-day">
                                                    {new Date(match.match_date).toLocaleDateString('en-US', { day: 'numeric' })}
                                                </div>
                                                <div className="date-month">
                                                    {new Date(match.match_date).toLocaleDateString('en-US', { month: 'short' })}
                                                </div>
                                            </div>
                                            <div className="match-details-upcoming">
                                                <div className="match-teams-info">
                                                    <div className="team-vs-info">
                                                        <span className="your-team">{match.teamName}</span>
                                                        <span className="vs-text">vs</span>
                                                        <span className="opponent-team">{match.opponent}</span>
                                                    </div>
                                                    <div className="match-meta">
                                                        <span className="match-event">
                                                            <i className="fa fa-trophy"></i> {match.event}
                                                        </span>
                                                        {match.venue && match.venue !== 'TBA' && (
                                                            <span className="match-venue">
                                                                <i className="fa fa-map-marker-alt"></i> {match.venue}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="match-time">
                                                    <i className="fa fa-clock"></i>
                                                    {new Date(match.match_date).toLocaleTimeString('en-US', { 
                                                        hour: '2-digit', 
                                                        minute: '2-digit' 
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Match History Section */}
                    {matchHistory && matchHistory.length > 0 && (
                        <div className="match-history-section">
                            <div className="section-header">
                                <h2><i className="fa fa-history"></i> Recent Match History</h2>
                            </div>
                            <div className="match-history-list">
                                {loadingHistory ? (
                                    <div className="loading-history">Loading match history...</div>
                                ) : (
                                    matchHistory.map((match, index) => (
                                        <div key={index} className="match-history-item">
                                            <div className="match-result-badge">
                                                <span className={`result-${match.result.toLowerCase()}`}>
                                                    {match.result}
                                                </span>
                                            </div>
                                            <div className="match-opponent">
                                                <strong>vs {match.opponent}</strong>
                                            </div>
                                            <div className="match-score">{match.score}</div>
                                            <div className="match-date-small">
                                                {new Date(match.date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Teams Section */}
                    {dashboardData.teams && dashboardData.teams.length > 0 ? (
                        <div className="teams-section">
                            <div className="section-header">
                                <h2><i className="fa fa-users"></i> My Teams</h2>
                                <Link to="/manager/my-teams" className="view-all-link">View all</Link>
                            </div>
                            <div className="teams-list">
                                {dashboardData.teams.map((team) => (
                                    <div key={team._id} className="team-item">
                                        <div className="team-icon">
                                            <i className="fa fa-users"></i>
                                        </div>
                                        <div className="team-details">
                                            <h3>{team.name}</h3>
                                            <p>{team.sport_type} • {team.members?.length || 0} players</p>
                                        </div>
                                        <div className="team-actions">
                                            <Link to="/manager/my-teams" className="team-action-btn">
                                                Manage
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
                            <p>Create your first team to start competing in events</p>
                            <Link to="/manager/create-team" className="create-first-team-btn">
                                <i className="fa fa-plus-circle"></i>
                                Create Your First Team
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
