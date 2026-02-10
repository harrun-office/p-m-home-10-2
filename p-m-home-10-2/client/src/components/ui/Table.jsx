/**
 * Table wrapper: consistent header, sticky header on scroll, token-based.
 * Use stickyHeader on Table + TableHeader for long lists.
 */
export function Table({
  children,
  className = '',
  stickyHeader = true,
}) {
  return (
    <div className={`overflow-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] ${className}`.trim()}>
      <table className="min-w-full border-collapse">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '', stickyHeader = true }) {
  return (
    <thead
      className={`bg-[var(--muted)] border-b border-[var(--border)] ${stickyHeader ? 'sticky top-0 z-10 shadow-[0_1px_0_0_var(--border)]' : ''} ${className}`.trim()}
      role="rowgroup"
    >
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '', zebra = false }) {
  return (
    <tbody className={`divide-y divide-[var(--border)] ${zebra ? '[&>tr:nth-child(even)]:bg-[var(--muted)]/40' : ''} ${className}`.trim()}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', hover = true }) {
  return (
    <tr className={`${hover ? 'hover:bg-[var(--hover)] transition-colors duration-150' : ''} ${className}`.trim()}>
      {children}
    </tr>
  );
}

export function Th({ children, className = '' }) {
  return (
    <th className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)] bg-inherit ${className}`.trim()}>
      {children}
    </th>
  );
}

export function Td({ children, className = '' }) {
  return (
    <td className={`px-4 py-3.5 text-sm text-[var(--fg)] align-middle ${className}`.trim()}>
      {children}
    </td>
  );
}

/** Empty state row inside tbody. Use colSpan = number of columns. */
export function TableEmptyRow({ colSpan, children, className = '' }) {
  return (
    <tr>
      <td colSpan={colSpan} className={`px-4 py-12 text-center ${className}`.trim()}>
        {children}
      </td>
    </tr>
  );
}
