import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Target,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  Calendar,
  UserPlus,
  UserMinus,
  Flag,
  CheckSquare,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card } from '../../ui/Card.jsx';
import { Button } from '../../ui/Button.jsx';
import { Input } from '../../ui/Input.jsx';

const STATUS_LABELS = { ACTIVE: 'Active', ON_HOLD: 'On Hold', COMPLETED: 'Completed' };
const EVENT_TYPES = [
  { value: '', label: 'All' },
  { value: 'status_change', label: 'Status' },
  { value: 'date_change', label: 'Dates' },
  { value: 'team', label: 'Team' },
  { value: 'milestone', label: 'Milestones' },
  { value: 'task_milestone', label: 'Tasks' },
];
const DATE_RANGES = [
  { value: '', label: 'All time' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];
const INITIAL_VISIBLE = 10;

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function relativeTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sec = Math.floor((now - d) / 1000);
  if (sec < 60) return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} day${day !== 1 ? 's' : ''} ago`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month} mo ago`;
  return `${Math.floor(month / 12)} yr ago`;
}

function durationBetween(at1, at2) {
  if (!at1 || !at2) return null;
  const a = new Date(at1);
  const b = new Date(at2);
  const days = Math.round((b - a) / (1000 * 60 * 60 * 24));
  if (days <= 0) return null;
  if (days === 1) return '1 day';
  if (days < 30) return `${days} days`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''}`;
  return `${Math.round(months / 12)} year${Math.round(months / 12) !== 1 ? 's' : ''}`;
}

export function ProjectTimeline({ project, users = [], tasks = [], addProjectMilestone, isReadOnly }) {
  const [filterType, setFilterType] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [showRelative, setShowRelative] = useState(true);
  const [compact, setCompact] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneNote, setMilestoneNote] = useState('');
  const [addingMilestone, setAddingMilestone] = useState(false);

  const userById = useMemo(() => {
    const m = new Map();
    (users || []).forEach((u) => m.set(u.id, u));
    return m;
  }, [users]);

  const taskById = useMemo(() => {
    const m = new Map();
    (tasks || []).forEach((t) => m.set(t.id, t));
    return m;
  }, [tasks]);

  const allEvents = useMemo(() => {
    if (!project) return [];
    const out = [];
    const history = project.statusHistory || [];
    history.forEach((e, i) => {
      out.push({
        type: 'status_change',
        at: e.at,
        userId: e.userId,
        note: e.note,
        status: e.status,
        isFirst: i === 0,
      });
    });
    const log = project.activityLog || [];
    log.forEach((e) => {
      out.push({
        type: e.type,
        id: e.id,
        at: e.at,
        userId: e.userId,
        note: e.note,
        payload: e.payload || {},
      });
    });
    if (out.length === 0) {
      const start = project.startDate || project.createdAt || new Date().toISOString();
      out.push({ type: 'status_change', at: start, status: 'ACTIVE', isFirst: true });
      if (project.status !== 'ACTIVE') {
        out.push({ type: 'status_change', at: project.endDate || new Date().toISOString(), status: project.status, isFirst: false });
      }
    }
    out.sort((a, b) => new Date(a.at) - new Date(b.at));
    return out;
  }, [project]);

  const filteredEvents = useMemo(() => {
    let list = allEvents;
    if (filterType) {
      if (filterType === 'team') {
        list = list.filter((e) => e.type === 'member_added' || e.type === 'member_removed');
      } else {
        list = list.filter((e) => e.type === filterType);
      }
    }
    if (dateRange) {
      const days = Number(dateRange);
      const since = new Date();
      since.setDate(since.getDate() - days);
      list = list.filter((e) => new Date(e.at) >= since);
    }
    return list;
  }, [allEvents, filterType, dateRange]);

  const visibleEvents = useMemo(
    () => filteredEvents.slice(0, visibleCount),
    [filteredEvents, visibleCount]
  );
  const hasMore = filteredEvents.length > visibleCount;

  const exportText = useMemo(() => {
    return filteredEvents
      .map((e) => {
        const date = formatDateTime(e.at);
        const who = e.userId ? (userById.get(e.userId)?.name || 'Someone') : '';
        const whoStr = who ? ` by ${who}` : '';
        let line = `${date} — ${eventLabel(e)}${whoStr}`;
        if (e.note) line += ` (${e.note})`;
        if (e.type === 'status_change' && e.status) line += ` — ${STATUS_LABELS[e.status] || e.status}`;
        return line;
      })
      .join('\n');
  }, [filteredEvents, userById]);

  function eventLabel(e) {
    if (e.type === 'status_change') {
      if (e.isFirst && e.status === 'ACTIVE') return 'Project created';
      if (e.status === 'ACTIVE') return 'Marked active';
      if (e.status === 'ON_HOLD') return 'Put on hold';
      if (e.status === 'COMPLETED') return 'Marked completed';
      return 'Status change';
    }
    if (e.type === 'date_change' && e.payload?.field) {
      const f = e.payload.field === 'startDate' ? 'Start date' : 'End date';
      return `${f} changed`;
    }
    if (e.type === 'member_added') return 'Member added';
    if (e.type === 'member_removed') return 'Member removed';
    if (e.type === 'milestone' && e.payload?.title) return e.payload.title;
    if (e.type === 'task_milestone') {
      const t = taskById.get(e.payload?.taskId);
      return t ? `Task completed: ${t.title}` : 'Task completed';
    }
    return 'Event';
  }

  function eventConfig(e) {
    if (e.type === 'status_change') {
      const isActive = e.status === 'ACTIVE';
      const isOnHold = e.status === 'ON_HOLD';
      const icon = e.isFirst && isActive ? Target : isActive ? PlayCircle : isOnHold ? PauseCircle : CheckCircle2;
      const accent = isActive ? 'var(--success)' : isOnHold ? 'var(--warning)' : 'var(--purple)';
      const bgLight = isActive ? 'var(--success-light)' : isOnHold ? 'var(--warning-light)' : 'var(--purple-light)';
      return { icon, accent, bgLight };
    }
    if (e.type === 'date_change') return { icon: Calendar, accent: 'var(--info)', bgLight: 'var(--info-light)' };
    if (e.type === 'member_added') return { icon: UserPlus, accent: 'var(--success)', bgLight: 'var(--success-light)' };
    if (e.type === 'member_removed') return { icon: UserMinus, accent: 'var(--danger)', bgLight: 'var(--danger-light)' };
    if (e.type === 'milestone') return { icon: Flag, accent: 'var(--purple)', bgLight: 'var(--purple-light)' };
    if (e.type === 'task_milestone') return { icon: CheckSquare, accent: 'var(--success)', bgLight: 'var(--success-light)' };
    return { icon: History, accent: 'var(--fg-muted)', bgLight: 'var(--muted)' };
  }

  function handleCopyExport() {
    if (exportText) {
      navigator.clipboard.writeText(`Project: ${project?.name || 'Project'}\n\n${exportText}`);
    }
  }

  function handleAddMilestone() {
    const title = milestoneTitle.trim();
    if (!title || !project || !addProjectMilestone) return;
    addProjectMilestone(project.id, title, milestoneNote.trim() || undefined);
    setMilestoneTitle('');
    setMilestoneNote('');
    setAddingMilestone(false);
  }

  if (!project) return null;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--fg)]">Project timeline</h3>
              <p className="text-sm text-[var(--fg-muted)]">Status changes, team updates, and key dates</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRelative(!showRelative)}
              className="text-xs px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--fg-muted)] hover:bg-[var(--muted)]"
            >
              {showRelative ? 'Relative' : 'Exact date'}
            </button>
            <button
              type="button"
              onClick={() => setCompact(!compact)}
              className="text-xs px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--fg-muted)] hover:bg-[var(--muted)]"
            >
              {compact ? 'Compact' : 'Full'}
            </button>
            <Button variant="outline" size="sm" leftIcon={Copy} onClick={handleCopyExport} disabled={!exportText}>
              Copy
            </Button>
            {!isReadOnly && addProjectMilestone && (
              <Button variant="primary" size="sm" onClick={() => setAddingMilestone(true)}>
                Add milestone
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-[var(--border)]">
          <span className="text-xs font-medium text-[var(--fg-muted)]">Filter:</span>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map((t) => (
              <button
                key={t.value || 'all'}
                type="button"
                onClick={() => setFilterType(t.value)}
                className={`text-xs px-2.5 py-1.5 rounded-lg ${
                  filterType === t.value ? 'bg-[var(--primary)] text-[var(--primary-fg)]' : 'bg-[var(--muted)] text-[var(--fg-muted)] hover:bg-[var(--hover)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-xs px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--fg)]"
          >
            {DATE_RANGES.map((r) => (
              <option key={r.value || 'all'} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Add milestone inline */}
        {addingMilestone && (
          <div className="mb-6 p-4 rounded-xl border border-[var(--border)] bg-[var(--muted-tint)]">
            <Input
              placeholder="Milestone title"
              value={milestoneTitle}
              onChange={(e) => setMilestoneTitle(e.target.value)}
              className="mb-2"
            />
            <Input
              placeholder="Note (optional)"
              value={milestoneNote}
              onChange={(e) => setMilestoneNote(e.target.value)}
              className="mb-3"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddMilestone} disabled={!milestoneTitle.trim()}>
                Add
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setAddingMilestone(false); setMilestoneTitle(''); setMilestoneNote(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="relative">
          <div className="absolute left-5 top-2 bottom-2 w-0.5 rounded-full bg-[var(--border)]" aria-hidden />
          <ul className="space-y-0">
            {visibleEvents.map((e, index) => {
              const isLast = index === visibleEvents.length - 1 && index === filteredEvents.length - 1;
              const prevAt = index > 0 ? visibleEvents[index - 1].at : null;
              const duration = durationBetween(prevAt, e.at);
              const config = eventConfig(e);
              const Icon = config.icon;
              const userName = e.userId ? (userById.get(e.userId)?.name || null) : null;
              const task = e.type === 'task_milestone' && e.payload?.taskId ? taskById.get(e.payload.taskId) : null;
              return (
                <li key={e.id || `${e.type}-${e.at}-${index}`} className="relative flex gap-4 pb-8 last:pb-0">
                  <div
                    className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 shadow-sm"
                    style={{ backgroundColor: config.bgLight, borderColor: config.accent, color: config.accent }}
                  >
                    <Icon className="w-5 h-5" aria-hidden />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-[var(--fg)]">{eventLabel(e)}</p>
                      {isLast && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)] text-[var(--primary-fg)]">Current</span>
                      )}
                    </div>
                    {e.type === 'status_change' && e.status && (
                      <p className="text-sm text-[var(--fg-muted)] mt-0.5">{STATUS_LABELS[e.status] ?? e.status}</p>
                    )}
                    {e.type === 'date_change' && e.payload?.oldValue && e.payload?.newValue && (
                      <p className="text-sm text-[var(--fg-muted)] mt-0.5">
                        {e.payload.oldValue.slice(0, 10)} → {e.payload.newValue.slice(0, 10)}
                      </p>
                    )}
                    {e.type === 'member_added' && e.payload?.userId && (
                      <p className="text-sm text-[var(--fg-muted)] mt-0.5">
                        {userById.get(e.payload.userId)?.name || 'Member'} added to project
                      </p>
                    )}
                    {e.type === 'member_removed' && e.payload?.userId && (
                      <p className="text-sm text-[var(--fg-muted)] mt-0.5">
                        {userById.get(e.payload.userId)?.name || 'Member'} removed from project
                      </p>
                    )}
                    {e.note && <p className="text-sm text-[var(--fg-muted)] mt-1 italic">&quot;{e.note}&quot;</p>}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="text-xs text-[var(--fg-muted)]">
                        {showRelative ? relativeTime(e.at) : formatDateTime(e.at)}
                      </span>
                      {duration && <span className="text-xs text-[var(--fg-muted)]">· {duration} since previous</span>}
                      {userName && e.type !== 'member_added' && e.type !== 'member_removed' && (
                        <span className="text-xs text-[var(--fg-muted)]">
                          by <Link to={`/admin/users/${e.userId}`} className="text-[var(--primary)] hover:underline">{userName}</Link>
                        </span>
                      )}
                    </div>
                    {task && e.type === 'task_milestone' && (
                      <Link
                        to={`/admin/projects/${project.id}`}
                        state={{ tab: 'tasks' }}
                        className="text-xs text-[var(--primary)] hover:underline mt-1 inline-block"
                      >
                        View task: {task.title}
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {hasMore && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibleCount((c) => c + INITIAL_VISIBLE)}
              rightIcon={ChevronDown}
            >
              Show more
            </Button>
          </div>
        )}
        {filteredEvents.length > visibleCount && visibleCount > INITIAL_VISIBLE && (
          <div className="mt-2 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount(INITIAL_VISIBLE)}
              className="text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] flex items-center gap-1"
            >
              <ChevronUp className="w-3 h-3" /> Show less
            </button>
          </div>
        )}

        {filteredEvents.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-[var(--fg-muted)] mb-2">No timeline events yet.</p>
            <p className="text-sm text-[var(--fg-muted)] max-w-md mx-auto">
              Timeline will show status changes, team updates, and key dates as they happen. Change the project status or add members to see the first events.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
