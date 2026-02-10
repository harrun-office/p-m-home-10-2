/**
 * Accessibility utilities and helpers
 */

/**
 * Generate unique IDs for ARIA relationships
 */
let idCounter = 0;
export function generateId(prefix = 'id') {
  return `${prefix}-${++idCounter}`;
}

/**
 * Announce content to screen readers
 */
export function announceToScreenReader(message, priority = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Manage focus trapping for modals and dialogs
 */
export function trapFocus(container) {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  function handleKeyDown(e) {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }

    if (e.key === 'Escape') {
      // Find and trigger close handler
      const closeButton = container.querySelector('[data-close-modal]');
      if (closeButton) {
        closeButton.click();
      }
    }
  }

  container.addEventListener('keydown', handleKeyDown);

  // Focus first element
  if (firstElement) {
    firstElement.focus();
  }

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Skip link management
 */
export function manageSkipLinks() {
  const skipLinks = document.querySelectorAll('a[href^="#"]');

  skipLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/**
 * High contrast mode detection
 */
export function prefersHighContrast() {
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Reduced motion preference
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Color scheme preference
 */
export function prefersDarkMode() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Keyboard navigation utilities
 */
export const keyboardNavigation = {
  // Arrow key navigation for lists
  handleArrowNavigation: (items, currentIndex, direction) => {
    const newIndex = direction === 'up'
      ? Math.max(0, currentIndex - 1)
      : Math.min(items.length - 1, currentIndex + 1);

    if (newIndex !== currentIndex) {
      items[newIndex].focus();
      announceToScreenReader(`Item ${newIndex + 1} of ${items.length}`);
    }

    return newIndex;
  },

  // Home/End navigation
  handleHomeEndNavigation: (items, key) => {
    const targetIndex = key === 'Home' ? 0 : items.length - 1;
    items[targetIndex].focus();
    announceToScreenReader(`Item ${targetIndex + 1} of ${items.length}`);
    return targetIndex;
  }
};

/**
 * ARIA live region manager for dynamic content
 */
export class LiveRegion {
  constructor(priority = 'polite') {
    this.element = document.createElement('div');
    this.element.setAttribute('aria-live', priority);
    this.element.setAttribute('aria-atomic', 'true');
    this.element.className = 'sr-only';
    document.body.appendChild(this.element);
  }

  announce(message) {
    this.element.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      this.element.textContent = '';
    }, 1000);
  }

  destroy() {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

/**
 * Focus management utilities
 */
export const focusManagement = {
  // Save and restore focus
  saveFocus: () => {
    return document.activeElement;
  },

  restoreFocus: (element) => {
    if (element && element.focus) {
      element.focus();
    }
  },

  // Move focus to next focusable element
  moveFocus: (direction = 'next') => {
    const focusableElements = Array.from(
      document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    );

    const currentIndex = focusableElements.indexOf(document.activeElement);

    if (currentIndex === -1) return;

    const nextIndex = direction === 'next'
      ? Math.min(focusableElements.length - 1, currentIndex + 1)
      : Math.max(0, currentIndex - 1);

    focusableElements[nextIndex].focus();
  }
};

/**
 * Semantic heading management
 */
export function validateHeadingHierarchy() {
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let lastLevel = 0;

  headings.forEach(heading => {
    const level = parseInt(heading.tagName.charAt(1));

    // Check for skipped levels (should not skip more than one level)
    if (level > lastLevel + 1 && lastLevel !== 0) {
      console.warn(`Heading hierarchy violation: ${heading.tagName} after h${lastLevel}`, heading);
    }

    lastLevel = level;
  });
}

/**
 * Color contrast utilities
 */
export function calculateLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function calculateContrastRatio(color1, color2) {
  const lum1 = calculateLuminance(...color1);
  const lum2 = calculateLuminance(...color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export function hasGoodContrast(foreground, background) {
  const ratio = calculateContrastRatio(foreground, background);
  return ratio >= 4.5; // WCAG AA standard for normal text
}

/**
 * Form accessibility helpers
 */
export const formAccessibility = {
  // Associate labels with inputs
  associateLabels: () => {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      const id = input.id || generateId('input');
      input.id = id;

      // Find or create label
      let label = document.querySelector(`label[for="${id}"]`);
      if (!label) {
        const parent = input.parentElement;
        if (parent && parent.querySelector('label')) {
          label = parent.querySelector('label');
          label.setAttribute('for', id);
        }
      }
    });
  },

  // Validate form accessibility
  validateForm: (form) => {
    const issues = [];

    // Check for labels
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby') && !document.querySelector(`label[for="${input.id}"]`)) {
        issues.push(`Input ${input.name || input.id} missing label`);
      }
    });

    // Check for error messages
    const invalidInputs = form.querySelectorAll('input:invalid, select:invalid, textarea:invalid');
    invalidInputs.forEach(input => {
      if (!input.getAttribute('aria-describedby')) {
        issues.push(`Invalid input ${input.name || input.id} missing error message association`);
      }
    });

    return issues;
  }
};