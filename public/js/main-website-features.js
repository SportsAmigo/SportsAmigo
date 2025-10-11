// Main Website AJAX & DHTML Integration
// No demo page restrictions - works on main website

document.addEventListener('DOMContentLoaded', function() {
    console.log('🏈 AJAX & DHTML Features Active on Main Website');
    
    // Initialize features for all pages
    initMainWebsiteFeatures();
});

function initMainWebsiteFeatures() {
    // Check if we're on the homepage ONLY - be very strict
    const currentPath = window.location.pathname;
    const isHomepage = currentPath === '/' || currentPath === '/index' || currentPath === '/home';
    
    if (isHomepage) {
        console.log('🏠 Homepage detected - initializing homepage features');
        initHomepageScoreboard();
        initAnnouncementBar(); // Only show on homepage
    } else {
        console.log('📱 Dashboard page detected - skipping announcement bar');
        // Ensure announcement bar is completely hidden on dashboard pages
        const existingBar = document.getElementById('announcement-bar');
        if (existingBar) {
            existingBar.remove();
        }
    }
    
    // Check if we're on player dashboard and initialize countdown timers
    if (currentPath.includes('/player/dashboard')) {
        initDashboardCountdownTimers();
    }
    
    // Initialize quick registration buttons if they exist
    initQuickRegistrationButtons();
}

function initHomepageScoreboard() {
    console.log('📊 Initializing homepage live scoreboard');
    
    const scoreboardContainer = document.getElementById('scoreboard-container');
    if (!scoreboardContainer) return;
    
    // Start fetching live scores immediately
    fetchLiveScores();
    
    // Continue fetching every 10 seconds
    setInterval(fetchLiveScores, 10000);
}

// DHTML Feature: Dashboard Countdown Timers
function initDashboardCountdownTimers() {
    console.log('⏰ Initializing dashboard countdown timers');
    
    const timerContainer = document.getElementById('dashboard-countdown-timers');
    if (!timerContainer) return;
    
    // Sample upcoming matches for the dashboard
    const upcomingMatches = [
        {
            id: 'dashboard-match-1',
            teams: 'Your Team vs Rivals FC',
            date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
            tournament: 'Local League',
            type: 'Your Match'
        },
        {
            id: 'dashboard-match-2', 
            teams: 'Champions vs United',
            date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
            tournament: 'Premier League',
            type: 'Featured Match'
        }
    ];
    
    // Clear loading message
    timerContainer.innerHTML = '';
    
    upcomingMatches.forEach(match => {
        const matchDiv = document.createElement('div');
        matchDiv.className = 'countdown-display mb-3';
        matchDiv.style.cssText = 'border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; background: #f8f9fa;';
        
        matchDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <div class="fw-bold text-primary">${match.tournament}</div>
                    <div class="text-dark">${match.teams}</div>
                    <small class="text-muted">${match.type}</small>
                </div>
                <div class="text-end">
                    <div class="countdown-time fw-bold text-success" id="dashboard-timer-${match.id}">
                        Loading...
                    </div>
                    <small class="text-muted">Time remaining</small>
                </div>
            </div>
        `;
        
        timerContainer.appendChild(matchDiv);
        
        // Start countdown for this match
        updateDashboardCountdown(match);
        setInterval(() => updateDashboardCountdown(match), 1000);
    });
}

function updateDashboardCountdown(match) {
    const timerElement = document.getElementById(`dashboard-timer-${match.id}`);
    if (!timerElement) return;
    
    const now = new Date().getTime();
    const matchTime = match.date.getTime();
    const timeDiff = matchTime - now;
    
    if (timeDiff > 0) {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
            timerElement.innerHTML = `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            timerElement.innerHTML = `${hours}h ${minutes}m`;
        } else {
            timerElement.innerHTML = `${minutes}m`;
        }
        timerElement.className = 'countdown-time fw-bold text-success';
    } else {
        timerElement.innerHTML = '🔴 LIVE NOW!';
        timerElement.className = 'countdown-time fw-bold text-danger match-started-text';
    }
}

// AJAX Feature 1: Live Football Scoreboard
async function fetchLiveScores() {
    console.log('AJAX: Fetching live football scores...');
    
    const scoreboardContainer = document.getElementById('scoreboard-container');
    if (!scoreboardContainer) return;
    
    try {
        // Simulate AJAX call to get live scores
        const scores = await generateMockLiveScores();
        
        // Update DOM with new scores using DHTML
        updateScoreboardDisplay(scores);
        
        console.log('✅ AJAX + DHTML: Live scores updated successfully');
        
    } catch (error) {
        console.error('❌ AJAX Error:', error);
        showScoreboardError();
    }
}

function updateScoreboardDisplay(scores) {
    const scoreboardContainer = document.getElementById('scoreboard-container');
    if (!scoreboardContainer) return;
    
    // Clear loading message
    scoreboardContainer.innerHTML = '';
    
    scores.forEach(match => {
        // Create match element using DHTML
        const matchElement = document.createElement('div');
        matchElement.className = 'scoreboard-item';
        matchElement.setAttribute('data-match-id', match.id);
        
        matchElement.innerHTML = `
            <div class="match-info">
                <h4>${match.tournament}</h4>
                <div class="teams">${match.homeTeam} vs ${match.awayTeam}</div>
                <div class="time">${match.status}</div>
            </div>
            <div class="match-score">
                <div class="score">${match.homeScore} - ${match.awayScore}</div>
                ${match.isLive ? '<span class="live-indicator">LIVE</span>' : ''}
            </div>
        `;
        
        // Add flash animation for score changes
        if (match.justScored) {
            matchElement.classList.add('score-flash');
            setTimeout(() => matchElement.classList.remove('score-flash'), 1000);
        }
        
        scoreboardContainer.appendChild(matchElement);
    });
}

function showScoreboardError() {
    const scoreboardContainer = document.getElementById('scoreboard-container');
    if (!scoreboardContainer) return;
    
    scoreboardContainer.innerHTML = `
        <div class="loading-message" style="color: #dc3545;">
            ⚠️ Unable to load live scores. Retrying...
        </div>
    `;
}

// AJAX Feature 2: Announcement Bar
function initAnnouncementBar() {
    console.log('AJAX: Initializing announcement bar');
    
    const announcementBar = document.getElementById('announcement-bar');
    if (!announcementBar) return;
    
    // Show announcement bar
    announcementBar.style.display = 'block';
    
    // Start fetching announcements immediately
    fetchAnnouncements();
    
    // Continue fetching every 15 seconds
    setInterval(fetchAnnouncements, 15000);
}

async function fetchAnnouncements() {
    console.log('AJAX: Fetching latest announcements...');
    
    try {
        // Simulate AJAX call to get announcements
        const announcement = await generateMockAnnouncements();
        
        // Update announcement bar with slide effect
        updateAnnouncementDisplay(announcement);
        
        console.log('✅ AJAX + DHTML: Announcement updated');
        
    } catch (error) {
        console.error('❌ AJAX Error in announcements:', error);
    }
}

function updateAnnouncementDisplay(announcement) {
    const announcementText = document.getElementById('announcement-text');
    if (!announcementText) return;
    
    // Slide out old announcement
    announcementText.style.animation = 'slideOut 0.3s ease';
    
    setTimeout(() => {
        // Update content
        announcementText.textContent = announcement.message;
        
        // Slide in new announcement
        announcementText.style.animation = 'slideIn 0.5s ease';
    }, 300);
}

// AJAX Feature 3: Quick Registration
function initQuickRegistrationButtons() {
    // Look for existing quick registration buttons
    const quickButtons = document.querySelectorAll('.quick-register-btn');
    console.log(`Found ${quickButtons.length} quick registration buttons`);
}

async function handleQuickRegistration(matchId, button) {
    if (!button) return;
    
    console.log(`AJAX: Handling quick registration for match ${matchId}`);
    
    const originalContent = button.innerHTML;
    const isRegistered = button.classList.contains('registered');
    const action = isRegistered ? 'unregister' : 'register';
    
    // Update button state immediately (optimistic UI)
    button.disabled = true;
    button.innerHTML = '⏳ Processing...';
    
    try {
        // Simulate AJAX registration call
        const response = await simulateAsyncRequest(`/api/matches/${matchId}/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.success) {
            // Update registration state with DHTML
            setTimeout(() => {
                if (!isRegistered) {
                    // Successfully registered
                    button.innerHTML = '✅ Registered';
                    button.className = 'quick-register-btn registered';
                    button.title = 'Click to leave match';
                } else {
                    // Successfully unregistered
                    button.innerHTML = '👥 Quick Join';
                    button.className = 'quick-register-btn';
                    button.title = 'Click to join match';
                }
                
                button.disabled = false;
                
                // Add success animation
                button.style.animation = 'successPulse 0.6s ease';
                setTimeout(() => {
                    button.style.animation = '';
                }, 600);
                
            }, 500);
            
            console.log(`✅ AJAX + DHTML: Successfully ${action}ed for match ${matchId}`);
            
        } else {
            throw new Error(response.message || `${action} failed`);
        }
        
    } catch (error) {
        console.error(`❌ AJAX Error in match ${action}:`, error);
        
        // Reset button on error
        button.disabled = false;
        button.innerHTML = originalContent;
        
        // Show error feedback
        button.style.animation = 'shake 0.3s ease';
        setTimeout(() => {
            button.style.animation = '';
        }, 300);
        
        // Show error message
        showTemporaryMessage(`Failed to ${action}. Please try again.`, 'error');
    }
}

// Mock data generators
async function generateMockLiveScores() {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const matches = [
        {
            id: 'live-1',
            tournament: 'Premier League',
            homeTeam: 'Manchester United',
            awayTeam: 'Liverpool',
            homeScore: Math.floor(Math.random() * 4),
            awayScore: Math.floor(Math.random() * 4),
            status: 'Live - 67\'',
            isLive: true,
            justScored: Math.random() > 0.7
        },
        {
            id: 'live-2', 
            tournament: 'La Liga',
            homeTeam: 'Barcelona',
            awayTeam: 'Real Madrid',
            homeScore: Math.floor(Math.random() * 3),
            awayScore: Math.floor(Math.random() * 3),
            status: 'Live - 89\'',
            isLive: true,
            justScored: Math.random() > 0.8
        },
        {
            id: 'finished-1',
            tournament: 'Premier League',
            homeTeam: 'Chelsea',
            awayTeam: 'Arsenal',
            homeScore: 2,
            awayScore: 1,
            status: 'Finished',
            isLive: false,
            justScored: false
        }
    ];
    
    return matches;
}

async function generateMockAnnouncements() {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const announcements = [
        { message: "🏆 Registration now open for the Summer Football Championship!" },
        { message: "⚽ New training facilities available for youth teams" },
        { message: "🎯 Weekend tournament registration closing soon - sign up now!" },
        { message: "🏃‍♂️ Join our fitness program - improve your game today" },
        { message: "📅 Match schedules updated - check your dashboard for changes" }
    ];
    
    return announcements[Math.floor(Math.random() * announcements.length)];
}

// Utility functions
async function simulateAsyncRequest(url, options = {}) {
    console.log(`AJAX: Simulating request to ${url}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate successful response
    return {
        success: true,
        message: 'Operation completed successfully',
        data: { url, timestamp: new Date().toISOString() }
    };
}

function showTemporaryMessage(message, type = 'info') {
    // Create temporary message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert alert-${type === 'error' ? 'danger' : 'success'}`;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        max-width: 300px;
        animation: slideIn 0.3s ease;
    `;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// Additional CSS animations for slideOut
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(additionalStyles);