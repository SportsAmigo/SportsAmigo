import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, logoutUser } from '../../store/slices/authSlice';
import '../../pages/coordinator/CoordinatorDashboard.css';

const CoordinatorLayout = ({ children }) => {
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
        <div className="coordinator-dashboard">
            <div className="coordinator-dashboard-content">
                {/* Sidebar */}
                <div className={`coordinator-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
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
                                : user?.email || 'Coordinator'
                            }
                        </div>
                        <div className="sidebar-user-role">COORDINATOR</div>
                    </div>

                    <nav className="sidebar-nav">
                        <Link
                            to="/coordinator/dashboard"
                            className={`sidebar-nav-item ${isActive('/coordinator/dashboard') ? 'active' : ''}`}
                        >
                            <i className="fa fa-tachometer-alt"></i>
                            Dashboard
                        </Link>
                        <Link
                            to="/coordinator/pending-organizers"
                            className={`sidebar-nav-item ${isActive('/coordinator/pending-organizers') ? 'active' : ''}`}
                        >
                            <i className="fa fa-user-clock"></i>
                            Pending Organizers
                        </Link>
                        <Link
                            to="/coordinator/pending-events"
                            className={`sidebar-nav-item ${isActive('/coordinator/pending-events') ? 'active' : ''}`}
                        >
                            <i className="fa fa-calendar-check"></i>
                            Pending Events
                        </Link>
                        <Link
                            to="/coordinator/approved-organizers"
                            className={`sidebar-nav-item ${isActive('/coordinator/approved-organizers') ? 'active' : ''}`}
                        >
                            <i className="fa fa-user-check"></i>
                            Approved Organizers
                        </Link>
                        <Link
                            to="/coordinator/approved-events"
                            className={`sidebar-nav-item ${isActive('/coordinator/approved-events') ? 'active' : ''}`}
                        >
                            <i className="fa fa-calendar-alt"></i>
                            Approved Events
                        </Link>
                        <Link
                            to="/coordinator/rejected"
                            className={`sidebar-nav-item ${isActive('/coordinator/rejected') ? 'active' : ''}`}
                        >
                            <i className="fa fa-times-circle"></i>
                            Rejected
                        </Link>
                        <Link
                            to="/coordinator/activity-log"
                            className={`sidebar-nav-item ${isActive('/coordinator/activity-log') ? 'active' : ''}`}
                        >
                            <i className="fa fa-history"></i>
                            Activity Log
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
                <div className={`coordinator-main-content ${sidebarOpen ? '' : 'expanded'}`}>
                    <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <i className={`fa fa-${sidebarOpen ? 'times' : 'bars'}`}></i>
                    </button>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default CoordinatorLayout;
