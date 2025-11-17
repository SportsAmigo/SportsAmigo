/**
 * DHTML Integration - Dynamic HTML Enhancements
 * Universal DHTML features for SportsAmigo application
 * Enhances interactivity without modifying existing functionality
 */

// DHTML integration: Global enhancement variables
const DHTML = {
    initialized: false,
    animationSpeed: 300,
    debounceTimeout: 250,
    activeAnimations: new Set()
};

document.addEventListener('DOMContentLoaded', function() {
    if (DHTML.initialized) return;
    
    console.log('Initializing DHTML enhancements');
    
    // Initialize all DHTML features
    initDHTMLFeatures();
    
    DHTML.initialized = true;
    console.log('DHTML enhancements initialized');
});

/**
 * Main DHTML initialization function
 */
function initDHTMLFeatures() {
    // Enhanced navigation interactions
    initNavigationEnhancements();
    
    // Dynamic page transitions
    initPageTransitions();
    
    // Enhanced form interactions
    initFormEnhancements();
    
    // Interactive elements
    initInteractiveElements();
    
    // Accessibility enhancements
    initAccessibilityFeatures();
    
    // Performance monitoring
    initPerformanceOptimizations();
}

/**
 * DHTML integration: Enhanced navigation interactions
 */
function initNavigationEnhancements() {
    // Enhanced dropdown menus
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const content = dropdown.querySelector('.dropdown-content');
        if (!content) return;
        
        // Add smooth transitions
        content.style.opacity = '0';
        content.style.transform = 'translateY(-10px)';
        content.style.transition = 'all 0.3s ease';
        content.style.pointerEvents = 'none';
        
        dropdown.addEventListener('mouseenter', function() {
            content.style.opacity = '1';
            content.style.transform = 'translateY(0)';
            content.style.pointerEvents = 'auto';
        });
        
        dropdown.addEventListener('mouseleave', function() {
            content.style.opacity = '0';
            content.style.transform = 'translateY(-10px)';
            content.style.pointerEvents = 'none';
        });
    });
    
    // Enhanced navigation links
    const navLinks = document.querySelectorAll('nav a, .nav-links a');
    
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.2s ease';
            this.style.transform = 'translateY(-2px)';
            this.style.textShadow = '0 2px 4px rgba(0,0,0,0.1)';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.textShadow = '';
        });
    });
}

/**
 * DHTML integration: Dynamic page transitions
 */
function initPageTransitions() {
    // Add loading overlay for page transitions
    const style = document.createElement('style');
    style.textContent = `
        .page-transition-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, #007bff, #28a745);
            z-index: 99999;
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }
        
        .page-transition-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }
        
        .transition-spinner {
            width: 50px;
            height: 50px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
    `;
    document.head.appendChild(style);
    
    // Create transition overlay
    const overlay = document.createElement('div');
    overlay.className = 'page-transition-overlay';
    overlay.innerHTML = '<div class="transition-spinner"></div>';
    document.body.appendChild(overlay);
    
    // Enhanced link transitions (only for internal links)
    const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]');
    
    internalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Skip if modifier keys are pressed or it's a different target
            if (e.ctrlKey || e.metaKey || e.shiftKey || this.target === '_blank') return;
            
            const href = this.getAttribute('href');
            if (!href || href === '#') return;
            
            e.preventDefault();
            
            // Show transition
            overlay.classList.add('active');
            
            // Navigate after animation
            setTimeout(() => {
                window.location.href = href;
            }, 150);
        });
    });
}

/**
 * DHTML integration: Enhanced form interactions
 */
function initFormEnhancements() {
    // Enhanced input field interactions
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        // Add floating label effect if label exists
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label && !input.placeholder) {
            const wrapper = document.createElement('div');
            wrapper.className = 'floating-label-wrapper';
            wrapper.style.position = 'relative';
            
            input.parentNode.insertBefore(wrapper, input);
            wrapper.appendChild(input);
            wrapper.appendChild(label);
            
            label.style.position = 'absolute';
            label.style.top = '50%';
            label.style.left = '12px';
            label.style.transform = 'translateY(-50%)';
            label.style.transition = 'all 0.3s ease';
            label.style.pointerEvents = 'none';
            label.style.color = '#666';
            label.style.background = 'white';
            label.style.padding = '0 4px';
            
            function updateLabel() {
                if (input.value || input.matches(':focus')) {
                    label.style.top = '0';
                    label.style.fontSize = '12px';
                    label.style.color = '#007bff';
                } else {
                    label.style.top = '50%';
                    label.style.fontSize = '14px';
                    label.style.color = '#666';
                }
            }
            
            input.addEventListener('focus', updateLabel);
            input.addEventListener('blur', updateLabel);
            input.addEventListener('input', updateLabel);
            
            // Initial state
            updateLabel();
        }
        
        // Enhanced focus effects
        input.addEventListener('focus', function() {
            this.style.transform = 'scale(1.02)';
            this.style.transition = 'all 0.2s ease';
        });
        
        input.addEventListener('blur', function() {
            this.style.transform = 'scale(1)';
        });
    });
}

/**
 * DHTML integration: Interactive elements
 */
function initInteractiveElements() {
    // Enhanced image hover effects
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        img.addEventListener('mouseenter', function() {
            if (!this.style.transform) {
                this.style.transition = 'transform 0.3s ease';
                this.style.transform = 'scale(1.05)';
            }
        });
        
        img.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // Enhanced button interactions (global)
    const buttons = document.querySelectorAll('button:not([data-dhtml-enhanced]), .btn:not([data-dhtml-enhanced])');
    
    buttons.forEach(button => {
        button.setAttribute('data-dhtml-enhanced', 'true');
        
        // Add ripple effect container
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        
        button.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.className = 'dhtml-ripple';
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.parentNode.removeChild(ripple);
                }
            }, 600);
        });
    });
}

/**
 * DHTML integration: Accessibility enhancements
 */
function initAccessibilityFeatures() {
    // Enhanced keyboard navigation
    const focusableElements = document.querySelectorAll('a, button, input, textarea, select, [tabindex]');
    
    focusableElements.forEach(element => {
        element.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                // Add visual feedback for keyboard interaction
                this.style.outline = '2px solid #007bff';
                this.style.outlineOffset = '2px';
                
                setTimeout(() => {
                    this.style.outline = '';
                    this.style.outlineOffset = '';
                }, 200);
            }
        });
    });
    
    // Add skip link for accessibility
    if (!document.querySelector('.skip-link')) {
        const skipLink = document.createElement('a');
        skipLink.className = 'skip-link';
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: #007bff;
            color: white;
            padding: 8px;
            text-decoration: none;
            border-radius: 4px;
            z-index: 1000;
            transition: top 0.3s ease;
        `;
        
        skipLink.addEventListener('focus', function() {
            this.style.top = '6px';
        });
        
        skipLink.addEventListener('blur', function() {
            this.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
    }
}

/**
 * DHTML integration: Performance optimizations
 */
function initPerformanceOptimizations() {
    // Lazy loading for images
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
    
    // Debounced scroll handler for performance
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        
        scrollTimeout = setTimeout(() => {
            // Trigger scroll-dependent animations
            document.dispatchEvent(new CustomEvent('optimizedScroll'));
        }, DHTML.debounceTimeout);
    }, { passive: true });
}

// DHTML integration: Global utility functions
window.DHTML_Utils = {
    // Animate element into view
    animateIn: function(element, delay = 0) {
        if (DHTML.activeAnimations.has(element)) return;
        
        DHTML.activeAnimations.add(element);
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = `all ${DHTML.animationSpeed}ms ease`;
        
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
            
            setTimeout(() => {
                DHTML.activeAnimations.delete(element);
            }, DHTML.animationSpeed);
        }, delay);
    },
    
    // Show notification
    showNotification: function(message, type = 'info', duration = 3000) {
        if (window.showNotification) {
            window.showNotification(message, type, duration);
        } else {
            // Fallback notification
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    },
    
    // Smooth scroll to element
    scrollTo: function(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
};

// DHTML integration: Add global CSS for enhancements
const globalDHTMLStyle = document.createElement('style');
globalDHTMLStyle.textContent = `
    .dhtml-ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: scale(0);
        animation: dhtml-ripple 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes dhtml-ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .floating-label-wrapper input,
    .floating-label-wrapper textarea {
        padding-top: 20px !important;
    }
    
    img.loaded {
        opacity: 1;
        transition: opacity 0.3s ease;
    }
    
    img[data-src] {
        opacity: 0;
    }
    
    @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
    }
`;
document.head.appendChild(globalDHTMLStyle);