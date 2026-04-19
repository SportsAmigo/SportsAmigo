import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, logoutUser } from '../../store/slices/authSlice';
import '../../pages/admin/AdminDashboard.css';

const AdminLayout = ({ children }) => {
    const SCROLL_KEY = 'adminSidebarScrollTop';
    const location = useLocation();
    const navigate = useNavigate();
    const sidebarRef = useRef(null);
    const user = useSelector(selectUser);
    const dispatch = useDispatch();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [userManagementOpen, setUserManagementOpen] = useState(false);

    const handleLogout = async () => {
        await dispatch(logoutUser()).unwrap();
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    const isUserManagementActive = () => {
        const userManagementPaths = ['/admin/users', '/admin/players', '/admin/managers', '/admin/organizers', '/admin/coordinators'];
        return userManagementPaths.some(p => location.pathname === p);
    };

    useEffect(() => {
        if (!userManagementOpen && isUserManagementActive()) {
            setUserManagementOpen(true);
        }
    }, [location.pathname]);

    useEffect(() => {
        const sidebarEl = sidebarRef.current;
        if (!sidebarEl) return;
        const savedScroll = Number(sessionStorage.getItem(SCROLL_KEY) || 0);
        if (!Number.isNaN(savedScroll)) {
            requestAnimationFrame(() => { sidebarEl.scrollTop = savedScroll; });
        }
    }, [location.pathname]);

    const handleSidebarScroll = (event) => {
        sessionStorage.setItem(SCROLL_KEY, String(event.currentTarget.scrollTop || 0));
    };

    const NavLink = ({ to, icon, label }) => (
        <Link to={to} className={`sidebar-nav-item ${isActive(to) ? 'active' : ''}`}>
            <i className={`fa ${icon}`}></i>
            {label}
        </Link>
    );

    return (
        <div className="admin-dashboard">
            <div className="admin-dashboard-content">
                {/* Sidebar */}
                <div ref={sidebarRef} onScroll={handleSidebarScroll} className={`admin-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
                    <div className="sidebar-header">
                        <Link to="/" className="sidebar-logo">
                            <div className="sidebar-logo-icon"><i className="fa fa-shield-alt"></i></div>
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
                            {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.email || 'Admin'}
                        </div>
                        <div className="sidebar-user-role">ADMIN</div>
                    </div>

                    <nav className="sidebar-nav">
                        <NavLink to="/admin/dashboard" icon="fa-tachometer-alt" label="Dashboard" />

                        {/* User Management Dropdown */}
                        <div className="sidebar-nav-dropdown">
                            <button onClick={() => setUserManagementOpen(!userManagementOpen)}
                                className={`sidebar-nav-dropdown-header ${isUserManagementActive() ? 'active' : ''}`}>
                                <div className="sidebar-nav-dropdown-icon">
                                    <i className="fa fa-users-cog"></i>
                                    <span>User Management</span>
                                </div>
                                <i className={`fa fa-chevron-down sidebar-nav-dropdown-arrow ${userManagementOpen ? 'open' : ''}`}></i>
                            </button>
                            <div className={`sidebar-nav-dropdown-content ${userManagementOpen ? 'open' : ''}`}>
                                {[
                                    { to: '/admin/users', icon: 'fa-users', label: 'All Users' },
                                    { to: '/admin/players', icon: 'fa-user-friends', label: 'Players' },
                                    { to: '/admin/managers', icon: 'fa-user-tie', label: 'Managers' },
                                    { to: '/admin/organizers', icon: 'fa-user-shield', label: 'Organizers' },
                                    { to: '/admin/coordinators', icon: 'fa-user-check', label: 'Coordinators' },
                                ].map(item => (
                                    <Link key={item.to} to={item.to} className={`sidebar-nav-dropdown-item ${isActive(item.to) ? 'active' : ''}`}>
                                        <i className={`fa ${item.icon}`}></i>
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <NavLink to="/admin/teams" icon="fa-users" label="Teams" />
                        <NavLink to="/admin/events" icon="fa-calendar-alt" label="Events" />
                        <NavLink to="/admin/matches" icon="fa-futbol" label="Matches" />

                        {/* Divider */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 16px' }}></div>

                        <NavLink to="/admin/financial" icon="fa-wallet" label="Financial Overview" />
                        <NavLink to="/admin/subscriptions" icon="fa-id-card" label="Subscriptions" />
                        <NavLink to="/admin/vas" icon="fa-gem" label="VAS Revenue" />
                        <NavLink to="/admin/commissions" icon="fa-hand-holding-usd" label="Commissions" />

                        {/* Divider */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 16px' }}></div>


                        <NavLink to="/admin/verification" icon="fa-clipboard-check" label="Verification Hub" />
                        <NavLink to="/admin/stats" icon="fa-chart-line" label="Statistics" />
                        <NavLink to="/admin/activity-logs" icon="fa-history" label="Activity Logs" />


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
