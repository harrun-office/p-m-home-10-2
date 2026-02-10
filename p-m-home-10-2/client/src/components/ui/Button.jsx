import { motion } from 'framer-motion';
import { buttonTap } from '../motion/motionPresets.js';

const variants = {
  primary: 'bg-[var(--primary)] text-[var(--primary-fg)] hover:bg-[var(--primary-hover)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-colored)]',
  secondary: 'bg-[var(--muted)] text-[var(--fg)] hover:bg-[var(--active)]',
  ghost: 'bg-transparent text-[var(--fg)] hover:bg-[var(--muted)]',
  danger: 'bg-[var(--danger)] text-[var(--danger-fg)] hover:bg-[var(--danger-hover)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow)]',
  outline: 'border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] hover:bg-[var(--muted)] hover:border-[var(--border-focus)]',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
};

/**
 * Button with variants: primary, secondary, ghost, danger, outline. Sizes: sm, md. leftIcon/rightIcon.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  className = '',
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  onClick,
  ...rest
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ring-offset)] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed transition-all duration-150 active:translate-y-[0.5px]';
  const combined = `${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`.trim();

  return (
    <motion.button
      type={type}
      disabled={disabled}
      className={combined}
      onClick={onClick}
      whileTap={buttonTap}
      {...rest}
    >
      {LeftIcon && <LeftIcon className="w-4 h-4 shrink-0" aria-hidden />}
      {children}
      {RightIcon && <RightIcon className="w-4 h-4 shrink-0" aria-hidden />}
    </motion.button>
  );
}
