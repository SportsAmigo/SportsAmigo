import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, logoutUser } from '../../store/slices/authSlice';
import axios from 'axios';
import './PlayerDashboard.css';

const PlayerDashboard = () => {
    const user = useSelector(selectUser);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalEvents: 0,
        activeTeams: 0,
        achievements: 0,
        performance: 85
    });
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // TODO: Implement API calls to fetch actual player data
            setStats({
                totalEvents: 0,
                activeTeams: 0,
                achievements: 0,
                performance: 85
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    const handleLogout = async () => {
        await dispatch(logoutUser()).unwrap();
        navigate('/');
    };

    return (
        <div className="player-dashboard">
            <div className="player-dashboard-content">
                {/* Sidebar */}
                <div className={`player-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
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
                        <div className="sidebar-user-name">{user?.first_name || user?.name || '222 Nor'}</div>
                        <div className="sidebar-user-role">PLAYER</div>
                    </div>

                    <nav className="sidebar-nav">
                        <Link to="/player/dashboard" className="sidebar-nav-item active">
                            <i className="fa fa-tachometer-alt"></i>
                            Dashboard
                        </Link>
                        <Link to="/player/my-events" className="sidebar-nav-item">
                            <i className="fa fa-calendar-alt"></i>
                            My Events
                        </Link>
                        <Link to="/player/my-teams" className="sidebar-nav-item">
                            <i className="fa fa-users"></i>
                            My Teams
                        </Link>
                        <Link to="/player/events" className="sidebar-nav-item">
                            <i className="fa fa-search"></i>
                            Browse Events
                        </Link>
                        <Link to="/player/browse-teams" className="sidebar-nav-item">
                            <i className="fa fa-user-friends"></i>
                            Browse Teams
                        </Link>
                        <Link to="/player/profile" className="sidebar-nav-item">
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
                <div className="main-content">
                    {/* Stats Cards */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon-container" style={{ backgroundColor: '#EF4444' }}>
                                <i className="fa fa-calendar-check"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-label">MY EVENTS</div>
                                <div className="stat-value">{stats.totalEvents}</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-container" style={{ backgroundColor: '#10B981' }}>
                                <i className="fa fa-users"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-label">MY TEAMS</div>
                                <div className="stat-value">{stats.activeTeams}</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-container" style={{ backgroundColor: '#06B6D4' }}>
                                <i className="fa fa-trophy"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-label">ACHIEVEMENTS</div>
                                <div className="stat-value">{stats.achievements}</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon-container" style={{ backgroundColor: '#F59E0B' }}>
                                <i className="fa fa-chart-line"></i>
                            </div>
                            <div className="stat-info">
                                <div className="stat-label">PERFORMANCE</div>
                                <div className="stat-value">{stats.performance}%</div>
                            </div>
                        </div>
                    </div>

                    {/* Welcome Section */}
                    <div className="welcome-section">
                        <h2 className="welcome-title">Welcome back, {user?.first_name || user?.name || '222'}!</h2>
                        <p className="welcome-subtitle">
                            You don't have any upcoming events. Browse available events or join a team to participate!
                        </p>
                        <div className="welcome-actions">
                            <Link to="/player/events" className="btn-primary">
                                Browse Events
                            </Link>
                            <Link to="/player/browse-teams" className="btn-secondary">
                                Join a Team
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerDashboard;
