import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * Hover lift effect for cards and buttons
 */
export function HoverLift({
  children,
  liftAmount = 4,
  scaleAmount = 1.02,
  className = '',
  disabled = false
}) {
  if (disabled) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      whileHover={{
        y: -liftAmount,
        scale: scaleAmount
      }}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Pulse animation for notifications or important items
 */
export function PulseNotification({ children, isActive = false, className = '' }) {
  return (
    <motion.div
      className={className}
      animate={isActive ? {
        scale: [1, 1.05, 1],
        boxShadow: [
          '0 0 0 0 rgba(59, 130, 246, 0)',
          '0 0 0 4px rgba(59, 130, 246, 0.3)',
          '0 0 0 0 rgba(59, 130, 246, 0)'
        ]
      } : {}}
      transition={{
        duration: 2,
        repeat: isActive ? Infinity : 0,
        repeatDelay: 3
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered list animation
 */
export function StaggeredList({ children, staggerDelay = 0.1, className = '' }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            <motion.div key={index} variants={itemVariants}>
              {child}
            </motion.div>
          ))
        : children
      }
    </motion.div>
  );
}

/**
 * Success checkmark animation
 */
export function SuccessCheckmark({ size = 24, className = '' }) {
  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 0.6, ease: 'easeInOut' },
        opacity: { duration: 0.2 }
      }
    }
  };

  const circleVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: 0.2
      }
    }
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`text-green-500 ${className}`}
      initial="hidden"
      animate="visible"
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        variants={circleVariants}
      />
      <motion.path
        d="M8 12l2 2 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={pathVariants}
      />
    </motion.svg>
  );
}

/**
 * Loading dots animation
 */
export function LoadingDots({ size = 'md', color = 'text-blue-500' }) {
  const sizes = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  const dotVariants = {
    animate: {
      scale: [1, 1.2, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={`${sizes[size]} ${color} rounded-full`}
          variants={dotVariants}
          animate="animate"
          style={{
            animationDelay: `${index * 0.2}s`
          }}
        />
      ))}
    </div>
  );
}

/**
 * Progress bar with smooth animation
 */
export function AnimatedProgressBar({
  value = 0,
  max = 100,
  height = 4,
  color = 'bg-blue-500',
  backgroundColor = 'bg-gray-200',
  className = '',
  showPercentage = false
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayValue(value);
    }, 100);

    return () => clearTimeout(timer);
  }, [value]);

  const percentage = Math.min(Math.max((displayValue / max) * 100, 0), 100);

  return (
    <div className={`relative ${className}`}>
      <div
        className={`w-full ${backgroundColor} rounded-full overflow-hidden`}
        style={{ height }}
      >
        <motion.div
          className={`h-full ${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            type: 'spring',
            stiffness: 100,
            damping: 20,
            duration: 1
          }}
        />
      </div>
      {showPercentage && (
        <motion.span
          className="absolute right-0 top-0 text-xs font-medium text-gray-600 transform translate-x-full ml-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {Math.round(percentage)}%
        </motion.span>
      )}
    </div>
  );
}

/**
 * Button with ripple effect
 */
export function RippleButton({
  children,
  onClick,
  className = '',
  rippleColor = 'rgba(255, 255, 255, 0.3)',
  ...props
}) {
  const [ripples, setRipples] = useState([]);

  const handleClick = (event) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const newRipple = {
      id: Date.now(),
      x,
      y,
      size
    };

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);

    onClick?.(event);
  };

  return (
    <button
      {...props}
      onClick={handleClick}
      className={`relative overflow-hidden ${className}`}
    >
      {children}

      {/* Ripples */}
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: rippleColor
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
    </button>
  );
}

/**
 * Toast notification with slide-in animation
 */
export function SlideToast({ children, type = 'info', onClose, autoClose = true }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  const variants = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.8 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25
          }}
          className={`fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg border shadow-lg ${variants[type]}`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">{children}</div>
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="text-current opacity-60 hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Morphing shape animation for status indicators
 */
export function MorphingShape({ state, size = 20, className = '' }) {
  const shapes = {
    idle: 'M10 10 L20 10 L20 20 L10 20 Z',
    loading: 'M15 5 L25 15 L15 25 L5 15 Z',
    success: 'M7 13 L12 18 L23 7',
    error: 'M7 7 L17 17 M17 7 L7 17'
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 30 30"
      className={className}
    >
      <motion.path
        d={shapes[state] || shapes.idle}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5 }}
      />
    </motion.svg>
  );
}

/**
 * Page transition wrapper
 */
export function PageTransition({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        duration: 0.5
      }}
    >
      {children}
    </motion.div>
  );
}