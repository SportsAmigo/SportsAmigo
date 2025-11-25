import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import OrganizerLayout from '../../components/layout/OrganizerLayout';
import axios from 'axios';

const CreateEvent = () => {
    const user = useSelector(selectUser);
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        sport: '',
        location: '',
        description: '',
        start_date: '',
        end_date: '',
        registration_deadline: '',
        max_teams: 16,
        entry_fee: ''
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const sports = [
        'Football', 'Cricket', 'Basketball', 'Tennis', 'Badminton', 
        'Volleyball', 'Table Tennis', 'Hockey', 'Swimming', 'Athletics'
    ];

    const validateStep1 = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Event name is required';
        } else if (formData.name.length < 3) {
            newErrors.name = 'Event name must be at least 3 characters';
        } else if (formData.name.length > 100) {
            newErrors.name = 'Event name must not exceed 100 characters';
        }

        if (!formData.sport) {
            newErrors.sport = 'Please select a sport';
        }

        if (!formData.location.trim()) {
            newErrors.location = 'Location is required';
        } else if (formData.location.length < 3) {
            newErrors.location = 'Location must be at least 3 characters';
        }

        if (formData.description && formData.description.length > 1000) {
            newErrors.description = 'Description must not exceed 1000 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors = {};

        if (!formData.start_date) {
            newErrors.start_date = 'Start date is required';
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startDate = new Date(formData.start_date);

            if (startDate < today) {
                newErrors.start_date = 'Start date cannot be in the past';
            }
        }

        if (!formData.end_date) {
            newErrors.end_date = 'End date is required';
        } else if (formData.start_date) {
            const startDate = new Date(formData.start_date);
            const endDate = new Date(formData.end_date);

            if (endDate < startDate) {
                newErrors.end_date = 'End date must be after start date';
            }
        }

        if (!formData.registration_deadline) {
            newErrors.registration_deadline = 'Registration deadline is required';
        } else if (formData.start_date) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const regDeadline = new Date(formData.registration_deadline);
            const startDate = new Date(formData.start_date);

            if (regDeadline < today) {
                newErrors.registration_deadline = 'Registration deadline must be in the future';
            } else if (regDeadline >= startDate) {
                newErrors.registration_deadline = 'Registration deadline must be before start date';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep3 = () => {
        const newErrors = {};

        if (!formData.max_teams) {
            newErrors.max_teams = 'Maximum teams is required';
        } else {
            const maxTeams = parseInt(formData.max_teams);
            if (isNaN(maxTeams) || maxTeams < 2) {
                newErrors.max_teams = 'Minimum 2 teams required';
            } else if (maxTeams > 100) {
                newErrors.max_teams = 'Maximum 100 teams allowed';
            }
        }

        if (formData.entry_fee && formData.entry_fee < 0) {
            newErrors.entry_fee = 'Entry fee cannot be negative';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'max_teams') {
            if (!/^\d*$/.test(value)) {
                return;
            }
        }

        if (name === 'entry_fee') {
            if (!/^\d*\.?\d*$/.test(value)) {
                return;
            }
        }

        setFormData(prev => ({ ...prev, [name]: value }));

        if (errors[name]) {
            const newErrors = { ...errors };
            delete newErrors[name];
            setErrors(newErrors);
        }
    };

    const handleNext = () => {
        let isValid = false;
        
        if (currentStep === 1) {
            isValid = validateStep1();
        } else if (currentStep === 2) {
            isValid = validateStep2();
        }

        if (isValid) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
        setErrors({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateStep3()) {
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            const response = await axios.post('http://localhost:5000/api/organizer/create-event', {
                ...formData,
                organizer_id: user._id
            }, {
                withCredentials: true
            });

            alert('Event created successfully!');
            navigate('/organizer/events');
        } catch (error) {
            setErrors({ submit: error.response?.data?.message || 'Error creating event' });
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
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                            Create New Event
                        </h1>
                        <p className="text-gray-600">Fill in the details to create your sports event</p>
                    </div>

                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            {[1, 2, 3].map((step) => (
                                <div key={step} className="flex-1 flex items-center">
                                    <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg transition-all ${
                                        currentStep >= step
                                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                                            : 'bg-gray-200 text-gray-500'
                                    }`}>
                                        {step}
                                    </div>
                                    {step < 3 && (
                                        <div className={`flex-1 h-2 mx-2 rounded transition-all ${
                                            currentStep > step
                                                ? 'bg-gradient-to-r from-orange-500 to-red-500'
                                                : 'bg-gray-200'
                                        }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-3">
                            <span className="text-sm font-medium text-gray-700">Basic Info</span>
                            <span className="text-sm font-medium text-gray-700">Dates & Time</span>
                            <span className="text-sm font-medium text-gray-700">Settings</span>
                        </div>
                    </div>

                    {errors.submit && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
                            <p className="font-medium">{errors.submit}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="bg-white bg-opacity-95 backdrop-filter backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-orange-100" style={{ backdropFilter: 'blur(10px)' }}>
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-200">
                                    Step 1: Basic Information
                                </h3>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Event Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                                            errors.name ? 'border-red-500' : 'border-gray-200'
                                        }`}
                                        placeholder="e.g., Summer Cricket Tournament 2025"
                                    />
                                    {errors.name && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center">
                                            <span className="mr-1"></span>
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Sport <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="sport"
                                        value={formData.sport}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                                            errors.sport ? 'border-red-500' : 'border-gray-200'
                                        }`}
                                    >
                                        <option value="">Select a sport</option>
                                        {sports.map(sport => (
                                            <option key={sport} value={sport}>{sport}</option>
                                        ))}
                                    </select>
                                    {errors.sport && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center">
                                            <span className="mr-1"></span>
                                            {errors.sport}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Location <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                                            errors.location ? 'border-red-500' : 'border-gray-200'
                                        }`}
                                        placeholder="e.g., City Sports Complex, Mumbai"
                                    />
                                    {errors.location && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center">
                                            <span className="mr-1"></span>
                                            {errors.location}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Description <span className="text-gray-500 text-xs">(Optional)</span>
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows="4"
                                        maxLength="1000"
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none ${
                                            errors.description ? 'border-red-500' : 'border-gray-200'
                                        }`}
                                        placeholder="Describe your event, rules, prizes, etc..."
                                    />
                                    <div className="flex justify-between items-center mt-1">
                                        {errors.description ? (
                                            <p className="text-red-500 text-xs flex items-center">
                                                <span className="mr-1"></span>
                                                {errors.description}
                                            </p>
                                        ) : (
                                            <span></span>
                                        )}
                                        <span className="text-xs text-gray-500">
                                            {formData.description.length}/1000 characters
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-6">
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl shadow-lg transform transition-all hover:scale-105"
                                    >
                                        Next Step 
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-200">
                                    Step 2: Dates & Time
                                </h3>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Start Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleChange}
                                        min={new Date().toISOString().split('T')[0]}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                                            errors.start_date ? 'border-red-500' : 'border-gray-200'
                                        }`}
                                    />
                                    {errors.start_date && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center">
                                            <span className="mr-1"></span>
                                            {errors.start_date}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        End Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleChange}
                                        min={formData.start_date || new Date().toISOString().split('T')[0]}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                                            errors.end_date ? 'border-red-500' : 'border-gray-200'
                                        }`}
                                    />
                                    {errors.end_date && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center">
                                            <span className="mr-1"></span>
                                            {errors.end_date}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Registration Deadline <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="registration_deadline"
                                        value={formData.registration_deadline}
                                        onChange={handleChange}
                                        min={new Date().toISOString().split('T')[0]}
                                        max={formData.start_date}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                                            errors.registration_deadline ? 'border-red-500' : 'border-gray-200'
                                        }`}
                                    />
                                    {errors.registration_deadline && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center">
                                            <span className="mr-1"></span>
                                            {errors.registration_deadline}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                        Teams must register before this date
                                    </p>
                                </div>

                                <div className="flex justify-between pt-6">
                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        className="px-8 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-xl transition-all"
                                    >
                                         Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl shadow-lg transform transition-all hover:scale-105"
                                    >
                                        Next Step 
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-200">
                                    Step 3: Event Settings
                                </h3>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Maximum Teams <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="max_teams"
                                        value={formData.max_teams}
                                        onChange={handleChange}
                                        maxLength="3"
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                                            errors.max_teams ? 'border-red-500' : 'border-gray-200'
                                        }`}
                                        placeholder="e.g., 16"
                                    />
                                    {errors.max_teams && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center">
                                            <span className="mr-1"></span>
                                            {errors.max_teams}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                        Minimum 2 teams, maximum 100 teams
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Entry Fee <span className="text-gray-500 text-xs">(Optional)</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-3 text-gray-500 font-semibold">?</span>
                                        <input
                                            type="text"
                                            name="entry_fee"
                                            value={formData.entry_fee}
                                            onChange={handleChange}
                                            className={`w-full pl-8 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                                                errors.entry_fee ? 'border-red-500' : 'border-gray-200'
                                            }`}
                                            placeholder="0"
                                        />
                                    </div>
                                    {errors.entry_fee && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center">
                                            <span className="mr-1"></span>
                                            {errors.entry_fee}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                        Leave blank or enter 0 for free entry
                                    </p>
                                </div>

                                <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200">
                                    <h4 className="font-bold text-gray-800 mb-4">Event Summary</h4>
                                    <div className="space-y-2 text-sm">
                                        <p><span className="font-semibold">Name:</span> {formData.name || 'N/A'}</p>
                                        <p><span className="font-semibold">Sport:</span> {formData.sport || 'N/A'}</p>
                                        <p><span className="font-semibold">Location:</span> {formData.location || 'N/A'}</p>
                                        <p><span className="font-semibold">Start:</span> {formData.start_date ? new Date(formData.start_date).toLocaleDateString() : 'N/A'}</p>
                                        <p><span className="font-semibold">End:</span> {formData.end_date ? new Date(formData.end_date).toLocaleDateString() : 'N/A'}</p>
                                        <p><span className="font-semibold">Registration Deadline:</span> {formData.registration_deadline ? new Date(formData.registration_deadline).toLocaleDateString() : 'N/A'}</p>
                                        <p><span className="font-semibold">Max Teams:</span> {formData.max_teams || 'N/A'}</p>
                                        <p><span className="font-semibold">Entry Fee:</span> ?{formData.entry_fee || '0'}</p>
                                    </div>
                                </div>

                                <div className="flex justify-between pt-6">
                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        className="px-8 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-xl transition-all"
                                    >
                                         Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-8 py-4 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white font-bold text-lg rounded-xl shadow-xl transform transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        {loading ? (
                                            <span className="flex items-center">
                                                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Creating...
                                            </span>
                                        ) : (
                                            <span className="flex items-center">
                                                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Create Event
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
                </div>
            </div>
        </OrganizerLayout>
    );
};

export default CreateEvent;
