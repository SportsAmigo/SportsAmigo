import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, logoutUser } from '../../store/slices/authSlice';

const AdminLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const dispatch = useDispatch();

    const handleLogout = async () => {
        await dispatch(logoutUser()).unwrap();
        navigate('/');
    };

    const navItems = [
        { path: '/admin/dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard' },
        { path: '/admin/users', icon: 'fa-users-cog', label: 'User Management' },
        { path: '/admin/events', icon: 'fa-calendar-alt', label: 'Events' },
        { path: '/admin/teams', icon: 'fa-users', label: 'Teams' },
        { path: '/admin/analytics', icon: 'fa-chart-line', label: 'Analytics' },
        { path: '/admin/settings', icon: 'fa-cog', label: 'Settings' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-lg flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-gray-200">
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">S</span>
                        </div>
                        <span className="text-xl font-bold text-gray-800">SportsAmigo</span>
                    </Link>
                </div>

                {/* User Profile */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-4 border-gray-700 shadow-lg">
                            {user?.profile_image ? (
                                <img 
                                    src={`http://localhost:5000${user.profile_image}`} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                                    <i className="fas fa-user-shield text-3xl text-white"></i>
                                </div>
                            )}
                        </div>
                        <h3 className="font-bold text-gray-800 text-center">
                            {user?.first_name && user?.last_name 
                                ? `${user.first_name} ${user.last_name}`
                                : user?.name || 'Admin'
                            }
                        </h3>
                        <p className="text-sm text-gray-700 font-semibold uppercase tracking-wide">ADMINISTRATOR</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 overflow-y-auto">
                    <ul className="space-y-2">
                        {navItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                                        isActive(item.path)
                                            ? 'bg-gray-100 text-gray-900 font-semibold'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                >
                                    <i className={`fas ${item.icon} w-5`}></i>
                                    <span>{item.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 w-full"
                    >
                        <i className="fas fa-sign-out-alt w-5"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                {children}
            </div>
        </div>
    );
};

export default AdminLayout;

