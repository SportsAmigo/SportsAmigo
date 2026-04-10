import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, updateUserData } from '../../store/slices/authSlice';
import ManagerLayout from '../../components/layout/ManagerLayout';
import axios from 'axios';
import './Profile.css';

const ManagerProfile = () => {
    const user = useSelector(selectUser);
    const dispatch = useDispatch();
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        bio: ''
    });
    const [profileImage, setProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone: user.phone || '',
                bio: user.bio || ''
            });
            // Set preview from existing profile image
            if (user.profile_image) {
                setImagePreview(`http://localhost:5000${user.profile_image}`);
            }
        }
    }, [user]);

    const validateField = (name, value) => {
        const newErrors = { ...errors };

        switch (name) {
            case 'first_name':
                if (!value.trim()) {
                    newErrors.first_name = 'First name is required';
                } else if (!/^[a-zA-Z\s]+$/.test(value)) {
                    newErrors.first_name = 'First name can only contain letters and spaces';
                } else if (value.length < 2 || value.length > 50) {
                    newErrors.first_name = 'First name must be between 2 and 50 characters';
                } else {
                    delete newErrors.first_name;
                }
                break;

            case 'last_name':
                if (!value.trim()) {
                    newErrors.last_name = 'Last name is required';
                } else if (!/^[a-zA-Z\s]+$/.test(value)) {
                    newErrors.last_name = 'Last name can only contain letters and spaces';
                } else if (value.length < 2 || value.length > 50) {
                    newErrors.last_name = 'Last name must be between 2 and 50 characters';
                } else {
                    delete newErrors.last_name;
                }
                break;

            case 'phone':
                if (!value.trim()) {
                    newErrors.phone = 'Phone number is required';
                } else if (!/^[6-9]\d{9}$/.test(value)) {
                    newErrors.phone = 'Phone number must be exactly 10 digits starting with 6, 7, 8, or 9';
                } else {
                    delete newErrors.phone;
                }
                break;

            case 'bio':
                if (value && value.length > 500) {
                    newErrors.bio = 'Bio must not exceed 500 characters';
                } else {
                    delete newErrors.bio;
                }
                break;

            default:
                break;
        }

        setErrors(newErrors);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Real-time input filtering to prevent invalid characters
        if (name === 'first_name' || name === 'last_name') {
            // Allow only letters and spaces
            if (!/^[a-zA-Z\s]*$/.test(value)) {
                return;
            }
        }

        if (name === 'phone') {
            // Allow only digits and max 10 characters
            if (!/^\d*$/.test(value) || value.length > 10) {
                return;
            }
        }

        setFormData({
            ...formData,
            [name]: value
        });
        validateField(name, value);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setMessage({ type: 'error', text: 'Please select a valid image file' });
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
                return;
            }
            
            setProfileImage(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        // Validate all fields
        validateField('first_name', formData.first_name);
        validateField('last_name', formData.last_name);
        validateField('phone', formData.phone);
        validateField('bio', formData.bio);

        // Check if there are any errors
        if (Object.keys(errors).length > 0 || 
            !formData.first_name.trim() || 
            !formData.last_name.trim() || 
            !formData.phone.trim() ||
            !/^[a-zA-ZÀ-ÖØ-öø-ÿ'\-\s]+$/.test(formData.first_name) ||
            !/^[a-zA-ZÀ-ÖØ-öø-ÿ'\-\s]+$/.test(formData.last_name) ||
            !/^[6-9]\d{9}$/.test(formData.phone)) {
            setMessage({ type: 'error', text: 'Please fix all validation errors before submitting' });
            return;
        }

        setLoading(true);

        try {
            // Create FormData for file upload
            const formDataToSend = new FormData();
            formDataToSend.append('first_name', formData.first_name);
            formDataToSend.append('last_name', formData.last_name);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('phone', formData.phone);
            formDataToSend.append('bio', formData.bio);
            
            if (profileImage) {
                formDataToSend.append('profile_image', profileImage);
            }

            const response = await axios.put(
                'http://localhost:5000/api/manager/profile',
                formDataToSend,
                { 
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                if (response.data.user) {
                    dispatch(updateUserData(response.data.user));
                }
                // Reset image file after successful upload
                setProfileImage(null);
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Error updating profile'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ManagerLayout>
            <div className="profile-container">
                <div className="profile-wrapper">
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">
                                <i className="fa fa-user-circle"></i>
                                My Profile
                            </h1>
                            <p className="page-subtitle">
                                Manage your personal information and preferences
                            </p>
                        </div>
                    </div>

                    {message.text && (
                        <div className={`message-alert ${message.type}`}>
                            <i className={`fa ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                            {message.text}
                        </div>
                    )}

                    <div className="profile-layout">
                        <div className="profile-info-card">
                            <div className="profile-avatar">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Profile" />
                                ) : (
                                    <i className="fa fa-user"></i>
                                )}
                            </div>
                            <div className="upload-image-section">
                                <label htmlFor="profileImageInput" className="upload-btn">
                                    <i className="fa fa-camera"></i>
                                    Upload Photo
                                </label>
                                <input
                                    type="file"
                                    id="profileImageInput"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    style={{ display: 'none' }}
                                />
                            </div>
                            <h3>{user?.first_name} {user?.last_name}</h3>
                            <p className="user-email">{user?.email}</p>
                            <span className="role-badge">Manager</span>
                        </div>

                        <div className="profile-form-card">
                            <h2 className="form-card-title">Personal Information</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="first_name">
                                            First Name <span className="required">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="first_name"
                                            name="first_name"
                                            className={`form-input ${errors.first_name ? 'error' : ''}`}
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            required
                                        />
                                        {errors.first_name && <span className="error-message">{errors.first_name}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="last_name">
                                            Last Name <span className="required">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="last_name"
                                            name="last_name"
                                            className={`form-input ${errors.last_name ? 'error' : ''}`}
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            required
                                        />
                                        {errors.last_name && <span className="error-message">{errors.last_name}</span>}
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="email">
                                            Email <span className="required">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            className="form-input"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="phone">
                                            Phone Number <span className="required">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            className={`form-input ${errors.phone ? 'error' : ''}`}
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="9876543210"
                                            maxLength="10"
                                            required
                                        />
                                        {errors.phone && <span className="error-message">{errors.phone}</span>}
                                        <small className="form-hint">10 digits starting with 6, 7, 8, or 9</small>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="bio">
                                        Bio
                                    </label>
                                    <textarea
                                        id="bio"
                                        name="bio"
                                        className="form-textarea"
                                        rows="4"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        placeholder="Tell us about yourself..."
                                    ></textarea>
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="btn-submit" disabled={loading}>
                                        <i className="fa fa-save"></i>
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </ManagerLayout>
    );
};

export default ManagerProfile;

