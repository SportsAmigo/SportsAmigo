import { useState } from 'react';

/**
 * Custom hook for form handling with validation
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationRules - Validation rules for each field
 * @returns {Object} Form state and handlers
 */
export const useForm = (initialValues, validationRules = {}) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * Handle input change
     */
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        
        setValues(prev => ({ ...prev, [name]: newValue }));
        
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    /**
     * Handle input blur (for showing validation errors)
     */
    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        
        // Validate on blur if validation rule exists
        if (validationRules[name]) {
            const error = validationRules[name](values[name], values);
            if (error) {
                setErrors(prev => ({ ...prev, [name]: error }));
            }
        }
    };

    /**
     * Validate all fields
     */
    const validate = () => {
        const newErrors = {};
        Object.keys(validationRules).forEach(field => {
            const error = validationRules[field](values[field], values);
            if (error) {
                newErrors[field] = error;
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * Reset form to initial values
     */
    const reset = () => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
    };

    /**
     * Set multiple values at once
     */
    const setFieldValue = (name, value) => {
        setValues(prev => ({ ...prev, [name]: value }));
    };

    /**
     * Set multiple errors at once
     */
    const setFieldError = (name, error) => {
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    /**
     * Handle form submission
     */
    const handleSubmit = (onSubmit) => async (e) => {
        e.preventDefault();
        
        // Mark all fields as touched
        const allTouched = {};
        Object.keys(values).forEach(key => {
            allTouched[key] = true;
        });
        setTouched(allTouched);

        // Validate
        if (!validate()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(values);
        } catch (error) {
            console.error('Form submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        values,
        errors,
        touched,
        isSubmitting,
        handleChange,
        handleBlur,
        handleSubmit,
        validate,
        reset,
        setValues,
        setFieldValue,
        setFieldError,
    };
};

export default useForm;

