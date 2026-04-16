import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ManagerLayout from '../../components/layout/ManagerLayout';
import './CreateTeam.css'; // Reuse the same CSS
import { API_BASE_URL } from '../../utils/constants';

const EditTeam = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        sport_type: '',
        description: '',
        max_members: 11
    });
    const [errors, setErrors] = useState({});

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

    useEffect(() => {
        fetchTeamDetails();
    }, [id]);

    const fetchTeamDetails = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/manager/team/${id}`, {
                withCredentials: true
            });
            if (response.data.success) {
                const team = response.data.team;
                setFormData({
                    name: team.name || '',
                    sport_type: team.sport_type || '',
                    description: team.description || '',
                    max_members: team.max_members || 11
                });
            }
        } catch (error) {
            console.error('Error fetching team details:', error);
            alert('Failed to load team details');
            navigate('/manager/my-teams');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Team name is required';
        } else if (formData.name.length < 3) {
            newErrors.name = 'Team name must be at least 3 characters';
        }

        if (!formData.sport_type) {
            newErrors.sport_type = 'Please select a sport type';
        }

        if (formData.max_members < 5) {
            newErrors.max_members = 'Maximum members must be at least 5';
        } else if (formData.max_members > 50) {
            newErrors.max_members = 'Maximum members cannot exceed 50';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setSubmitting(true);

        try {
            const response = await axios.put(
                `${API_BASE_URL}/api/manager/team/${id}`,
                formData,
                { withCredentials: true }
            );

            if (response.data.success) {
                alert('Team updated successfully!');
                navigate('/manager/my-teams');
            }
        } catch (error) {
            console.error('Error updating team:', error);
            alert(error.response?.data?.message || 'Failed to update team');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <ManagerLayout>
                <div className="create-team-container">
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Loading team details...</p>
                    </div>
                </div>
            </ManagerLayout>
        );
    }

    return (
        <ManagerLayout>
            <div className="create-team-container">
                <div className="create-team-wrapper">
                    <div className="create-team-header">
                        <h1>
                            <i className="fa fa-edit"></i>
                            Edit Team
                        </h1>
                        <p>Update your team information</p>
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
                                className={`form-input ${errors.sport_type ? 'error' : ''}`}
                                value={formData.sport_type}
                                onChange={handleChange}
                            >
                                <option value="">Select a sport</option>
                                {sportTypes.map(sport => (
                                    <option key={sport} value={sport}>{sport}</option>
                                ))}
                            </select>
                            {errors.sport_type && <span className="error-message">{errors.sport_type}</span>}
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
                                className="form-input"
                                placeholder="Tell us about your team..."
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                maxLength={500}
                            />
                            <small className="char-count">{formData.description.length}/500 characters</small>
                        </div>

                        {/* Max Members */}
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
                                placeholder="11"
                                value={formData.max_members}
                                onChange={handleChange}
                                min={5}
                                max={50}
                            />
                            {errors.max_members && <span className="error-message">{errors.max_members}</span>}
                            <small className="help-text">Enter a number between 5 and 50</small>
                        </div>

                        {/* Form Actions */}
                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={() => navigate('/manager/my-teams')}
                                disabled={submitting}
                            >
                                <i className="fa fa-times"></i>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-submit"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <i className="fa fa-spinner fa-spin"></i>
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa fa-check"></i>
                                        Update Team
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </ManagerLayout>
    );
};

export default EditTeam;
