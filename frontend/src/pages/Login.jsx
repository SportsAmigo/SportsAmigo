import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, selectLoading, selectError } from '../store/slices/authSlice';

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
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetStep, setResetStep] = useState(1);

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

    const handleForgotPassword = async () => {
        if (!resetEmail || !/\S+@\S+\.\S+/.test(resetEmail)) {
            alert('Please enter a valid email address.');
            return;
        }
        // TODO: Implement password reset API call
        setResetStep(2);
    };

    const closeModal = () => {
        setShowForgotPassword(false);
        setResetEmail('');
        setResetStep(1);
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
                <div className="modal" style={{ display: 'block' }} onClick={(e) => { if (e.target.className === 'modal') closeModal(); }}>
                    <div className="modal-content">
                        <span className="close-modal" onClick={closeModal}>&times;</span>
                        <div className="modal-header">
                            <h2>Reset Your Password</h2>
                        </div>
                        <div className="modal-body">
                            {resetStep === 1 ? (
                                <div id="reset-step-1">
                                    <p>Enter your email address below and we'll send you a link to reset your password.</p>
                                    <div className="form-group">
                                        <label htmlFor="reset-email">Email Address</label>
                                        <input 
                                            type="email" 
                                            id="reset-email" 
                                            name="reset-email" 
                                            placeholder="Enter your email"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            required 
                                        />
                                    </div>
                                    <div className="form-actions">
                                        <button className="hero-btn reset-btn" onClick={handleForgotPassword}>Send Reset Link</button>
                                        <button className="hero-btn cancel-btn" onClick={closeModal}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div id="reset-step-2">
                                    <div className="success-message">
                                        <i className="fa fa-check-circle"></i>
                                        <h3>Email Sent!</h3>
                                        <p>We've sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.</p>
                                        <p className="note">If you don't receive an email within a few minutes, please check your spam folder.</p>
                                        <button className="hero-btn ok-btn" onClick={closeModal}>OK</button>
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
