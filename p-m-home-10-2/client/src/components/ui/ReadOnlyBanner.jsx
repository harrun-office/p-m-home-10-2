/**
 * Banner shown when project is read-only (ON_HOLD / COMPLETED).
 * Use in project detail, tasks tab, task modal.
 */
export function ReadOnlyBanner() {
  return (
    <div className="bg-[var(--warning-muted)] border border-[var(--warning-muted)]/50 text-[var(--warning-muted-fg)] px-4 py-3 rounded-[var(--radius-lg)] text-sm" role="status">
      Project is read-only in this status.
    </div>
  );
}
