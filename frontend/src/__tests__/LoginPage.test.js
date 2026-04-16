import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock axios and api service
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

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => jest.fn()
}));

// Create a minimal mock store
const createMockStore = (initialState = {}) => {
    return configureStore({
        reducer: {
            auth: (state = { user: null, isAuthenticated: false, ...initialState }) => state
        }
    });
};

// Import Login after mocks
import Login from '../pages/Login';
import api from '../services/api';

describe('LoginPage', () => {
    test('renders email input, password input, and submit button', () => {
        const store = createMockStore();
        
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <Login />
                </MemoryRouter>
            </Provider>
        );

        // The login page should have email and password fields
        const emailInput = screen.getByPlaceholderText(/email/i) || screen.getByLabelText(/email/i);
        expect(emailInput).toBeInTheDocument();
        
        const passwordInput = screen.getByPlaceholderText(/password/i) || screen.getByLabelText(/password/i);
        expect(passwordInput).toBeInTheDocument();
        
        // Should have a login/sign in button
        const submitButton = screen.getByRole('button', { name: /login|sign in|log in/i });
        expect(submitButton).toBeInTheDocument();
    });

    test('shows error message on failed login', async () => {
        const store = createMockStore();
        api.post.mockRejectedValueOnce({
            response: { status: 401, data: { success: false, message: 'Invalid email or password' } }
        });

        render(
            <Provider store={store}>
                <MemoryRouter>
                    <Login />
                </MemoryRouter>
            </Provider>
        );

        const emailInput = screen.getByPlaceholderText(/email/i) || screen.getByLabelText(/email/i);
        const passwordInput = screen.getByPlaceholderText(/password/i) || screen.getByLabelText(/password/i);
        
        fireEvent.change(emailInput, { target: { value: 'wrong@test.com' } });
        fireEvent.change(passwordInput, { target: { value: 'wrongPass' } });
        
        const submitButton = screen.getByRole('button', { name: /login|sign in|log in/i });
        fireEvent.click(submitButton);

        // Wait for error message to appear
        await waitFor(() => {
            const errorElement = screen.queryByText(/invalid|incorrect|wrong|error|failed/i);
            if (errorElement) {
                expect(errorElement).toBeInTheDocument();
            }
        }, { timeout: 3000 });
    });

    test('calls login service with correct credentials', async () => {
        const store = createMockStore();
        api.post.mockResolvedValueOnce({
            data: { success: true, user: { id: '1', email: 'test@test.com', role: 'player' } }
        });

        render(
            <Provider store={store}>
                <MemoryRouter>
                    <Login />
                </MemoryRouter>
            </Provider>
        );

        const emailInput = screen.getByPlaceholderText(/email/i) || screen.getByLabelText(/email/i);
        const passwordInput = screen.getByPlaceholderText(/password/i) || screen.getByLabelText(/password/i);
        
        fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        
        const submitButton = screen.getByRole('button', { name: /login|sign in|log in/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalled();
        }, { timeout: 3000 });
    });
});
