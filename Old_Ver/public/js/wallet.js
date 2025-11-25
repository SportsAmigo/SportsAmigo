/**
 * SportsAmigo Wallet - Client-side JavaScript
 * Handles wallet operations, fund management, and transaction history
 */

// Global variables
let currentBalance = 0;
let transactionHistory = [];

// Initialize wallet functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeWallet();
});

/**
 * Initialize wallet functionality
 */
function initializeWallet() {
    // Get current balance from page
    const balanceElement = document.querySelector('.balance-amount');
    if (balanceElement) {
        currentBalance = parseFloat(balanceElement.textContent.replace('₹', '').replace(',', ''));
    }
    
    // Set up form submission
    const addFundsForm = document.getElementById('addFundsForm');
    if (addFundsForm) {
        addFundsForm.addEventListener('submit', handleAddFunds);
    }
    
    // Set up transaction filters
    setupTransactionFilters();
    
    console.log('Wallet initialized successfully');
}

/**
 * Handle add funds form submission
 */
async function handleAddFunds(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const amount = parseFloat(formData.get('amount'));
    const paymentMethod = formData.get('paymentMethod');
    
    // Validate amount
    if (!amount || amount <= 0) {
        showMessage('Please enter a valid amount', 'error');
        return;
    }
    
    if (amount < 10) {
        showMessage('Minimum amount is ₹10', 'error');
        return;
    }
    
    if (amount > 50000) {
        showMessage('Maximum amount is ₹50,000', 'error');
        return;
    }
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner"></span> Processing...';
    
    try {
        const response = await fetch('/wallet/add-funds', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amount,
                paymentMethod: paymentMethod
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update balance display
            updateBalanceDisplay(data.newBalance);
            
            // Add new transaction to history
            addTransactionToHistory(data.transaction);
            
            // Close modal
            closeModal('addFundsModal');
            
            // Reset form
            form.reset();
            
            // Show success message
            showMessage(`Successfully added ₹${amount.toFixed(2)} to your wallet!`, 'success');
            
        } else {
            throw new Error(data.error || 'Failed to add funds');
        }
        
    } catch (error) {
        console.error('Add funds error:', error);
        showMessage(error.message || 'Failed to add funds. Please try again.', 'error');
        
    } finally {
        // Reset button
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
}

/**
 * Update balance display with animation
 */
function updateBalanceDisplay(newBalance) {
    const balanceElement = document.querySelector('.balance-amount');
    if (!balanceElement) return;
    
    // Animate balance change
    const oldBalance = currentBalance;
    currentBalance = newBalance;
    
    // Add animation class
    balanceElement.classList.add('balance-updating');
    
    // Animate the number
    animateNumber(balanceElement, oldBalance, newBalance, 1000);
    
    // Remove animation class after animation
    setTimeout(() => {
        balanceElement.classList.remove('balance-updating');
    }, 1000);
}

/**
 * Animate number change
 */
function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    const difference = end - start;
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        
        const currentValue = start + (difference * easedProgress);
        element.textContent = '₹' + currentValue.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

/**
 * Add new transaction to history table
 */
function addTransactionToHistory(transaction) {
    const transactionTableBody = document.querySelector('.transaction-table tbody');
    if (!transactionTableBody) return;
    
    // Create new row
    const newRow = document.createElement('tr');
    newRow.className = 'transaction-row new-transaction';
    
    const date = new Date(transaction.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    
    const time = new Date(transaction.createdAt).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    newRow.innerHTML = `
        <td>
            <div class="transaction-info">
                <div class="transaction-type ${transaction.type.toLowerCase()}">
                    ${transaction.type === 'Credit' ? '💰' : '💸'} ${transaction.description}
                </div>
                <div class="transaction-meta">
                    ID: ${transaction.referenceId}
                </div>
            </div>
        </td>
        <td class="transaction-amount ${transaction.type.toLowerCase()}">
            ${transaction.type === 'Credit' ? '+' : '-'}₹${transaction.amount.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}
        </td>
        <td class="transaction-date">
            <div>${date}</div>
            <small>${time}</small>
        </td>
        <td>
            <span class="status-badge success">Completed</span>
        </td>
    `;
    
    // Insert at the beginning
    transactionTableBody.insertBefore(newRow, transactionTableBody.firstChild);
    
    // Add highlight animation
    setTimeout(() => {
        newRow.classList.remove('new-transaction');
    }, 2000);
    
    // Update "no transactions" message if it exists
    const noTransactions = document.querySelector('.no-transactions');
    if (noTransactions) {
        noTransactions.style.display = 'none';
    }
}

/**
 * Setup transaction filters
 */
function setupTransactionFilters() {
    // Date range filter
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', filterTransactions);
    }
    
    // Type filter
    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter) {
        typeFilter.addEventListener('change', filterTransactions);
    }
    
    // Search functionality
    const searchInput = document.getElementById('transactionSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounceSearch);
    }
}

/**
 * Filter transactions based on selected criteria
 */
function filterTransactions() {
    const dateFilter = document.getElementById('dateFilter')?.value || 'all';
    const typeFilter = document.getElementById('typeFilter')?.value || 'all';
    const searchTerm = document.getElementById('transactionSearch')?.value.toLowerCase() || '';
    
    const rows = document.querySelectorAll('.transaction-row');
    let visibleCount = 0;
    
    rows.forEach(row => {
        let showRow = true;
        
        // Date filter
        if (dateFilter !== 'all') {
            const transactionDate = new Date(row.querySelector('.transaction-date div').textContent);
            const now = new Date();
            
            switch (dateFilter) {
                case 'today':
                    showRow = transactionDate.toDateString() === now.toDateString();
                    break;
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    showRow = transactionDate >= weekAgo;
                    break;
                case 'month':
                    showRow = transactionDate.getMonth() === now.getMonth() && 
                             transactionDate.getFullYear() === now.getFullYear();
                    break;
            }
        }
        
        // Type filter
        if (typeFilter !== 'all' && showRow) {
            const transactionType = row.querySelector('.transaction-type').classList.contains('credit') ? 'credit' : 'debit';
            showRow = transactionType === typeFilter;
        }
        
        // Search filter
        if (searchTerm && showRow) {
            const transactionText = row.textContent.toLowerCase();
            showRow = transactionText.includes(searchTerm);
        }
        
        row.style.display = showRow ? '' : 'none';
        if (showRow) visibleCount++;
    });
    
    // Update results count
    updateResultsCount(visibleCount);
}

/**
 * Update results count display
 */
function updateResultsCount(count) {
    let countElement = document.querySelector('.results-count');
    if (!countElement) {
        countElement = document.createElement('div');
        countElement.className = 'results-count';
        const filtersSection = document.querySelector('.transaction-filters');
        if (filtersSection) {
            filtersSection.appendChild(countElement);
        }
    }
    
    countElement.textContent = `Showing ${count} transaction${count !== 1 ? 's' : ''}`;
}

/**
 * Debounced search function
 */
let searchTimeout;
function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(filterTransactions, 300);
}

/**
 * Export transaction history
 */
function exportTransactions() {
    const visibleRows = document.querySelectorAll('.transaction-row[style=""]');
    if (visibleRows.length === 0) {
        showMessage('No transactions to export', 'error');
        return;
    }
    
    let csvContent = 'Date,Description,Type,Amount,Status\n';
    
    visibleRows.forEach(row => {
        const date = row.querySelector('.transaction-date div').textContent;
        const description = row.querySelector('.transaction-type').textContent.trim();
        const type = row.querySelector('.transaction-amount').classList.contains('credit') ? 'Credit' : 'Debit';
        const amount = row.querySelector('.transaction-amount').textContent.replace(/[₹+\-,]/g, '');
        const status = row.querySelector('.status-badge').textContent;
        
        csvContent += `"${date}","${description}","${type}","${amount}","${status}"\n`;
    });
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showMessage('Transaction history exported successfully!', 'success');
}

/**
 * Modal functions
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

/**
 * Show add funds modal
 */
function showAddFundsModal() {
    openModal('addFundsModal');
}

/**
 * Set quick amount in add funds form
 */
function setQuickAmount(amount) {
    const amountInput = document.getElementById('fundAmount');
    if (amountInput) {
        amountInput.value = amount;
        amountInput.focus();
    }
}

/**
 * Scroll to transactions section
 */
function scrollToTransactions() {
    const transactionSection = document.getElementById('transactionHistory');
    if (transactionSection) {
        transactionSection.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Show message to user
 */
function showMessage(message, type = 'success') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.flash-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `flash-message ${type}`;
    messageDiv.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Insert at top of content
    const content = document.querySelector('.wallet-content') || document.body;
    content.insertBefore(messageDiv, content.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentElement) {
            messageDiv.remove();
        }
    }, 5000);
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});
