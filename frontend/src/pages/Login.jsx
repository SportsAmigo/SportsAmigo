import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, selectLoading, selectError } from '../store/slices/authSlice';
import authService from '../services/authService';

const Login = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'player',
        remember: false
    });
    
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    // Forgot Password state
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetOtp, setResetOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [resetStep, setResetStep] = useState(1); // 1: Enter email, 2: Enter OTP, 3: Enter new password
    const [resetToken, setResetToken] = useState('');

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

    const selectRole = (role) => {
        setFormData(prev => ({ ...prev, role }));
        setMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setMessage('');
        setLoading(true);

        try {
            const result = await dispatch(loginUser({ 
                email: formData.email, 
                password: formData.password, 
                role: formData.role 
            })).unwrap();
            
            navigate(`/${result.user.role}/dashboard`);
        } catch (error) {
            console.error('Login error:', error);
            setMessage(error.message || 'Login failed');
            if (error.errors) {
                setErrors(error.errors);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPasswordClick = () => {
        setShowForgotPassword(true);
        setResetStep(1);
        setResetEmail('');
        setResetOtp('');
        setNewPassword('');
        setConfirmNewPassword('');
        setMessage('');
        setSuccessMessage('');
    };

    const handleSendResetOTP = async () => {
        if (!resetEmail || !/\S+@\S+\.\S+/.test(resetEmail)) {
            setMessage('Please enter a valid email address.');
            return;
        }
        
        setLoading(true);
        setMessage('');
        setSuccessMessage('');
        
        try {
            const result = await authService.forgotPassword(resetEmail);
            setSuccessMessage(result.message || 'Reset code sent to your email!');
            setResetStep(2);
        } catch (error) {
            setMessage(error.message || 'Failed to send reset code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyResetOTP = async () => {
        if (!resetOtp || resetOtp.length !== 6) {
            setMessage('Please enter the 6-digit OTP code.');
            return;
        }
        
        setLoading(true);
        setMessage('');
        setSuccessMessage('');
        
        try {
            const result = await authService.verifyResetOTP(resetEmail, resetOtp);
            setSuccessMessage(result.message || 'OTP verified! Please enter your new password.');
            setResetToken(result.resetToken);
            setResetStep(3);
        } catch (error) {
            setMessage(error.message || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            setMessage('Password must be at least 6 characters.');
            return;
        }
        
        if (newPassword !== confirmNewPassword) {
            setMessage('Passwords do not match.');
            return;
        }
        
        setLoading(true);
        setMessage('');
        setSuccessMessage('');
        
        try {
            const result = await authService.resetPassword(resetEmail, resetToken, newPassword);
            setSuccessMessage(result.message || 'Password reset successful! You can now login.');
            
            setTimeout(() => {
                closeModal();
                setFormData(prev => ({ ...prev, email: resetEmail, password: '' }));
            }, 2000);
        } catch (error) {
            setMessage(error.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setLoading(true);
        setMessage('');
        setSuccessMessage('');
        
        try {
            const result = await authService.forgotPassword(resetEmail);
            setSuccessMessage(result.message || 'New reset code sent to your email!');
        } catch (error) {
            setMessage(error.message || 'Failed to resend code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setShowForgotPassword(false);
        setResetEmail('');
        setResetOtp('');
        setNewPassword('');
        setConfirmNewPassword('');
        setResetStep(1);
        setResetToken('');
        setMessage('');
        setSuccessMessage('');
    };

    return (
        <div>
            {/* Sub Header */}
            <section className="sub-header">
                <nav>
                    <Link to="/"><img src="/images/logooo-removebg-preview.png" className="logo-spin" alt="SportsAmigo Logo" /></Link>
                    <div className="nav-links">
                        <ul>
                            <li><Link to="/">HOME</Link></li>
                            <li><Link to="/about">ABOUT</Link></li>
                            <li className="dropdown">
                                <Link to="/events">EVENTS</Link>
                                <div className="dropdown-content">
                                    <Link to="/events/football">Football</Link>
                                    <Link to="/events/cricket">Cricket</Link>
                                    <Link to="/events/basketball">Basketball</Link>
                                </div>
                            </li>
                            <li><Link to="/contact">CONTACT</Link></li>
                            <li><Link to="/login">LOGIN</Link></li>
                        </ul>
                    </div>
                </nav>
                <h1>Login to Your Account</h1>
            </section>

            {/* Login Form Section */}
            <section className="login-section">
                <div className="container">
                    <div className="login-container">
                        {message && (
                            <div className="error-message">
                                {message}
                            </div>
                        )}
                        
                        {/* Role Selection */}
                        <div className="role-selection">
                            <h2>Choose Your Role</h2>
                            <div className="role-options">
                                <div 
                                    className={`role-card ${formData.role === 'organizer' ? 'active' : ''}`}
                                    onClick={() => selectRole('organizer')}
                                >
                                    <div className="role-icon">
                                        <i className="fa fa-calendar"></i>
                                    </div>
                                    <h3>Organizer</h3>
                                    <p>Create and manage sports events and tournaments</p>
                                </div>
                                <div 
                                    className={`role-card ${formData.role === 'manager' ? 'active' : ''}`}
                                    onClick={() => selectRole('manager')}
                                >
                                    <div className="role-icon">
                                        <i className="fa fa-users"></i>
                                    </div>
                                    <h3>Manager</h3>
                                    <p>Manage teams, players, and coaching staff</p>
                                </div>
                                <div 
                                    className={`role-card ${formData.role === 'player' ? 'active' : ''}`}
                                    onClick={() => selectRole('player')}
                                >
                                    <div className="role-icon">
                                        <i className="fa fa-user"></i>
                                    </div>
                                    <h3>Player</h3>
                                    <p>Access your player dashboard and manage your team activities</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Login Form */}
                        <div className="login-form">
                            <h2>Login as <span id="selected-role">
                                {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
                            </span></h2>
                            <form onSubmit={handleSubmit}>
                                <input type="hidden" name="role" value={formData.role} />
                                <div className="form-group">
                                    <label htmlFor="email">Email Address</label>
                                    <input 
                                        type="email" 
                                        id="email" 
                                        name="email" 
                                        placeholder="Enter your email" 
                                        value={formData.email}
                                        onChange={handleChange}
                                        required 
                                    />
                                    {errors.email && <span className="error-text">{errors.email}</span>}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="password">Password</label>
                                    <input 
                                        type="password" 
                                        id="password" 
                                        name="password" 
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required 
                                    />
                                    {errors.password && <span className="error-text">{errors.password}</span>}
                                </div>
                                <div className="form-group">
                                    <button type="submit" className="hero-btn login-btn" disabled={loading}>
                                        {loading ? 'Logging in...' : 'Login'}
                                    </button>
                                </div>
                                <div className="forgot-password-link" style={{ textAlign: 'center', marginTop: '10px' }}>
                                    <button 
                                        type="button"
                                        onClick={handleForgotPasswordClick}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#007bff',
                                            cursor: 'pointer',
                                            textDecoration: 'underline',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                                <div className="register-link">
                                    <p>New to SportsAmigo? <Link to={`/signup?role=${formData.role}`}>Register Now</Link></p>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* Forgot Password Modal */}
            {showForgotPassword && (
                <div className="modal" style={{ display: 'block', position: 'fixed', zIndex: 1000, left: 0, top: 0, width: '100%', height: '100%', overflow: 'auto', backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={(e) => { if (e.target.className === 'modal') closeModal(); }}>
                    <div className="modal-content" style={{ backgroundColor: '#fefefe', margin: '5% auto', padding: '30px', border: '1px solid #888', width: '90%', maxWidth: '500px', borderRadius: '10px', position: 'relative' }}>
                        <span className="close-modal" onClick={closeModal} style={{ color: '#aaa', float: 'right', fontSize: '28px', fontWeight: 'bold', cursor: 'pointer', position: 'absolute', right: '20px', top: '10px' }}>&times;</span>
                        <div className="modal-header" style={{ marginBottom: '20px' }}>
                            <h2 style={{ color: '#333', marginTop: '10px' }}>
                                {resetStep === 1 && 'Reset Your Password'}
                                {resetStep === 2 && 'Verify OTP'}
                                {resetStep === 3 && 'Set New Password'}
                            </h2>
                        </div>
                        <div className="modal-body">
                            {message && (
                                <div style={{ padding: '10px', marginBottom: '15px', backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '5px' }}>
                                    {message}
                                </div>
                            )}
                            {successMessage && (
                                <div style={{ padding: '10px', marginBottom: '15px', backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb', borderRadius: '5px' }}>
                                    {successMessage}
                                </div>
                            )}

                            {resetStep === 1 && (
                                <div id="reset-step-1">
                                    <p style={{ marginBottom: '20px', color: '#666' }}>Enter your email address and we'll send you a 6-digit code to reset your password.</p>
                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                        <label htmlFor="reset-email" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Email Address</label>
                                        <input 
                                            type="email" 
                                            id="reset-email" 
                                            name="reset-email" 
                                            placeholder="Enter your email"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px' }}
                                            required 
                                        />
                                    </div>
                                    <div className="form-actions" style={{ display: 'flex', gap: '10px' }}>
                                        <button 
                                            className="hero-btn reset-btn" 
                                            onClick={handleSendResetOTP}
                                            disabled={loading}
                                            style={{ flex: 1, padding: '12px 24px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
                                        >
                                            {loading ? 'Sending...' : 'Send Reset Code'}
                                        </button>
                                        <button 
                                            className="hero-btn cancel-btn" 
                                            onClick={closeModal}
                                            style={{ flex: 1, padding: '12px 24px', backgroundColor: '#777', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {resetStep === 2 && (
                                <div id="reset-step-2">
                                    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '5px', border: '1px solid #b3d9ff' }}>
                                        <p style={{ margin: '5px 0', color: '#666' }}>We've sent a 6-digit code to:</p>
                                        <p style={{ margin: '5px 0', fontWeight: 'bold', color: '#333' }}>{resetEmail}</p>
                                        <p style={{ margin: '5px 0', fontSize: '12px', color: '#999' }}>Please check your inbox (and spam folder)</p>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                        <label htmlFor="reset-otp" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Enter OTP:</label>
                                        <input 
                                            type="text" 
                                            id="reset-otp" 
                                            name="reset-otp" 
                                            placeholder="Enter 6-digit code"
                                            value={resetOtp}
                                            onChange={(e) => setResetOtp(e.target.value)}
                                            maxLength="6"
                                            pattern="[0-9]{6}"
                                            autoFocus
                                            style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '24px', textAlign: 'center', letterSpacing: '8px' }}
                                            required 
                                        />
                                    </div>
                                    <div className="form-actions" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                        <button 
                                            className="hero-btn verify-btn" 
                                            onClick={handleVerifyResetOTP}
                                            disabled={loading}
                                            style={{ flex: 1, padding: '12px 24px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
                                        >
                                            {loading ? 'Verifying...' : 'Verify Code'}
                                        </button>
                                        <button 
                                            className="hero-btn cancel-btn" 
                                            onClick={closeModal}
                                            style={{ flex: 1, padding: '12px 24px', backgroundColor: '#777', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <button 
                                            type="button" 
                                            onClick={handleResendOTP}
                                            disabled={loading}
                                            style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}
                                        >
                                            Resend Code
                                        </button>
                                        <span style={{ margin: '0 10px', color: '#999' }}>|</span>
                                        <button 
                                            type="button" 
                                            onClick={() => setResetStep(1)}
                                            style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px' }}
                                        >
                                            Change Email
                                        </button>
                                    </div>
                                </div>
                            )}

                            {resetStep === 3 && (
                                <div id="reset-step-3">
                                    <p style={{ marginBottom: '20px', color: '#666' }}>Create a new password for your account.</p>
                                    <div className="form-group" style={{ marginBottom: '15px' }}>
                                        <label htmlFor="new-password" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>New Password:</label>
                                        <input 
                                            type="password" 
                                            id="new-password" 
                                            name="new-password" 
                                            placeholder="At least 6 characters"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px' }}
                                            required 
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '20px' }}>
                                        <label htmlFor="confirm-new-password" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Confirm Password:</label>
                                        <input 
                                            type="password" 
                                            id="confirm-new-password" 
                                            name="confirm-new-password" 
                                            placeholder="Re-enter password"
                                            value={confirmNewPassword}
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                            style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px' }}
                                            required 
                                        />
                                    </div>
                                    <div className="form-actions" style={{ display: 'flex', gap: '10px' }}>
                                        <button 
                                            className="hero-btn reset-btn" 
                                            onClick={handleResetPassword}
                                            disabled={loading}
                                            style={{ flex: 1, padding: '12px 24px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
                                        >
                                            {loading ? 'Updating...' : 'Reset Password'}
                                        </button>
                                        <button 
                                            className="hero-btn cancel-btn" 
                                            onClick={closeModal}
                                            style={{ flex: 1, padding: '12px 24px', backgroundColor: '#777', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <section className="footer">
                <h4>About SportsAmigo</h4>
                <p>Join the largest sports community and experience the thrill of competition, the joy of teamwork, and the pride of victory.</p>
                <div className="icons">
                    <i className="fa fa-facebook"></i>
                    <i className="fa fa-twitter"></i>
                    <i className="fa fa-instagram"></i>
                    <i className="fa fa-linkedin"></i>
                </div>
                <p>Made with <i className="fa fa-heart-o"></i> by SportsAmigo Team</p>
            </section>
        </div>
    );
};

export default Login;
