import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, updateUserData } from '../../store/slices/authSlice';
import PlayerLayout from '../../components/layout/PlayerLayout';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
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

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
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
        setLoading(true);
        setMessage({ type: '', text: '' });

        // Validate first name - only letters and spaces
        const nameRegex = /^[A-Za-z\s]+$/;
        if (!nameRegex.test(formData.first_name)) {
            setMessage({ type: 'error', text: 'First name can only contain letters and spaces' });
            setLoading(false);
            return;
        }

        // Validate last name - only letters and spaces
        if (!nameRegex.test(formData.last_name)) {
            setMessage({ type: 'error', text: 'Last name can only contain letters and spaces' });
            setLoading(false);
            return;
        }

        // Validate phone number - 10 digits starting with 6, 7, 8, or 9
        if (formData.phone) {
            const phoneRegex = /^[6-9]\d{9}$/;
            if (!phoneRegex.test(formData.phone)) {
                setMessage({ type: 'error', text: 'Phone number must be 10 digits starting with 6, 7, 8, or 9' });
                setLoading(false);
                return;
            }
        }

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
                'http://localhost:5000/api/player/profile',
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
        <PlayerLayout>
            <div className="browse-wrapper">
                <div className="profile-page-header">
                    <div className="profile-header-content">
                        <h1>
                            <i className="fa fa-user-circle"></i>
                            My Profile
                        </h1>
                        <p>Manage your personal information and preferences</p>
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
                        <span className="role-badge">Player</span>
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
                                        className="form-input"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="last_name">
                                        Last Name <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="last_name"
                                        name="last_name"
                                        className="form-input"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        required
                                    />
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
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        className="form-input"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+1234567890"
                                    />
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
        </PlayerLayout>
    );
};

export default Profile;
