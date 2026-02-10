/**
 * Page header: clear hierarchy, optional badge, subtitle/description, actions. Token-based.
 * Description uses --content-narrow for readable line length.
 */
export function PageHeader({ title, subtitle, description, badge, rightActions, className = '' }) {
  return (
    <header
      className={`mb-6 sm:mb-8 pb-5 sm:pb-6 border-b border-[var(--border)] ${className}`.trim()}
      aria-label="Page header"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
        {/* Left Section: Title and Metadata */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--fg)]">{title}</h1>
            {badge != null && badge !== '' && (
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-[var(--primary-muted)] text-[var(--primary-muted-fg)] ring-1 ring-[var(--primary)]/10 whitespace-nowrap">
                {badge}
              </span>
            )}
          </div>
          {(subtitle != null && subtitle !== '') || (description != null && description !== '') ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              {subtitle != null && subtitle !== '' && (
                <p className="text-sm sm:text-base text-[var(--fg-muted)] font-medium">{subtitle}</p>
              )}
              {subtitle != null && subtitle !== '' && description != null && description !== '' && (
                <span className="hidden sm:inline text-[var(--fg-muted)] mx-1">·</span>
              )}
              {description != null && description !== '' && (
                <p className="text-sm sm:text-base text-[var(--fg-muted)] leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          ) : null}
        </div>
        
        {/* Right Section: Actions */}
        {rightActions != null && (
          <div className="flex flex-wrap items-center justify-end gap-2 lg:gap-3 shrink-0">
            {rightActions}
          </div>
        )}
      </div>
    </header>
  );
}
