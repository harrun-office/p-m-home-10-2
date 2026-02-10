import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';

/**
 * Comprehensive async wrapper for handling loading, error, and success states
 */
export function AsyncWrapper({
  loading = false,
  error = null,
  success = null,
  loadingComponent,
  errorComponent,
  successComponent,
  children,
  retry,
  className = ''
}) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (success) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      setShowError(true);
    } else {
      setShowError(false);
    }
  }, [error]);

  if (loading) {
    return loadingComponent || <LoadingSpinner />;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Error Overlay */}
      <AnimatePresence>
        {showError && error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-4 right-4 z-50"
          >
            <ErrorToast
              error={error}
              onClose={() => setShowError(false)}
              onRetry={retry}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Notification */}
      <AnimatePresence>
        {showSuccess && success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-4 right-4 z-50"
          >
            <SuccessToast
              message={success}
              onClose={() => setShowSuccess(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </div>
  );
}

/**
 * Loading spinner with different sizes and styles
 */
export function LoadingSpinner({ size = 'md', className = '', text = '' }) {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-500`} />
      {text && (
        <p className="mt-2 text-sm text-gray-600">{text}</p>
      )}
    </div>
  );
}

/**
 * Skeleton loading component for content
 */
export function SkeletonLoader({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );
}

/**
 * Card skeleton for loading states
 */
export function CardSkeleton({ count = 1, className = '' }) {
  return (
    <div className={`grid gap-4 ${count > 1 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : ''} ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="h-6 bg-gray-200 rounded w-16"></div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Error toast/notification
 */
export function ErrorToast({ error, onClose, onRetry }) {
  const errorMessage = typeof error === 'string' ? error :
    error?.message || 'An unexpected error occurred';

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm shadow-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-red-800">Error</h4>
          <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
          <div className="flex gap-2 mt-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded transition-colors"
              >
                Try Again
              </button>
            )}
            <button
              onClick={onClose}
              className="text-xs text-red-600 hover:text-red-800 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-red-400 hover:text-red-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Success toast/notification
 */
export function SuccessToast({ message, onClose }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-sm shadow-lg">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-green-800">Success</h4>
          <p className="text-sm text-green-700 mt-1">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-green-400 hover:text-green-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Full page loading overlay
 */
export function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

/**
 * Hook for managing async operations
 */
export function useAsyncOperation() {
  const [state, setState] = useState({
    loading: false,
    error: null,
    success: null
  });

  const execute = async (operation, successMessage = null) => {
    setState({ loading: true, error: null, success: null });

    try {
      const result = await operation();
      setState({
        loading: false,
        error: null,
        success: successMessage || 'Operation completed successfully'
      });
      return result;
    } catch (error) {
      setState({
        loading: false,
        error: error.message || 'An error occurred',
        success: null
      });
      throw error;
    }
  };

  const reset = () => {
    setState({ loading: false, error: null, success: null });
  };

  return {
    ...state,
    execute,
    reset
  };
}