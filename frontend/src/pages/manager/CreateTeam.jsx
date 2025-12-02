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
            console.error('Error saving team:', error);
            setErrors({ submit: error.response?.data?.message || `Error ${isEditMode ? 'updating' : 'creating'} team` });
        } finally {
            setLoading(false);
        }
    };

    if (loadingTeam) {
        return (
            <ManagerLayout>
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading team details...</p>
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

                    {errors.submit && (
                        <div className="error-alert">
                            <i className="fa fa-exclamation-circle"></i>
                            {errors.submit}
                        </div>
                    )}

                    <div className="form-card">
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="name" className="form-label">
                                        Team Name <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className={`form-input ${errors.name ? 'error' : ''}`}
                                        placeholder="Enter team name"
                                        required
                                        minLength="3"
                                        maxLength="50"
                                    />
                                    {errors.name && (
                                        <span className="error-message">
                                            <i className="fa fa-exclamation-circle"></i>
                                            {errors.name}
                                        </span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="sport_type" className="form-label">
                                        Sport Type <span className="required">*</span>
                                    </label>
                                    <select
                                        id="sport_type"
                                        name="sport_type"
                                        value={formData.sport_type}
                                        onChange={handleChange}
                                        className={`form-input ${errors.sport_type ? 'error' : ''}`}
                                        required
                                    >
                                        <option value="">Select sport</option>
                                        <option value="Football">Football</option>
                                        <option value="Basketball">Basketball</option>
                                        <option value="Cricket">Cricket</option>
                                        <option value="Volleyball">Volleyball</option>
                                        <option value="Badminton">Badminton</option>
                                        <option value="Tennis">Tennis</option>
                                    </select>
                                    {errors.sport_type && (
                                        <span className="error-message">
                                            <i className="fa fa-exclamation-circle"></i>
                                            {errors.sport_type}
                                        </span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="max_members" className="form-label">
                                        Maximum Members <span className="required">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        id="max_members"
                                        name="max_members"
                                        value={formData.max_members}
                                        onChange={handleChange}
                                        className={`form-input ${errors.max_members ? 'error' : ''}`}
                                        min="5"
                                        max="50"
                                        required
                                    />
                                    {errors.max_members && (
                                        <span className="error-message">
                                            <i className="fa fa-exclamation-circle"></i>
                                            {errors.max_members}
                                        </span>
                                    )}
                                </div>

                                <div className="form-group full-width">
                                    <label htmlFor="description" className="form-label">
                                        Team Description
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        className={`form-textarea ${errors.description ? 'error' : ''}`}
                                        rows="4"
                                        placeholder="Describe your team, goals, and requirements..."
                                        maxLength="500"
                                    ></textarea>
                                    {errors.description && (
                                        <span className="error-message">
                                            <i className="fa fa-exclamation-circle"></i>
                                            {errors.description}
                                        </span>
                                    )}
                                    <small className="form-hint">
                                        {formData.description.length}/500 characters
                                    </small>
                                </div>
                            </div>

                            <div className="form-actions">
                                <Link 
                                    to={isEditMode ? `/manager/team/${id}/manage` : "/manager/my-teams"} 
                                    className="btn-cancel"
                                >
                                    <i className="fa fa-times"></i>
                                    Cancel
                                </Link>
                                <button type="submit" className="btn-submit" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <i className="fa fa-spinner fa-spin"></i>
                                            {isEditMode ? 'Updating...' : 'Creating...'}
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa fa-check"></i>
                                            {isEditMode ? 'Update Team' : 'Create Team'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </ManagerLayout>
    );
};

export default CreateTeam;
