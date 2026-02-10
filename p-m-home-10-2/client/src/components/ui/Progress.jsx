import { motion } from 'framer-motion';

/**
 * Progress bar component with animation
 */
export function Progress({ value = 0, max = 100, className = '', color = 'bg-[var(--primary)]' }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`w-full bg-[var(--muted)] rounded-full h-2 overflow-hidden ${className}`}>
      <motion.div
        className={`h-full ${color} transition-all duration-300`}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}