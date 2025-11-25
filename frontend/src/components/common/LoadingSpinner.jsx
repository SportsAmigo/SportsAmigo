import React from 'react';

const LoadingSpinner = ({ 
    size = 'md', 
    message = 'Loading...', 
    fullScreen = true,
    color = 'orange',
}) => {
    const sizes = {
        sm: 'h-8 w-8 border-2',
        md: 'h-16 w-16 border-4',
        lg: 'h-24 w-24 border-4',
    };

    const colors = {
        orange: 'border-orange-600',
        blue: 'border-blue-600',
        green: 'border-green-600',
        red: 'border-red-600',
    };

    const spinner = (
        <div className="flex flex-col items-center justify-center">
            <div 
                className={`inline-block animate-spin rounded-full border-t-transparent border-b-transparent ${sizes[size]} ${colors[color]}`}
            ></div>
            {message && <p className="text-gray-700 text-lg font-medium mt-4">{message}</p>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                {spinner}
            </div>
        );
    }

    return spinner;
};

export default LoadingSpinner;

