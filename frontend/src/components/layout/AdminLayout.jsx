import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, logoutUser } from '../../store/slices/authSlice';
import '../../pages/admin/AdminDashboard.css';

const AdminLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const dispatch = useDispatch();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [userManagementOpen, setUserManagementOpen] = useState(false);

    const handleLogout = async () => {
        await dispatch(logoutUser()).unwrap();
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;
    
    // Check if any user management route is active
    const isUserManagementActive = () => {
        const userManagementPaths = ['/admin/users', '/admin/players', '/admin/managers', '/admin/organizers'];
        return userManagementPaths.includes(location.pathname);
    };

    return (
        <div className="admin-dashboard">
            <div className="admin-dashboard-content">
                {/* Sidebar */}
                <div className={`admin-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
                    <div className="sidebar-header">
                        <Link to="/" className="sidebar-logo">
                            <div className="sidebar-logo-icon">
                                <i className="fa fa-shield-alt"></i>
                            </div>
                            <span>SportsAmigo</span>
                        </Link>
                    </div>

                    <div className="sidebar-user-profile">
                        <div className="sidebar-user-avatar">
                            {user?.profile_image ? (
                                <img 
                                    src={user.profile_image.startsWith('http') ? user.profile_image : `http://localhost:5000${user.profile_image}`} 
                                    alt="Profile"
                                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                />
                            ) : null}
                            <i className="fa fa-user" style={{ display: user?.profile_image ? 'none' : 'flex' }}></i>
                        </div>
                        <div className="sidebar-user-name">
                            {user?.first_name && user?.last_name 
                                ? `${user.first_name} ${user.last_name}`
                                : user?.email || 'Admin'
                            }
                        </div>
                        <div className="sidebar-user-role">ADMIN</div>
                    </div>

                    <nav className="sidebar-nav">
                        <Link 
                            to="/admin/dashboard" 
                            className={`sidebar-nav-item ${isActive('/admin/dashboard') ? 'active' : ''}`}
                        >
                            <i className="fa fa-tachometer-alt"></i>
                            Dashboard
                        </Link>

                        {/* User Management Dropdown */}
                        <div className="sidebar-nav-dropdown">
                            <button 
                                onClick={() => setUserManagementOpen(!userManagementOpen)}
                                className={`sidebar-nav-dropdown-header ${isUserManagementActive() ? 'active' : ''}`}
                            >
                                <div className="sidebar-nav-dropdown-icon">
                                    <i className="fa fa-users-cog"></i>
                                    <span>User Management</span>
                                </div>
                                <i className={`fa fa-chevron-down sidebar-nav-dropdown-arrow ${userManagementOpen ? 'open' : ''}`}></i>
                            </button>
                            <div className={`sidebar-nav-dropdown-content ${userManagementOpen ? 'open' : ''}`}>
                                <Link 
                                    to="/admin/users" 
                                    className={`sidebar-nav-dropdown-item ${isActive('/admin/users') ? 'active' : ''}`}
                                >
                                    <i className="fa fa-users"></i>
                                    All Users
                                </Link>
                                <Link 
                                    to="/admin/players" 
                                    className={`sidebar-nav-dropdown-item ${isActive('/admin/players') ? 'active' : ''}`}
                                >
                                    <i className="fa fa-user-friends"></i>
                                    Players
                                </Link>
                                <Link 
                                    to="/admin/managers" 
                                    className={`sidebar-nav-dropdown-item ${isActive('/admin/managers') ? 'active' : ''}`}
                                >
                                    <i className="fa fa-user-tie"></i>
                                    Managers
                                </Link>
                                <Link 
                                    to="/admin/organizers" 
                                    className={`sidebar-nav-dropdown-item ${isActive('/admin/organizers') ? 'active' : ''}`}
                                >
                                    <i className="fa fa-user-shield"></i>
                                    Organizers
                                </Link>
                            </div>
                        </div>

                        <Link 
                            to="/admin/teams" 
                            className={`sidebar-nav-item ${isActive('/admin/teams') ? 'active' : ''}`}
                        >
                            <i className="fa fa-users"></i>
                            Teams
                        </Link>
                        <Link 
                            to="/admin/events" 
                            className={`sidebar-nav-item ${isActive('/admin/events') ? 'active' : ''}`}
                        >
                            <i className="fa fa-calendar-alt"></i>
                            Events
                        </Link>
                        <Link 
                            to="/admin/matches" 
                            className={`sidebar-nav-item ${isActive('/admin/matches') ? 'active' : ''}`}
                        >
                            <i className="fa fa-futbol"></i>
                            Matches
                        </Link>
                        <Link 
                            to="/admin/stats" 
                            className={`sidebar-nav-item ${isActive('/admin/stats') ? 'active' : ''}`}
                        >
                            <i className="fa fa-chart-line"></i>
                            Statistics
                        </Link>
                        <Link 
                            to="/admin/activity-logs" 
                            className={`sidebar-nav-item ${isActive('/admin/activity-logs') ? 'active' : ''}`}
                        >
                            <i className="fa fa-history"></i>
                            Activity Logs
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
                <div className={`admin-main-content ${sidebarOpen ? '' : 'expanded'}`}>
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

export default AdminLayout;

