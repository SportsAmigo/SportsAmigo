/**
 * SportsAmigo AJAX/Fetch API Implementation - Production Ready
 * Real-time features for dashboard pages
 */

// Global configuration
const API_BASE_URL = '/api';
let dashboardUpdateInterval = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('SportsAmigo AJAX functionality initialized');
    
    // Initialize dashboard features
    initDashboardUpdates();
    initAsyncForms();
    initEventSearch();
});

/**
 * Dashboard Live Updates - Real-time data for user dashboards
 */
function initDashboardUpdates() {
    // Update dashboard stats every 30 seconds
    updateDashboardStats();
    dashboardUpdateInterval = setInterval(updateDashboardStats, 30000);
    
    // Initialize quick actions
    initQuickActions();
}

async function updateDashboardStats() {
    try {
        const statsElements = document.querySelectorAll('[data-live-stat]');
        if (statsElements.length === 0) return;
        
        const response = await fetch(`${API_BASE_URL}/dashboard-stats`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            statsElements.forEach(element => {
                const statType = element.dataset.liveStat;
                if (data[statType] !== undefined) {
                    const oldValue = element.textContent;
                    element.textContent = data[statType];
                    
                    // Animate if value changed
                    if (oldValue !== data[statType]) {
                        element.style.animation = 'statUpdate 0.5s ease';
                        setTimeout(() => element.style.animation = '', 500);
                    }
                }
            });
            
            console.log('Dashboard stats updated');
        }
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
}

/**
 * Quick Actions - AJAX form submissions for dashboard actions
 */
function initQuickActions() {
    // Team join/leave buttons
    document.addEventListener('click', handleQuickTeamAction);
    
    // Event registration buttons
    document.addEventListener('click', handleQuickEventAction);
}

async function handleQuickTeamAction(event) {
    const button = event.target;
    if (!button.matches('[data-team-action]')) return;
    
    event.preventDefault();
    
    const teamId = button.dataset.teamId;
    const action = button.dataset.teamAction; // 'join' or 'leave'
    
    if (!teamId || !action) return;
    
    try {
        // Show loading state
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = action === 'join' ? 'Joining...' : 'Leaving...';
        
        const response = await fetch(`${API_BASE_URL}/teams/${teamId}/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            // Update button state
            if (action === 'join') {
                button.textContent = 'Leave Team';
                button.dataset.teamAction = 'leave';
                button.className = button.className.replace('btn-outline-success', 'btn-outline-danger');
            } else {
                button.textContent = 'Join Team';
                button.dataset.teamAction = 'join';
                button.className = button.className.replace('btn-outline-danger', 'btn-outline-success');
            }
            
            showNotification(result.message || `Successfully ${action}ed team`, 'success');
        } else {
            throw new Error(result.message || `Failed to ${action} team`);
        }
        
    } catch (error) {
        console.error(`Error ${action}ing team:`, error);
        button.textContent = originalText;
        showNotification(error.message, 'error');
    } finally {
        button.disabled = false;
    }
}

async function handleQuickEventAction(event) {
    const button = event.target;
    if (!button.matches('[data-event-action]')) return;
    
    event.preventDefault();
    
    const eventId = button.dataset.eventId;
    const action = button.dataset.eventAction; // 'register' or 'unregister'
    
    if (!eventId || !action) return;
    
    try {
        // Show loading state
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = action === 'register' ? 'Registering...' : 'Unregistering...';
        
        const response = await fetch(`${API_BASE_URL}/events/${eventId}/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            // Update button state
            if (action === 'register') {
                button.textContent = 'Unregister';
                button.dataset.eventAction = 'unregister';
                button.className = button.className.replace('btn-success', 'btn-outline-danger');
            } else {
                button.textContent = 'Register';
                button.dataset.eventAction = 'register';
                button.className = button.className.replace('btn-outline-danger', 'btn-success');
            }
            
            showNotification(result.message || `Successfully ${action}ed for event`, 'success');
        } else {
            throw new Error(result.message || `Failed to ${action} for event`);
        }
        
    } catch (error) {
        console.error(`Error ${action}ing for event:`, error);
        button.textContent = originalText;
        showNotification(error.message, 'error');
    } finally {
        button.disabled = false;
    }
}
/**
 * Async Form Enhancement - Real forms in dashboard pages
 */
function initAsyncForms() {
    // Enhance existing forms with AJAX submission
    const forms = document.querySelectorAll('form[data-async="true"]');
    forms.forEach(form => {
        form.addEventListener('submit', handleAsyncFormSubmit);
    });
    
    // Email availability check for registration forms
    const emailInputs = document.querySelectorAll('input[name="email"][data-check-availability]');
    emailInputs.forEach(input => {
        let checkTimeout;
        input.addEventListener('input', function() {
            clearTimeout(checkTimeout);
            const email = this.value.trim();
            
            if (email && email.includes('@')) {
                checkTimeout = setTimeout(() => {
                    checkEmailAvailability(email, this);
                }, 500);
            }
        });
    });
}

async function handleAsyncFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
    const formData = new FormData(form);
    
    try {
        // Show loading state
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';
        
        const response = await fetch(form.action, {
            method: form.method || 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showNotification(result.message || 'Form submitted successfully!', 'success');
            
            // Reset form if specified
            if (form.dataset.resetOnSuccess !== 'false') {
                form.reset();
            }
            
            // Redirect if specified
            if (result.redirect) {
                setTimeout(() => {
                    window.location.href = result.redirect;
                }, 1000);
            }
        } else {
            throw new Error(result.message || 'Form submission failed');
        }
        
    } catch (error) {
        console.error('Form submission error:', error);
        showNotification(error.message, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
}

async function checkEmailAvailability(email, inputElement) {
    try {
        // Remove previous result
        const existingResult = inputElement.parentNode.querySelector('.email-availability-result');
        if (existingResult) existingResult.remove();
        
        // Add loading indicator
        const loader = document.createElement('small');
        loader.className = 'email-check-loader text-muted';
        loader.textContent = 'Checking...';
        inputElement.parentNode.appendChild(loader);
        
        const response = await fetch(`${API_BASE_URL}/check-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const result = await response.json();
        
        // Remove loader
        loader.remove();
        
        // Show result
        const resultElement = document.createElement('small');
        resultElement.className = 'email-availability-result';
        
        if (result.available) {
            resultElement.textContent = '✓ Email available';
            resultElement.style.color = 'var(--primary-green)';
            inputElement.style.borderColor = 'var(--primary-green)';
        } else {
            resultElement.textContent = '✗ Email already registered';
            resultElement.style.color = 'var(--primary-red)';
            inputElement.style.borderColor = 'var(--primary-red)';
        }
        
        inputElement.parentNode.appendChild(resultElement);
        
    } catch (error) {
        console.error('Email availability check error:', error);
        const loader = inputElement.parentNode.querySelector('.email-check-loader');
        if (loader) loader.remove();
    }
}

/**
 * Event Search - Real-time search in dashboard pages
 */
function initEventSearch() {
    const searchInput = document.querySelector('#event-search-input');
    const categoryFilter = document.querySelector('#event-category-filter');
    const resultsContainer = document.querySelector('#search-results');
    
    if (!searchInput || !resultsContainer) return;
    
    let searchTimeout;
    
    // Real-time search
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.trim();
        
        if (query.length >= 2) {
            searchTimeout = setTimeout(() => {
                performEventSearch(query, categoryFilter?.value || '');
            }, 300);
        } else if (query.length === 0) {
            resultsContainer.innerHTML = '';
        }
    });
    
    // Category filter
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            const query = searchInput.value.trim();
            if (query.length >= 2) {
                performEventSearch(query, this.value);
            }
        });
    }
}

async function performEventSearch(query, category = '') {
    const resultsContainer = document.querySelector('#search-results');
    if (!resultsContainer) return;
    
    try {
        // Show loading state
        resultsContainer.innerHTML = `
            <div class="text-center p-3">
                <div class="spinner-border spinner-border-sm" role="status"></div>
                <span class="ml-2">Searching events...</span>
            </div>
        `;
        
        const response = await fetch(`${API_BASE_URL}/search-events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, category })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            displaySearchResults(result.events || []);
        } else {
            throw new Error(result.message || 'Search failed');
        }
        
    } catch (error) {
        console.error('Event search error:', error);
        resultsContainer.innerHTML = `
            <div class="alert alert-warning">
                <strong>Search Error:</strong> Unable to search events. Please try again.
            </div>
        `;
    }
}

function displaySearchResults(events) {
    const resultsContainer = document.querySelector('#search-results');
    if (!resultsContainer) return;
    
    if (events.length === 0) {
        resultsContainer.innerHTML = '<p class="text-muted p-3">No events found matching your criteria.</p>';
        return;
    }
    
    const resultsHTML = events.map(event => `
        <div class="event-result-card border rounded p-3 mb-3">
            <div class="row">
                <div class="col-md-8">
                    <h6>${event.name}</h6>
                    <p class="text-muted mb-1">📅 ${event.date} | 📍 ${event.location}</p>
                    <p class="mb-2">${event.description}</p>
                    <span class="badge badge-secondary">${event.sport}</span>
                </div>
                <div class="col-md-4 text-right">
                    <button class="btn btn-outline-primary btn-sm" 
                            onclick="viewEventDetails('${event.id}')">
                        View Details
                    </button>
                    <button class="btn btn-success btn-sm" 
                            data-event-action="register" 
                            data-event-id="${event.id}">
                        Register
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    resultsContainer.innerHTML = resultsHTML;
}

// Global function for viewing event details
window.viewEventDetails = async function(eventId) {
    try {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`);
        const result = await response.json();
        
        if (response.ok) {
            // You can customize this to show details in a modal or redirect
            showNotification(`Loading details for: ${result.event?.name || 'Event'}`, 'info');
            window.location.href = `/events/${eventId}`;
        } else {
            throw new Error(result.message || 'Failed to load event details');
        }
    } catch (error) {
        console.error('Error loading event details:', error);
        showNotification(error.message, 'error');
    }
};

/**
 * Notification System - Clean notification display
 */
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification-toast');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification-toast alert alert-${type === 'error' ? 'danger' : type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    notification.innerHTML = `
        <button type="button" class="close" onclick="this.parentElement.remove()">
            <span>&times;</span>
        </button>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    // Fade in
    setTimeout(() => notification.style.opacity = '1', 10);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Add required CSS styles
const productionStyles = document.createElement('style');
productionStyles.textContent = `
    /* SportsAmigo AJAX Styles */
    @keyframes statUpdate {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); color: var(--primary-green); }
        100% { transform: scale(1); }
    }
    
    .email-availability-result {
        display: block;
        margin-top: 4px;
        font-size: 0.875rem;
    }
    
    .event-result-card {
        transition: all 0.3s ease;
    }
    
    .event-result-card:hover {
        border-color: var(--primary-green) !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .notification-toast {
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        border: none;
        border-radius: 8px;
    }
    
    .notification-toast .close {
        padding: 0.5rem;
        margin: -0.5rem -0.5rem -0.5rem auto;
    }
`;
document.head.appendChild(productionStyles);

// Cleanup function for when page unloads
window.addEventListener('beforeunload', function() {
    if (dashboardUpdateInterval) {
        clearInterval(dashboardUpdateInterval);
    }
});
