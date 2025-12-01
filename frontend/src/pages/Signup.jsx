import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { signupUser } from '../store/slices/authSlice';
import '../styles/Auth.css';

const Signup = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const dispatch = useDispatch();
    
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        confirm_password: '',
        role: searchParams.get('role') || 'player',
    });
    
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

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

        // Client-side validation
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
            console.log('Submitting signup with data:', { ...formData, password: '***' });
            const result = await dispatch(signupUser(formData)).unwrap();
            console.log('Signup result:', result);
            
            setSuccessMessage(result.message || 'Registration successful! Please login with your credentials.');
            // Redirect to login page after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            console.error('Signup error:', error);
            setMessage(error.message || 'An error occurred. Please try again.');
            if (error.errors) {
                setErrors(error.errors);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <h2 className="auth-title">Sign Up for SportsAmigo</h2>
                    
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
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
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
