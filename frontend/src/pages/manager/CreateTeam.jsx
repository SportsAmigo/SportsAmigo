import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import axios from 'axios';
import './CreateTeam.css';

const CreateTeam = () => {
    const user = useSelector(selectUser);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        sport_type: '',
        description: '',
        max_members: 10
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        
        // Frontend validation: Team name cannot be only numbers
        const teamNameOnlyNumbers = /^\d+$/;
        if (teamNameOnlyNumbers.test(formData.name.trim())) {
            setErrors({ name: 'Team name cannot contain only numbers. Please include at least one letter.' });
            setLoading(false);
            return;
        }
        
        // Team name must contain at least one letter
        const hasLetter = /[a-zA-Z]/;
        if (!hasLetter.test(formData.name.trim())) {
            setErrors({ name: 'Team name must contain at least one letter.' });
            setLoading(false);
            return;
        }
        
        try {
            const response = await axios.post('http://localhost:5000/api/manager/create-team', formData, { withCredentials: true });
            if (response.data.success) {
                alert('Team created successfully!');
                navigate('/manager/my-teams');
            }
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ submit: error.response?.data?.message || 'Error creating team' });
            }
        } finally {
            setLoading(false);
        }
    };

    const sportTypes = [
        'Football',
        'Cricket',
        'Basketball',
        'Volleyball',
        'Tennis',
        'Badminton',
        'Table Tennis',
        'Hockey',
        'Swimming',
        'Athletics'
    ];

    return (
        <div className="create-team-container">
            <div className="create-team-wrapper">
                <div className="create-team-header">
                    <h1>
                        <i className="fa fa-plus-circle"></i>
                        Create New Team
                    </h1>
                    <p>Create a new sports team and invite players to join</p>
                </div>

                {errors.submit && (
                    <div className="error-alert">
                        <i className="fa fa-exclamation-circle"></i>
                        {errors.submit}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="create-team-form">
                    {/* Team Name */}
                    <div className="form-group">
                        <label htmlFor="name" className="form-label">
                            <i className="fa fa-shield-alt"></i>
                            Team Name *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            className={`form-input ${errors.name ? 'error' : ''}`}
                            placeholder="Enter your team name"
                            value={formData.name}
                            onChange={handleChange}
                            maxLength={50}
                            required
                        />
                        {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>

                    {/* Sport Type */}
                    <div className="form-group">
                        <label htmlFor="sport_type" className="form-label">
                            <i className="fa fa-futbol"></i>
                            Sport Type *
                        </label>
                        <select
                            id="sport_type"
                            name="sport_type"
                            className={`form-select ${errors.sport_type ? 'error' : ''}`}
                            value={formData.sport_type}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select a sport</option>
                            {sportTypes.map(sport => (
                                <option key={sport} value={sport}>{sport}</option>
                            ))}
                        </select>
                        {errors.sport_type && <span className="error-message">{errors.sport_type}</span>}
                    </div>

                    {/* Maximum Members */}
                    <div className="form-group">
                        <label htmlFor="max_members" className="form-label">
                            <i className="fa fa-users"></i>
                            Maximum Team Members *
                        </label>
                        <input
                            type="number"
                            id="max_members"
                            name="max_members"
                            className={`form-input ${errors.max_members ? 'error' : ''}`}
                            placeholder="Enter maximum team size"
                            value={formData.max_members}
                            onChange={handleChange}
                            min="5"
                            max="50"
                        />
                        {errors.max_members && <span className="error-message">{errors.max_members}</span>}
                        <span className="help-text">Set the maximum number of players (5-50)</span>
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label htmlFor="description" className="form-label">
                            <i className="fa fa-align-left"></i>
                            Description (Optional)
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            className={`form-textarea ${errors.description ? 'error' : ''}`}
                            placeholder="Describe your team, goals, and requirements..."
                            value={formData.description}
                            onChange={handleChange}
                            maxLength={500}
                            rows="4"
                        ></textarea>
                        {errors.description && <span className="error-message">{errors.description}</span>}
                        <span className="char-count">{formData.description.length}/500 characters</span>
                    </div>

                    {/* Form Actions */}
                    <div className="form-actions">
                        <Link to="/manager/dashboard" className="btn-cancel">
                            <i className="fa fa-times"></i>
                            Cancel
                        </Link>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <i className="fa fa-spinner fa-spin"></i>
                                    Creating Team...
                                </>
                            ) : (
                                <>
                                    <i className="fa fa-check"></i>
                                    Create Team
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTeam;
