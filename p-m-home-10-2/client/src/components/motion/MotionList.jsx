import { motion } from 'framer-motion';
import { listStagger, listItem } from './motionPresets.js';

/**
 * List container that staggers children on mount.
 */
export function MotionList({ children, className = '', as = 'div' }) {
  const Component = motion[as] || motion.div;

  return (
    <Component
      initial="initial"
      animate="animate"
      variants={listStagger.animate()}
      className={className}
    >
      {children}
    </Component>
  );
}

/**
 * Single list item — use with MotionList for stagger.
 */
export function MotionListItem({ children, className = '', as = 'div' }) {
  const Component = motion[as] || motion.div;

  return (
    <Component variants={listItem} className={className}>
      {children}
    </Component>
  );
}
