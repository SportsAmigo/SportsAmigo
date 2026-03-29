import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';
import '../styles/AdminLogin.css';

const ModeratorLogin = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        remember: false
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            await dispatch(loginUser({
                email: formData.email,
                password: formData.password,
                role: 'coordinator'
            })).unwrap();

            navigate('/coordinator/dashboard');
        } catch (error) {
            console.error('Coordinator login error:', error);
            setMessage(error.message || 'Invalid credentials. Please check your email and password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-background">
                <div className="admin-login-overlay"></div>
            </div>

            <div className="admin-login-content">
                <Link to="/" className="back-to-home">
                    <i className="fas fa-arrow-left"></i>
                    <span>Back to Home</span>
                </Link>

                <div className="admin-login-card">
                    <div className="admin-login-header">
                        <div className="admin-icon-wrapper">
                            <i className="fas fa-clipboard-check"></i>
                        </div>
                        <h1>Coordinator Login</h1>
                        <p>Access the coordinator approval panel</p>
                    </div>

                    {message && (
                        <div className="admin-alert admin-alert-error">
                            <i className="fas fa-exclamation-circle"></i>
                            <span>{message}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="admin-login-form">
                        <div className="admin-form-group">
                            <label htmlFor="email">
                                <i className="fas fa-envelope"></i>
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={errors.email ? 'error' : ''}
                                placeholder="Enter your coordinator email"
                                disabled={loading}
                            />
                            {errors.email && (
                                <span className="admin-error-message">{errors.email}</span>
                            )}
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="password">
                                <i className="fas fa-lock"></i>
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={errors.password ? 'error' : ''}
                                placeholder="Enter your password"
                                disabled={loading}
                            />
                            {errors.password && (
                                <span className="admin-error-message">{errors.password}</span>
                            )}
                        </div>

                        <div className="admin-form-group-checkbox">
                            <label className="admin-checkbox-label">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={formData.remember}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                                <span>Remember me</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="admin-login-button"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    <span>Logging in...</span>
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-sign-in-alt"></i>
                                    <span>Login</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="admin-login-footer">
                        <div className="admin-divider">
                            <span>Other Login Options</span>
                        </div>
                        <div className="admin-login-links">
                            <Link to="/admin/login" className="admin-alt-login-link">
                                <i className="fas fa-shield-alt"></i>
                                Admin Login
                            </Link>
                            <Link to="/login" className="admin-alt-login-link">
                                <i className="fas fa-user"></i>
                                User Login
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="admin-login-info">
                    <div className="info-card">
                        <i className="fas fa-shield-alt"></i>
                        <h3>Secure Access</h3>
                        <p>Your credentials are encrypted and secure</p>
                    </div>
                    <div className="info-card">
                        <i className="fas fa-user-check"></i>
                        <h3>Approval Authority</h3>
                        <p>Review and approve organizers and events</p>
                    </div>
                    <div className="info-card">
                        <i className="fas fa-clock"></i>
                        <h3>24/7 Access</h3>
                        <p>Monitor and moderate anytime, anywhere</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModeratorLogin;
