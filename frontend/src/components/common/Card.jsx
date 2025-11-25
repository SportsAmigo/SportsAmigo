import React from 'react';

const Card = ({ 
    children, 
    className = '', 
    title, 
    subtitle,
    footer,
    padding = 'default',
    shadow = true,
    hover = false,
}) => {
    const paddingClasses = {
        none: '',
        sm: 'p-3',
        default: 'p-6',
        lg: 'p-8',
    };

    const shadowClass = shadow ? 'shadow-lg' : '';
    const hoverClass = hover ? 'hover:shadow-xl transition-shadow duration-200' : '';

    return (
        <div className={`bg-white rounded-xl ${shadowClass} ${hoverClass} ${paddingClasses[padding]} ${className}`}>
            {(title || subtitle) && (
                <div className="mb-4">
                    {title && <h3 className="text-2xl font-bold text-gray-800">{title}</h3>}
                    {subtitle && <p className="text-gray-600 text-sm mt-1">{subtitle}</p>}
                </div>
            )}
            
            <div>{children}</div>
            
            {footer && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    {footer}
                </div>
            )}
        </div>
    );
};

export default Card;

