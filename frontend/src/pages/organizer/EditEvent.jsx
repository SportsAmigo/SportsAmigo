import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import OrganizerLayout from '../../components/layout/OrganizerLayout';
import axios from 'axios';

const EditEvent = () => {
    const { id } = useParams();
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
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const sports = [
        'Football', 'Cricket', 'Basketball', 'Tennis', 'Badminton', 
        'Volleyball', 'Table Tennis', 'Hockey', 'Swimming', 'Athletics'
    ];

    useEffect(() => {
        fetchEventDetails();
    }, [id]);

    const fetchEventDetails = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/organizer/event/${id}`, {
                withCredentials: true
            });

            if (response.data.success) {
                const event = response.data.event;
                setFormData({
                    name: event.name || '',
                    sport: event.sport || '',
                    location: event.location || '',
                    description: event.description || '',
                    start_date: event.start_date ? new Date(event.start_date).toISOString().split('T')[0] : '',
                    end_date: event.end_date ? new Date(event.end_date).toISOString().split('T')[0] : '',
                    registration_deadline: event.registration_deadline ? new Date(event.registration_deadline).toISOString().split('T')[0] : '',
                    max_teams: event.max_teams || 16,
                    entry_fee: event.entry_fee || ''
                });
            }
        } catch (error) {
            console.error('Error fetching event details:', error);
            setMessage({ type: 'error', text: 'Failed to load event details' });
        } finally {
            setLoading(false);
        }
    };

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

    const handleNextStep = () => {
        let isValid = false;

        switch (currentStep) {
            case 1:
                isValid = validateStep1();
                break;
            case 2:
                isValid = validateStep2();
                break;
            case 3:
                isValid = validateStep3();
                break;
            default:
                isValid = false;
        }

        if (isValid) {
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePreviousStep = () => {
        setCurrentStep(currentStep - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateStep3()) {
            return;
        }

        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await axios.put(
                `http://localhost:5000/api/organizer/event/${id}`,
                formData,
                { withCredentials: true }
            );

            if (response.data.success) {
                setMessage({ type: 'success', text: 'Event updated successfully!' });
                setTimeout(() => {
                    navigate(`/organizer/event/${id}`);
                }, 1500);
            }
        } catch (error) {
            console.error('Error updating event:', error);
            const errorMessage = error.response?.data?.message || 'Failed to update event. Please try again.';
            setMessage({ type: 'error', text: errorMessage });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <OrganizerLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-600 mb-4"></div>
                        <p className="text-gray-700 text-lg font-medium">Loading event details...</p>
                    </div>
                </div>
            </OrganizerLayout>
        );
    }

    return (
        <OrganizerLayout>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link to={`/organizer/event/${id}`} className="text-orange-600 hover:text-orange-700 mb-4 inline-flex items-center font-medium">
                        <i className="fa fa-arrow-left mr-2"></i> Back to Event Details
                    </Link>
                    <h1 className="text-4xl font-bold text-gray-800 mt-4 mb-2">Edit Event</h1>
                    <p className="text-gray-600">Update your event information</p>
                </div>

                {/* Message Alert */}
                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
                        <div className="flex items-center justify-between">
                            <span className="font-medium">{message.text}</span>
                            <button onClick={() => setMessage({ type: '', text: '' })} className="text-gray-500 hover:text-gray-700">
                                <i className="fa fa-times"></i>
                            </button>
                        </div>
                    </div>
                )}

                {/* Progress Steps */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex items-center justify-between">
                        {[1, 2, 3].map((step) => (
                            <React.Fragment key={step}>
                                <div className="flex flex-col items-center">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                                        currentStep >= step 
                                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' 
                                            : 'bg-gray-200 text-gray-500'
                                    }`}>
                                        {step}
                                    </div>
                                    <span className={`mt-2 text-sm font-medium ${currentStep >= step ? 'text-orange-600' : 'text-gray-500'}`}>
                                        {step === 1 && 'Basic Info'}
                                        {step === 2 && 'Dates'}
                                        {step === 3 && 'Settings'}
                                    </span>
                                </div>
                                {step < 3 && (
                                    <div className={`flex-1 h-1 mx-4 rounded-full transition-all ${
                                        currentStep > step ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gray-200'
                                    }`}></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
                    {/* Step 1: Basic Information */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                <i className="fa fa-info-circle text-orange-600 mr-3"></i>
                                Basic Information
                            </h2>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Event Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all ${
                                        errors.name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="e.g., Summer Football Championship 2024"
                                />
                                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Sport <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="sport"
                                    value={formData.sport}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all ${
                                        errors.sport ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Select a sport</option>
                                    {sports.map(sport => (
                                        <option key={sport} value={sport}>{sport}</option>
                                    ))}
                                </select>
                                {errors.sport && <p className="text-red-500 text-sm mt-1">{errors.sport}</p>}
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Location <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all ${
                                        errors.location ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="e.g., City Sports Complex, Mumbai"
                                />
                                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="4"
                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none ${
                                        errors.description ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Provide a brief description of your event..."
                                ></textarea>
                                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                                <p className="text-sm text-gray-500 mt-1">{formData.description.length}/1000 characters</p>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Dates */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                <i className="fa fa-calendar-alt text-orange-600 mr-3"></i>
                                Event Dates
                            </h2>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Start Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all ${
                                        errors.start_date ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>}
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">
                                    End Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all ${
                                        errors.end_date ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>}
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Registration Deadline <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="registration_deadline"
                                    value={formData.registration_deadline}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all ${
                                        errors.registration_deadline ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {errors.registration_deadline && <p className="text-red-500 text-sm mt-1">{errors.registration_deadline}</p>}
                                <p className="text-sm text-gray-500 mt-1">Teams cannot register after this date</p>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Settings */}
                    {currentStep === 3 && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                <i className="fa fa-cog text-orange-600 mr-3"></i>
                                Event Settings
                            </h2>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Maximum Teams <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="max_teams"
                                    value={formData.max_teams}
                                    onChange={handleChange}
                                    min="2"
                                    max="100"
                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all ${
                                        errors.max_teams ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="16"
                                />
                                {errors.max_teams && <p className="text-red-500 text-sm mt-1">{errors.max_teams}</p>}
                                <p className="text-sm text-gray-500 mt-1">Number of teams that can register (2-100)</p>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">
                                    Entry Fee (₹)
                                </label>
                                <input
                                    type="number"
                                    name="entry_fee"
                                    value={formData.entry_fee}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all ${
                                        errors.entry_fee ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="0"
                                />
                                {errors.entry_fee && <p className="text-red-500 text-sm mt-1">{errors.entry_fee}</p>}
                                <p className="text-sm text-gray-500 mt-1">Leave blank or 0 for free events</p>
                            </div>

                            {/* Summary */}
                            <div className="mt-8 p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border-2 border-orange-200">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                    <i className="fa fa-check-circle text-orange-600 mr-2"></i>
                                    Event Summary
                                </h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600 font-medium">Event Name:</p>
                                        <p className="text-gray-800 font-semibold">{formData.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 font-medium">Sport:</p>
                                        <p className="text-gray-800 font-semibold">{formData.sport || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 font-medium">Location:</p>
                                        <p className="text-gray-800 font-semibold">{formData.location || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 font-medium">Date Range:</p>
                                        <p className="text-gray-800 font-semibold">
                                            {formData.start_date && formData.end_date 
                                                ? `${new Date(formData.start_date).toLocaleDateString()} - ${new Date(formData.end_date).toLocaleDateString()}`
                                                : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 font-medium">Max Teams:</p>
                                        <p className="text-gray-800 font-semibold">{formData.max_teams}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 font-medium">Entry Fee:</p>
                                        <p className="text-gray-800 font-semibold">
                                            {formData.entry_fee ? `₹${formData.entry_fee}` : 'Free'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                        {currentStep > 1 ? (
                            <button
                                type="button"
                                onClick={handlePreviousStep}
                                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200"
                            >
                                <i className="fa fa-arrow-left mr-2"></i>Previous
                            </button>
                        ) : (
                            <Link
                                to={`/organizer/event/${id}`}
                                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200"
                            >
                                <i className="fa fa-times mr-2"></i>Cancel
                            </Link>
                        )}

                        {currentStep < 3 ? (
                            <button
                                type="button"
                                onClick={handleNextStep}
                                className="px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
                            >
                                Next<i className="fa fa-arrow-right ml-2"></i>
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={saving}
                                className={`px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 ${
                                    saving ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                {saving ? (
                                    <>
                                        <i className="fa fa-spinner fa-spin mr-2"></i>Updating...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa fa-save mr-2"></i>Update Event
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </OrganizerLayout>
    );
};

export default EditEvent;
