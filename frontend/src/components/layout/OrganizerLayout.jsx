import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, logoutUser } from '../../store/slices/authSlice';
import { FaCrown, FaStar } from 'react-icons/fa';

const PLAN_BADGE = {
    pro: {
        label: 'PRO',
        icon: <FaCrown style={{ fontSize: '0.75rem', color: '#F59E0B' }} />,
        sectionBg: '#fffbeb',
        sectionBorder: '2px solid #F59E0B',
        avatarRing: '0 0 0 3px #F59E0B',
        bannerBg: 'linear-gradient(90deg, #D97706, #F59E0B)',
        bannerText: '#fff',
        nameColor: '#92400E',
    },
    enterprise: {
        label: 'ENTERPRISE',
        icon: <FaStar style={{ fontSize: '0.75rem', color: '#8B5CF6' }} />,
        sectionBg: '#f5f3ff',
        sectionBorder: '2px solid #8B5CF6',
        avatarRing: '0 0 0 3px #8B5CF6',
        bannerBg: 'linear-gradient(90deg, #6D28D9, #8B5CF6)',
        bannerText: '#fff',
        nameColor: '#4C1D95',
    }
};

const OrganizerLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = useSelector(selectUser);
    const dispatch = useDispatch();
    const [subPlan, setSubPlan] = useState(null);

    // Fetch subscription directly — never rely on auth flow to carry it
    useEffect(() => {
        fetch('http://localhost:5000/api/v1/subscriptions/current', { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                const plan = data?.data?.plan || data?.subscription?.plan || null;
                if (plan && plan !== 'free') setSubPlan(plan);
            })
            .catch(() => {});
    }, []);

    const handleLogout = async () => {
        await dispatch(logoutUser()).unwrap();
        navigate('/');
    };

    const navItems = [
        { path: '/organizer/dashboard', icon: 'fa-tachometer-alt', label: 'Dashboard' },
        { path: '/organizer/my-events', icon: 'fa-calendar-alt', label: 'My Events' },
        { path: '/organizer/create-event', icon: 'fa-plus-circle', label: 'Create Event' },
        { path: '/organizer/subscription', icon: 'fa-crown', label: 'Subscriptions' },
        { path: '/organizer/services', icon: 'fa-briefcase', label: 'Services' },
        { path: '/organizer/payment-history', icon: 'fa-receipt', label: 'Payments' },
        { path: '/organizer/profile', icon: 'fa-user', label: 'Profile' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-lg flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-gray-200">
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">S</span>
                        </div>
                        <span className="text-xl font-bold text-red-600">SportsAmigo</span>
                    </Link>
                </div>

                {/* User Profile */}
                <div style={{
                    borderBottom: '1px solid #e5e7eb',
                    background: PLAN_BADGE[subPlan] ? PLAN_BADGE[subPlan].sectionBg : '#fff',
                    borderBottom: PLAN_BADGE[subPlan] ? `2px solid ${PLAN_BADGE[subPlan].sectionBorder.replace('2px solid ','')}` : '1px solid #e5e7eb',
                }}>
                    {/* Plan banner strip */}
                    {PLAN_BADGE[subPlan] && (
                        <div style={{
                            background: PLAN_BADGE[subPlan].bannerBg,
                            color: PLAN_BADGE[subPlan].bannerText,
                            padding: '4px 0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                            fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                        }}>
                            {PLAN_BADGE[subPlan].icon}
                            {PLAN_BADGE[subPlan].label}
                            {PLAN_BADGE[subPlan].icon}
                        </div>
                    )}

                    <div className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                            {/* Avatar */}
                            <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                                boxShadow: PLAN_BADGE[subPlan] ? PLAN_BADGE[subPlan].avatarRing : '0 0 0 2px #EF4444',
                            }}>
                                {user?.profile_image ? (
                                    <img src={`http://localhost:5000${user.profile_image}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#EF4444,#DC2626)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className="fas fa-user" style={{ fontSize: '1.1rem', color: '#fff' }}></i>
                                    </div>
                                )}
                            </div>

                            {/* Name + role */}
                            <div style={{ minWidth: 0 }}>
                                <p style={{ fontWeight: 700, color: PLAN_BADGE[subPlan] ? PLAN_BADGE[subPlan].nameColor : '#1F2937', fontSize: '0.85rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {user?.first_name && user?.last_name
                                        ? `${user.first_name} ${user.last_name}`
                                        : user?.name || 'User'}
                                </p>
                                <p style={{ fontSize: '0.7rem', color: PLAN_BADGE[subPlan] ? PLAN_BADGE[subPlan].nameColor : '#DC2626', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0, opacity: 0.8 }}>
                                    {PLAN_BADGE[subPlan] ? 'Organizer' : 'Organizer'}
                                </p>
                            </div>
                        </div>
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
                                            ? 'bg-red-50 text-red-600 font-semibold'
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
                <div className="p-4 border-t border-gray-200 flex-shrink-0">
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 w-full"
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

export default OrganizerLayout;

