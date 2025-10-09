// Reusable DOM-based form validation for SportsAmigo
// Attaches to forms with: data-validate attribute, class 'needs-validation', or specific ids like 'login-form' or 'signup-form'
document.addEventListener('DOMContentLoaded', function () {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const phoneRegex = /^[0-9]{10}$/;

  function createError(el, msg) {
    // try to reuse existing error element
    let next = el.nextElementSibling;
    if (next && next.classList && next.classList.contains('fv-error')) {
      next.textContent = msg;
      return next;
    }
    const div = document.createElement('div');
    div.className = 'fv-error text-danger';
    div.style.marginTop = '0.25rem';
    div.textContent = msg;
    el.parentNode.insertBefore(div, el.nextSibling);
    return div;
  }

  function clearError(el) {
    el.classList.remove('is-invalid');
    el.classList.add('is-valid');
    let next = el.nextElementSibling;
    if (next && next.classList && next.classList.contains('fv-error')) next.remove();
  }

  function invalidate(el, msg) {
    el.classList.remove('is-valid');
    el.classList.add('is-invalid');
    createError(el, msg);
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
      const ev = (field.tagName.toLowerCase() === 'select' || field.type === 'checkbox' || field.type === 'radio') ? 'change' : 'input';
      field.addEventListener(ev, () => validateField(field, form));
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
    form.addEventListener('submit', function (e) {
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
        // focus first invalid
        const firstInvalid = form.querySelector('.is-invalid');
        if (firstInvalid) firstInvalid.focus();
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

});
