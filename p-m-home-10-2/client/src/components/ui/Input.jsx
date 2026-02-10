/**
 * Text input: focus ring, optional leftIcon. Supports error state and helper/error text.
 */
export function Input({
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  error = false,
  helperText,
  className = '',
  leftIcon: LeftIcon,
  id,
  ...rest
}) {
  const inputBase =
    'w-full rounded-[var(--radius)] border bg-[var(--card)] py-2.5 text-[var(--fg)] placeholder:text-[var(--muted-fg)] shadow-[var(--shadow-sm)] focus:ring-2 focus:shadow-[var(--shadow)] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed';
  const borderClass = error
    ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/20'
    : 'border-[var(--border)] focus:border-[var(--accent)] focus:ring-[var(--ring)]/20';
  const inputClass = LeftIcon ? 'pl-9 pr-3' : 'px-3';
  const wrapperClass = 'relative flex flex-col gap-1';
  return (
    <div className={wrapperClass}>
      <div className="relative flex items-center">
        {LeftIcon && (
          <span className="absolute left-2.5 text-[var(--muted-fg)] pointer-events-none" aria-hidden>
            <LeftIcon className="w-4 h-4" />
          </span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={error}
          aria-describedby={helperText ? `${id}-hint` : undefined}
          className={`${inputBase} ${borderClass} ${inputClass} ${className}`.trim()}
          {...rest}
        />
      </div>
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
