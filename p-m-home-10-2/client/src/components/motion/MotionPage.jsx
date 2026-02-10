import { motion } from 'framer-motion';
import { pageTransition } from './motionPresets.js';

/**
 * Wraps page content with gentle fade + slide-up on mount.
 */
export function MotionPage({ children, className = '' }) {
  return (
    <motion.div
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      exit={pageTransition.exit}
      transition={pageTransition.transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
