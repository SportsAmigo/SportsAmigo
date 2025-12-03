import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import ManagerLayout from '../../components/layout/ManagerLayout';
import axios from 'axios';
import './CreateTeam.css';

const CreateTeam = () => {
    const user = useSelector(selectUser);
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    
    const [formData, setFormData] = useState({
        name: '',
        sport_type: '',
        description: '',
        max_members: 10
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [loadingTeam, setLoadingTeam] = useState(isEditMode);

    useEffect(() => {
        if (isEditMode) {
            fetchTeamData();
        }
    }, [id]);

    const fetchTeamData = async () => {
        try {
            setLoadingTeam(true);
            const response = await axios.get(`http://localhost:5000/api/manager/team/${id}`, {
                withCredentials: true
            });
            if (response.data.success) {
                const team = response.data.team;
                setFormData({
                    name: team.name || '',
                    sport_type: team.sport_type || '',
                    description: team.description || '',
                    max_members: team.max_members || 10
                });
            } else {
                setErrors({ submit: 'Failed to load team details' });
            }
        } catch (error) {
            console.error('Error fetching team:', error);
            setErrors({ submit: error.response?.data?.message || 'Error loading team details' });
        } finally {
            setLoadingTeam(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.name || formData.name.trim().length === 0) {
            newErrors.name = 'Team name is required';
        } else if (formData.name.trim().length < 3) {
            newErrors.name = 'Team name must be at least 3 characters';
        } else if (formData.name.trim().length > 50) {
            newErrors.name = 'Team name must be less than 50 characters';
        }
        
        if (!formData.sport_type) {
            newErrors.sport_type = 'Sport type is required';
        }
        
        if (formData.max_members < 5 || formData.max_members > 50) {
            newErrors.max_members = 'Maximum members must be between 5 and 50';
        }
        
        if (formData.description && formData.description.length > 500) {
            newErrors.description = 'Description must be less than 500 characters';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: undefined
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        setErrors({});
        try {
            const url = isEditMode 
                ? `http://localhost:5000/api/manager/teams/${id}/edit`
                : 'http://localhost:5000/api/manager/create-team';
                
            const response = await axios.post(url, formData, { withCredentials: true });
            
            if (response.data.success) {
                alert(isEditMode ? 'Team updated successfully!' : 'Team created successfully!');
                navigate('/manager/my-teams');
            } else {
                setErrors({ submit: response.data.message || `Error ${isEditMode ? 'updating' : 'creating'} team` });
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
            </ManagerLayout>
        );
    }

    return (
        <ManagerLayout>
            <div className="create-team-container">
                <div className="create-team-wrapper">
                    <div className="page-header">
                        <h2 className="page-title">
                            <i className={isEditMode ? "fa fa-edit" : "fa fa-plus-circle"}></i>
                            {isEditMode ? 'Edit Team' : 'Create New Team'}
                        </h2>
                        <p className="page-subtitle">
                            {isEditMode 
                                ? 'Update your team details and settings'
                                : 'Create a new sports team and invite players to join'
                            }
                        </p>
                    </div>

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
        </ManagerLayout>
    );
};

export default CreateTeam;
