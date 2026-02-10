/**
 * Badge: neutral + status variants. Token-based.
 * Status: success (ACTIVE), warning (ON_HOLD), muted (COMPLETED), danger (HIGH priority).
 */
const variantStyles = {
  neutral: 'bg-[var(--muted)] text-[var(--muted-fg)]',
  success: 'bg-[var(--success-muted)] text-[var(--success-muted-fg)]',
  warning: 'bg-[var(--warning-muted)] text-[var(--warning-muted-fg)]',
  danger: 'bg-[var(--danger-muted)] text-[var(--danger-muted-fg)]',
  primary: 'bg-[var(--primary-muted)] text-[var(--primary-muted-fg)]',
  info: 'bg-[var(--info-muted)] text-[var(--info-muted-fg)]',
};

export function Badge({ children, variant = 'neutral', className = '' }) {
  const base = 'inline-flex items-center rounded-[var(--radius-sm)] px-2 py-0.5 text-xs font-medium';
  return (
    <span className={`${base} ${variantStyles[variant] || variantStyles.neutral} ${className}`.trim()}>
      {children}
    </span>
  );
}
