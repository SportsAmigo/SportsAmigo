// Event Page JavaScript Functionality

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize event registration handlers
    initEventRegistration();
    
    // Initialize facility booking system
    initFacilityBooking();
    
    // Initialize coaching registration
    initCoachingRegistration();
    
    // Initialize event filtering and search
    initEventFiltering();
    
    // Initialize league table sorting
    initLeagueTableSorting();
    
    // Initialize countdown timers for upcoming events
    initCountdownTimers();
    
    // Initialize animated stats
    initAnimatedStats();
    
    // Mobile navigation menu (already in the original files)
    var navLinks = document.getElementById("navLinks");
    if (navLinks) {
        window.showMenu = function() {
            navLinks.style.right = "0";
        };
        window.hideMenu = function() {
            navLinks.style.right = "-200px";
        };
    }
});

// Event Registration System
function initEventRegistration() {
    const registerButtons = document.querySelectorAll('.event-btn');
    
    registerButtons.forEach(button => {
        if (button.textContent.includes('Register')) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Get event details from the parent card
                const eventCard = this.closest('.event-card');
                const eventName = eventCard.querySelector('h3').textContent;
                const eventDate = eventCard.querySelector('.event-date .day').textContent + ' ' + 
                                 eventCard.querySelector('.event-date .month').textContent;
                const eventLocation = eventCard.querySelector('.event-location').textContent;
                
                // Show registration modal with event details
                showRegistrationModal(eventName, eventDate, eventLocation);
            });
        }
    });
}

// Show registration modal with event details
function showRegistrationModal(eventName, eventDate, eventLocation) {
    // Create modal elements
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Modal header
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    modalHeader.innerHTML = `
        <h3>Register for ${eventName}</h3>
        <span class="close-modal">&times;</span>
    `;
    
    // Modal body
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    modalBody.innerHTML = `
        <p><strong>Event:</strong> ${eventName}</p>
        <p><strong>Date:</strong> ${eventDate}</p>
        <p><strong>Location:</strong> ${eventLocation}</p>
        <form id="registration-form">
            <div class="form-group">
                <label for="team-name">Team Name:</label>
                <input type="text" id="team-name" name="team-name" required>
            </div>
            <div class="form-group">
                <label for="captain-name">Captain Name:</label>
                <input type="text" id="captain-name" name="captain-name" required>
            </div>
            <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" required>
            </div>
            <div class="form-group">
                <label for="phone">Phone:</label>
                <input type="tel" id="phone" name="phone" required>
            </div>
            <div class="form-group">
                <label for="players">Number of Players:</label>
                <input type="number" id="players" name="players" min="1" required>
            </div>
            <button type="submit" class="submit-btn">Submit Registration</button>
        </form>
    `;
    
    // Assemble modal
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalOverlay.appendChild(modalContent);
    
    // Add modal to the body
    document.body.appendChild(modalOverlay);
    
    // Show modal
    setTimeout(() => {
        modalOverlay.classList.add('active');
    }, 10);
    
    // Close modal function
    const closeModal = () => {
        modalOverlay.classList.remove('active');
        setTimeout(() => {
            document.body.removeChild(modalOverlay);
        }, 300);
    };
    
    // Close button event
    modalContent.querySelector('.close-modal').addEventListener('click', closeModal);
    
    // Close on outside click
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });
    
    // Form submission
    const form = modalContent.querySelector('#registration-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Simulate form submission
        const submitBtn = this.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        
        setTimeout(() => {
            // Show success message
            modalBody.innerHTML = `
                <div class="success-message">
                    <i class="fa fa-check-circle"></i>
                    <h3>Registration Successful!</h3>
                    <p>Thank you for registering for ${eventName}. We've sent a confirmation email to your registered email address.</p>
                    <button class="close-btn">Close</button>
                </div>
            `;
            
            // Add event listener to the new close button
            modalBody.querySelector('.close-btn').addEventListener('click', closeModal);
        }, 1500);
    });
}

// Facility Booking System
function initFacilityBooking() {
    const bookingButtons = document.querySelectorAll('.facility-btn');
    
    bookingButtons.forEach(button => {
        if (button.textContent.includes('Book')) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Get facility details
                const facilityCard = this.closest('.facility-card');
                const facilityName = facilityCard.querySelector('h3').textContent;
                const facilityPrice = facilityCard.querySelector('.price').textContent;
                
                // Show booking modal
                showBookingModal(facilityName, facilityPrice);
            });
        }
    });
}

// Show facility booking modal
function showBookingModal(facilityName, facilityPrice) {
    // Create modal elements (similar to registration modal)
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Modal header
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    modalHeader.innerHTML = `
        <h3>Book ${facilityName}</h3>
        <span class="close-modal">&times;</span>
    `;
    
    // Modal body with date picker and time slots
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    
    // Get today's date and format it for the date input min attribute
    const today = new Date().toISOString().split('T')[0];
    
    modalBody.innerHTML = `
        <p><strong>Facility:</strong> ${facilityName}</p>
        <p><strong>Price:</strong> ${facilityPrice} / hour</p>
        <form id="booking-form">
            <div class="form-group">
                <label for="booking-date">Select Date:</label>
                <input type="date" id="booking-date" name="booking-date" min="${today}" required>
            </div>
            <div class="form-group">
                <label>Select Time Slot:</label>
                <div class="time-slots" id="time-slots">
                    <div class="time-slot">
                        <input type="radio" id="slot-1" name="time-slot" value="09:00-10:00">
                        <label for="slot-1">09:00 - 10:00</label>
                    </div>
                    <div class="time-slot">
                        <input type="radio" id="slot-2" name="time-slot" value="10:00-11:00">
                        <label for="slot-2">10:00 - 11:00</label>
                    </div>
                    <div class="time-slot">
                        <input type="radio" id="slot-3" name="time-slot" value="11:00-12:00">
                        <label for="slot-3">11:00 - 12:00</label>
                    </div>
                    <div class="time-slot">
                        <input type="radio" id="slot-4" name="time-slot" value="12:00-13:00">
                        <label for="slot-4">12:00 - 13:00</label>
                    </div>
                    <div class="time-slot">
                        <input type="radio" id="slot-5" name="time-slot" value="13:00-14:00">
                        <label for="slot-5">13:00 - 14:00</label>
                    </div>
                    <div class="time-slot">
                        <input type="radio" id="slot-6" name="time-slot" value="14:00-15:00">
                        <label for="slot-6">14:00 - 15:00</label>
                    </div>
                    <div class="time-slot">
                        <input type="radio" id="slot-7" name="time-slot" value="15:00-16:00">
                        <label for="slot-7">15:00 - 16:00</label>
                    </div>
                    <div class="time-slot">
                        <input type="radio" id="slot-8" name="time-slot" value="16:00-17:00">
                        <label for="slot-8">16:00 - 17:00</label>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label for="name">Your Name:</label>
                <input type="text" id="name" name="name" required>
            </div>
            <div class="form-group">
                <label for="booking-email">Email:</label>
                <input type="email" id="booking-email" name="email" required>
            </div>
            <div class="form-group">
                <label for="booking-phone">Phone:</label>
                <input type="tel" id="booking-phone" name="phone" required>
            </div>
            <button type="submit" class="submit-btn">Confirm Booking</button>
        </form>
    `;
    
    // Assemble modal
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalOverlay.appendChild(modalContent);
    
    // Add modal to the body
    document.body.appendChild(modalOverlay);
    
    // Show modal
    setTimeout(() => {
        modalOverlay.classList.add('active');
    }, 10);
    
    // Close modal function
    const closeModal = () => {
        modalOverlay.classList.remove('active');
        setTimeout(() => {
            document.body.removeChild(modalOverlay);
        }, 300);
    };
    
    // Close button event
    modalContent.querySelector('.close-modal').addEventListener('click', closeModal);
    
    // Close on outside click
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });
    
    // Form submission
    const form = modalContent.querySelector('#booking-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Simulate form submission
        const submitBtn = this.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
        
        setTimeout(() => {
            // Show success message
            modalBody.innerHTML = `
                <div class="success-message">
                    <i class="fa fa-check-circle"></i>
                    <h3>Booking Confirmed!</h3>
                    <p>Your booking for ${facilityName} has been confirmed. We've sent the details to your email.</p>
                    <button class="close-btn">Close</button>
                </div>
            `;
            
            // Add event listener to the new close button
            modalBody.querySelector('.close-btn').addEventListener('click', closeModal);
        }, 1500);
    });
}

// Initialize Coaching Registration
function initCoachingRegistration() {
    const coachingButtons = document.querySelectorAll('.coaching-btn');
    
    coachingButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get coaching program details
            const coachingCard = this.closest('.coaching-card');
            const programName = coachingCard.querySelector('h3').textContent;
            const programDetails = coachingCard.querySelector('p').textContent;
            
            // Show coaching registration modal
            showCoachingModal(programName, programDetails);
        });
    });
}

// Show coaching registration modal
function showCoachingModal(programName, programDetails) {
    // Create modal (similar implementation as above)
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Modal header
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    modalHeader.innerHTML = `
        <h3>Enroll in ${programName}</h3>
        <span class="close-modal">&times;</span>
    `;
    
    // Modal body
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    modalBody.innerHTML = `
        <p><strong>Program:</strong> ${programName}</p>
        <p><strong>Details:</strong> ${programDetails}</p>
        <form id="coaching-form">
            <div class="form-group">
                <label for="participant-name">Participant Name:</label>
                <input type="text" id="participant-name" name="participant-name" required>
            </div>
            <div class="form-group">
                <label for="participant-age">Age:</label>
                <input type="number" id="participant-age" name="age" min="5" max="65" required>
            </div>
            <div class="form-group">
                <label for="experience">Experience Level:</label>
                <select id="experience" name="experience" required>
                    <option value="">Select your level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                </select>
            </div>
            <div class="form-group">
                <label for="coaching-email">Email:</label>
                <input type="email" id="coaching-email" name="email" required>
            </div>
            <div class="form-group">
                <label for="coaching-phone">Phone:</label>
                <input type="tel" id="coaching-phone" name="phone" required>
            </div>
            <div class="form-group">
                <label for="special-requirements">Special Requirements (Optional):</label>
                <textarea id="special-requirements" name="requirements" rows="3"></textarea>
            </div>
            <button type="submit" class="submit-btn">Submit Enrollment</button>
        </form>
    `;
    
    // Assemble modal
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalOverlay.appendChild(modalContent);
    
    // Add modal to the body
    document.body.appendChild(modalOverlay);
    
    // Show modal
    setTimeout(() => {
        modalOverlay.classList.add('active');
    }, 10);
    
    // Close modal function
    const closeModal = () => {
        modalOverlay.classList.remove('active');
        setTimeout(() => {
            document.body.removeChild(modalOverlay);
        }, 300);
    };
    
    // Close button event
    modalContent.querySelector('.close-modal').addEventListener('click', closeModal);
    
    // Close on outside click
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });
    
    // Form submission
    const form = modalContent.querySelector('#coaching-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Simulate form submission
        const submitBtn = this.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
        
        setTimeout(() => {
            // Show success message
            modalBody.innerHTML = `
                <div class="success-message">
                    <i class="fa fa-check-circle"></i>
                    <h3>Enrollment Successful!</h3>
                    <p>You have successfully enrolled in ${programName}. We've sent a confirmation email with all details.</p>
                    <button class="close-btn">Close</button>
                </div>
            `;
            
            // Add event listener to the new close button
            modalBody.querySelector('.close-btn').addEventListener('click', closeModal);
        }, 1500);
    });
}

// Initialize Event Filtering
function initEventFiltering() {
    // Check if we're on an events page
    const eventContainer = document.querySelector('.event-container');
    if (!eventContainer) return;
    
    // Create filter elements
    const filterSection = document.createElement('div');
    filterSection.className = 'event-filter';
    filterSection.innerHTML = `
        <div class="search-bar">
            <input type="text" id="event-search" placeholder="Search events...">
            <button id="search-btn"><i class="fa fa-search"></i></button>
        </div>
        <div class="filter-options">
            <select id="filter-month">
                <option value="all">All Months</option>
                <option value="JAN">January</option>
                <option value="FEB">February</option>
                <option value="MAR">March</option>
                <option value="APR">April</option>
                <option value="MAY">May</option>
                <option value="JUN">June</option>
                <option value="JUL">July</option>
                <option value="AUG">August</option>
                <option value="SEP">September</option>
                <option value="OCT">October</option>
                <option value="NOV">November</option>
                <option value="DEC">December</option>
            </select>
            <select id="filter-location">
                <option value="all">All Locations</option>
                <!-- Will be populated dynamically -->
            </select>
        </div>
    `;
    
    // Insert filter before event container
    eventContainer.parentNode.insertBefore(filterSection, eventContainer);
    
    // Populate location filter dynamically
    const locationFilter = document.getElementById('filter-location');
    const locationSet = new Set();
    
    // Get all event locations
    document.querySelectorAll('.event-location').forEach(location => {
        const locationText = location.textContent.trim();
        locationSet.add(locationText);
    });
    
    // Add locations to filter dropdown
    locationSet.forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        locationFilter.appendChild(option);
    });
    
    // Filter events function
    function filterEvents() {
        const searchTerm = document.getElementById('event-search').value.toLowerCase();
        const monthFilter = document.getElementById('filter-month').value;
        const locationFilter = document.getElementById('filter-location').value;
        
        document.querySelectorAll('.event-card').forEach(card => {
            const eventName = card.querySelector('h3').textContent.toLowerCase();
            const eventMonth = card.querySelector('.event-date .month').textContent;
            const eventLocation = card.querySelector('.event-location').textContent;
            
            const matchesSearch = eventName.includes(searchTerm);
            const matchesMonth = monthFilter === 'all' || eventMonth === monthFilter;
            const matchesLocation = locationFilter === 'all' || eventLocation.includes(locationFilter);
            
            if (matchesSearch && matchesMonth && matchesLocation) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    // Add event listeners to filter controls
    document.getElementById('event-search').addEventListener('input', filterEvents);
    document.getElementById('filter-month').addEventListener('change', filterEvents);
    document.getElementById('filter-location').addEventListener('change', filterEvents);
    document.getElementById('search-btn').addEventListener('click', filterEvents);
}

// Initialize League Table Sorting
function initLeagueTableSorting() {
    const leagueTable = document.querySelector('.league-table table');
    if (!leagueTable) return;
    
    // Add sort indicators to table headers
    const tableHeaders = leagueTable.querySelectorAll('thead th');
    tableHeaders.forEach(header => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', function() {
            sortTable(leagueTable, Array.from(tableHeaders).indexOf(this));
        });
    });
}

// Sort table function
function sortTable(table, columnIndex) {
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    const direction = table.querySelector('thead th:nth-child(' + (columnIndex + 1) + ')').classList.contains('sort-asc') ? -1 : 1;
    
    // Clear existing sort classes
    table.querySelectorAll('thead th').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
    });
    
    // Add new sort class
    table.querySelector('thead th:nth-child(' + (columnIndex + 1) + ')').classList.add(direction === 1 ? 'sort-asc' : 'sort-desc');
    
    // Sort rows
    rows.sort((a, b) => {
        const aValue = a.querySelector('td:nth-child(' + (columnIndex + 1) + ')').textContent.trim();
        const bValue = b.querySelector('td:nth-child(' + (columnIndex + 1) + ')').textContent.trim();
        
        return aValue.localeCompare(bValue) * direction;
    });
    
    // Update table with sorted rows
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
}

// Initialize Countdown Timers
function initCountdownTimers() {
    document.querySelectorAll('.event-card').forEach(card => {
        // Get event date from the card
        const day = card.querySelector('.event-date .day').textContent;
        const month = card.querySelector('.event-date .month').textContent;
        const year = new Date().getFullYear();
        
        // Map month abbreviation to month number
        const monthMap = {
            'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
            'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
        };
        
        // Create event date
        const eventDate = new Date(year, monthMap[month], parseInt(day));
        
        // Add countdown element to card if it doesn't exist yet
        if (!card.querySelector('.countdown')) {
            const countdownEl = document.createElement('div');
            countdownEl.className = 'countdown';
            card.querySelector('.event-details').appendChild(countdownEl);
            
            // Update countdown every second
            updateCountdown(countdownEl, eventDate);
            setInterval(() => updateCountdown(countdownEl, eventDate), 1000);
        }
    });
}

// Update countdown function
function updateCountdown(element, targetDate) {
    const now = new Date();
    
    // Calculate time difference
    const diff = targetDate - now;
    
    if (diff <= 0) {
        // Event has already happened or is happening now
        element.innerHTML = '<span class="countdown-label">Event In Progress</span>';
        return;
    }
    
    // Calculate days, hours, minutes, seconds
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    // Update countdown element
    element.innerHTML = `
        <span class="countdown-label">Event starts in:</span>
        <div class="countdown-time">
            <span class="countdown-unit">${days}d</span>
            <span class="countdown-unit">${hours}h</span>
            <span class="countdown-unit">${minutes}m</span>
            <span class="countdown-unit">${seconds}s</span>
        </div>
    `;
}

// Animated Stats
function initAnimatedStats() {
    const statValues = document.querySelectorAll('.stat-value');
    
    // Check if IntersectionObserver is supported
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateValue(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        statValues.forEach(stat => {
            observer.observe(stat);
        });
    } else {
        // Fallback for browsers that don't support IntersectionObserver
        statValues.forEach(stat => {
            animateValue(stat);
        });
    }
}

// Animate value function
function animateValue(element) {
    const value = element.textContent;
    
    // Don't animate if not a number
    if (isNaN(parseInt(value))) return;
    
    let start = 0;
    const end = parseInt(value.replace(/[^\d]/g, ''));
    const duration = 1500;
    const startTime = performance.now();
    
    // Handle currency values
    const hasSymbol = value.match(/[₹$€£]/);
    const symbol = hasSymbol ? hasSymbol[0] : '';
    
    function updateValue(timestamp) {
        const runtime = timestamp - startTime;
        const progress = Math.min(runtime / duration, 1);
        
        // Use easeOutQuad for smooth animation
        const easeProgress = 1 - (1 - progress) * (1 - progress);
        const currentValue = Math.floor(easeProgress * end);
        
        element.textContent = symbol + currentValue;
        
        if (runtime < duration) {
            requestAnimationFrame(updateValue);
        } else {
            element.textContent = value; // Reset to original formatted value
        }
    }
    
    requestAnimationFrame(updateValue);
} 