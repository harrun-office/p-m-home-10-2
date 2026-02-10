import { useState, useMemo } from 'react';
import { Bell, CheckCircle2, CalendarClock, UserPlus } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState.jsx';
import { Button } from '../ui/Button.jsx';
import { Select } from '../ui/Select.jsx';
import { Badge } from '../ui/Badge.jsx';
import { Card } from '../ui/Card.jsx';

const FILTER_READ_ALL = 'all';
const FILTER_READ_UNREAD = 'unread';
const FILTER_TYPE_ALL = 'all';
const FILTER_TYPE_ASSIGNED = 'ASSIGNED';
const FILTER_TYPE_DEADLINE = 'DEADLINE';

/**
 * Reusable notification list: summary, filters, and cards.
 * Props: notifications (already filtered by user), onMarkRead(id), onMarkAllRead(), emptyMessage, showFilters.
 */
export function NotificationsList({
  notifications = [],
  onMarkRead,
  onMarkAllRead,
  emptyMessage = 'No notifications.',
  showFilters = true,
}) {
  const [readFilter, setReadFilter] = useState(FILTER_READ_ALL);
  const [typeFilter, setTypeFilter] = useState(FILTER_TYPE_ALL);

  const filtered = useMemo(() => {
    let list = notifications;
    if (readFilter === FILTER_READ_UNREAD) list = list.filter((n) => !n.read);
    if (typeFilter === FILTER_TYPE_ASSIGNED) list = list.filter((n) => n.type === 'ASSIGNED');
    if (typeFilter === FILTER_TYPE_DEADLINE) list = list.filter((n) => n.type === 'DEADLINE');
    return list;
  }, [notifications, readFilter, typeFilter]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    const date = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { date, time, full: `${date} at ${time}` };
  }

  function TypeIcon({ type }) {
    if (type === 'DEADLINE') return <CalendarClock className="w-5 h-5 text-[var(--warning-muted-fg)]" aria-hidden />;
    if (type === 'ASSIGNED') return <UserPlus className="w-5 h-5 text-[var(--primary-muted-fg)]" aria-hidden />;
    return <Bell className="w-5 h-5 text-[var(--fg-muted)]" aria-hidden />;
  }

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <Card className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--muted)] text-[var(--fg-secondary)]">
              <Bell className="w-5 h-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--fg)]">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-[var(--fg-muted)]">
                {unreadCount === 0
                  ? 'All caught up'
                  : `${unreadCount} unread`}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="primary" size="sm" onClick={() => onMarkAllRead?.()}>
              Mark all as read
            </Button>
          )}
        </div>
      </Card>

      {/* Filters */}
      {showFilters && (
        <Card padding="p-4">
          <h2 className="text-sm font-semibold text-[var(--fg)] uppercase tracking-wider mb-3">
            Filter
          </h2>
          <div className="flex flex-wrap gap-6">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="notif-read-filter" className="text-xs font-medium text-[var(--fg-muted)]">
                Status
              </label>
              <Select
                id="notif-read-filter"
                value={readFilter}
                onChange={(e) => setReadFilter(e.target.value)}
                className="min-w-[140px] text-sm"
              >
                <option value={FILTER_READ_ALL}>All</option>
                <option value={FILTER_READ_UNREAD}>Unread only</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="notif-type-filter" className="text-xs font-medium text-[var(--fg-muted)]">
                Type
              </label>
              <Select
                id="notif-type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="min-w-[140px] text-sm"
              >
                <option value={FILTER_TYPE_ALL}>All types</option>
                <option value={FILTER_TYPE_ASSIGNED}>Assigned</option>
                <option value={FILTER_TYPE_DEADLINE}>Deadline</option>
              </Select>
            </div>
          </div>
        </Card>
      )}

      {/* List */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--fg)] uppercase tracking-wider mb-3">
          {filtered.length === 0 ? 'Results' : `Showing ${filtered.length} notification${filtered.length !== 1 ? 's' : ''}`}
        </h2>

        {filtered.length === 0 ? (
          <Card className="py-12">
            <EmptyState title="No notifications" message={emptyMessage} />
          </Card>
        ) : (
          <ul className="space-y-3" role="list">
            {filtered.map((n) => {
              const { date, time, full } = formatDate(n.createdAt);
              return (
                <li key={n.id}>
                  <Card
                    padding="p-0"
                    className={`overflow-hidden transition-all duration-150 ${
                      n.read ? 'bg-[var(--card)] opacity-90' : 'bg-[var(--card)] ring-1 ring-[var(--primary)]/20'
                    }`}
                  >
                    <div className="flex gap-4 p-4 sm:p-5">
                      <span
                        className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl ${
                          n.read ? 'bg-[var(--muted)] text-[var(--fg-muted)]' : 'bg-[var(--primary-muted)] text-[var(--primary-muted-fg)]'
                        }`}
                        aria-hidden
                      >
                        <TypeIcon type={n.type} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <Badge variant={n.type === 'ASSIGNED' ? 'primary' : 'warning'}>
                            {n.type}
                          </Badge>
                          {!n.read && (
                            <span className="text-xs font-medium text-[var(--primary-muted-fg)]">
                              Unread
                            </span>
                          )}
                        </div>
                        <p className="text-sm sm:text-base text-[var(--fg)] leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-xs text-[var(--fg-muted)] mt-2" title={full}>
                          {date} · {time}
                        </p>
                      </div>
                      {!n.read && (
                        <div className="flex-shrink-0 flex items-start">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onMarkRead?.(n.id)}
                            className="inline-flex items-center gap-1.5 text-[var(--primary-muted-fg)] hover:bg-[var(--primary-muted)]"
                            aria-label={`Mark as read: ${n.message.slice(0, 40)}…`}
                          >
                            <CheckCircle2 className="w-4 h-4" aria-hidden />
                            <span className="hidden sm:inline">Mark read</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
