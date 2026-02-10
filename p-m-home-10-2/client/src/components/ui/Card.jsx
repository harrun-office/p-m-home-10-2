import { motion } from 'framer-motion';
import { cardHover } from '../motion/motionPresets.js';

/**
 * Card: surface + border + optional elevated/hover. Use motionCard for hover animation.
 * elevated: stronger shadow for hierarchy (e.g. login card, modals).
 */
export function Card({
  children,
  className = '',
  padding = 'p-5',
  motionCard = false,
  elevated = false,
  ...rest
}) {
  const shadow = elevated ? 'shadow-[var(--shadow-md)]' : 'shadow-[var(--shadow)]';
  const base = `rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] ${shadow} transition-all duration-150 hover:border-[var(--border-focus)] hover:shadow-[var(--shadow-md)] ${padding} ${className}`.trim();

  if (motionCard) {
    return (
      <motion.div
        className={base}
        whileHover={cardHover.hover}
        whileTap={cardHover.tap}
        transition={{ duration: 0.2 }}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={base} {...rest}>
      {children}
    </div>
  );
}
