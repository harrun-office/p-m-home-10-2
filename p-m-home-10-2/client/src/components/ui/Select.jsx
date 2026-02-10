/**
 * Native select: token styling, error state, optional helper/error text.
 */
export function Select({
  value,
  onChange,
  children,
  disabled = false,
  error = false,
  helperText,
  className = '',
  id,
  ...rest
}) {
  const borderClass = error
    ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/20'
    : 'border-[var(--border)] focus:border-[var(--accent)] focus:ring-[var(--ring)]/20';
  const base = `w-full rounded-[var(--radius)] border bg-[var(--card)] px-3 py-2.5 text-[var(--fg)] shadow-[var(--shadow-sm)] focus:ring-2 focus:shadow-[var(--shadow)] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${borderClass}`;
  return (
    <div className="flex flex-col gap-1">
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={error}
        aria-describedby={helperText ? `${id}-hint` : undefined}
        className={`${base} ${className}`.trim()}
        {...rest}
      >
        {children}
      </select>
      {helperText && !error && (
        <p id={id ? `${id}-hint` : undefined} className="text-xs text-[var(--muted-fg)]">
          {helperText}
        </p>
      )}
      {error && typeof error === 'string' && (
        <p className="text-xs text-[var(--danger)] font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
