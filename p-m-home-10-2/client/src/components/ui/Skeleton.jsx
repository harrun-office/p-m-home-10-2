/**
 * Skeleton blocks for dashboard cards / table rows. Simple shimmer via CSS.
 */

export function Skeleton({ className = '', ...rest }) {
  return (
    <div
      className={`animate-pulse rounded-[var(--radius)] bg-[var(--muted)] ${className}`.trim()}
      aria-hidden
      {...rest}
    />
  );
}

export function SkeletonCard({ lines = 2 }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-16" />
      {lines > 1 && <Skeleton className="h-3 w-full" />}
    </div>
  );
}

export function SkeletonRow({ cols = 5 }) {
  return (
    <tr className="border-b border-[var(--border)]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}
