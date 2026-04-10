import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';
import '../styles/AdminLogin.css';

const AdminLogin = () => {
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
            setMessage('Please fix the errors and try again');
            return;
        }

        setLoading(true);

        try {
            const result = await dispatch(loginUser({ 
                email: formData.email, 
                password: formData.password, 
                role: 'admin' 
            })).unwrap();
            
            navigate('/admin/dashboard');
        } catch (error) {
            console.error('Admin login error:', error);
            setMessage(error.message || 'Invalid admin credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-container">
                {/* Header Section */}
                <div className="admin-header">
                    <div className="admin-shield-icon">
                        <i className="fas fa-shield-alt"></i>
                    </div>
                    <h1>Administrator Portal</h1>
                    <p>Secure access for system administrators</p>
                </div>

                {/* Admin Badge */}
                <div className="admin-badge-container">
                    <div className="admin-badge">
                        <div className="admin-badge-icon">
                            <i className="fas fa-lock"></i>
                        </div>
                        <h3>Administrator</h3>
                        <p>System administration and platform management</p>
                    </div>
                </div>

                {/* Login Form */}
                <div className="admin-form-container">
                    {message && (
                        <div className="admin-error-message">
                            <i className="fas fa-exclamation-circle"></i>
                            <span>{message}</span>
                        </div>
                    )}

                    <h2 className="admin-form-title">Admin Login</h2>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="admin-form-group">
                            <label htmlFor="email">Email Address</label>
                            <div className="admin-input-wrapper">
                                <i className="fas fa-envelope admin-input-icon"></i>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={errors.email ? 'error' : ''}
                                    placeholder="admin@sportsamigo.com"
                                    disabled={loading}
                                />
                            </div>
                            {errors.email && <span className="admin-field-error"><i className="fas fa-times-circle"></i> {errors.email}</span>}
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="password">Password</label>
                            <div className="admin-input-wrapper">
                                <i className="fas fa-key admin-input-icon"></i>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={errors.password ? 'error' : ''}
                                    placeholder="Enter your secure password"
                                    disabled={loading}
                                />
                            </div>
                            {errors.password && <span className="admin-field-error"><i className="fas fa-times-circle"></i> {errors.password}</span>}
                        </div>

                        <div className="admin-form-options">
                            <label className="admin-remember-me">
                                <input 
                                    type="checkbox" 
                                    name="remember"
                                    checked={formData.remember}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                                <span>Keep me signed in</span>
                            </label>
                        </div>

                        <button 
                            type="submit" 
                            className="admin-btn-login"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    <span>Authenticating...</span>
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-sign-in-alt"></i>
                                    <span>Login to Dashboard</span>
                                </>
                            )}
                        </button>

                        <div className="admin-security-badge">
                            <i className="fas fa-shield-check"></i>
                            <span>Secured with end-to-end encryption</span>
                        </div>
                    </form>

                    <div className="admin-form-footer">
                        <div className="admin-footer-link">
                            <i className="fas fa-user-circle"></i>
                            <span>Regular user? <a href="/login">Go to main login</a></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
