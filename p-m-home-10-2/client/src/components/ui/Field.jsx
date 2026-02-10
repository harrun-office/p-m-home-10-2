/**
 * Form field group: label (with optional required asterisk) + children.
 * Pass htmlFor and id to the control for a11y. Put error/helperText on Input/Select.
 */
export function Field({
  label,
  htmlFor,
  required = false,
  children,
  className = '',
}) {
  return (
    <div className={`space-y-1.5 ${className}`.trim()}>
      {label != null && label !== '' && (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium text-[var(--fg)]"
        >
          {label}
          {required && <span className="text-[var(--danger)] ml-0.5" aria-hidden>*</span>}
        </label>
      )}
      {children}
    </div>
  );
}
