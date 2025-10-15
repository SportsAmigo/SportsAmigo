/**
 * SportsAmigo Shop - Client-side JavaScript
 * Handles AJAX operations, dynamic UI updates, and user interactions
 */

// Global variables
let searchTimeout;
let currentProducts = [];

// Initialize shop functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeShop();
});

/**
 * Initialize shop functionality
 */
function initializeShop() {
    // Set up search functionality
    const searchBox = document.getElementById('searchBox');
    if (searchBox) {
        searchBox.addEventListener('input', debounceSearch);
    }

    // Set up category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterByCategory);
    }

    // Store initial products for client-side sorting/filtering
    storeCurrentProducts();
    
    console.log('Shop initialized successfully');
}

/**
 * Store current products for client-side operations
 */
function storeCurrentProducts() {
    const productCards = document.querySelectorAll('.product-card');
    currentProducts = Array.from(productCards).map(card => ({
        element: card,
        name: card.getAttribute('data-name'),
        price: parseFloat(card.getAttribute('data-price')),
        category: card.getAttribute('data-category')
    }));
}

/**
 * Debounced search function to avoid too many API calls
 */
function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const searchTerm = document.getElementById('searchBox').value;
        if (searchTerm.length >= 2) {
            searchProducts();
        } else if (searchTerm.length === 0) {
            // Reset to show all products
            window.location.href = '/shop';
        }
    }, 300);
}

/**
 * Search products via AJAX
 */
async function searchProducts() {
    const searchTerm = document.getElementById('searchBox').value.trim();
    
    if (searchTerm.length < 2) {
        showMessage('Please enter at least 2 characters to search', 'error');
        return;
    }

    showLoadingIndicator(true);

    try {
        const response = await fetch(`/shop/search?q=${encodeURIComponent(searchTerm)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.success) {
            displaySearchResults(data.products);
        } else {
            showMessage(data.error || 'Search failed', 'error');
        }
    } catch (error) {
        console.error('Search error:', error);
        showMessage('Search failed. Please try again.', 'error');
    } finally {
        showLoadingIndicator(false);
    }
}

/**
 * Display search results
 * @param {Array} products - Array of product objects
 */
function displaySearchResults(products) {
    const container = document.getElementById('productsContainer');
    
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = `
            <div class="no-products">
                <h3>No products found</h3>
                <p>Try different keywords or browse all products.</p>
                <button onclick="clearSearch()" class="clear-search-btn">Clear Search</button>
            </div>
        `;
        return;
    }

    // Generate HTML for products
    let html = '';
    products.forEach(product => {
        const isLoggedIn = document.querySelector('.nav-links a[href*="logout"]') !== null;
        
        html += `
            <div class="product-card" data-category="${product.category}" data-price="${product.price}" data-name="${product.name}">
                <div class="product-image">
                    <img src="${product.imageUrl || '/images/shop/default-product.jpg'}" alt="${product.name}" />
                    ${product.stock === 0 ? '<div class="out-of-stock-overlay">Out of Stock</div>' : ''}
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="product-category">${product.category}</p>
                    <p class="product-description">${product.description || 'No description available'}</p>
                    <div class="product-price">₹${product.price.toFixed(2)}</div>
                    <div class="product-stock">Stock: ${product.stock}</div>
                    ${isLoggedIn ? 
                        (product.stock > 0 ? 
                            `<button class="add-to-cart-btn" data-product-id="${product._id}" onclick="addToCart('${product._id}')">Add to Cart</button>` :
                            `<button class="add-to-cart-btn disabled" disabled>Out of Stock</button>`
                        ) : 
                        `<a href="/login" class="add-to-cart-btn">Login to Purchase</a>`
                    }
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    
    // Update current products array
    storeCurrentProducts();
}

/**
 * Clear search and show all products
 */
function clearSearch() {
    document.getElementById('searchBox').value = '';
    window.location.href = '/shop';
}

/**
 * Filter products by category
 */
function filterByCategory() {
    const categoryFilter = document.getElementById('categoryFilter');
    const selectedCategory = categoryFilter.value;
    
    // Update URL with category parameter
    const url = new URL(window.location.href);
    if (selectedCategory) {
        url.searchParams.set('category', selectedCategory);
    } else {
        url.searchParams.delete('category');
    }
    
    // Navigate to filtered page
    window.location.href = url.toString();
}

/**
 * Sort products client-side
 */
function sortProducts() {
    const sortBy = document.getElementById('sortBy').value;
    const container = document.getElementById('productsContainer');
    
    if (!container || currentProducts.length === 0) return;

    let sortedProducts = [...currentProducts];

    switch (sortBy) {
        case 'name':
            sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'price-low':
            sortedProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            sortedProducts.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
            // Keep original order (newest first by default)
            break;
    }

    // Clear container and re-append sorted elements
    container.innerHTML = '';
    sortedProducts.forEach(product => {
        container.appendChild(product.element);
    });
}

/**
 * Add item to cart via AJAX
 * @param {string} itemId - Product ID
 */
async function addToCart(itemId) {
    const button = document.querySelector(`[data-product-id="${itemId}"]`);
    
    if (!button) return;

    // Disable button to prevent multiple clicks
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Adding...';

    try {
        const response = await fetch(`/cart/add/${itemId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quantity: 1 })
        });

        const data = await response.json();
        
        if (data.success) {
            // Update cart count in navigation
            updateCartCount(data.count);
            
            // Change button appearance
            button.textContent = 'Added ✅';
            button.classList.add('added');
            
            // Show success message
            showMessage(data.message || 'Item added to cart successfully!', 'success');
            
            // Reset button after delay
            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
                button.classList.remove('added');
            }, 2000);
        } else {
            throw new Error(data.error || 'Failed to add item to cart');
        }
    } catch (error) {
        console.error('Add to cart error:', error);
        showMessage(error.message || 'Failed to add item to cart', 'error');
        
        // Reset button
        button.textContent = originalText;
        button.disabled = false;
    }
}

/**
 * Update cart count in navigation
 * @param {number} count - New cart count
 */
function updateCartCount(count) {
    const cartCountElements = document.querySelectorAll('#cartCount');
    cartCountElements.forEach(element => {
        element.textContent = count;
    });
}

/**
 * Update cart item quantity
 * @param {string} itemId - Item ID
 * @param {number} quantity - New quantity
 */
async function updateQuantity(itemId, quantity) {
    const parsedQuantity = parseInt(quantity);
    
    if (parsedQuantity < 0) return;

    try {
        const response = await fetch('/shop/update-cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                itemId: itemId,
                quantity: parsedQuantity
            })
        });

        const data = await response.json();
        
        if (data.success) {
            if (parsedQuantity === 0) {
                // Remove item from UI
                const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
                if (itemElement) {
                    itemElement.remove();
                }
            } else {
                // Update quantity input and totals
                updateCartItemDisplay(itemId, data.cart);
            }
            
            // Update cart count
            updateCartCount(data.count);
            
            // Update cart summary
            updateCartSummary(data.cart);
            
            showMessage('Cart updated successfully!', 'success');
        } else {
            throw new Error(data.error || 'Failed to update cart');
        }
    } catch (error) {
        console.error('Update quantity error:', error);
        showMessage(error.message || 'Failed to update cart', 'error');
    }
}

/**
 * Remove item from cart
 * @param {string} itemId - Item ID to remove
 */
async function removeFromCart(itemId) {
    if (!confirm('Are you sure you want to remove this item from your cart?')) {
        return;
    }

    try {
        const response = await fetch('/shop/remove-from-cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ itemId: itemId })
        });

        const data = await response.json();
        
        if (data.success) {
            // Remove item from UI
            const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
            if (itemElement) {
                itemElement.remove();
            }
            
            // Update cart count
            updateCartCount(data.count);
            
            // Update cart summary
            updateCartSummary(data.cart);
            
            // Check if cart is empty
            if (data.cart.items.length === 0) {
                showEmptyCart();
            }
            
            showMessage('Item removed from cart!', 'success');
        } else {
            throw new Error(data.error || 'Failed to remove item from cart');
        }
    } catch (error) {
        console.error('Remove from cart error:', error);
        showMessage(error.message || 'Failed to remove item from cart', 'error');
    }
}

/**
 * Update cart item display
 * @param {string} itemId - Item ID
 * @param {Object} cart - Updated cart object
 */
function updateCartItemDisplay(itemId, cart) {
    const item = cart.items.find(item => item.itemId === itemId);
    if (!item) return;

    const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
    if (!itemElement) return;

    // Update quantity input
    const quantityInput = itemElement.querySelector('input[type="number"]');
    if (quantityInput) {
        quantityInput.value = item.quantity;
    }

    // Update item total
    const itemTotalElement = itemElement.querySelector('.item-total p');
    if (itemTotalElement) {
        itemTotalElement.textContent = `₹${(item.price * item.quantity).toFixed(2)}`;
    }
}

/**
 * Update cart summary
 * @param {Object} cart - Cart object
 */
function updateCartSummary(cart) {
    const totalElement = document.querySelector('.summary-row.total span:last-child');
    if (totalElement) {
        totalElement.textContent = `₹${cart.totalAmount.toFixed(2)}`;
    }

    const itemCountElement = document.querySelector('.summary-row span:first-child');
    if (itemCountElement) {
        itemCountElement.textContent = `Items (${cart.itemCount}):`;
    }
}

/**
 * Show empty cart message
 */
function showEmptyCart() {
    const cartItemsContainer = document.querySelector('.cart-items-list');
    const cartSummary = document.querySelector('.cart-summary');
    
    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <h3>Your cart is empty</h3>
                <p>Add some amazing sports products to get started!</p>
                <a href="/shop" class="continue-shopping-btn">Continue Shopping</a>
            </div>
        `;
    }
    
    if (cartSummary) {
        cartSummary.style.display = 'none';
    }
}

/**
 * Process checkout
 */
async function processCheckout() {
    const form = document.getElementById('checkoutForm');
    
    if (!form || !form.checkValidity()) {
        showMessage('Please fill in all required shipping information', 'error');
        return;
    }

    const formData = new FormData(form);
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'Credit Card';
    
    const shippingAddress = {
        street: formData.get('street'),
        city: formData.get('city'),
        state: formData.get('state'),
        zipCode: formData.get('zipCode'),
        country: formData.get('country')
    };

    // Show loading modal
    showModal('loadingModal');

    try {
        const response = await fetch('/shop/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                shippingAddress: shippingAddress,
                paymentMethod: paymentMethod
            })
        });

        const data = await response.json();
        
        if (data.success) {
            // Redirect to success page
            window.location.href = `/shop/checkout-success/${data.order._id}`;
        } else {
            throw new Error(data.error || 'Checkout failed');
        }
    } catch (error) {
        console.error('Checkout error:', error);
        closeModal('loadingModal');
        showMessage(error.message || 'Checkout failed. Please try again.', 'error');
    }
}

/**
 * Show loading indicator
 * @param {boolean} show - Whether to show or hide
 */
function showLoadingIndicator(show) {
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) {
        indicator.style.display = show ? 'block' : 'none';
    }
}

/**
 * Show message to user
 * @param {string} message - Message to display
 * @param {string} type - Type: 'success' or 'error'
 */
function showMessage(message, type = 'success') {
    if (type === 'success') {
        document.getElementById('successMessage').textContent = message;
        showModal('successModal');
    } else {
        document.getElementById('errorMessage').textContent = message;
        showModal('errorModal');
    }
}

/**
 * Show modal
 * @param {string} modalId - Modal ID
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        
        // Auto-close success modals after 3 seconds
        if (modalId === 'successModal') {
            setTimeout(() => {
                closeModal(modalId);
            }, 3000);
        }
    }
}

/**
 * Close modal
 * @param {string} modalId - Modal ID
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};

// Additional utility functions for orders page

/**
 * Reorder items from a previous order
 * @param {string} orderId - Order ID
 */
async function reorderItems(orderId) {
    if (!confirm('Add all items from this order to your cart?')) {
        return;
    }

    // This would require additional backend endpoint
    showMessage('Reorder functionality coming soon!', 'success');
}

/**
 * Cancel order
 * @param {string} orderId - Order ID
 */
async function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) {
        return;
    }

    // This would require additional backend endpoint
    showMessage('Cancel order functionality coming soon!', 'success');
}

/**
 * Redirect to checkout page
 */
function goToCheckout() {
    const form = document.getElementById('checkoutForm');
    
    if (!form || !form.checkValidity()) {
        showMessage('Please fill in all required shipping information', 'error');
        return;
    }

    // Store shipping info in sessionStorage for checkout page
    const formData = new FormData(form);
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'Credit Card';
    
    const shippingData = {
        street: formData.get('street'),
        city: formData.get('city'),
        state: formData.get('state'),
        zipCode: formData.get('zipCode'),
        country: formData.get('country'),
        paymentMethod: paymentMethod
    };
    
    sessionStorage.setItem('shippingData', JSON.stringify(shippingData));
    
    // Redirect to checkout page
    window.location.href = '/checkout';
}

/**
 * Shop logout function
 */
async function shopLogout() {
    if (!confirm('Are you sure you want to logout? Your cart will be preserved.')) {
        return;
    }

    try {
        const response = await fetch('/shop-login/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            // Redirect to cart page after logout
            window.location.href = '/cart';
        } else {
            throw new Error('Logout failed');
        }
    } catch (error) {
        console.error('Logout error:', error);
        // Fallback: redirect anyway
        window.location.href = '/cart';
    }
}
