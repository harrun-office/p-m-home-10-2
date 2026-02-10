import { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Input } from './Input.jsx';
import { Select } from './Select.jsx';

/**
 * Enhanced form field with validation, error states, and accessibility
 */
export const FormField = forwardRef(({
  label,
  name,
  type = 'text',
  required = false,
  error,
  success,
  hint,
  suggestion,
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  validate,
  onValidationChange,
  className = '',
  inputClassName = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [internalError, setInternalError] = useState('');

  const actualType = showPasswordToggle && showPassword ? 'text' : type;
  const hasError = error || (touched && internalError);
  const hasSuccess = success && !hasError;
  const displayError = error || internalError;

  const handleBlur = (e) => {
    setTouched(true);

    if (validate) {
      try {
        const validationError = validate(e.target.value);
        setInternalError(validationError || '');
        onValidationChange?.(name, !validationError);
      } catch (err) {
        setInternalError(err.message);
        onValidationChange?.(name, false);
      }
    }

    props.onBlur?.(e);
  };

  const handleChange = (e) => {
    if (internalError) {
      setInternalError('');
      onValidationChange?.(name, true);
    }
    props.onChange?.(e);
  };

  const inputProps = {
    ...props,
    ref,
    name,
    type: actualType,
    onBlur: handleBlur,
    onChange: handleChange,
    className: `${inputClassName} ${
      hasError ? 'border-[var(--danger-muted)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/20' :
      hasSuccess ? 'border-[var(--success-muted)] focus:border-[var(--success)] focus:ring-[var(--success)]/20' :
      ''
    }`,
    'aria-invalid': hasError ? 'true' : 'false',
    'aria-describedby': [
      hasError && `${name}-error`,
      hint && `${name}-hint`,
      suggestion && `${name}-suggestion`
    ].filter(Boolean).join(' ') || undefined
  };

  const rightElement = showPasswordToggle ? (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)] hover:text-[var(--fg)]"
      aria-label={showPassword ? 'Hide password' : 'Show password'}
    >
      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  ) : rightIcon ? (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]">
      {rightIcon}
    </div>
  ) : null;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-[var(--fg)]"
        >
          {label}
          {required && <span className="text-[var(--danger)] ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]">
            {leftIcon}
          </div>
        )}

        {type === 'select' ? (
          <Select {...inputProps} />
        ) : (
          <Input {...inputProps} />
        )}

        {rightElement}
      </div>

      {/* Status Indicators */}
      <div className="flex items-start gap-2">
        {/* Error State */}
        <AnimatePresence>
          {hasError && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-[var(--danger)] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p
                  id={`${name}-error`}
                  className="text-sm text-[var(--danger)]"
                  role="alert"
                >
                  {displayError}
                </p>
                {suggestion && (
                  <p
                    id={`${name}-suggestion`}
                    className="text-sm text-[var(--info)] mt-1"
                  >
                    💡 {suggestion}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success State */}
        <AnimatePresence>
          {hasSuccess && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
              <span className="text-sm text-[var(--success-muted-fg)]">{success}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hint Text */}
      {hint && !hasError && (
        <p
          id={`${name}-hint`}
          className="text-sm text-[var(--fg-muted)]"
        >
          {hint}
        </p>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

/**
 * Form section with validation summary
 */
export function FormSection({ title, description, children, className = '' }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {(title || description) && (
        <div>
          {title && (
            <h3 className="text-lg font-medium text-[var(--fg)]">{title}</h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-[var(--fg-muted)]">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

/**
 * Form validation utilities
 */
export const validators = {
  required: (value) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return 'This field is required';
    }
    return null;
  },

  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  minLength: (min) => (value) => {
    if (value && value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (max) => (value) => {
    if (value && value.length > max) {
      return `Must be no more than ${max} characters`;
    }
    return null;
  },

  pattern: (regex, message) => (value) => {
    if (value && !regex.test(value)) {
      return message || 'Invalid format';
    }
    return null;
  },

  compose: (...validators) => (value) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return null;
  }
};

/**
 * Form state management hook
 */
export function useFormValidation(initialValues = {}, validationRules = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (name, value) => {
    const rules = validationRules[name];
    if (!rules) return null;

    if (Array.isArray(rules)) {
      for (const rule of rules) {
        const error = rule(value);
        if (error) return error;
      }
    } else {
      return rules(value);
    }

    return null;
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(name => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));

    const error = validateField(name, values[name]);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (onSubmit) => {
    setIsSubmitting(true);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    validateForm,
    reset,
    setValues
  };
}