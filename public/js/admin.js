/**
 * Admin Dashboard JavaScript
 * Comprehensive functionality for admin dashboard pages
 * Handles search, filtering, action buttons, and more
 */

// Global variables
let debugMode = true;
let initialized = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin JS loaded');
    
    // Wait a brief moment to ensure DOM is fully loaded with dynamic content
    setTimeout(function() {
        try {
            if (initialized) return;
            
            console.log('Initializing admin dashboard...');
            
            // Initialize components based on current page
            initPage();
            
            // Initialize sidebar dropdowns
            initDropdowns();
            
            // Enable debugging to see events in console
            enableDebugMode();
            
            console.log('Admin JS initialization complete');
            initialized = true;
        } catch (error) {
            console.error('Error initializing admin JS:', error);
        }
    }, 300);
});

/**
 * Main initialization function
 */
function initializeAdmin() {
    try {
        if (initialized) return;
        
        console.log('Initializing admin dashboard...');
        
        // Enable debug logging
        enableDebugLogging();
        
        // Initialize common components
        initSidebar();
        initActionButtons();
        initBasicSearch();
        initPagination();
        initFormValidation();
        
        // Initialize page-specific components based on current URL
        initPageSpecificComponents();
        
        initialized = true;
        debugLog('Admin dashboard initialization complete');
    } catch (error) {
        console.error('Error initializing admin dashboard:', error);
    }
}

/**
 * Enable debug logging
 */
function enableDebugLogging() {
    window.debugLog = function(message) {
        if (debugMode) console.log(`[Admin] ${message}`);
    };
    
    debugLog('Debug logging enabled');
    debugLog(`Current page: ${window.location.pathname}`);
}

/**
 * Initialize sidebar functionality
 */
function initSidebar() {
    try {
        debugLog('Initializing sidebar');
        
        // Toggle sidebar collapse
        const sidebarToggle = document.getElementById('sidebarCollapse');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', function() {
                document.getElementById('sidebar')?.classList.toggle('active');
            });
        }
        
        // Initialize dropdown toggles
        document.querySelectorAll('.dropdown-toggle').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const target = this.getAttribute('href');
                if (!target) return;
                
                const targetEl = document.querySelector(target);
                if (!targetEl) return;
                
                targetEl.classList.toggle('show');
                this.setAttribute('aria-expanded', 
                    this.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
            });
        });
        
        debugLog('Sidebar initialization complete');
    } catch (error) {
        console.error('Error initializing sidebar:', error);
    }
}

/**
 * Initialize action buttons (view, edit, delete)
 */
function initActionButtons() {
    try {
        debugLog('Initializing action buttons');
        
        // View buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const row = this.closest('tr');
                if (!row) return;
                
                const nameEl = row.querySelector('[class$="-name"]');
                const name = nameEl ? nameEl.textContent.trim() : 'item';
                
                debugLog(`View button clicked for ${name}`);
                alert(`Viewing details for ${name}`);
            });
        });
        
        // Edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const row = this.closest('tr');
                if (!row) return;
                
                const nameEl = row.querySelector('[class$="-name"]');
                const name = nameEl ? nameEl.textContent.trim() : 'item';
                
                debugLog(`Edit button clicked for ${name}`);
                alert(`Editing ${name}`);
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const row = this.closest('tr');
                if (!row) return;
                
                const nameEl = row.querySelector('[class$="-name"]');
                const name = nameEl ? nameEl.textContent.trim() : 'item';
                
                debugLog(`Delete button clicked for ${name}`);
                if (confirm(`Are you sure you want to delete ${name}?`)) {
                    row.style.display = 'none';
                    debugLog(`${name} deleted from view`);
                }
            });
        });
        
        debugLog(`Initialized ${document.querySelectorAll('.view-btn, .edit-btn, .delete-btn').length} action buttons`);
    } catch (error) {
        console.error('Error initializing action buttons:', error);
    }
}

/**
 * Generic search function for all tables
 */
function initSearch() {
    debugLog('Initializing search');
    
    try {
        // Find all search inputs using multiple selectors to catch different naming patterns
        const searchInputs = document.querySelectorAll('input[type="search"], input[type="text"].search-input, input[id$="-search"]');
        debugLog(`Found ${searchInputs.length} search inputs`);
        
        if (searchInputs.length === 0) {
            debugLog('No search inputs found on page');
            return;
        }
        
        searchInputs.forEach(searchInput => {
            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase().trim();
                debugLog(`Search term: "${searchTerm}"`);
                
                if (searchTerm.length === 0 && this.dataset.lastSearchTerm === '') {
                    return; // No change in empty search, skip processing
                }
                
                this.dataset.lastSearchTerm = searchTerm;
                
                // Find the closest table to search in
                let closestTable = null;
                let parent = this.parentElement;
                
                // Look through parent elements to find a table
                while (parent && !closestTable && parent.tagName !== 'BODY') {
                    parent = parent.parentElement;
                    if (!parent) break;
                    
                    const tables = parent.querySelectorAll('table');
                    if (tables.length > 0) {
                        closestTable = tables[0];
                    }
                }
                
                // If no table found in parents, look for any table in the document
                if (!closestTable) {
                    closestTable = document.querySelector('table');
                }
                
                if (!closestTable) {
                    debugLog('No table found to search in');
                    return;
                }
                
                debugLog(`Searching in table: ${closestTable.className || 'unnamed'}`);
                
                // Get all rows from the table
                const rows = closestTable.querySelectorAll('tbody tr');
                let matchCount = 0;
                
                // For each row, check if it contains the search term
                rows.forEach(row => {
                    const rowText = row.textContent.toLowerCase();
                    const matches = rowText.includes(searchTerm);
                    
                    // Set display style based on match
                    if (matches || searchTerm === '') {
                        row.style.display = '';
                        matchCount++;
                    } else {
                        row.style.display = 'none';
                    }
                });
                
                debugLog(`Search results: ${matchCount} matches out of ${rows.length} rows`);
                
                // Update pagination if present
                if (typeof updatePageDisplay === 'function') {
                    updatePageDisplay();
                }
            });
            
            // Set initial data attribute for comparison
            searchInput.dataset.lastSearchTerm = '';
            debugLog(`Initialized search input: ${searchInput.id || 'unnamed'}`);
        });
    } catch (error) {
        console.error('Error initializing search:', error);
    }
}

/**
 * Initialize status filters for tables
 */
function initStatusFilters() {
    try {
        debugLog('Initializing status filters');
        
        // Find all status filter selects
        const statusFilters = document.querySelectorAll('select[id$="-filter"]');
        if (statusFilters.length === 0) {
            debugLog('No status filters found');
            return;
        }
        
        statusFilters.forEach(filter => {
            // Only process status filters and similar
            if (!filter.id.includes('status') && !filter.id.includes('state') && !filter.id.includes('type')) {
                return;
            }
            
            debugLog(`Setting up filter: ${filter.id}`);
            
            filter.addEventListener('change', function() {
                const filterValue = this.value.toLowerCase().trim();
                debugLog(`Filter changed: ${filter.id} = "${filterValue}"`);
                
                // Find the closest table
                let closestTable = null;
                let parent = this.parentElement;
                
                // Look through parent elements to find a table
                while (parent && !closestTable && parent.tagName !== 'BODY') {
                    parent = parent.parentElement;
                    if (!parent) break;
                    
                    const tables = parent.querySelectorAll('table');
                    if (tables.length > 0) {
                        closestTable = tables[0];
                    }
                }
                
                // If no table found in parents, look for any table
                if (!closestTable) {
                    closestTable = document.querySelector('table');
                }
                
                if (!closestTable) {
                    debugLog('No table found to filter');
                    return;
                }
                
                // Get all rows from the table
                const rows = closestTable.querySelectorAll('tbody tr');
                let matchCount = 0;
                
                // Filter type determines what we're looking for
                const filterType = filter.id.replace('-filter', '');
                
                rows.forEach(row => {
                    // If no filter value, show all rows
                    if (!filterValue) {
                        row.style.display = '';
                        matchCount++;
                        return;
                    }
                    
                    // Try different strategies to find status value
                    let statusElements = [];
                    
                    // 1. Look for elements with the filter type in the class name
                    const typeSpecificElements = row.querySelectorAll(`[class*="${filterType}"]`);
                    if (typeSpecificElements.length > 0) {
                        statusElements = typeSpecificElements;
                    } 
                    // 2. Look for elements with "status" in class if it's a status filter
                    else if (filterType.includes('status')) {
                        statusElements = row.querySelectorAll('[class*="status"]');
                    }
                    // 3. Look for badge elements that might contain status
                    else if (statusElements.length === 0) {
                        statusElements = row.querySelectorAll('.badge');
                    }
                    
                    // If still no elements, check the cell text for the filter type
                    if (statusElements.length === 0) {
                        // Try to find by table header (th) text
                        const headerCells = closestTable.querySelectorAll('th');
                        let columnIndex = -1;
                        
                        headerCells.forEach((th, index) => {
                            if (th.textContent.toLowerCase().includes(filterType)) {
                                columnIndex = index;
                            }
                        });
                        
                        if (columnIndex >= 0 && row.cells.length > columnIndex) {
                            statusElements = [row.cells[columnIndex]];
                        }
                    }
                    
                    // Check if any of the status elements match the filter
                    let matches = false;
                    statusElements.forEach(el => {
                        // Check for success (active) or danger (inactive) class
                        const isActive = el.classList.contains('bg-success');
                        const filterWantsActive = !filterValue.toLowerCase().startsWith('in');
                        
                        // Compare based on active/inactive class
                        if (isActive === filterWantsActive) {
                            matches = true;
                            debugLog(`Status match found: ${isActive ? 'Active' : 'Inactive'} matches '${filterValue}'`);
                        }
                    });
                    
                    // If no specific status elements found but we have a filter value,
                    // check the entire row text as a fallback
                    if (statusElements.length === 0) {
                        matches = row.textContent.toLowerCase().includes(filterValue);
                    }
                    
                    // Apply visibility based on match
                    if (matches) {
                        row.style.display = '';
                        matchCount++;
                    } else {
                        row.style.display = 'none';
                    }
                });
                
                debugLog(`Filter results for ${filter.id}: ${matchCount} matches out of ${rows.length} rows`);
                
                // Update pagination if present
                if (typeof updatePageDisplay === 'function') {
                    updatePageDisplay();
                } else if (typeof refreshPagination === 'function') {
                    refreshPagination();
                }
            });
            
            debugLog(`Initialized filter: ${filter.id}`);
        });
    } catch (error) {
        console.error('Error initializing status filters:', error);
    }
}

/**
 * Initialize pagination for tables
 */
function initPagination() {
    try {
        debugLog('Initializing pagination');
        
        // Find all pagination elements
        const paginationElements = document.querySelectorAll('.pagination');
        if (paginationElements.length === 0) {
            debugLog('No pagination elements found');
            return;
        }
        
        debugLog(`Found ${paginationElements.length} pagination elements`);
        
        paginationElements.forEach(pagination => {
            const pageLinks = pagination.querySelectorAll('.page-link');
            debugLog(`Found ${pageLinks.length} pagination links`);
            
            pageLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    debugLog(`Pagination link clicked: ${this.textContent}`);
                    
                    // Remove active class from all page items
                    pagination.querySelectorAll('.page-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    
                    // Add active class to the clicked page item
                    this.closest('.page-item').classList.add('active');
                    
                    // Enable/disable previous/next buttons based on current page
                    const currentPage = parseInt(this.textContent);
                    if (!isNaN(currentPage)) {
                        const prevButton = pagination.querySelector('.page-item:first-child');
                        const nextButton = pagination.querySelector('.page-item:last-child');
                        
                        if (prevButton) {
                            if (currentPage === 1) {
                                prevButton.classList.add('disabled');
                            } else {
                                prevButton.classList.remove('disabled');
                            }
                        }
                        
                        if (nextButton) {
                            const maxPage = pagination.querySelectorAll('.page-item:not(:first-child):not(:last-child)').length;
                            if (currentPage === maxPage) {
                                nextButton.classList.add('disabled');
                            } else {
                                nextButton.classList.remove('disabled');
                            }
                        }
                    }
                    
                    refreshPagination();
                });
            });
            
            // Initialize previous button
            const prevButton = pagination.querySelector('.page-item:first-child .page-link');
            if (prevButton) {
                prevButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    const activeItem = pagination.querySelector('.page-item.active');
                    if (!activeItem) return;
                    
                    const prevItem = activeItem.previousElementSibling;
                    if (prevItem && !prevItem.classList.contains('disabled')) {
                        const pageLink = prevItem.querySelector('.page-link');
                        if (pageLink) pageLink.click();
                    }
                });
            }
            
            // Initialize next button
            const nextButton = pagination.querySelector('.page-item:last-child .page-link');
            if (nextButton) {
                nextButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    const activeItem = pagination.querySelector('.page-item.active');
                    if (!activeItem) return;
                    
                    const nextItem = activeItem.nextElementSibling;
                    if (nextItem && !nextItem.classList.contains('disabled')) {
                        const pageLink = nextItem.querySelector('.page-link');
                        if (pageLink) pageLink.click();
                    }
                });
            }
        });
        
        // Trigger initial pagination
        refreshPagination();
        
        debugLog('Pagination initialization complete');
    } catch (error) {
        console.error('Error initializing pagination:', error);
    }
}

/**
 * Update pagination display after filtering
 */
function refreshPagination() {
    try {
        debugLog('Refreshing pagination');
        
        const paginationElements = document.querySelectorAll('.pagination');
        if (paginationElements.length === 0) return;
        
        // Store active page to preserve it through refreshes
        let currentPageNum = 1;
        
        paginationElements.forEach(pagination => {
            const activePage = pagination.querySelector('.page-item.active .page-link');
            if (activePage) {
                currentPageNum = parseInt(activePage.textContent) || 1;
                debugLog(`Current active page: ${currentPageNum}`);
            }
            
            const itemsPerPage = 3; // Show only 3 items per page to better demonstrate pagination
            
            debugLog(`Active page: ${currentPageNum}, items per page: ${itemsPerPage}`);
            
            // Find the closest table
            let table = null;
            let current = pagination;
            while (current && !table) {
                current = current.parentElement;
                if (!current) break;
                
                table = current.querySelector('table');
                if (current.tagName === 'BODY') break;
            }
            
            if (!table) {
                debugLog('No table found for pagination');
                return;
            }
            
            // Get all rows
            const allRows = Array.from(table.querySelectorAll('tbody tr'));
            
            // First, determine which rows should be visible based on filters
            // (those not hidden by filters)
            const filteredRows = allRows.filter(row => {
                return row.style.display !== 'none' || row.hasAttribute('data-page-hidden');
            });
            
            debugLog(`Filtered rows for pagination: ${filteredRows.length}`);
            
            // Make sure the page links match the data
            const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));
            debugLog(`Total pages: ${totalPages}`);
            
            // Adjust current page if it's out of bounds after filtering
            if (currentPageNum > totalPages) {
                currentPageNum = totalPages;
                debugLog(`Adjusted current page to ${currentPageNum} due to filtering`);
            }
            
            // First hide all rows (reset pagination state)
            allRows.forEach(row => {
                // If this row was hidden by pagination, not filters, clear that state
                if (row.hasAttribute('data-page-hidden')) {
                    row.removeAttribute('data-page-hidden');
                }
                
                // Hide rows for pagination calculation
                if (row.style.display !== 'none') {
                    row.setAttribute('data-page-hidden', 'true');
                    row.style.display = 'none';
                }
            });
            
            // Now show only rows for current page
            const startIndex = (currentPageNum - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            
            // Show only rows for the current page
            for (let i = startIndex; i < endIndex && i < filteredRows.length; i++) {
                const row = filteredRows[i];
                row.style.display = '';
                row.removeAttribute('data-page-hidden');
                debugLog(`Showing row ${i+1} on page ${currentPageNum}`);
            }
            
            // Check if page is empty and show message
            const noContentMessage = document.getElementById('no-content-message');
            if (noContentMessage) {
                // If we're on a page with no content (except page 1 when there are no rows at all)
                if (startIndex >= filteredRows.length && currentPageNum > 1) {
                    noContentMessage.style.display = 'block';
                    debugLog('Showing no content message for empty page');
                } else {
                    noContentMessage.style.display = 'none';
                }
            }
            
            // Update page numbers if pagination has numbered pages
            const pageItems = pagination.querySelectorAll('.page-item:not(:first-child):not(:last-child)');
            
            // Mark the correct page as active
            if (pageItems.length > 0) {
                pageItems.forEach((item, i) => {
                    const pageNum = i + 1;
                    
                    // Hide page numbers greater than total pages
                    if (pageNum > totalPages) {
                        item.style.display = 'none';
                    } else {
                        item.style.display = '';
                    }
                    
                    // Set active state
                    if (pageNum === currentPageNum) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
            }
            
            // Update pagination UI - disable/enable Previous/Next buttons
            const prevButton = pagination.querySelector('.page-item:first-child');
            const nextButton = pagination.querySelector('.page-item:last-child');
            
            if (prevButton) {
                if (currentPageNum <= 1) {
                    prevButton.classList.add('disabled');
                } else {
                    prevButton.classList.remove('disabled');
                }
            }
            
            if (nextButton) {
                if (currentPageNum >= totalPages) {
                    nextButton.classList.add('disabled');
                } else {
                    nextButton.classList.remove('disabled');
                }
            }
        });
    } catch (error) {
        console.error('Error refreshing pagination:', error);
    }
}

/**
 * Initialize form validation for modal forms
 */
function initFormValidation() {
    try {
        debugLog('Initializing form validation');
        
        // Find all forms within modals
        const modalForms = document.querySelectorAll('.modal form');
        if (modalForms.length === 0) {
            debugLog('No modal forms found');
            return;
        }
        
        modalForms.forEach(form => {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Check if the form is valid
                const isValid = validateForm(form);
                
                if (isValid) {
                    debugLog('Form validated successfully');
                    alert('Form submitted successfully');
                    
                    // Find the modal and close it
                    const modal = form.closest('.modal');
                    if (modal && window.bootstrap) {
                        const bsModal = bootstrap.Modal.getInstance(modal);
                        if (bsModal) bsModal.hide();
                    }
                }
            });
            
            debugLog(`Form validation initialized for ${form.id || 'unnamed form'}`);
        });
        
        // Add validation for submit buttons outside forms
        document.querySelectorAll('.modal-footer .btn-primary').forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (!modal) return;
                
                const form = modal.querySelector('form');
                if (!form) return;
                
                const isValid = validateForm(form);
                
                if (isValid) {
                    debugLog('Form validated successfully from external button');
                    alert('Form submitted successfully');
                    
                    if (window.bootstrap) {
                        const bsModal = bootstrap.Modal.getInstance(modal);
                        if (bsModal) bsModal.hide();
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error initializing form validation:', error);
    }
}

/**
 * Validate a form
 * @param {HTMLFormElement} form - The form to validate
 * @returns {boolean} - Whether the form is valid
 */
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        // Reset previous error styling
        field.classList.remove('is-invalid');
        
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
            
            // Add error message if not exists
            let errorMsg = field.nextElementSibling;
            if (!errorMsg || !errorMsg.classList.contains('invalid-feedback')) {
                errorMsg = document.createElement('div');
                errorMsg.classList.add('invalid-feedback');
                errorMsg.textContent = 'This field is required';
                field.parentNode.insertBefore(errorMsg, field.nextSibling);
            }
        }
    });
    
    return isValid;
}

/**
 * Initialize page-specific components based on current URL
 */
function initPageSpecificComponents() {
    const path = window.location.pathname;
    debugLog(`Initializing page-specific components for: ${path}`);
    
    // Common filters for most pages
    initStatusFilters();
    initSportFilters();
    initDateFilters();
    
    // Page-specific initializations
    if (path.includes('/organizers')) {
        initOrganizersPage();
    } else if (path.includes('/managers')) {
        initManagersPage();
    } else if (path.includes('/players')) {
        initPlayersPage();
    } else if (path.includes('/teams')) {
        initTeamsPage();
    } else if (path.includes('/tournaments')) {
        initTournamentsPage();
    } else if (path.includes('/matches')) {
        initMatchesPage();
    } else if (path.includes('/finance-analytics')) {
        initFinanceAnalyticsPage();
    } else if (path.includes('/activity-logs')) {
        initActivityLogsPage();
    } else if (path.includes('/dashboard')) {
        initDashboardPage();
    }
}

/**
 * Initialize sport filters
 */
function initSportFilters() {
    try {
        const sportFilter = document.getElementById('sport-filter');
        if (!sportFilter) {
            debugLog('No sport filter found');
            return;
        }
        
        debugLog('Initializing sport filter');
        
        sportFilter.addEventListener('change', function() {
            const sportValue = this.value.toLowerCase();
            debugLog(`Sport filter changed to: ${sportValue}`);
            
            // Find the table
            const table = document.querySelector('table');
            if (!table) return;
            
            // Get all rows except header
            const rows = table.querySelectorAll('tbody tr');
            
            // Filter rows based on sport
            rows.forEach(row => {
                // If no sport selected, show all rows
                if (!sportValue) {
                    row.style.removeProperty('display');
                    return;
                }
                
                // Look for sport elements
                const sportEl = row.querySelector('[class*="sport"]');
                const sport = sportEl ? sportEl.textContent.toLowerCase() : '';
                
                row.style.display = sport.includes(sportValue) ? '' : 'none';
            });
            
            refreshPagination();
        });
        
        debugLog('Sport filter initialized');
    } catch (error) {
        console.error('Error initializing sport filter:', error);
    }
}

/**
 * Initialize date filters
 */
function initDateFilters() {
    try {
        const fromDate = document.getElementById('from-date');
        const toDate = document.getElementById('to-date');
        
        if (!fromDate || !toDate) {
            debugLog('Date filters not found');
            return;
        }
        
        debugLog('Initializing date filters');
        
        // Setup event listeners
        fromDate.addEventListener('change', filterByDate);
        toDate.addEventListener('change', filterByDate);
        
        // Make sure toDate is not before fromDate
        fromDate.addEventListener('change', function() {
            if (toDate.value && this.value > toDate.value) {
                toDate.value = this.value;
            }
        });
        
        toDate.addEventListener('change', function() {
            if (fromDate.value && this.value < fromDate.value) {
                fromDate.value = this.value;
            }
        });
        
        debugLog('Date filters initialized');
    } catch (error) {
        console.error('Error initializing date filters:', error);
    }
}

/**
 * Filter table rows by date
 */
function filterByDate() {
    try {
        const fromDate = document.getElementById('from-date');
        const toDate = document.getElementById('to-date');
        
        if (!fromDate || !toDate) return;
        
        const fromValue = fromDate.value ? new Date(fromDate.value) : null;
        const toValue = toDate.value ? new Date(toDate.value) : null;
        
        // If both dates are empty, don't filter
        if (!fromValue && !toValue) return;
        
        debugLog(`Filtering by date: ${fromDate.value} to ${toDate.value}`);
        
        // Find the table
        const table = document.querySelector('table');
        if (!table) return;
        
        // Get all rows except header
        const rows = table.querySelectorAll('tbody tr');
        
        // Filter rows based on date
        rows.forEach(row => {
            // Find a date cell (usually in position 3, 4, or 5)
            let dateCell = null;
            for (let i = 2; i < 6 && !dateCell; i++) {
                const cell = row.cells[i];
                if (cell && cell.textContent.match(/\d{1,2}[\s-/]\w+[\s-/]\d{4}/)) {
                    dateCell = cell;
                }
            }
            
            if (!dateCell) {
                row.style.removeProperty('display');
                return;
            }
            
            // Parse the date
            const dateStr = dateCell.textContent.trim();
            let rowDate;
            
            try {
                rowDate = new Date(dateStr);
            } catch (e) {
                // If date can't be parsed, show the row
                row.style.removeProperty('display');
                return;
            }
            
            // Check if date is valid
            if (isNaN(rowDate.getTime())) {
                row.style.removeProperty('display');
                return;
            }
            
            // Check if date is in range
            let inRange = true;
            
            if (fromValue && rowDate < fromValue) inRange = false;
            if (toValue && rowDate > toValue) inRange = false;
            
            row.style.display = inRange ? '' : 'none';
        });
        
        refreshPagination();
    } catch (error) {
        console.error('Error filtering by date:', error);
    }
}

/**
 * Initialize organizers page
 */
function initOrganizersPage() {
    debugLog('Initializing organizers page');
    // Add any specific functionality for the organizers page
}

/**
 * Initialize managers page
 */
function initManagersPage() {
    debugLog('Initializing managers page');
    // Add any specific functionality for the managers page
}

/**
 * Initialize players page
 */
function initPlayersPage() {
    debugLog('Initializing players page');
    
    // Add team status filter if exists
    const teamStatusFilter = document.getElementById('team-status-filter');
    if (teamStatusFilter) {
        teamStatusFilter.addEventListener('change', function() {
            const statusValue = this.value.toLowerCase();
            debugLog(`Team status filter changed to: ${statusValue}`);
            
            // Filter table rows
            const table = document.querySelector('table');
            if (!table) return;
            
            const rows = table.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                if (!statusValue) {
                    row.style.removeProperty('display');
                    return;
                }
                
                const teamStatusEl = row.querySelector('.team-status');
                const teamStatus = teamStatusEl ? teamStatusEl.textContent.toLowerCase() : '';
                
                row.style.display = teamStatus.includes(statusValue) ? '' : 'none';
            });
            
            refreshPagination();
        });
    }
}

/**
 * Initialize teams page
 */
function initTeamsPage() {
    debugLog('Initializing teams page');
    // Add any specific functionality for the teams page
}

/**
 * Initialize tournaments page
 */
function initTournamentsPage() {
    debugLog('Initializing tournaments page');
    // Add any specific functionality for the tournaments page
}

/**
 * Initialize matches page
 */
function initMatchesPage() {
    debugLog('Initializing matches page');
    // Add any specific functionality for the matches page
}

/**
 * Initialize finance analytics page
 */
function initFinanceAnalyticsPage() {
    debugLog('Initializing finance analytics page');
    
    // Initialize charts if Chart.js is available
    if (typeof Chart !== 'undefined') {
        // Revenue chart
        const revenueChartEl = document.getElementById('revenueChart');
        if (revenueChartEl) {
            new Chart(revenueChartEl.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Revenue',
                        data: [3200, 4100, 3800, 5200, 4800, 5500],
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 2,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
        
        // Expenses chart
        const expensesChartEl = document.getElementById('expensesChart');
        if (expensesChartEl) {
            new Chart(expensesChartEl.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Expenses',
                        data: [2100, 2400, 2200, 2800, 3200, 3000],
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 2,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    }
}

/**
 * Initialize activity logs page
 */
function initActivityLogsPage() {
    debugLog('Initializing activity logs page');
    
    // Add level filter
    const levelFilter = document.getElementById('level-filter');
    if (levelFilter) {
        levelFilter.addEventListener('change', function() {
            const levelValue = this.value.toLowerCase();
            debugLog(`Level filter changed to: ${levelValue}`);
            
            // Filter table rows
            const table = document.querySelector('table');
            if (!table) return;
            
            const rows = table.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                if (!levelValue) {
                    row.style.removeProperty('display');
                    return;
                }
                
                const levelEl = row.querySelector('.log-level');
                const level = levelEl ? levelEl.textContent.toLowerCase() : '';
                
                row.style.display = level.includes(levelValue) ? '' : 'none';
            });
            
            refreshPagination();
        });
    }
    
    // Add activity filter
    const activityFilter = document.getElementById('activity-filter');
    if (activityFilter) {
        activityFilter.addEventListener('change', function() {
            const activityValue = this.value.toLowerCase();
            debugLog(`Activity filter changed to: ${activityValue}`);
            
            // Filter table rows
            const table = document.querySelector('table');
            if (!table) return;
            
            const rows = table.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                if (!activityValue) {
                    row.style.removeProperty('display');
                    return;
                }
                
                const activityEl = row.querySelector('.log-activity');
                const activity = activityEl ? activityEl.textContent.toLowerCase() : '';
                
                row.style.display = activity.includes(activityValue) ? '' : 'none';
            });
            
            refreshPagination();
        });
    }
}

/**
 * Initialize dashboard page
 */
function initDashboardPage() {
    debugLog('Initializing dashboard page');
    
    // Initialize charts if Chart.js is available
    if (typeof Chart !== 'undefined') {
        // User Growth Chart
        const userGrowthCanvas = document.getElementById('userGrowthChart');
        if (userGrowthCanvas) {
            new Chart(userGrowthCanvas.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'New Users',
                        data: [65, 78, 90, 105, 125, 142],
                        borderColor: '#5e63ff',
                        backgroundColor: 'rgba(94, 99, 255, 0.1)',
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
        
        // Event Participation Chart
        const eventParticipationCanvas = document.getElementById('eventParticipationChart');
        if (eventParticipationCanvas) {
            new Chart(eventParticipationCanvas.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['Basketball', 'Football', 'Cricket', 'Tennis', 'Volleyball'],
                    datasets: [{
                        label: 'Participants',
                        data: [45, 62, 38, 27, 18],
                        backgroundColor: [
                            'rgba(54, 162, 235, 0.7)',
                            'rgba(75, 192, 192, 0.7)',
                            'rgba(255, 206, 86, 0.7)',
                            'rgba(153, 102, 255, 0.7)',
                            'rgba(255, 159, 64, 0.7)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    }
}

/**
 * Initialize page functionality based on current URL path
 */
function initPage() {
    try {
        const path = window.location.pathname;
        debugLog(`Initializing page: ${path}`);
        
        // Common components for all admin pages
        initSearch();
        initStatusFilters();
        initActionButtons();
        
        // Apply additional initialization based on path
        if (path.includes('/admin/dashboard')) {
            debugLog('Initializing dashboard page');
            initCharts();
        } 
        else if (path.includes('/admin/teams')) {
            debugLog('Initializing teams page');
            document.getElementById('sport-filter')?.addEventListener('change', applyFilters);
            document.querySelectorAll('.team-status')?.forEach(el => {
                el.addEventListener('click', toggleStatus);
            });
        } 
        else if (path.includes('/admin/player-assignments')) {
            debugLog('Initializing player assignments page');
            document.getElementById('team-filter')?.addEventListener('change', applyFilters);
        } 
        else if (path.includes('/admin/team-assignments')) {
            debugLog('Initializing team assignments page');
            document.getElementById('tournament-filter')?.addEventListener('change', applyFilters);
        } 
        else if (path.includes('/admin/tournaments')) {
            debugLog('Initializing tournaments page');
            document.getElementById('sport-filter')?.addEventListener('change', applyFilters);
            
            // Add tournament button
            const addBtn = document.querySelector('button[data-bs-target="#addTournamentModal"]');
            if (!addBtn) {
                debugLog('Add tournament button not found, creating one');
                const addButton = document.createElement('button');
                addButton.className = 'btn btn-primary';
                addButton.innerHTML = '<i class="bi bi-plus-circle me-1"></i> Add Tournament';
                addButton.setAttribute('data-bs-toggle', 'modal');
                addButton.setAttribute('data-bs-target', '#addTournamentModal');
                
                const actionArea = document.querySelector('.card-body .row .col-md-2');
                if (actionArea) {
                    actionArea.appendChild(addButton);
                }
            }
        } 
        else if (path.includes('/admin/matches')) {
            debugLog('Initializing matches page');
            document.getElementById('tournament-filter')?.addEventListener('change', applyFilters);
        } 
        else if (path.includes('/admin/player-finance') || path.includes('/admin/team-finance')) {
            debugLog('Initializing finance page');
            initDateRangePickers();
            document.getElementById('payment-filter')?.addEventListener('change', applyFilters);
        } 
        else if (path.includes('/admin/finance-analytics')) {
            debugLog('Initializing finance analytics page');
            initDateRangePickers();
            initCharts();
        } 
        else if (path.includes('/admin/organizers')) {
            debugLog('Initializing organizers page');
            document.querySelectorAll('.organizer-status')?.forEach(el => {
                el.addEventListener('click', toggleStatus);
            });
        } 
        else if (path.includes('/admin/managers')) {
            debugLog('Initializing managers page');
            document.querySelectorAll('.manager-status')?.forEach(el => {
                el.addEventListener('click', toggleStatus);
            });
        } 
        else if (path.includes('/admin/players')) {
            debugLog('Initializing players page');
            document.querySelectorAll('.player-status')?.forEach(el => {
                el.addEventListener('click', toggleStatus);
            });
        }
        else if (path.includes('/admin/activity-logs')) {
            debugLog('Initializing activity logs page');
            document.getElementById('user-filter')?.addEventListener('change', applyFilters);
            document.getElementById('activity-filter')?.addEventListener('change', applyFilters);
            document.getElementById('level-filter')?.addEventListener('change', applyFilters);
            
            // Export logs button
            document.getElementById('export-logs')?.addEventListener('click', function() {
                alert('Exporting logs (mock)');
            });
            
            // Clear logs button
            document.getElementById('clear-logs')?.addEventListener('click', function() {
                if (confirm('Are you sure you want to clear all logs? This cannot be undone.')) {
                    alert('Logs cleared (mock)');
                }
            });
        }
        
        // Initialize date range pickers if present
        const fromDate = document.getElementById('from-date');
        const toDate = document.getElementById('to-date');
        if (fromDate && toDate) {
            initDateRangePickers();
        }
        
        // Initialize pagination if present
        const pagination = document.querySelector('.pagination');
        if (pagination) {
            initPagination();
        }
        
        debugLog('Page initialization complete');
    } catch (error) {
        console.error('Error initializing page:', error);
    }
}

/**
 * Toggle status element between active/inactive
 */
function toggleStatus() {
    try {
        const currentStatus = this.textContent.trim().toLowerCase();
        debugLog(`Toggling status from: ${currentStatus}`);
        
        if (currentStatus === 'active') {
            this.textContent = 'Inactive';
            this.className = this.className.replace('bg-success', 'bg-danger');
        } else {
            this.textContent = 'Active';
            this.className = this.className.replace('bg-danger', 'bg-success');
        }
        
        debugLog(`Status toggled to: ${this.textContent}`);
    } catch (error) {
        console.error('Error toggling status:', error);
    }
}

/**
 * Apply all active filters based on current page
 */
function applyFilters() {
    try {
        debugLog('Applying all active filters');
        
        // Get all filter values
        const filters = {};
        
        // Search input
        const searchInput = document.querySelector('input[id$="-search"], input.search-input');
        if (searchInput) {
            filters.search = searchInput.value.toLowerCase().trim();
        }
        
        // Status filter
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            filters.status = statusFilter.value.toLowerCase().trim();
        }
        
        // Sport filter
        const sportFilter = document.getElementById('sport-filter');
        if (sportFilter) {
            filters.sport = sportFilter.value.toLowerCase().trim();
        }
        
        // Team filter
        const teamFilter = document.getElementById('team-filter');
        if (teamFilter) {
            filters.team = teamFilter.value.toLowerCase().trim();
        }
        
        // Tournament filter
        const tournamentFilter = document.getElementById('tournament-filter');
        if (tournamentFilter) {
            filters.tournament = tournamentFilter.value.toLowerCase().trim();
        }
        
        // Payment filter
        const paymentFilter = document.getElementById('payment-filter');
        if (paymentFilter) {
            filters.payment = paymentFilter.value.toLowerCase().trim();
        }
        
        // User filter (for activity logs)
        const userFilter = document.getElementById('user-filter');
        if (userFilter) {
            filters.user = userFilter.value.toLowerCase().trim();
        }
        
        // Activity filter (for activity logs)
        const activityFilter = document.getElementById('activity-filter');
        if (activityFilter) {
            filters.activity = activityFilter.value.toLowerCase().trim();
        }
        
        // Level filter (for activity logs)
        const levelFilter = document.getElementById('level-filter');
        if (levelFilter) {
            filters.level = levelFilter.value.toLowerCase().trim();
        }
        
        // Date filters
        const fromDate = document.getElementById('from-date');
        const toDate = document.getElementById('to-date');
        if (fromDate && fromDate.value) {
            filters.fromDate = new Date(fromDate.value);
        }
        if (toDate && toDate.value) {
            filters.toDate = new Date(toDate.value);
            // Include the full day
            filters.toDate.setHours(23, 59, 59, 999);
        }
        
        debugLog('Active filters: ' + JSON.stringify(Object.keys(filters)));
        
        // Find table to filter
        const table = document.querySelector('table');
        if (!table) {
            debugLog('No table found to apply filters');
            return;
        }
        
        // Get all rows
        const rows = table.querySelectorAll('tbody tr');
        let visibleCount = 0;
        
        // Apply filters to each row
        rows.forEach(row => {
            let visible = true;
            
            // Search filter
            if (filters.search) {
                const rowText = row.textContent.toLowerCase();
                if (!rowText.includes(filters.search)) {
                    visible = false;
                }
            }
            
            // Status filter
            if (visible && filters.status) {
                // Look for a status badge
                const statusEl = row.querySelector('.badge');
                if (statusEl) {
                    // Check for success (active) or danger (inactive) class
                    const isActive = statusEl.classList.contains('bg-success');
                    const filterWantsActive = !filters.status.toLowerCase().startsWith('in');
                    
                    if (isActive !== filterWantsActive) {
                        visible = false;
                        debugLog(`Row filtered out - status class mismatch: ${isActive ? 'Active' : 'Inactive'} vs filter: '${filters.status}'`);
                    }
                }
            }
            
            // Sport filter
            if (visible && filters.sport) {
                const sportEl = row.querySelector('[class*="sport"]') || row.cells[1];
                if (sportEl) {
                    const sport = sportEl.textContent.toLowerCase();
                    if (!sport.includes(filters.sport)) {
                        visible = false;
                    }
                }
            }
            
            // Team filter
            if (visible && filters.team) {
                const teamEl = row.querySelector('[class*="team"]') || row.cells[0];
                if (teamEl) {
                    const team = teamEl.textContent.toLowerCase();
                    if (!team.includes(filters.team)) {
                        visible = false;
                    }
                }
            }
            
            // Tournament filter
            if (visible && filters.tournament) {
                const tournamentEl = row.querySelector('[class*="tournament"]') || row.cells[2];
                if (tournamentEl) {
                    const tournament = tournamentEl.textContent.toLowerCase();
                    if (!tournament.includes(filters.tournament)) {
                        visible = false;
                    }
                }
            }
            
            // Payment filter
            if (visible && filters.payment) {
                const paymentEl = row.querySelector('[class*="payment"]') || row.cells[3];
                if (paymentEl) {
                    const payment = paymentEl.textContent.toLowerCase();
                    if (!payment.includes(filters.payment)) {
                        visible = false;
                    }
                }
            }
            
            // User filter (for activity logs)
            if (visible && filters.user) {
                const userEl = row.querySelector('.log-user') || row.cells[0];
                if (userEl) {
                    const user = userEl.textContent.toLowerCase();
                    if (!user.includes(filters.user)) {
                        visible = false;
                    }
                }
            }
            
            // Activity filter (for activity logs)
            if (visible && filters.activity) {
                const activityEl = row.querySelector('.log-activity') || row.cells[1];
                if (activityEl) {
                    const activity = activityEl.textContent.toLowerCase();
                    if (!activity.includes(filters.activity)) {
                        visible = false;
                    }
                }
            }
            
            // Level filter (for activity logs)
            if (visible && filters.level) {
                const levelEl = row.querySelector('.log-level') || row.cells[2];
                if (levelEl) {
                    const level = levelEl.textContent.toLowerCase();
                    if (!level.includes(filters.level)) {
                        visible = false;
                    }
                }
            }
            
            // Date filter
            if (visible && (filters.fromDate || filters.toDate)) {
                // Try to find a date cell
                let dateEl = null;
                for (let i = 0; i < row.cells.length; i++) {
                    const cell = row.cells[i];
                    if (cell && cell.textContent.match(/\d{1,2}[\s-/]\w+[\s-/]\d{4}/)) {
                        dateEl = cell;
                        break;
                    }
                }
                
                if (dateEl) {
                    let date;
                    try {
                        date = new Date(dateEl.textContent);
                    } catch (e) {
                        visible = true; // If date can't be parsed, show the row
                    }
                    
                    if (date && !isNaN(date.getTime())) {
                        if (filters.fromDate && date < filters.fromDate) {
                            visible = false;
                        }
                        if (filters.toDate && date > filters.toDate) {
                            visible = false;
                        }
                    }
                }
            }
            
            // Apply visibility
            row.style.display = visible ? '' : 'none';
            if (visible) visibleCount++;
        });
        
        debugLog(`Filter applied: ${visibleCount} of ${rows.length} rows visible`);
        
        // Update pagination
        if (typeof updatePageDisplay === 'function') {
            updatePageDisplay();
        } else if (typeof refreshPagination === 'function') {
            refreshPagination();
        }
    } catch (error) {
        console.error('Error applying filters:', error);
    }
} 