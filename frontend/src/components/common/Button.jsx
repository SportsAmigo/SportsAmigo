import React from 'react';

const Button = ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    disabled = false,
    onClick,
    type = 'button',
    className = '',
    fullWidth = false,
}) => {
    const baseStyles = 'font-semibold rounded-lg transition-all duration-200 inline-flex items-center justify-center';
    
    const variants = {
        primary: 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:shadow-lg hover:from-orange-700 hover:to-red-700',
        secondary: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 bg-white',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        success: 'bg-green-600 text-white hover:bg-green-700',
        outline: 'border-2 border-orange-600 text-orange-600 hover:bg-orange-50',
    };
    
    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className} ${
                disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
        >
            {loading ? (
                <>
                    <i className="fa fa-spinner fa-spin mr-2"></i>
                    Loading...
                </>
            ) : (
                children
            )}
        </button>
    );
};

export default Button;

