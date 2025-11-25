import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

// Create Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    // Check authentication status on mount
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            setLoading(true);
            const response = await authService.checkSession();
            
            if (response.success && response.authenticated) {
                setUser(response.user);
                setAuthenticated(true);
            } else {
                setUser(null);
                setAuthenticated(false);
            }
        } catch (error) {
            console.error('Auth check error:', error);
            setUser(null);
            setAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password, role) => {
        try {
            const response = await authService.login(email, password, role);
            
            if (response.success) {
                setUser(response.user);
                setAuthenticated(true);
                return { success: true, user: response.user };
            } else {
                return { success: false, message: response.message, errors: response.errors };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                message: error.message || 'Login failed',
                errors: error.errors || {}
            };
        }
    };

    const signup = async (userData) => {
        try {
            console.log('AuthContext signup called with:', { ...userData, password: '***' });
            const response = await authService.signup(userData);
            console.log('AuthContext signup response:', response);
            
            if (response.success) {
                // Don't auto-login - user should login manually after signup (like EJS version)
                return { success: true, message: response.message || 'Registration successful! Please login with your credentials.' };
            } else {
                return { success: false, message: response.message, errors: response.errors };
            }
        } catch (error) {
            console.error('Signup error in AuthContext:', error);
            return { 
                success: false, 
                message: error.message || 'Signup failed',
                errors: error.errors || {}
            };
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
            setUser(null);
            setAuthenticated(false);
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            // Still clear local state even if API call fails
            setUser(null);
            setAuthenticated(false);
            return { success: false, message: error.message || 'Logout failed' };
        }
    };

    const updateUser = (userData) => {
        setUser(prevUser => ({ ...prevUser, ...userData }));
    };

    const value = {
        user,
        authenticated,
        loading,
        login,
        signup,
        logout,
        updateUser,
        checkAuthStatus,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use Auth Context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
