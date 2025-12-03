import React, { useState, useEffect } from 'react';
import OrganizerLayout from '../../components/layout/OrganizerLayout';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, updateUserData } from '../../store/slices/authSlice';
import axios from 'axios';

const OrganizerProfile = () => {
    const user = useSelector(selectUser);
    const dispatch = useDispatch();

    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        organization: '',
        age: '',
        address: '',
        bio: '',
        profile_image: ''
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [accountStats, setAccountStats] = useState({
        status: 'Active',
        memberSince: '',
        totalEvents: 0,
        upcomingEvents: 0
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (user) {
            setProfile({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone: user.phone || '',
                organization: user.organization || '',
                age: user.age || '',
                address: user.address || '',
                bio: user.bio || '',
                profile_image: user.profile_image || ''
            });
            if (user.profile_image) {
                setImagePreview(`http://localhost:5000${user.profile_image}`);
            }
        }
        fetchAccountStats();
    }, [user]);

    const fetchAccountStats = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/organizer/stats', {
                withCredentials: true
            });
            if (response.data.success && response.data.stats) {
                setAccountStats({
                    status: 'Active',
                    memberSince: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
                    totalEvents: response.data.stats.totalEvents || 0,
                    upcomingEvents: response.data.stats.upcomingEvents || 0
                });
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const validateField = (name, value) => {
        const newErrors = { ...errors };

        switch (name) {
            case 'organization':
                if (!value.trim()) {
                    newErrors.organization = 'Organization name is required';
                } else if (!/^[a-zA-Z\s]+$/.test(value)) {
                    newErrors.organization = 'Organization name can only contain letters and spaces';
                } else if (value.length < 2 || value.length > 100) {
                    newErrors.organization = 'Organization name must be between 2 and 100 characters';
                } else {
                    delete newErrors.organization;
                }
                break;

            case 'age':
                const ageNum = parseInt(value);
                if (!value) {
                    newErrors.age = 'Age is required';
                } else if (isNaN(ageNum)) {
                    newErrors.age = 'Age must be a number';
                } else if (ageNum < 18 || ageNum > 100) {
                    newErrors.age = 'Age must be between 18 and 100';
                } else {
                    delete newErrors.age;
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

            case 'address':
                if (!value.trim()) {
                    newErrors.address = 'Address is required';
                } else if (value.length < 10 || value.length > 200) {
                    newErrors.address = 'Address must be between 10 and 200 characters';
                } else {
                    delete newErrors.address;
                }
                break;

            case 'bio':
                if (value && value.length > 500) {
                    newErrors.bio = 'Bio must not exceed 500 characters';
                } else {
                    delete newErrors.bio;
                }
                break;

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

            default:
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
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

        if (name === 'organization') {
            // Allow only letters and spaces for organization name
            if (!/^[a-zA-Z\s]*$/.test(value)) {
                return;
            }
        }

        if (name === 'age') {
            // Allow only digits
            if (!/^\d*$/.test(value)) {
                return;
            }
        }

        if (name === 'phone') {
            // Allow only digits and max 10 characters
            if (!/^\d*$/.test(value) || value.length > 10) {
                return;
            }
        }

        setProfile(prev => ({ ...prev, [name]: value }));
        validateField(name, value);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                setMessage({ type: 'error', text: 'Please upload a valid image file (JPEG, PNG, or GIF)' });
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
                return;
            }

            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        
        let isValid = true;
        Object.keys(profile).forEach(key => {
            if (!validateField(key, profile[key]) && key !== 'bio' && key !== 'profile_image') {
                isValid = false;
            }
        });

        if (!isValid) {
            setMessage({ type: 'error', text: 'Please fix all validation errors before saving' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const formData = new FormData();
            Object.keys(profile).forEach(key => {
                if (key !== 'profile_image') {
                    formData.append(key, profile[key]);
                }
            });

            if (imageFile) {
                formData.append('profile_image', imageFile);
            }

            const response = await axios.put('http://localhost:5000/api/organizer/profile', formData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            
            // Update Redux store with new user data
            if (response.data.user) {
                dispatch(updateUserData(response.data.user));
            }

            // Update local profile state with all new data
            setProfile(response.data.user);
            
            if (response.data.user.profile_image) {
                setImagePreview(`http://localhost:5000${response.data.user.profile_image}`);
            }

            setImageFile(null);
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
        <OrganizerLayout>
            <div className="min-h-screen py-8" style={{
                backgroundImage: 'url(/images/581A3451.webp)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                position: 'relative'
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 0
                }}></div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                            Profile Settings
                        </h1>
                        <p className="text-gray-600">Manage your account information and preferences</p>
                    </div>

                    {message.text && (
                        <div className={`mb-6 p-4 rounded-lg shadow-md animate-fade-in ${
                            message.type === 'success' 
                                ? 'bg-green-50 border-l-4 border-green-500 text-green-800'
                                : 'bg-red-50 border-l-4 border-red-500 text-red-800'
                        }`}>
                            <div className="flex items-center">
                                <span className="text-2xl mr-3">
                                    {message.type === 'success' ? '' : ''}
                                </span>
                                <p className="font-medium">{message.text}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-orange-100">
                                <div className="h-32 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 relative">
                                    <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                                        <div className="relative">
                                            {imagePreview ? (
                                                <img
                                                    src={imagePreview}
                                                    alt="Profile"
                                                    className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover"
                                                />
                                            ) : (
                                                <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-4xl font-bold">
                                                    {profile.first_name?.charAt(0)}{profile.last_name?.charAt(0)}
                                                </div>
                                            )}
                                            <label
                                                htmlFor="profile-image"
                                                className="absolute bottom-0 right-0 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full cursor-pointer shadow-lg transition-all transform hover:scale-110"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </label>
                                            <input
                                                type="file"
                                                id="profile-image"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-20 pb-6 px-6 text-center">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-1">
                                        {profile.first_name} {profile.last_name}
                                    </h2>
                                    <p className="text-orange-600 font-medium mb-1">{profile.organization}</p>
                                    <p className="text-gray-500 text-sm">{profile.email}</p>
                                </div>

                                <div className="border-t border-gray-100 p-6 space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                                        <span className="text-gray-600 font-medium">Total Events</span>
                                        <span className="text-orange-600 font-bold text-lg">{accountStats.totalEvents}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                                        <span className="text-gray-600 font-medium">Upcoming Events</span>
                                        <span className="text-red-600 font-bold text-lg">{accountStats.upcomingEvents}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <form onSubmit={handleSaveChanges} className="bg-white bg-opacity-95 backdrop-filter backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-orange-100" style={{ backdropFilter: 'blur(10px)' }}>
                                <h3 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-200">
                                    Personal Information
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            First Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="first_name"
                                            value={profile.first_name}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                                                errors.first_name ? 'border-red-500' : 'border-gray-200'
                                            }`}
                                            placeholder="Enter your first name"
                                        />
                                        {errors.first_name && (
                                            <p className="text-red-500 text-xs mt-1 flex items-center">
                                                <span className="mr-1"></span>
                                                {errors.first_name}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Last Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="last_name"
                                            value={profile.last_name}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                                                errors.last_name ? 'border-red-500' : 'border-gray-200'
                                            }`}
                                            placeholder="Enter your last name"
                                        />
                                        {errors.last_name && (
                                            <p className="text-red-500 text-xs mt-1 flex items-center">
                                                <span className="mr-1"></span>
                                                {errors.last_name}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={profile.email}
                                            disabled
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Phone Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={profile.phone}
                                            onChange={handleChange}
                                            maxLength="10"
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                                                errors.phone ? 'border-red-500' : 'border-gray-200'
                                            }`}
                                            placeholder="10-digit number"
                                        />
                                        {errors.phone && (
                                            <p className="text-red-500 text-xs mt-1 flex items-center">
                                                <span className="mr-1"></span>
                                                {errors.phone}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Organization <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="organization"
                                            value={profile.organization}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                                                errors.organization ? 'border-red-500' : 'border-gray-200'
                                            }`}
                                            placeholder="Your organization name"
                                        />
                                        {errors.organization && (
                                            <p className="text-red-500 text-xs mt-1 flex items-center">
                                                <span className="mr-1"></span>
                                                {errors.organization}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Age <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="age"
                                            value={profile.age}
                                            onChange={handleChange}
                                            maxLength="3"
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                                                errors.age ? 'border-red-500' : 'border-gray-200'
                                            }`}
                                            placeholder="18-100"
                                        />
                                        {errors.age && (
                                            <p className="text-red-500 text-xs mt-1 flex items-center">
                                                <span className="mr-1"></span>
                                                {errors.age}
                                            </p>
                                        )}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Address <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            name="address"
                                            value={profile.address}
                                            onChange={handleChange}
                                            rows="3"
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none ${
                                                errors.address ? 'border-red-500' : 'border-gray-200'
                                            }`}
                                            placeholder="Enter your full address"
                                        />
                                        {errors.address && (
                                            <p className="text-red-500 text-xs mt-1 flex items-center">
                                                <span className="mr-1"></span>
                                                {errors.address}
                                            </p>
                                        )}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Bio <span className="text-gray-500 text-xs">(Optional)</span>
                                        </label>
                                        <textarea
                                            name="bio"
                                            value={profile.bio}
                                            onChange={handleChange}
                                            rows="4"
                                            maxLength="500"
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none ${
                                                errors.bio ? 'border-red-500' : 'border-gray-200'
                                            }`}
                                            placeholder="Tell us about yourself and your organization..."
                                        />
                                        <div className="flex justify-between items-center mt-1">
                                            {errors.bio ? (
                                                <p className="text-red-500 text-xs flex items-center">
                                                    <span className="mr-1"></span>
                                                    {errors.bio}
                                                </p>
                                            ) : (
                                                <span></span>
                                            )}
                                            <span className="text-xs text-gray-500">
                                                {profile.bio.length}/500 characters
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white font-bold text-lg rounded-xl shadow-xl transform transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center">
                                                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Saving Changes...
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center">
                                                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Save Changes
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                </div>
            </div>

        </OrganizerLayout>
    );
};

export default OrganizerProfile;
