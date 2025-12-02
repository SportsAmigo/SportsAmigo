import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';
import authService from '../services/authService';
import '../styles/Auth.css';

const Signup = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const dispatch = useDispatch();
    
    const [step, setStep] = useState(1); // 1: Enter details, 2: Enter OTP
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        confirm_password: '',
        role: searchParams.get('role') || 'player',
        otp: ''
    });
    
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setMessage('');
        setSuccessMessage('');
        setLoading(true);

        if (step === 1) {
            // Step 1: Send OTP
            const newErrors = {};
            
            if (!formData.first_name.trim()) {
                newErrors.first_name = 'First name is required';
            }
            
            if (!formData.email.trim()) {
                newErrors.email = 'Email is required';
            }
            
            if (!formData.phone.trim()) {
                newErrors.phone = 'Phone number is required';
            }
            
            if (formData.password !== formData.confirm_password) {
                newErrors.confirm_password = 'Passwords do not match';
            }
            
            if (formData.password.length < 6) {
                newErrors.password = 'Password must be at least 6 characters';
            }

            const regex = /^[A-Za-z]+$/;
            if (!regex.test(formData.first_name)) {
                newErrors.first_name = 'First name can only contain letters';
            }
            if (formData.last_name && !regex.test(formData.last_name)) {            
                newErrors.last_name = 'Last name can only contain letters';
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                setMessage('Please fix the errors below');
                setLoading(false);
                return;
            }

            try {
                console.log('Sending OTP to email:', formData.email);
                const result = await authService.sendOTP({
                    email: formData.email,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    role: formData.role
                });
                
                console.log('OTP sent successfully:', result);
                setSuccessMessage(result.message || 'OTP sent to your email! Please check your inbox.');
                setOtpSent(true);
                setStep(2);
            } catch (error) {
                console.error('Send OTP error:', error);
                setMessage(error.message || 'Failed to send OTP. Please try again.');
            } finally {
                setLoading(false);
            }
        } else {
            // Step 2: Verify OTP and complete signup
            if (!formData.otp || formData.otp.length !== 6) {
                setErrors({ otp: 'Please enter the 6-digit OTP' });
                setMessage('Please enter a valid OTP');
                setLoading(false);
                return;
            }

            try {
                console.log('Verifying OTP and completing signup...');
                const result = await authService.verifyOTP({
                    email: formData.email,
                    otp: formData.otp,
                    password: formData.password,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formData.phone,
                    role: formData.role
                });
                
                console.log('Signup completed:', result);
                setSuccessMessage(result.message || 'Registration successful! Redirecting...');
                
                // Auto-login after successful signup
                if (result.user) {
                    dispatch(loginUser({ 
                        email: formData.email, 
                        password: formData.password, 
                        role: formData.role 
                    }));
                    
                    setTimeout(() => {
                        navigate(result.redirectUrl || `/${formData.role}`);
                    }, 1500);
                }
            } catch (error) {
                console.error('Verify OTP error:', error);
                setMessage(error.message || 'Failed to verify OTP. Please try again.');
                if (error.errors) {
                    setErrors(error.errors);
                }
            } finally {
                setLoading(false);
            }
        }
    };

    const handleResendOTP = async () => {
        setLoading(true);
        setMessage('');
        setSuccessMessage('');
        
        try {
            const result = await authService.sendOTP({
                email: formData.email,
                first_name: formData.first_name,
                last_name: formData.last_name,
                role: formData.role
            });
            
            setSuccessMessage(result.message || 'New OTP sent to your email!');
        } catch (error) {
            setMessage(error.message || 'Failed to resend OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <h2 className="auth-title">
                        {step === 1 ? 'Sign Up for SportsAmigo' : 'Verify Your Email'}
                    </h2>
                    
                    {message && (
                        <div className="alert alert-error">
                            {message}
                        </div>
                    )}
                    
                    {successMessage && (
                        <div className="alert alert-success">
                            {successMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        {step === 1 ? (
                            <>
                                <div className="form-group">
                                    <label htmlFor="role">I want to join as:</label>
                                    <select
                                        id="role"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="form-control"
                                    >
                                        <option value="player">Player</option>
                                        <option value="manager">Manager</option>
                                        <option value="organizer">Organizer</option>
                                    </select>
                                    {errors.role && <span className="error-text">{errors.role}</span>}
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="first_name">First Name:</label>
                                        <input
                                            type="text"
                                            id="first_name"
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            className={`form-control ${errors.first_name ? 'error' : ''}`}
                                            placeholder="Enter first name"
                                            required
                                        />
                                        {errors.first_name && <span className="error-text">{errors.first_name}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="last_name">Last Name:</label>
                                        <input
                                            type="text"
                                            id="last_name"
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            className={`form-control ${errors.last_name ? 'error' : ''}`}
                                            placeholder="Enter last name"
                                            required
                                        />
                                        {errors.last_name && <span className="error-text">{errors.last_name}</span>}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email">Email:</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`form-control ${errors.email ? 'error' : ''}`}
                                        placeholder="Enter your email"
                                        required
                                    />
                                    {errors.email && <span className="error-text">{errors.email}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="phone">Phone:</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className={`form-control ${errors.phone ? 'error' : ''}`}
                                        placeholder="10-digit mobile number"
                                        pattern="[6-9][0-9]{9}"
                                        required
                                    />
                                    {errors.phone && <span className="error-text">{errors.phone}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="password">Password:</label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`form-control ${errors.password ? 'error' : ''}`}
                                        placeholder="At least 6 characters"
                                        required
                                    />
                                    {errors.password && <span className="error-text">{errors.password}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirm_password">Confirm Password:</label>
                                    <input
                                        type="password"
                                        id="confirm_password"
                                        name="confirm_password"
                                        value={formData.confirm_password}
                                        onChange={handleChange}
                                        className={`form-control ${errors.confirm_password ? 'error' : ''}`}
                                        placeholder="Re-enter password"
                                        required
                                    />
                                    {errors.confirm_password && <span className="error-text">{errors.confirm_password}</span>}
                                </div>

                                <button 
                                    type="submit" 
                                    className="btn btn-primary btn-block"
                                    disabled={loading}
                                >
                                    {loading ? 'Sending OTP...' : 'Send OTP'}
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="otp-info">
                                    <p>We've sent a 6-digit verification code to:</p>
                                    <p><strong>{formData.email}</strong></p>
                                    <p className="text-muted">Please check your inbox (and spam folder)</p>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="otp">Enter OTP:</label>
                                    <input
                                        type="text"
                                        id="otp"
                                        name="otp"
                                        value={formData.otp}
                                        onChange={handleChange}
                                        className={`form-control ${errors.otp ? 'error' : ''}`}
                                        placeholder="Enter 6-digit code"
                                        maxLength="6"
                                        pattern="[0-9]{6}"
                                        required
                                        autoFocus
                                        style={{ fontSize: '24px', textAlign: 'center', letterSpacing: '8px' }}
                                    />
                                    {errors.otp && <span className="error-text">{errors.otp}</span>}
                                </div>

                                <button 
                                    type="submit" 
                                    className="btn btn-primary btn-block"
                                    disabled={loading}
                                >
                                    {loading ? 'Verifying...' : 'Verify & Sign Up'}
                                </button>

                                <div className="otp-actions" style={{ marginTop: '15px', textAlign: 'center' }}>
                                    <button 
                                        type="button" 
                                        onClick={handleResendOTP}
                                        className="btn-link"
                                        disabled={loading}
                                        style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
                                    >
                                        Resend OTP
                                    </button>
                                    <span style={{ margin: '0 10px' }}>|</span>
                                    <button 
                                        type="button" 
                                        onClick={() => { setStep(1); setOtpSent(false); setMessage(''); setSuccessMessage(''); }}
                                        className="btn-link"
                                        style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
                                    >
                                        Change Email
                                    </button>
                                </div>
                            </>
                        )}
                    </form>

                    <div className="auth-footer">
                        <p>Already have an account? <Link to="/login">Login here</Link></p>
                        <p><Link to="/">Back to Home</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
