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
        try {
            const response = await axios.post('http://localhost:5000/api/manager/create-team', formData, { withCredentials: true });
            if (response.data.success) {
                alert('Team created successfully!');
                navigate('/manager/my-teams');
            }
        } catch (error) {
            setErrors({ submit: error.response?.data?.message || 'Error creating team' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-team-container">
            <div className="create-team-wrapper">
                <div className="page-header">
                    <h2 className="page-title">
                        <i className="fa fa-plus-circle"></i>
                        Create New Team
                    </h2>
                    <p className="page-subtitle">Create a new sports team and invite players to join</p>
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
                                    className="form-input"
                                    placeholder="Enter team name"
                                    required
                                />
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
                                    className="form-input"
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
                            </div>

                            <div className="form-group">
                                <label htmlFor="max_members" className="form-label">
                                    Maximum Members
                                </label>
                                <input
                                    type="number"
                                    id="max_members"
                                    name="max_members"
                                    value={formData.max_members}
                                    onChange={handleChange}
                                    className="form-input"
                                    min="5"
                                    max="50"
                                />
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
                                    className="form-textarea"
                                    rows="4"
                                    placeholder="Describe your team, goals, and requirements..."
                                ></textarea>
                            </div>
                        </div>

                        <div className="form-actions">
                            <Link to="/manager/dashboard" className="btn-cancel">
                                <i className="fa fa-times"></i>
                                Cancel
                            </Link>
                            <button type="submit" className="btn-submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <i className="fa fa-spinner fa-spin"></i>
                                        Creating...
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
        </div>
    );
};

export default CreateTeam;
