import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, logoutUser } from '../../store/slices/authSlice';
import '../../pages/player/Dashboard.css';

const PlayerLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const dispatch = useDispatch();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = async () => {
        await dispatch(logoutUser()).unwrap();
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className="player-dashboard">
            <div className="dashboard-content">
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
                        <div className="sidebar-user-name">
                            {user?.first_name && user?.last_name 
                                ? `${user.first_name} ${user.last_name}`
                                : user?.first_name || 'Player'
                            }
                        </div>
                        <div className="sidebar-user-role">Player</div>
                    </div>

                    <nav className="sidebar-nav">
                        <Link 
                            to="/player/dashboard" 
                            className={`sidebar-nav-item ${isActive('/player/dashboard') ? 'active' : ''}`}
                        >
                            <i className="fa fa-tachometer-alt"></i>
                            Dashboard
                        </Link>
                        <Link 
                            to="/player/browse-teams" 
                            className={`sidebar-nav-item ${isActive('/player/browse-teams') ? 'active' : ''}`}
                        >
                            <i className="fa fa-search"></i>
                            Browse Teams
                        </Link>
                        <Link 
                            to="/player/my-teams" 
                            className={`sidebar-nav-item ${isActive('/player/my-teams') ? 'active' : ''}`}
                        >
                            <i className="fa fa-users"></i>
                            My Teams
                        </Link>
                        <Link 
                            to="/player/events" 
                            className={`sidebar-nav-item ${isActive('/player/events') ? 'active' : ''}`}
                        >
                            <i className="fa fa-calendar-alt"></i>
                            Browse Events
                        </Link>
                        <Link 
                            to="/player/my-events" 
                            className={`sidebar-nav-item ${isActive('/player/my-events') ? 'active' : ''}`}
                        >
                            <i className="fa fa-calendar-check"></i>
                            My Events
                        </Link>
                        <Link 
                            to="/player/my-matches" 
                            className={`sidebar-nav-item ${isActive('/player/my-matches') ? 'active' : ''}`}
                        >
                            <i className="fa fa-futbol"></i>
                            My Matches
                        </Link>
                        <Link 
                            to="/player/stats" 
                            className={`sidebar-nav-item ${isActive('/player/stats') ? 'active' : ''}`}
                        >
                            <i className="fa fa-chart-bar"></i>
                            Statistics
                        </Link>
                        <Link 
                            to="/wallet" 
                            className={`sidebar-nav-item ${isActive('/wallet') ? 'active' : ''}`}
                        >
                            <i className="fa fa-wallet"></i>
                            Wallet
                        </Link>
                        <Link 
                            to="/player/profile" 
                            className={`sidebar-nav-item ${isActive('/player/profile') ? 'active' : ''}`}
                        >
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
                <div className={`player-main-content ${sidebarOpen ? '' : 'expanded'}`}>
                    {/* Sidebar Toggle Button */}
                    <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <i className={`fa fa-${sidebarOpen ? 'times' : 'bars'}`}></i>
                    </button>
                    
                    {children}
                </div>
            </div>
        </div>
    );
};

export default PlayerLayout;

