// Reusable DOM-based form validation for SportsAmigo
// Attaches to forms with: data-validate attribute, class 'needs-validation', or specific ids like 'login-form' or 'signup-form'
// Enhanced with DHTML integration for dynamic user experience
document.addEventListener('DOMContentLoaded', function () {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const phoneRegex = /^[0-9]{10}$/;

  // DHTML integration: Dynamic form enhancement variables
  let formSubmissionInProgress = false;
  const validationDelayTimeout = {};
  const VALIDATION_DELAY = 300; // milliseconds

  // AJAX form submission with fetch API
  async function submitFormWithAjax(form, event) {
    event.preventDefault();
    
    if (formSubmissionInProgress) {
      return false;
    }
    
    formSubmissionInProgress = true;
    const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
    const originalButtonText = submitButton ? submitButton.textContent : '';
    
    try {
      // Show loading state
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Submitting...';
      }
      
      // Create JSON data from the form
      const formData = new FormData(form);
      const jsonData = {};
      
      // Convert FormData to JSON object
      for (let [key, value] of formData.entries()) {
        jsonData[key] = value;
      }
      
      console.log('Submitting AJAX form data:', jsonData);
      
      // Make fetch request with JSON data
      const response = await fetch(form.action, {
        method: form.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(jsonData)
      });
      
      const result = await response.json();
      
      console.log('AJAX response:', result);
      
      if (response.ok && result.success) {
        // Success response
        showFormMessage(form, 'success', result.message || 'Form submitted successfully!');
        
        if (result.redirectUrl) {
          setTimeout(() => {
            window.location.href = result.redirectUrl;
          }, 1500);
        } else {
          form.reset();
          // Clear validation states
          const fields = form.querySelectorAll('.is-valid, .is-invalid');
          fields.forEach(field => {
            field.classList.remove('is-valid', 'is-invalid');
          });
          const feedbacks = form.querySelectorAll('.invalid-feedback, .valid-feedback');
          feedbacks.forEach(feedback => feedback.remove());
        }
      } else {
        // Error response
        showFormMessage(form, 'error', result.message || 'Submission failed');
        
        // Display field-specific errors if available
        if (result.errors) {
          Object.keys(result.errors).forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field) {
              field.classList.add('is-invalid');
              field.classList.remove('is-valid');
              
              // Remove existing feedback
              const existingFeedback = field.parentNode.querySelector('.invalid-feedback');
              if (existingFeedback) {
                existingFeedback.remove();
              }
              
              // Add new feedback
              const feedback = document.createElement('div');
              feedback.className = 'invalid-feedback';
              feedback.textContent = result.errors[fieldName];
              field.parentNode.appendChild(feedback);
            }
          });
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      showFormMessage(form, 'error', 'Network error. Please check your connection and try again.');
    } finally {
      formSubmissionInProgress = false;
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
    }
    
    return false;
  }
  
  function showFormMessage(form, type, message) {
    // Remove existing messages
    const existingMessages = form.querySelectorAll('.form-ajax-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert alert-${type === 'error' ? 'danger' : 'success'} form-ajax-message`;
    messageDiv.style.marginTop = '1rem';
    messageDiv.innerHTML = `
      <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'} me-2"></i>
      ${message}
    `;
    
    // Insert at the top of the form
    form.insertBefore(messageDiv, form.firstChild);
    
    // Auto-remove success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.remove();
        }
      }, 5000);
    }
  }

  function createError(el, msg) {
    // try to reuse existing error element
    let next = el.nextElementSibling;
    if (next && next.classList && next.classList.contains('fv-error')) {
      next.textContent = msg;
      // DHTML integration: Animate error message appearance
      next.style.opacity = '0';
      next.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        next.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        next.style.opacity = '1';
        next.style.transform = 'translateY(0)';
      }, 10);
      return next;
    }
    const div = document.createElement('div');
    div.className = 'fv-error text-danger';
    div.style.marginTop = '0.25rem';
    div.style.opacity = '0';
    div.style.transform = 'translateY(-10px)';
    div.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    div.textContent = msg;
    el.parentNode.insertBefore(div, el.nextSibling);
    
    // DHTML integration: Animate error appearance
    setTimeout(() => {
      div.style.opacity = '1';
      div.style.transform = 'translateY(0)';
    }, 10);
    
    return div;
  }

  function clearError(el) {
    el.classList.remove('is-invalid');
    el.classList.add('is-valid');
    let next = el.nextElementSibling;
    if (next && next.classList && next.classList.contains('fv-error')) {
      // DHTML integration: Animate error removal
      next.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      next.style.opacity = '0';
      next.style.transform = 'translateY(-10px)';
      setTimeout(() => next.remove(), 300);
    }
    
    // DHTML integration: Add success visual feedback
    addSuccessVisualFeedback(el);
  }

  function invalidate(el, msg) {
    el.classList.remove('is-valid');
    el.classList.add('is-invalid');
    // DHTML integration: Add shake animation for invalid fields
    el.style.animation = 'shake 0.3s ease-in-out';
    setTimeout(() => {
      el.style.animation = '';
    }, 300);
    createError(el, msg);
  }

  // DHTML integration: Add success visual feedback function
  function addSuccessVisualFeedback(el) {
    // Add a temporary success glow effect
    el.style.boxShadow = '0 0 10px rgba(40, 167, 69, 0.5)';
    el.style.transition = 'box-shadow 0.3s ease';
    setTimeout(() => {
      el.style.boxShadow = '';
    }, 1500);
  }

  // DHTML integration: Real-time validation with debouncing
  function debounceValidation(field, form, fieldId) {
    if (validationDelayTimeout[fieldId]) {
      clearTimeout(validationDelayTimeout[fieldId]);
    }
    
    validationDelayTimeout[fieldId] = setTimeout(() => {
      validateField(field, form);
    }, VALIDATION_DELAY);
  }

  function validateField(field, form) {
    const type = field.type;
    const name = field.name || field.id || '';
    const val = (field.value || '').trim();

    // skip disabled fields
    if (field.disabled) return true;

    // required
    if (field.required) {
      if (type === 'checkbox') {
        if (!field.checked) {
          invalidate(field, 'This field is required.');
          return false;
        }
      } else if (type === 'radio') {
        const checked = form.querySelector(`input[name="${name}"]:checked`);
        if (!checked) {
          // place message after the last radio in the group
          const radios = form.querySelectorAll(`input[name="${name}"]`);
          if (radios.length) createError(radios[radios.length - 1], 'Please select an option.');
          return false;
        }
      } else if (val === '') {
        invalidate(field, 'This field is required.');
        return false;
      }
    }

    // email
    if (type === 'email' || /email/i.test(name)) {
      if (val !== '' && !emailRegex.test(val)) {
        invalidate(field, 'Please enter a valid email address (e.g., name@example.com).');
        return false;
      }
    }

    // telephone / phone
    if (type === 'tel' || /phone|mobile/.test(name)) {
      const pattern = field.getAttribute('pattern');
      const pat = pattern ? new RegExp(pattern) : phoneRegex;
      if (val !== '' && !pat.test(val)) {
        invalidate(field, 'Please enter a valid 10-digit phone number.');
        return false;
      }
    }

    // password length
    if (type === 'password') {
      const minlength = field.getAttribute('minlength') || 6;
      if (val !== '' && val.length < Number(minlength)) {
        invalidate(field, `Password must be at least ${minlength} characters.`);
        return false;
      }
      // confirm password handled later by name/id
    }

    // number min/max
    if (type === 'number') {
      const min = field.getAttribute('min');
      const max = field.getAttribute('max');
      if (val !== '') {
        const num = Number(val);
        if (min && num < Number(min)) {
          invalidate(field, `Value must be at least ${min}.`);
          return false;
        }
        if (max && num > Number(max)) {
          invalidate(field, `Value must be at most ${max}.`);
          return false;
        }
      }
    }

    // date logic (start_date should not be in the past, end_date >= start_date)
    if (field.type === 'date' && val !== '') {
      const id = field.id || name;
      if (id === 'start_date') {
        const today = new Date();
        today.setHours(0,0,0,0);
        const sd = new Date(val);
        if (sd < today) {
          invalidate(field, 'Start date cannot be in the past.');
          return false;
        }
      }
      if (id === 'end_date') {
        const start = form.querySelector('#start_date');
        if (start && start.value) {
          const sd = new Date(start.value);
          const ed = new Date(val);
          if (ed < sd) {
            invalidate(field, 'End date cannot be before start date.');
            return false;
          }
        }
      }
    }

    // select required
    if (field.tagName.toLowerCase() === 'select' && field.required) {
      if (val === '') {
        invalidate(field, 'Please select an option.');
        return false;
      }
    }

    // custom pattern attribute
    const patternAttr = field.getAttribute && field.getAttribute('pattern');
    if (patternAttr && val !== '') {
      try {
        const re = new RegExp(patternAttr);
        if (!re.test(val)) {
          invalidate(field, 'Invalid format.');
          return false;
        }
      } catch (e) {
        // ignore bad regex
      }
    }

    // confirm password matching
    if (field.id === 'confirm_password' || /confirm/.test(name)) {
      const pwd = form.querySelector('#password');
      if (pwd && val !== '' && val !== pwd.value) {
        invalidate(field, 'Passwords do not match.');
        return false;
      }
    }

    // if reached here, field considered valid
    // remove error if any
    if (field.classList) {
      field.classList.remove('is-invalid');
      field.classList.add('is-valid');
    }
    const next = field.nextElementSibling;
    if (next && next.classList && next.classList.contains('fv-error')) next.remove();
    return true;
  }

  function attachFieldListeners(form) {
    const fields = form.querySelectorAll('input, textarea, select');
    fields.forEach(field => {
      const fieldId = field.id || field.name || Math.random().toString(36).substr(2, 9);
      const ev = (field.tagName.toLowerCase() === 'select' || field.type === 'checkbox' || field.type === 'radio') ? 'change' : 'input';
      
      // DHTML integration: Enhanced field listeners with debouncing
      field.addEventListener(ev, () => {
        if (field.type === 'password' || field.type === 'email') {
          // Use debouncing for performance-sensitive fields
          debounceValidation(field, form, fieldId);
        } else {
          validateField(field, form);
        }
      });
      
      // DHTML integration: Add focus and blur effects
      field.addEventListener('focus', function() {
        this.style.transition = 'border-color 0.3s ease, box-shadow 0.3s ease';
        this.style.borderColor = '#007bff';
        this.style.boxShadow = '0 0 0 0.2rem rgba(0, 123, 255, 0.25)';
      });
      
      field.addEventListener('blur', function() {
        this.style.borderColor = '';
        this.style.boxShadow = '';
      });
      
      // remove native invalid validity messages
      field.addEventListener('invalid', function (e) { e.preventDefault(); });
    });

    // special: confirm password live-check
    const pwd = form.querySelector('#password');
    const confirm = form.querySelector('#confirm_password');
    if (pwd && confirm) {
      confirm.addEventListener('input', () => validateField(confirm, form));
    }
  }

  function setupForm(form) {
    attachFieldListeners(form);
    
    // DHTML integration: Add form submission enhancements
    const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
    
    form.addEventListener('submit', function (e) {
      // Prevent double submission
      if (formSubmissionInProgress) {
        e.preventDefault();
        return;
      }
      
      let valid = true;
      const fields = form.querySelectorAll('input, textarea, select');
      fields.forEach(f => {
        const ok = validateField(f, form);
        if (!ok) valid = false;
      });

      // additional custom checks
      // Example: for create-team ensure at least 2 members? we keep generic

      if (!valid) {
        e.preventDefault();
        e.stopPropagation();
        // focus first invalid with smooth scroll
        const firstInvalid = form.querySelector('.is-invalid');
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstInvalid.focus();
        }
      } else {
        // Check if form should use AJAX (has data-ajax attribute or is certain forms)
        const useAjax = form.hasAttribute('data-ajax') || 
                       form.id === 'signup-form' || 
                       form.id === 'login-form' ||
                       form.action.includes('create-event') ||
                       form.action.includes('create-team') ||
                       form.action.includes('join-team');
        
        if (useAjax) {
          // Use AJAX submission
          submitFormWithAjax(form, e);
        } else {
          // DHTML integration: Show loading state on submit button for regular submission
          if (submitButton) {
            formSubmissionInProgress = true;
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';
            submitButton.style.opacity = '0.6';
            
            // Reset after 10 seconds (fallback)
            setTimeout(() => {
              if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
                submitButton.style.opacity = '1';
                formSubmissionInProgress = false;
              }
            }, 10000);
          }
        }
      }
    });
  }

  // find forms to enhance
  const selector = 'form[data-validate], form.needs-validation, form#login-form, form#signup-form, form[action*="create-team"], form[action*="create-event"]';
  const forms = document.querySelectorAll(selector);
  forms.forEach(f => setupForm(f));

  // Apply data-width attributes to elements (used to avoid EJS in inline style attributes)
  function applyDataWidths(root = document) {
    const els = root.querySelectorAll('[data-width]');
    els.forEach(el => {
      const v = el.getAttribute('data-width');
      if (v !== null) {
        // sanitize numeric value
        const num = Number(v);
        if (!isNaN(num)) {
          el.style.width = num + '%';
          // also update aria-valuenow if present
          if (el.hasAttribute('aria-valuenow')) el.setAttribute('aria-valuenow', String(num));
        }
      }
    });
  }

  // run once after DOM ready
  applyDataWidths(document);

  // DHTML integration: Add CSS animations dynamically
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
    
    .fv-error {
      font-size: 0.875rem;
      line-height: 1.2;
    }
    
    .form-control.is-valid {
      border-color: #28a745;
    }
    
    .form-control.is-invalid {
      border-color: #dc3545;
    }
    
    .form-control:focus {
      outline: none;
    }
    
    /* Enhanced button states */
    button[type="submit"]:disabled {
      cursor: not-allowed;
      transform: scale(0.98);
    }
  `;
  document.head.appendChild(style);

});
