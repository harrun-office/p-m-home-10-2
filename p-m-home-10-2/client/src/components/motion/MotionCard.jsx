import { motion } from 'framer-motion';
import { cardHover, listItem } from './motionPresets.js';

/**
 * Card with hover lift + optional fade-in (for list usage).
 */
export function MotionCard({ children, className = '', asListItem = false }) {
  const Component = motion.div;

  return (
    <Component
      initial={asListItem ? listItem.initial : false}
      animate={asListItem ? listItem.animate : false}
      transition={listItem.transition}
      whileHover={cardHover.hover}
      whileTap={cardHover.tap}
      className={className}
      style={typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? {} : undefined}
    >
      {children}
    </Component>
  );
}
