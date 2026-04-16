import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, logoutUser } from '../../store/slices/authSlice';
import '../../pages/manager/ManagerDashboard.css';
import { API_BASE_URL } from '../../utils/constants';

const ManagerLayout = ({ children }) => {
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
        <div className="manager-dashboard">
            <div className="manager-dashboard-content">
                {/* Sidebar - Same as Dashboard */}
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
                        <div className="sidebar-user-name">
                            {user?.first_name && user?.last_name 
                                ? `${user.first_name} ${user.last_name}`
                                : user?.first_name || 'Manager'
                            }
                        </div>
                        <div className="sidebar-user-role">Team Manager</div>
                    </div>

                    <nav className="sidebar-nav">
                        <Link 
                            to="/manager/dashboard" 
                            className={`sidebar-nav-item ${isActive('/manager/dashboard') ? 'active' : ''}`}
                        >
                            <i className="fa fa-tachometer-alt"></i>
                            Dashboard
                        </Link>
                        <Link 
                            to="/manager/my-teams" 
                            className={`sidebar-nav-item ${isActive('/manager/my-teams') ? 'active' : ''}`}
                        >
                            <i className="fa fa-users"></i>
                            My Teams
                        </Link>
                        <Link 
                            to="/manager/create-team" 
                            className={`sidebar-nav-item ${isActive('/manager/create-team') ? 'active' : ''}`}
                        >
                            <i className="fa fa-plus-circle"></i>
                            Create Team
                        </Link>
                        <Link 
                            to="/manager/browse-events" 
                            className={`sidebar-nav-item ${isActive('/manager/browse-events') ? 'active' : ''}`}
                        >
                            <i className="fa fa-search"></i>
                            Browse Events
                        </Link>
                        <Link 
                            to="/manager/my-events" 
                            className={`sidebar-nav-item ${isActive('/manager/my-events') ? 'active' : ''}`}
                        >
                            <i className="fa fa-calendar-alt"></i>
                            My Events
                        </Link>
                        <Link 
                            to="/manager/profile" 
                            className={`sidebar-nav-item ${isActive('/manager/profile') ? 'active' : ''}`}
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
                <div className={`manager-main-content ${sidebarOpen ? '' : 'expanded'}`}>
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

export default ManagerLayout;

