/**
 * Dynamic HTML Implementation - Football-Focused Features
 * Requirement 3: Incorporate Dynamic HTML elements that respond to user interactions
 * NOTE: Only activates on demo page to avoid interfering with normal functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Only initialize on demo page or pages that explicitly request it
    const isDemoPage = window.location.pathname.includes('/demo') || document.getElementById('dhtml-demo-enabled');
    
    if (!isDemoPage) {
        console.log('Dynamic Elements DHTML disabled - not on demo page');
        return;
    }
    
    console.log('Dynamic Elements DHTML initialized for football demo');
    
    // DHTML Integration Start - Football Features
    
    // 2️⃣ Match Countdown Timer (DHTML Only)
    initMatchCountdownTimers();
    
    // Original demo features (preserved)
    initDynamicTeamMembers();
    initDynamicEventFields();
    initDynamicComments();
    initDynamicSportsSelection();
    
    // DHTML Integration End
});

// DHTML Integration Start - Match Countdown Timer
/**
 * 2️⃣ Match Countdown Timer (DHTML Only)
 * Updates every second with setInterval(), purely DOM-based
 */
function initMatchCountdownTimers() {
    console.log('DHTML: Initializing Match Countdown Timers');
    
    // Create countdown timers for demo matches
    createMatchCountdownSection();
    
    // Start countdown intervals
    startCountdownTimers();
}

function createMatchCountdownSection() {
    const countdownSection = document.createElement('div');
    countdownSection.id = 'match-countdown-section';
    countdownSection.innerHTML = `
        <div class="card mt-4">
            <div class="card-header bg-success text-white">
                <h5>⚽ DHTML Demo: Live Match Countdown Timers</h5>
                <small>Pure DHTML - Updates every second without page reload</small>
            </div>
            <div class="card-body">
                <div class="row" id="countdown-matches">
                    <!-- Match countdown cards will be added here -->
                </div>
            </div>
        </div>
    `;
    
    const mainContent = document.querySelector('main, .container, .content');
    if (mainContent) {
        mainContent.appendChild(countdownSection);
    }
    
    // Add sample matches with different countdown times
    const matches = [
        {
            id: 'match-1',
            homeTeam: 'Manchester United',
            awayTeam: 'Liverpool FC',
            kickoffTime: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
            stadium: 'Old Trafford'
        },
        {
            id: 'match-2', 
            homeTeam: 'Arsenal',
            awayTeam: 'Chelsea',
            kickoffTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
            stadium: 'Emirates Stadium'
        },
        {
            id: 'match-3',
            homeTeam: 'Barcelona',
            awayTeam: 'Real Madrid',
            kickoffTime: new Date(Date.now() + 10 * 1000), // 10 seconds from now (for quick demo)
            stadium: 'Camp Nou'
        }
    ];
    
    const matchesContainer = document.getElementById('countdown-matches');
    matches.forEach(match => {
        const matchCard = document.createElement('div');
        matchCard.className = 'col-md-4 mb-3';
        matchCard.innerHTML = `
            <div class="card border-primary">
                <div class="card-body text-center">
                    <h6 class="card-title">${match.homeTeam} vs ${match.awayTeam}</h6>
                    <p class="text-muted small">${match.stadium}</p>
                    <div class="countdown-display" id="countdown-${match.id}">
                        <div class="countdown-text">Calculating...</div>
                    </div>
                    <div class="match-status" id="status-${match.id}"></div>
                </div>
            </div>
        `;
        matchesContainer.appendChild(matchCard);
        
        // Store match data for countdown calculation
        matchCard.dataset.kickoffTime = match.kickoffTime.getTime();
        matchCard.dataset.matchId = match.id;
    });
    
    console.log('DHTML: Created match countdown cards');
}

function startCountdownTimers() {
    // Update countdown every second
    const countdownInterval = setInterval(() => {
        const matchCards = document.querySelectorAll('[data-kickoff-time]');
        let allMatchesStarted = true;
        
        matchCards.forEach(card => {
            const kickoffTime = parseInt(card.dataset.kickoffTime);
            const matchId = card.dataset.matchId;
            const now = Date.now();
            const timeDiff = kickoffTime - now;
            
            const countdownElement = document.getElementById(`countdown-${matchId}`);
            const statusElement = document.getElementById(`status-${matchId}`);
            
            if (timeDiff > 0) {
                allMatchesStarted = false;
                
                // Calculate time components
                const hours = Math.floor(timeDiff / (1000 * 60 * 60));
                const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
                
                // Format time display
                const timeString = `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
                
                // Update countdown display with DHTML
                countdownElement.innerHTML = `
                    <div class="countdown-text">Kickoff in:</div>
                    <div class="countdown-time text-primary font-weight-bold">${timeString}</div>
                `;
                
                // Add pulse animation every 5 seconds
                if (seconds % 5 === 0) {
                    countdownElement.style.animation = 'pulse 0.5s ease';
                    setTimeout(() => {
                        countdownElement.style.animation = '';
                    }, 500);
                }
                
            } else {
                // Match has started - DHTML transformation
                if (!statusElement.classList.contains('match-started')) {
                    // Trigger smooth highlight animation when match starts
                    card.style.transition = 'all 0.5s ease';
                    card.style.backgroundColor = '#d4edda';
                    card.style.border = '2px solid #28a745';
                    
                    countdownElement.innerHTML = `
                        <div class="match-started-text text-success font-weight-bold">
                            ⚽ Match Started!
                        </div>
                    `;
                    
                    statusElement.innerHTML = `
                        <span class="badge badge-success">LIVE</span>
                    `;
                    
                    statusElement.classList.add('match-started');
                    
                    // Add pulsing animation for live matches
                    statusElement.style.animation = 'livePulse 2s infinite';
                    
                    console.log(`DHTML: Match ${matchId} status changed to LIVE`);
                }
            }
        });
        
        // Stop interval if all matches have started (optional cleanup)
        if (allMatchesStarted && document.querySelectorAll('.match-started').length === matchCards.length) {
            console.log('DHTML: All matches started, countdown timers completed');
        }
        
    }, 1000); // Update every second
    
    console.log('DHTML: Countdown timers started');
}
// DHTML Integration End - Match Countdown Timer

/**
 * DHTML: Dynamic Team Member Addition/Removal
 */
function initDynamicTeamMembers() {
    // Add this to team creation/management pages
    const teamContainer = document.getElementById('team-members-container');
    if (!teamContainer) {
        // Create container if it doesn't exist (for demo purposes)
        const container = document.createElement('div');
        container.id = 'team-members-container';
        container.innerHTML = `
            <h4>Team Members</h4>
            <div id="members-list">
                <div class="member-row" data-member="1">
                    <input type="text" placeholder="Member Name" class="form-control member-name" required>
                    <input type="text" placeholder="Position" class="form-control member-position">
                    <button type="button" class="btn btn-danger btn-sm remove-member">Remove</button>
                </div>
            </div>
            <button type="button" id="add-member-btn" class="btn btn-success">+ Add Team Member</button>
            <p class="text-muted">Team members: <span id="member-count">1</span></p>
        `;
        
        // Try to add to existing forms
        const form = document.querySelector('form[action*="team"], form#create-team-form, form.team-form');
        if (form) {
            form.appendChild(container);
        }
    }
    
    let memberCount = 1;
    
    // Add new member
    document.addEventListener('click', function(e) {
        if (e.target.id === 'add-member-btn') {
            memberCount++;
            const membersList = document.getElementById('members-list');
            
            const newMember = document.createElement('div');
            newMember.className = 'member-row';
            newMember.setAttribute('data-member', memberCount);
            newMember.style.opacity = '0';
            newMember.style.transform = 'translateY(-20px)';
            newMember.innerHTML = `
                <input type="text" placeholder="Member Name" class="form-control member-name" required>
                <input type="text" placeholder="Position" class="form-control member-position">
                <button type="button" class="btn btn-danger btn-sm remove-member">Remove</button>
            `;
            
            membersList.appendChild(newMember);
            
            // Animate in
            setTimeout(() => {
                newMember.style.transition = 'all 0.3s ease';
                newMember.style.opacity = '1';
                newMember.style.transform = 'translateY(0)';
            }, 10);
            
            updateMemberCount();
            console.log('DHTML: Added new team member element');
        }
    });
    
    // Remove member
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-member')) {
            const memberRow = e.target.closest('.member-row');
            const remainingMembers = document.querySelectorAll('.member-row').length;
            
            if (remainingMembers > 1) {
                // Animate out
                memberRow.style.transition = 'all 0.3s ease';
                memberRow.style.opacity = '0';
                memberRow.style.transform = 'translateX(-100%)';
                
                setTimeout(() => {
                    memberRow.remove();
                    updateMemberCount();
                    console.log('DHTML: Removed team member element');
                }, 300);
            } else {
                alert('Team must have at least one member!');
            }
        }
    });
    
    function updateMemberCount() {
        const count = document.querySelectorAll('.member-row').length;
        const countElement = document.getElementById('member-count');
        if (countElement) {
            countElement.textContent = count;
            countElement.style.animation = 'pulse 0.3s ease';
            setTimeout(() => countElement.style.animation = '', 300);
        }
    }
}

/**
 * DHTML: Dynamic Event Registration Fields
 */
function initDynamicEventFields() {
    // Create dynamic event registration section
    const eventContainer = document.createElement('div');
    eventContainer.id = 'dynamic-event-registration';
    eventContainer.innerHTML = `
        <div class="card mt-4">
            <div class="card-header">
                <h5>Quick Event Registration</h5>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <label class="form-label">Select Sport:</label>
                    <select id="sport-select" class="form-control">
                        <option value="">Choose a sport...</option>
                        <option value="football">Football</option>
                        <option value="cricket">Cricket</option>
                        <option value="basketball">Basketball</option>
                        <option value="tennis">Tennis</option>
                    </select>
                </div>
                <div id="dynamic-fields-container">
                    <!-- Dynamic fields will be added here -->
                </div>
                <div id="registration-summary" style="display: none;">
                    <h6>Registration Summary:</h6>
                    <ul id="summary-list"></ul>
                    <button type="button" class="btn btn-primary" id="submit-registration">Submit Registration</button>
                </div>
            </div>
        </div>
    `;
    
    // Add to main content area
    const mainContent = document.querySelector('main, .container, .content');
    if (mainContent) {
        mainContent.appendChild(eventContainer);
    }
    
    // Handle sport selection
    document.addEventListener('change', function(e) {
        if (e.target.id === 'sport-select') {
            const sport = e.target.value;
            const container = document.getElementById('dynamic-fields-container');
            
            // Clear existing fields
            container.innerHTML = '';
            
            if (sport) {
                addSportSpecificFields(sport, container);
                console.log(`DHTML: Added ${sport} specific fields`);
            }
        }
    });
    
    function addSportSpecificFields(sport, container) {
        const fields = getSportFields(sport);
        
        fields.forEach((field, index) => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'mb-3 dynamic-field';
            fieldDiv.style.opacity = '0';
            fieldDiv.style.transform = 'translateY(20px)';
            
            fieldDiv.innerHTML = `
                <label class="form-label">${field.label}:</label>
                <${field.type === 'select' ? 'select' : 'input'} 
                    ${field.type !== 'select' ? `type="${field.type}"` : ''} 
                    class="form-control" 
                    data-field="${field.name}"
                    ${field.required ? 'required' : ''}
                    placeholder="${field.placeholder || ''}"
                >
                    ${field.options ? field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('') : ''}
                </${field.type === 'select' ? 'select' : 'input'}>
            `;
            
            container.appendChild(fieldDiv);
            
            // Animate in with stagger
            setTimeout(() => {
                fieldDiv.style.transition = 'all 0.3s ease';
                fieldDiv.style.opacity = '1';
                fieldDiv.style.transform = 'translateY(0)';
            }, index * 100);
        });
        
        // Add change listeners for summary
        container.addEventListener('input', updateRegistrationSummary);
        container.addEventListener('change', updateRegistrationSummary);
    }
    
    function getSportFields(sport) {
        const sportFields = {
            football: [
                { name: 'team_name', label: 'Team Name', type: 'text', required: true },
                { name: 'formation', label: 'Preferred Formation', type: 'select', options: ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1'] },
                { name: 'experience', label: 'Team Experience Level', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced', 'Professional'] }
            ],
            cricket: [
                { name: 'team_name', label: 'Team Name', type: 'text', required: true },
                { name: 'format', label: 'Preferred Format', type: 'select', options: ['T20', 'ODI', 'Test Match'] },
                { name: 'bowling_style', label: 'Team Bowling Strength', type: 'select', options: ['Fast Bowling', 'Spin Bowling', 'All-round'] }
            ],
            basketball: [
                { name: 'team_name', label: 'Team Name', type: 'text', required: true },
                { name: 'league', label: 'League Preference', type: 'select', options: ['Amateur', 'Semi-Pro', 'Professional'] },
                { name: 'home_court', label: 'Home Court', type: 'text' }
            ],
            tennis: [
                { name: 'player_name', label: 'Player Name', type: 'text', required: true },
                { name: 'category', label: 'Category', type: 'select', options: ['Singles', 'Doubles', 'Mixed Doubles'] },
                { name: 'ranking', label: 'Current Ranking (if any)', type: 'text' }
            ]
        };
        
        return sportFields[sport] || [];
    }
    
    function updateRegistrationSummary() {
        const fields = document.querySelectorAll('#dynamic-fields-container [data-field]');
        const summary = document.getElementById('registration-summary');
        const summaryList = document.getElementById('summary-list');
        
        summaryList.innerHTML = '';
        let hasData = false;
        
        fields.forEach(field => {
            if (field.value.trim()) {
                hasData = true;
                const li = document.createElement('li');
                li.textContent = `${field.previousElementSibling.textContent} ${field.value}`;
                summaryList.appendChild(li);
            }
        });
        
        if (hasData) {
            summary.style.display = 'block';
            summary.style.animation = 'fadeIn 0.3s ease';
        } else {
            summary.style.display = 'none';
        }
    }
}

/**
 * DHTML: Dynamic Comment System
 */
function initDynamicComments() {
    // Create dynamic comment section
    const commentSection = document.createElement('div');
    commentSection.id = 'dynamic-comments';
    commentSection.innerHTML = `
        <div class="card mt-4">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5>Comments & Feedback</h5>
                <button type="button" class="btn btn-primary btn-sm" id="add-comment-btn">Add Comment</button>
            </div>
            <div class="card-body">
                <div id="comments-list">
                    <!-- Comments will be added here dynamically -->
                </div>
                <div id="comment-form" style="display: none;">
                    <div class="mb-3">
                        <label class="form-label">Your Comment:</label>
                        <textarea id="comment-text" class="form-control" rows="3" placeholder="Share your thoughts..."></textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Rating:</label>
                        <div id="star-rating">
                            <span class="star" data-rating="1">★</span>
                            <span class="star" data-rating="2">★</span>
                            <span class="star" data-rating="3">★</span>
                            <span class="star" data-rating="4">★</span>
                            <span class="star" data-rating="5">★</span>
                        </div>
                    </div>
                    <button type="button" class="btn btn-success" id="submit-comment">Submit Comment</button>
                    <button type="button" class="btn btn-secondary" id="cancel-comment">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    // Add to page
    const mainContent = document.querySelector('main, .container, .content');
    if (mainContent) {
        mainContent.appendChild(commentSection);
    }
    
    let selectedRating = 0;
    
    // Show comment form
    document.addEventListener('click', function(e) {
        if (e.target.id === 'add-comment-btn') {
            const form = document.getElementById('comment-form');
            form.style.display = 'block';
            form.style.opacity = '0';
            form.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                form.style.transition = 'all 0.3s ease';
                form.style.opacity = '1';
                form.style.transform = 'translateY(0)';
            }, 10);
            
            console.log('DHTML: Showed comment form');
        }
    });
    
    // Handle star rating
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('star')) {
            selectedRating = parseInt(e.target.dataset.rating);
            const stars = document.querySelectorAll('.star');
            
            stars.forEach((star, index) => {
                if (index < selectedRating) {
                    star.style.color = '#ffc107';
                } else {
                    star.style.color = '#ccc';
                }
            });
            
            console.log(`DHTML: Selected ${selectedRating} star rating`);
        }
    });
    
    // Submit comment
    document.addEventListener('click', function(e) {
        if (e.target.id === 'submit-comment') {
            const commentText = document.getElementById('comment-text').value.trim();
            
            if (commentText && selectedRating > 0) {
                addCommentToList(commentText, selectedRating);
                
                // Reset form
                document.getElementById('comment-text').value = '';
                selectedRating = 0;
                document.querySelectorAll('.star').forEach(star => star.style.color = '#ccc');
                document.getElementById('comment-form').style.display = 'none';
                
                console.log('DHTML: Added new comment dynamically');
            } else {
                alert('Please enter a comment and select a rating!');
            }
        }
    });
    
    // Cancel comment
    document.addEventListener('click', function(e) {
        if (e.target.id === 'cancel-comment') {
            document.getElementById('comment-form').style.display = 'none';
            document.getElementById('comment-text').value = '';
            selectedRating = 0;
            document.querySelectorAll('.star').forEach(star => star.style.color = '#ccc');
        }
    });
    
    function addCommentToList(text, rating) {
        const commentsList = document.getElementById('comments-list');
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment-item border-bottom pb-3 mb-3';
        commentDiv.style.opacity = '0';
        commentDiv.style.transform = 'translateY(20px)';
        
        const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
        const timestamp = new Date().toLocaleString();
        
        commentDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <div class="comment-rating" style="color: #ffc107;">${stars}</div>
                    <p class="comment-text mt-2">${text}</p>
                    <small class="text-muted">Posted on ${timestamp}</small>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger delete-comment">×</button>
            </div>
        `;
        
        commentsList.insertBefore(commentDiv, commentsList.firstChild);
        
        // Animate in
        setTimeout(() => {
            commentDiv.style.transition = 'all 0.3s ease';
            commentDiv.style.opacity = '1';
            commentDiv.style.transform = 'translateY(0)';
        }, 10);
        
        // Add delete functionality
        commentDiv.querySelector('.delete-comment').addEventListener('click', function() {
            commentDiv.style.transition = 'all 0.3s ease';
            commentDiv.style.opacity = '0';
            commentDiv.style.transform = 'translateX(100%)';
            
            setTimeout(() => {
                commentDiv.remove();
                console.log('DHTML: Removed comment dynamically');
            }, 300);
        });
    }
}

/**
 * DHTML: Dynamic Sports Selection with Live Preview
 */
function initDynamicSportsSelection() {
    // Add to signup/profile pages
    const sportsContainer = document.querySelector('[name="sports"], #sports-selection');
    if (!sportsContainer) return;
    
    const parentDiv = sportsContainer.closest('.form-group, .mb-3') || sportsContainer.parentElement;
    
    // Create dynamic sports selector
    const dynamicSports = document.createElement('div');
    dynamicSports.innerHTML = `
        <div class="dynamic-sports-selection mt-3">
            <h6>Select Your Sports (click to add/remove):</h6>
            <div class="sports-grid">
                <div class="sport-option" data-sport="football">⚽ Football</div>
                <div class="sport-option" data-sport="cricket">🏏 Cricket</div>
                <div class="sport-option" data-sport="basketball">🏀 Basketball</div>
                <div class="sport-option" data-sport="tennis">🎾 Tennis</div>
                <div class="sport-option" data-sport="volleyball">🏐 Volleyball</div>
                <div class="sport-option" data-sport="badminton">🏸 Badminton</div>
            </div>
            <div class="selected-sports mt-3">
                <strong>Selected: </strong>
                <span id="selected-sports-list">None</span>
            </div>
        </div>
    `;
    
    parentDiv.appendChild(dynamicSports);
    
    const selectedSports = new Set();
    
    // Handle sport selection
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('sport-option')) {
            const sport = e.target.dataset.sport;
            
            if (selectedSports.has(sport)) {
                selectedSports.delete(sport);
                e.target.classList.remove('selected');
                e.target.style.transform = 'scale(0.95)';
                console.log(`DHTML: Removed ${sport} from selection`);
            } else {
                selectedSports.add(sport);
                e.target.classList.add('selected');
                e.target.style.transform = 'scale(1.05)';
                console.log(`DHTML: Added ${sport} to selection`);
            }
            
            setTimeout(() => {
                e.target.style.transform = 'scale(1)';
            }, 150);
            
            updateSportsDisplay();
        }
    });
    
    function updateSportsDisplay() {
        const listElement = document.getElementById('selected-sports-list');
        if (selectedSports.size === 0) {
            listElement.textContent = 'None';
            listElement.style.color = '#6c757d';
        } else {
            listElement.textContent = Array.from(selectedSports).join(', ');
            listElement.style.color = '#28a745';
            listElement.style.animation = 'pulse 0.3s ease';
            setTimeout(() => listElement.style.animation = '', 300);
        }
        
        // Update original form field if it exists
        if (sportsContainer) {
            sportsContainer.value = Array.from(selectedSports).join(', ');
        }
    }
}

// Add CSS for dynamic elements
const dynamicStyle = document.createElement('style');
dynamicStyle.textContent = `
    .member-row {
        display: flex;
        gap: 10px;
        margin-bottom: 10px;
        align-items: center;
    }
    
    .member-row input {
        flex: 1;
    }
    
    .sports-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 10px;
        margin-top: 10px;
    }
    
    .sport-option {
        padding: 10px;
        border: 2px solid #ddd;
        border-radius: 8px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        user-select: none;
    }
    
    .sport-option:hover {
        border-color: #007bff;
        background-color: #f8f9fa;
    }
    
    .sport-option.selected {
        border-color: #28a745;
        background-color: #d4edda;
        color: #155724;
    }
    
    .star {
        font-size: 20px;
        cursor: pointer;
        color: #ccc;
        transition: color 0.2s ease;
        margin-right: 5px;
    }
    
    .star:hover {
        color: #ffc107;
    }
    
    .comment-item {
        transition: all 0.3s ease;
    }
    
    .dynamic-field {
        transition: all 0.3s ease;
    }
    
    /* DHTML Integration Start - Football-specific animations */
    
    .countdown-display {
        padding: 15px;
        border-radius: 8px;
        background: #f8f9fa;
        margin: 10px 0;
    }
    
    .countdown-time {
        font-size: 1.2em;
        font-weight: bold;
    }
    
    .match-started-text {
        font-size: 1.1em;
        animation: matchStarted 0.5s ease;
    }
    
    @keyframes matchStarted {
        0% { transform: scale(0.8); opacity: 0; }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); opacity: 1; }
    }
    
    @keyframes livePulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
    
    /* DHTML Integration End */
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(dynamicStyle);