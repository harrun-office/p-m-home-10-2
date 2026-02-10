/**
 * Horizontal divider using border token.
 */
export function Divider({ className = '' }) {
  return <hr className={`border-0 border-t border-[var(--border)] ${className}`.trim()} />;
}
