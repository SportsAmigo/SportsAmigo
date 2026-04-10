/**
 * Professional Checkout Page JavaScript
 * Enhanced checkout functionality with improved UX
 */

// Global variables
let cart = null;
let walletBalance = 0;
let selectedPaymentMethod = 'wallet';
let shippingData = null;
let checkoutData = {};

// Initialize checkout functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Professional checkout page loaded');
    initializeCheckout();
    initializePaymentMethods();
    initializeFormValidation();
    initializeOrderSummary();
});

/**
 * Initialize comprehensive checkout functionality
 */
function initializeCheckout() {
    // Parse checkout data from server
    if (window.checkoutData) {
        checkoutData = window.checkoutData;
        walletBalance = checkoutData.walletBalance || 0;
    }
    
    console.log('Initializing checkout with data:', checkoutData);
    
    // Load shipping data from session storage
    loadShippingData();
    
    // Set up payment method handlers
    setupPaymentMethods();
    
    // Set up checkout form
    setupCheckoutForm();
    
    // Update payment summary
    updatePaymentSummary();
    
    // Initialize payment method change listeners
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    paymentMethods.forEach(method => {
        method.addEventListener('change', handlePaymentMethodChange);
    });
    
    console.log('Professional checkout initialized successfully');
}

/**
 * Load shipping data from session storage
 */
function loadShippingData() {
    const storedData = sessionStorage.getItem('shippingData');
    if (storedData) {
        shippingData = JSON.parse(storedData);
        
        // Pre-fill shipping form
        if (shippingData) {
            const form = document.getElementById('shippingForm');
            if (form) {
                Object.keys(shippingData).forEach(key => {
                    const input = form.querySelector(`[name="${key}"]`);
                    if (input && shippingData[key]) {
                        input.value = shippingData[key];
                    }
                });
            }
        }
    }
}

/**
 * Handle payment method change with professional UI updates
 */
function handlePaymentMethodChange(event) {
    const selectedMethod = event.target.value;
    console.log('Payment method changed to:', selectedMethod);
    
    // Show/hide payment method specific content
    if (selectedMethod === 'Wallet') {
        showWalletDiscount();
        showWalletNotice();
    } else {
        hideWalletDiscount();
        hideWalletNotice();
    }
    
    updateOrderTotals();
}

function showWalletDiscount() {
    const discountRow = document.getElementById('walletDiscount');
    if (discountRow) {
        discountRow.style.display = 'flex';
    }
    
    // Update total calculation
    const finalTotal = document.getElementById('finalTotal');
    const cartTotal = checkoutData.cartTotal || 0;
    
    if (finalTotal) {
        // Wallet payments get free delivery
        finalTotal.textContent = `₹${cartTotal.toFixed(2)}`;
    }
}

function hideWalletDiscount() {
    const discountRow = document.getElementById('walletDiscount');
    if (discountRow) {
        discountRow.style.display = 'none';
    }
    
    // Update total calculation
    const finalTotal = document.getElementById('finalTotal');
    const cartTotal = checkoutData.cartTotal || 0;
    
    if (finalTotal) {
        // COD includes delivery charges
        finalTotal.textContent = `₹${(cartTotal + 25).toFixed(2)}`;
    }
}

function showWalletNotice() {
    const walletNotice = document.getElementById('walletNotice');
    if (walletNotice) {
        walletNotice.style.display = 'block';
    }
}

function hideWalletNotice() {
    const walletNotice = document.getElementById('walletNotice');
    if (walletNotice) {
        walletNotice.style.display = 'none';
    }
}

function updateOrderTotals() {
    const selectedPayment = document.querySelector('input[name="paymentMethod"]:checked');
    
    if (selectedPayment && selectedPayment.value === 'Wallet') {
        showWalletDiscount();
    } else {
        hideWalletDiscount();
    }
}

/**
 * Setup payment method handlers
 */
function setupPaymentMethods() {
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    
    paymentMethods.forEach(method => {
        method.addEventListener('change', function() {
            selectedPaymentMethod = this.value;
            updatePaymentSummary();
            togglePaymentSections();
            handlePaymentMethodChange({ target: this }); // Call the new handler
        });
    });
    
    // Initialize with default selection
    const defaultMethod = document.querySelector('input[name="paymentMethod"]:checked');
    if (defaultMethod) {
        selectedPaymentMethod = defaultMethod.value;
        togglePaymentSections();
        updateOrderTotals();
    }
}

/**
 * Toggle payment method sections
 */
function togglePaymentSections() {
    const walletSection = document.querySelector('.wallet-payment-section');
    const cardSection = document.querySelector('.card-payment-section');
    const codSection = document.querySelector('.cod-payment-section');
    
    // Hide all sections first
    if (walletSection) walletSection.style.display = 'none';
    if (cardSection) cardSection.style.display = 'none';
    if (codSection) codSection.style.display = 'none';
    
    // Show relevant section
    switch (selectedPaymentMethod) {
        case 'wallet':
            if (walletSection) walletSection.style.display = 'block';
            break;
        case 'card':
            if (cardSection) cardSection.style.display = 'block';
            break;
        case 'cod':
            if (codSection) codSection.style.display = 'block';
            break;
    }
}

/**
 * Setup checkout form with enhanced real-time validation
 */
function setupCheckoutForm() {
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckoutSubmission);
    }
    
    // Set up shipping form validation with real-time feedback
    const shippingInputs = document.querySelectorAll('#shippingForm input, #shippingForm select');
    shippingInputs.forEach(input => {
        // Real-time validation on input
        input.addEventListener('input', function(e) {
            clearFieldError(e);
            validateFieldRealTime(e.target);
        });
        
        // Validation on blur with animation
        input.addEventListener('blur', function(e) {
            validateShippingFieldAnimated(e);
        });
        
        // Focus animation
        input.addEventListener('focus', function(e) {
            animateFieldFocus(e.target);
        });
    });
    
    // Set up card form validation
    const cardInputs = document.querySelectorAll('.card-payment-section input');
    cardInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            clearFieldError(e);
            validateFieldRealTime(e.target);
        });
        input.addEventListener('blur', validateCardField);
        input.addEventListener('focus', function(e) {
            animateFieldFocus(e.target);
        });
    });
}

/**
 * Real-time field validation with immediate feedback
 */
function validateFieldRealTime(field) {
    const value = field.value.trim();
    
    // Basic required field check
    if (field.hasAttribute('required') && !value) {
        return; // Don't show error on empty required fields during typing
    }
    
    let isValid = true;
    let errorMessage = '';
    
    // Specific validation rules
    switch (field.name) {
        case 'phone':
            if (value) {
                const phonePattern = /^(\+91[\s-]?)?[6-9]\d{9}$/;
                if (!phonePattern.test(value.replace(/\s+/g, ''))) {
                    isValid = false;
                    errorMessage = 'Please enter a valid Indian mobile number';
                }
            }
            break;
        case 'email':
            if (value) {
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid email address';
                }
            }
            break;
        case 'fullName':
            if (value && value.length < 2) {
                isValid = false;
                errorMessage = 'Name must be at least 2 characters';
            }
            break;
    }
    
    if (isValid) {
        field.classList.remove('error');
        field.classList.add('valid');
        showFieldSuccess(field);
    } else {
        field.classList.remove('valid');
        field.classList.add('error');
        showFieldError(field, errorMessage);
    }
    
    return isValid;
}

/**
 * Animated field validation on blur
 */
function validateShippingFieldAnimated(event) {
    const field = event.target;
    const value = field.value.trim();
    
    // Add shake animation for validation
    field.style.transition = 'all 0.3s ease';
    
    if (field.hasAttribute('required') && !value) {
        field.classList.add('error', 'shake');
        showFieldError(field, 'This field is required');
        
        // Remove shake after animation
        setTimeout(() => {
            field.classList.remove('shake');
        }, 600);
        return false;
    }
    
    // Use real-time validation
    return validateFieldRealTime(field);
}

/**
 * Animate field focus
 */
function animateFieldFocus(field) {
    field.style.transform = 'scale(1.02)';
    field.style.transition = 'transform 0.2s ease';
    
    setTimeout(() => {
        field.style.transform = 'scale(1)';
    }, 200);
}

/**
 * Show field success with animation
 */
function showFieldSuccess(field) {
    clearFieldError(field);
    
    // Add success indicator
    let successIcon = field.parentElement.querySelector('.success-icon');
    if (!successIcon) {
        successIcon = document.createElement('span');
        successIcon.className = 'success-icon';
        successIcon.innerHTML = '✓';
        field.parentElement.appendChild(successIcon);
    }
    
    successIcon.style.display = 'inline-block';
    successIcon.style.opacity = '0';
    successIcon.style.transform = 'scale(0.5)';
    successIcon.style.transition = 'all 0.3s ease';
    
    setTimeout(() => {
        successIcon.style.opacity = '1';
        successIcon.style.transform = 'scale(1)';
    }, 50);
}

/**
 * Update payment summary
 */
function updatePaymentSummary() {
    const cartTotal = parseFloat(document.querySelector('.cart-total')?.textContent.replace('₹', '').replace(',', '') || 0);
    const summarySection = document.querySelector('.payment-summary-details');
    
    if (!summarySection) return;
    
    let summaryHTML = `
        <div class="summary-row">
            <span>Cart Total:</span>
            <span>₹${cartTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
    `;
    
    let finalAmount = cartTotal;
    let paymentFee = 0;
    
    switch (selectedPaymentMethod) {
        case 'wallet':
            if (cartTotal > walletBalance) {
                const shortfall = cartTotal - walletBalance;
                summaryHTML += `
                    <div class="summary-row insufficient-balance">
                        <span>Wallet Balance:</span>
                        <span>₹${walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div class="summary-row error">
                        <span>Insufficient Balance:</span>
                        <span>-₹${shortfall.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                `;
            } else {
                summaryHTML += `
                    <div class="summary-row">
                        <span>Wallet Balance:</span>
                        <span>₹${walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div class="summary-row">
                        <span>Remaining Balance:</span>
                        <span>₹${(walletBalance - cartTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                `;
            }
            break;
        case 'card':
            paymentFee = cartTotal * 0.025; // 2.5% card processing fee
            finalAmount = cartTotal + paymentFee;
            summaryHTML += `
                <div class="summary-row">
                    <span>Card Processing Fee (2.5%):</span>
                    <span>₹${paymentFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            `;
            break;
        case 'cod':
            paymentFee = 50; // Flat COD fee
            finalAmount = cartTotal + paymentFee;
            summaryHTML += `
                <div class="summary-row">
                    <span>Cash on Delivery Fee:</span>
                    <span>₹${paymentFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            `;
            break;
    }
    
    summaryHTML += `
        <div class="summary-row total">
            <strong>
                <span>Final Amount:</span>
                <span>₹${finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </strong>
        </div>
    `;
    
    summarySection.innerHTML = summaryHTML;
    
    // Update checkout button state
    updateCheckoutButton(cartTotal);
}

/**
 * Update checkout button state
 */
function updateCheckoutButton(cartTotal) {
    const checkoutButton = document.querySelector('.checkout-button');
    if (!checkoutButton) return;
    
    if (selectedPaymentMethod === 'wallet' && cartTotal > walletBalance) {
        checkoutButton.disabled = true;
        checkoutButton.textContent = 'Insufficient Wallet Balance';
        checkoutButton.classList.add('disabled');
    } else {
        checkoutButton.disabled = false;
        checkoutButton.textContent = 'Complete Order';
        checkoutButton.classList.remove('disabled');
    }
}

/**
 * Handle checkout form submission
 */
async function handleCheckoutSubmission(event) {
    event.preventDefault();
    
    // Validate all forms
    if (!validateAllForms()) {
        return;
    }
    
    const cartTotal = parseFloat(document.querySelector('.cart-total')?.textContent.replace('₹', '').replace(',', '') || 0);
    
    // Get selected payment method from form
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    
    // Check wallet balance if using wallet payment
    if (paymentMethod === 'Wallet' && cartTotal > walletBalance) {
        showMessage('Insufficient wallet balance. Please add funds or choose a different payment method.', 'error');
        return;
    }
    
    // Collect form data
    const orderData = collectOrderData();
    
    // Show loading state
    showLoadingState(true);
    
    try {
        const response = await fetch('/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Clear session storage
            sessionStorage.removeItem('shippingData');
            
            // Redirect to success page
            if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
            } else {
                window.location.href = `/checkout/order-success?orderId=${data.order._id}`;
            }
        } else {
            throw new Error(data.error || 'Checkout failed');
        }
        
    } catch (error) {
        console.error('Checkout error:', error);
        showMessage(error.message || 'Checkout failed. Please try again.', 'error');
        
    } finally {
        showLoadingState(false);
    }
}

/**
 * Validate all forms
 */
function validateAllForms() {
    let isValid = true;
    
    // Validate shipping form
    const shippingForm = document.getElementById('shippingForm');
    if (shippingForm && !shippingForm.checkValidity()) {
        isValid = false;
        showMessage('Please fill in all required shipping information', 'error');
    }
    
    // Validate payment method specific forms
    if (selectedPaymentMethod === 'card') {
        const cardForm = document.querySelector('.card-payment-section');
        const cardInputs = cardForm?.querySelectorAll('input[required]');
        
        cardInputs?.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.classList.add('error');
            }
        });
        
        if (!isValid) {
            showMessage('Please fill in all required card information', 'error');
        }
    }
    
    return isValid;
}

/**
 * Collect order data from forms
 */
function collectOrderData() {
    const checkoutForm = document.getElementById('checkoutForm');
    const formData = new FormData(checkoutForm);
    
    const orderData = {
        fullName: formData.get('fullName'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        street: formData.get('street'),
        city: formData.get('city'),
        state: formData.get('state'),
        area: formData.get('area'),
        landmark: formData.get('landmark'),
        paymentMethod: formData.get('paymentMethod')
    };
    
    return orderData;
}

/**
 * Show/hide loading state
 */
function showLoadingState(show) {
    const checkoutButton = document.querySelector('.checkout-button');
    const loadingOverlay = document.querySelector('.loading-overlay');
    
    if (show) {
        if (checkoutButton) {
            checkoutButton.disabled = true;
            checkoutButton.innerHTML = '<span class="spinner"></span> Processing Order...';
        }
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
    } else {
        if (checkoutButton) {
            checkoutButton.disabled = false;
            checkoutButton.textContent = 'Complete Order';
        }
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
}

/**
 * Validate shipping field
 */
function validateShippingField(event) {
    const field = event.target;
    const value = field.value.trim();
    
    if (field.hasAttribute('required') && !value) {
        field.classList.add('error');
        showFieldError(field, 'This field is required');
        return false;
    }
    
    // Specific validation rules
    switch (field.name) {
        case 'phone':
            // Allow formats: +91 9876543210, 9876543210, +919876543210
            const phonePattern = /^(\+91[\s-]?)?[6-9]\d{9}$/;
            if (!phonePattern.test(value.replace(/\s+/g, ''))) {
                field.classList.add('error');
                showFieldError(field, 'Please enter a valid Indian mobile number');
                return false;
            }
            break;
        case 'email':
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (value && !emailPattern.test(value)) {
                field.classList.add('error');
                showFieldError(field, 'Please enter a valid email address');
                return false;
            }
            break;
        case 'fullName':
            if (value && value.length < 2) {
                field.classList.add('error');
                showFieldError(field, 'Name must be at least 2 characters long');
                return false;
            }
            break;
        case 'street':
            if (value && value.length < 5) {
                field.classList.add('error');
                showFieldError(field, 'Please provide a complete street address');
                return false;
            }
            break;
        case 'city':
            if (value && value.length < 2) {
                field.classList.add('error');
                showFieldError(field, 'Please enter a valid city name');
                return false;
            }
            break;
        case 'area':
            if (value && value.length < 2) {
                field.classList.add('error');
                showFieldError(field, 'Please enter a valid area name');
                return false;
            }
            break;
    }
    
    field.classList.remove('error');
    clearFieldError(field);
    return true;
}

/**
 * Validate card field
 */
function validateCardField(event) {
    const field = event.target;
    const value = field.value.trim();
    
    if (field.hasAttribute('required') && !value) {
        field.classList.add('error');
        showFieldError(field, 'This field is required');
        return false;
    }
    
    // Specific validation rules
    switch (field.name) {
        case 'cardNumber':
            const cardNumber = value.replace(/\s/g, '');
            if (!/^\d{16}$/.test(cardNumber)) {
                field.classList.add('error');
                showFieldError(field, 'Please enter a valid 16-digit card number');
                return false;
            }
            break;
        case 'cvv':
            if (!/^\d{3,4}$/.test(value)) {
                field.classList.add('error');
                showFieldError(field, 'Please enter a valid CVV');
                return false;
            }
            break;
        case 'expiryMonth':
            const month = parseInt(value);
            if (month < 1 || month > 12) {
                field.classList.add('error');
                showFieldError(field, 'Please enter a valid month (1-12)');
                return false;
            }
            break;
        case 'expiryYear':
            const year = parseInt(value);
            const currentYear = new Date().getFullYear();
            if (year < currentYear || year > currentYear + 20) {
                field.classList.add('error');
                showFieldError(field, 'Please enter a valid year');
                return false;
            }
            break;
    }
    
    field.classList.remove('error');
    clearFieldError(field);
    return true;
}

/**
 * Show field error with animation
 */
function showFieldError(field, message) {
    clearFieldError(field);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    
    field.parentElement.appendChild(errorDiv);
    
    // Animate in
    setTimeout(() => {
        errorDiv.classList.add('show');
    }, 50);
}

/**
 * Clear field error with animation
 */
function clearFieldError(event) {
    const field = event.target || event;
    const errorDiv = field.parentElement.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.classList.remove('show');
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 300);
    }
    field.classList.remove('error');
}

/**
 * Add funds to wallet (redirect to wallet page)
 */
function addFundsToWallet() {
    const currentUrl = window.location.href;
    sessionStorage.setItem('returnUrl', currentUrl);
    window.location.href = '/wallet';
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
    const content = document.querySelector('.checkout-content') || document.body;
    content.insertBefore(messageDiv, content.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentElement) {
            messageDiv.remove();
        }
    }, 5000);
}

// Format card number input
document.addEventListener('input', function(event) {
    if (event.target.name === 'cardNumber') {
        let value = event.target.value.replace(/\s/g, '');
        let formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 ');
        if (formattedValue !== event.target.value) {
            event.target.value = formattedValue;
        }
    }
});

// Restrict numeric inputs
document.addEventListener('input', function(event) {
    if (['cardNumber', 'cvv', 'expiryMonth', 'expiryYear', 'zipCode'].includes(event.target.name)) {
        event.target.value = event.target.value.replace(/[^0-9]/g, '');
    }
});
