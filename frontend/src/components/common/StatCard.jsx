import React from 'react';

const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    gradient = 'bg-gradient-to-br from-orange-500 to-red-500',
    iconColor = 'text-white',
}) => {
    return (
        <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-4 rounded-lg ${gradient}`}>
                    <i className={`${icon} text-3xl ${iconColor}`}></i>
                </div>
                <div className="text-right">
                    <p className="text-gray-600 text-sm font-medium">{title}</p>
                    <p className="text-4xl font-bold text-gray-800">{value}</p>
                </div>
            </div>
            {subtitle && (
                <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600">{subtitle}</p>
                </div>
            )}
        </div>
    );
};

export default StatCard;

