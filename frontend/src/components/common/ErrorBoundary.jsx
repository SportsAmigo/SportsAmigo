import React from 'react';
import Button from './Button';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                    <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                        <div className="mb-4">
                            <i className="fa fa-exclamation-triangle text-6xl text-red-500"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            Oops! Something went wrong
                        </h2>
                        <p className="text-gray-600 mb-4">
                            We're sorry for the inconvenience. Please try refreshing the page.
                        </p>
                        
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-4 p-4 bg-red-50 rounded-lg text-left">
                                <p className="text-sm text-red-800 font-mono">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}
                        
                        <Button 
                            onClick={() => window.location.reload()}
                            variant="danger"
                            fullWidth
                        >
                            <i className="fa fa-refresh mr-2"></i>
                            Refresh Page
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

