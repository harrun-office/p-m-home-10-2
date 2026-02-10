/**
 * IconButton: table actions, topbar icons. Token-based, focus ring.
 */

import { motion } from 'framer-motion';
import { buttonTap } from '../motion/motionPresets.js';

const variants = {
  primary: 'text-[var(--primary-fg)] bg-[var(--primary)] hover:opacity-90',
  secondary: 'text-[var(--fg)] bg-[var(--muted)] hover:bg-[var(--border)]',
  ghost: 'text-[var(--muted-fg)] hover:text-[var(--fg)] hover:bg-[var(--muted)]',
  danger: 'text-[var(--danger-fg)] bg-[var(--danger)] hover:opacity-90',
  outline: 'border border-[var(--border)] text-[var(--fg)] hover:bg-[var(--muted)]',
};

export function IconButton({
  icon: Icon,
  variant = 'ghost',
  size = 'md',
  'aria-label': ariaLabel,
  className = '',
  onClick,
  disabled = false,
  ...rest
}) {
  const sizeClass = size === 'sm' ? 'p-1.5 [&>svg]:w-4 [&>svg]:h-4' : 'p-2.5 [&>svg]:w-5 [&>svg]:h-5';
  const base = 'inline-flex items-center justify-center rounded-[var(--radius)] transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  const combined = `${base} ${variants[variant] || variants.ghost} ${sizeClass} ${className}`.trim();

  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      className={combined}
      onClick={onClick}
      whileTap={buttonTap}
      {...rest}
    >
      {Icon && <Icon className="shrink-0" aria-hidden />}
    </motion.button>
  );
}
