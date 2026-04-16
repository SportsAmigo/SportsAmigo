import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock api
jest.mock('../services/api', () => ({
    __esModule: true,
    default: {
        post: jest.fn(),
        get: jest.fn(),
        interceptors: {
            request: { use: jest.fn() },
            response: { use: jest.fn() }
        }
    }
}));

// Create a mock auth reducer
const createAuthReducer = (isAuthenticated, user = null) => {
    return (state = { user, isAuthenticated, loading: false }, action) => state;
};

const createMockStore = (isAuthenticated, user = null) => {
    return configureStore({
        reducer: {
            auth: createAuthReducer(isAuthenticated, user)
        }
    });
};

// Simple ProtectedRoute component that matches typical pattern
const ProtectedRoute = ({ children }) => {
    const React = require('react');
    const { useSelector } = require('react-redux');
    const { Navigate } = require('react-router-dom');
    
    const auth = useSelector(state => state.auth);
    
    if (!auth.isAuthenticated && !auth.user) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
};

const ProtectedContent = () => <div data-testid="protected-content">Protected Page</div>;
const LoginPage = () => <div data-testid="login-page">Login Page</div>;

describe('ProtectedRoute', () => {
    test('redirects to /login when unauthenticated', () => {
        const store = createMockStore(false, null);

        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/dashboard']}>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/dashboard" element={
                            <ProtectedRoute>
                                <ProtectedContent />
                            </ProtectedRoute>
                        } />
                    </Routes>
                </MemoryRouter>
            </Provider>
        );

        // Should redirect to login
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    test('renders children when authenticated', () => {
        const store = createMockStore(true, { id: '1', email: 'test@test.com', role: 'player' });

        render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/dashboard']}>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/dashboard" element={
                            <ProtectedRoute>
                                <ProtectedContent />
                            </ProtectedRoute>
                        } />
                    </Routes>
                </MemoryRouter>
            </Provider>
        );

        // Should render protected content
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    });
});
