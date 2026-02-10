import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ListTodo,
  FolderKanban,
  Calendar,
  CalendarClock,
  FolderOpen,
  Pause,
  CheckCircle2,
  Circle,
  Loader2,
  Target,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useDataStore } from '../../store/dataStore.jsx';
import { getSession } from '../../store/sessionStore.js';
import { todayKey, toDayKey } from '../../utils/date.js';
import { Card } from '../../components/ui/Card.jsx';
import { SkeletonCard } from '../../components/ui/Skeleton.jsx';
import { MotionPage } from '../../components/motion/MotionPage.jsx';
import { MotionCard } from '../../components/motion/MotionCard.jsx';
import { Badge } from '../../components/ui/Badge.jsx';

/**
 * Employee Dashboard: same structure and style as Admin dashboard.
 * Hero strip, grouped KPIs (my projects, my tasks), task status progress.
 */
const SKELETON_DELAY_MS = 250;

const PROJECT_KPIS = [
  { key: 'totalProjects', label: 'Total', icon: FolderKanban, accent: 'var(--accent)', bg: 'var(--accent-light)' },
  { key: 'activeProjects', label: 'Active', icon: FolderOpen, accent: 'var(--success)', bg: 'var(--success-light)' },
  { key: 'onHoldProjects', label: 'On hold', icon: Pause, accent: 'var(--warning)', bg: 'var(--warning-light)' },
  { key: 'completedProjects', label: 'Done', icon: CheckCircle2, accent: 'var(--purple)', bg: 'var(--purple-light)' },
];

const TASK_KPIS = [
  { key: 'overdueTasks', label: 'Overdue', icon: AlertCircle, accent: 'var(--danger)', bg: 'var(--danger-light)' },
  { key: 'totalTasks', label: 'All tasks', icon: ListTodo, accent: 'var(--info)', bg: 'var(--info-light)' },
  { key: 'totalOpenTasks', label: 'To do', icon: Circle, accent: 'var(--warning)', bg: 'var(--warning-light)' },
  { key: 'tasksInProgress', label: 'In progress', icon: Loader2, accent: 'var(--teal)', bg: 'var(--teal-light)' },
  { key: 'tasksCompleted', label: 'Done', icon: CheckCircle2, accent: 'var(--success)', bg: 'var(--success-light)' },
];

export function EmployeeDashboardPage() {
  const navigate = useNavigate();
  const { state } = useDataStore();
  const session = getSession();
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    if (!session) navigate('/login', { replace: true });
  }, [session, navigate]);

  useEffect(() => {
    const t = setTimeout(() => setShowSkeleton(false), SKELETON_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const tasks = state.tasks || [];
  const projects = state.projects || [];

  const myProjects = useMemo(() => {
    if (!session) return [];
    return projects.filter((p) => (p.assignedUserIds || []).includes(session.userId));
  }, [projects, session]);

  const myTasks = useMemo(() => {
    if (!session) return [];
    return tasks.filter((t) => t.assigneeId === session.userId);
  }, [tasks, session]);

  const todayLabel = useMemo(
    () => new Date().toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }),
    []
  );

  const projectKpis = useMemo(() => {
    const active = myProjects.filter((p) => p.status === 'ACTIVE').length;
    const onHold = myProjects.filter((p) => p.status === 'ON_HOLD').length;
    const completed = myProjects.filter((p) => p.status === 'COMPLETED').length;
    return {
      totalProjects: myProjects.length,
      activeProjects: active,
      onHoldProjects: onHold,
      completedProjects: completed,
    };
  }, [myProjects]);

  const taskKpis = useMemo(() => {
    const today = todayKey();
    const overdue = myTasks.filter(
      (t) => t.status !== 'COMPLETED' && t.deadline && toDayKey(t.deadline) < today
    ).length;
    const todo = myTasks.filter((t) => t.status === 'TODO').length;
    const inProgress = myTasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const completed = myTasks.filter((t) => t.status === 'COMPLETED').length;
    return {
      overdueTasks: overdue,
      totalTasks: myTasks.length,
      totalOpenTasks: todo,
      tasksInProgress: inProgress,
      tasksCompleted: completed,
    };
  }, [myTasks]);

  const todayTasks = useMemo(() => {
    const today = todayKey();
    return myTasks.filter((t) => t.assignedAt && toDayKey(t.assignedAt) === today);
  }, [myTasks]);

  /** Current day tasks only: due today (deadline is today) — shown in "Today's tasks" section */
  const tasksDueToday = useMemo(() => {
    const today = todayKey();
    return myTasks.filter((t) => t.deadline && toDayKey(t.deadline) === today);
  }, [myTasks]);

  const projectById = useMemo(() => {
    const m = new Map();
    projects.forEach((p) => m.set(p.id, p));
    return m;
  }, [projects]);

  const totalForBars = myTasks.length || 1;
  const todoCount = taskKpis.totalOpenTasks;
  const inProgressCount = taskKpis.tasksInProgress;
  const completedCount = taskKpis.tasksCompleted;

  const statusBars = [
    { label: 'To Do', count: todoCount, color: 'var(--warning)' },
    { label: 'In Progress', count: inProgressCount, color: 'var(--info)' },
    { label: 'Completed', count: completedCount, color: 'var(--success)' },
  ];

  if (!session) return null;

  const welcomeName = session?.name?.split(/\s+/)[0] || 'there';

  return (
    <MotionPage className="space-y-8 sm:space-y-10">

      {/* Hero: welcome + stat boxes + CTAs */}
      <div
        className="relative overflow-hidden rounded-2xl border border-[var(--border)] px-5 py-6 sm:px-6 sm:py-8 shadow-[var(--shadow-md)]"
        style={{
          background: 'linear-gradient(135deg, var(--card) 0%, var(--card-tint) 50%, var(--accent-light) 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
          aria-hidden
        />
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-[var(--fg-muted)] mb-1">
                <Sparkles className="w-4 h-4 text-[var(--primary)]" aria-hidden />
                Welcome back, {welcomeName} · {todayLabel}
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--fg)] tracking-tight">
                Here&apos;s what&apos;s happening today
              </h2>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-4 rounded-xl border-2 border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-sm px-5 py-4 shadow-[var(--shadow-sm)] min-w-[140px]">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--accent-light)] text-[var(--primary)] shrink-0">
                <FolderOpen className="w-6 h-6" aria-hidden />
              </div>
              <div>
                <span className="block text-2xl sm:text-3xl font-bold tabular-nums text-[var(--fg)]">
                  {projectKpis.activeProjects}
                </span>
                <span className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider">
                  Active projects
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border-2 border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-sm px-5 py-4 shadow-[var(--shadow-sm)] min-w-[140px]">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--accent-light)] text-[var(--primary)] shrink-0">
                <Calendar className="w-6 h-6" aria-hidden />
              </div>
              <div>
                <span className="block text-2xl sm:text-3xl font-bold tabular-nums text-[var(--fg)]">
                  {todayTasks.length}
                </span>
                <span className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider">
                  Assigned today
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's tasks — current day only (due today) */}
      <section aria-labelledby="todays-tasks-heading">
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <div>
            <h2 id="todays-tasks-heading" className="flex items-center gap-2 section-heading mb-0.5">
              <CalendarClock className="w-5 h-5 text-[var(--warning-muted-fg)] shrink-0" aria-hidden />
              Today&apos;s tasks
            </h2>
            <p className="text-sm text-[var(--fg-muted)]">Tasks due today — current day only</p>
          </div>
          <Link
            to="/app/tasks"
            className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] shrink-0 flex items-center gap-1"
          >
            View all tasks <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>
        <Card padding="p-0" className="overflow-hidden">
          {tasksDueToday.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <CalendarClock className="w-10 h-10 mx-auto text-[var(--fg-muted)] mb-3" aria-hidden />
              <p className="text-sm font-medium text-[var(--fg)]">No tasks due today</p>
              <p className="text-sm text-[var(--fg-muted)] mt-1">Tasks with a due date of today will appear here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border)]" role="list">
              {tasksDueToday.map((t) => (
                <li key={t.id} className="px-5 py-4 hover:bg-[var(--muted)]/50 transition-colors">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[var(--fg)]">{t.title}</p>
                      <p className="text-sm text-[var(--fg-muted)] mt-0.5">
                        {projectById.get(t.projectId)?.name ?? '—'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant={t.status === 'COMPLETED' ? 'success' : t.status === 'IN_PROGRESS' ? 'info' : 'neutral'}>
                          {t.status === 'TODO' ? 'To Do' : t.status === 'IN_PROGRESS' ? 'In Progress' : 'Completed'}
                        </Badge>
                        {t.priority && (
                          <span className="text-xs text-[var(--fg-muted)]">{t.priority}</span>
                        )}
                        <span className="text-xs text-[var(--fg-muted)]">
                          Due {t.deadline ? new Date(t.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    </div>
                    <Link
                      to="/app/tasks"
                      className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] shrink-0"
                    >
                      Open <ArrowRight className="w-4 h-4" aria-hidden />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {/* Projects at a glance */}
      <section aria-labelledby="my-projects-kpis">
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <div>
            <h2 id="my-projects-kpis" className="flex items-center gap-2 section-heading mb-0.5">
              <FolderKanban className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden />
              Projects at a glance
            </h2>
            <p className="text-sm text-[var(--fg-muted)]">Your assigned projects by status</p>
          </div>
          <Link
            to="/app/projects"
            className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] shrink-0 flex items-center gap-1"
          >
            View all <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {showSkeleton ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={2} />)
          ) : (
            PROJECT_KPIS.map(({ key, label, icon: Icon, accent, bg }) => (
              <Link
                key={key}
                to="/app/projects"
                className="block focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 rounded-xl outline-none"
              >
                <MotionCard
                  asListItem
                  className="relative overflow-hidden rounded-xl border-2 border-[var(--border)] p-4 sm:p-5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-[var(--border-focus)] transition-all duration-200 h-full"
                  style={{ background: bg }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">{label}</p>
                      <p className="text-2xl sm:text-3xl font-bold mt-1.5 tabular-nums" style={{ color: accent }}>
                        {projectKpis[key]}
                      </p>
                    </div>
                    <span
                      className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 opacity-90"
                      style={{ background: accent, color: 'white' }}
                    >
                      <Icon className="w-5 h-5" aria-hidden />
                    </span>
                  </div>
                </MotionCard>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Tasks at a glance */}
      <section aria-labelledby="my-tasks-kpis">
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <div>
            <h2 id="my-tasks-kpis" className="flex items-center gap-2 section-heading mb-0.5">
              <Target className="w-5 h-5 text-[var(--info)] shrink-0" aria-hidden />
              Tasks at a glance
            </h2>
            <p className="text-sm text-[var(--fg-muted)]">Your assigned tasks by status</p>
          </div>
          <Link
            to="/app/tasks"
            className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] shrink-0 flex items-center gap-1"
          >
            View all <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {showSkeleton ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} lines={2} />)
          ) : (
            TASK_KPIS.map(({ key, label, icon: Icon, accent, bg }) => (
              <Link
                key={key}
                to="/app/tasks"
                className="block focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 rounded-xl outline-none"
              >
                <MotionCard
                  asListItem
                  className="relative overflow-hidden rounded-xl border-2 border-[var(--border)] p-4 sm:p-5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-[var(--border-focus)] transition-all duration-200 h-full"
                  style={{ background: bg }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">{label}</p>
                      <p className="text-2xl sm:text-3xl font-bold mt-1.5 tabular-nums" style={{ color: accent }}>
                        {taskKpis[key]}
                      </p>
                    </div>
                    <span
                      className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 opacity-90"
                      style={{ background: accent, color: 'white' }}
                    >
                      <Icon
                        className={`w-5 h-5 ${key === 'tasksInProgress' ? 'animate-spin' : ''}`}
                        aria-hidden
                      />
                    </span>
                  </div>
                </MotionCard>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Task status overview */}
      <section aria-labelledby="my-task-status">
        <div className="mb-3">
          <h2 id="my-task-status" className="flex items-center gap-2 section-heading mb-0.5">
            <Target className="w-5 h-5 text-[var(--info)] shrink-0" aria-hidden />
            Task status
          </h2>
          <p className="text-sm text-[var(--fg-muted)]">Progress for your assigned tasks</p>
        </div>
        <Card>
          {(() => {
            const completedPct = totalForBars ? Math.round((completedCount / totalForBars) * 100) : 0;
            return (
              <>
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div>
                    <span className="text-2xl font-bold tabular-nums text-[var(--fg)]">{myTasks.length}</span>
                    <span className="text-sm text-[var(--fg-muted)] ml-1.5">total tasks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--fg-muted)]">Completed</span>
                    <span className="text-xl font-bold tabular-nums text-[var(--success)]">{completedPct}%</span>
                  </div>
                </div>
                <div
                  className="h-2.5 bg-[var(--muted)] rounded-full overflow-hidden mb-5"
                  role="progressbar"
                  aria-valuenow={completedCount}
                  aria-valuemin={0}
                  aria-valuemax={totalForBars}
                  aria-label={`${completedPct}% of your tasks completed`}
                >
                  <div
                    className="h-full rounded-full bg-[var(--success)] transition-[width] duration-500"
                    style={{ width: `${completedPct}%` }}
                  />
                </div>
                <div className="space-y-4">
                  {statusBars.map(({ label, count, color }) => {
                    const pct = totalForBars ? Math.round((count / totalForBars) * 100) : 0;
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium text-[var(--fg)]">{label}</span>
                          <span className="tabular-nums font-semibold" style={{ color }}>
                            {count} <span className="text-[var(--fg-muted)] font-normal">({pct}%)</span>
                          </span>
                        </div>
                        <div
                          className="h-3 bg-[var(--muted)] rounded-full overflow-hidden"
                          role="progressbar"
                          aria-valuenow={count}
                          aria-valuemin={0}
                          aria-valuemax={totalForBars}
                          aria-label={`${label}: ${count} of ${totalForBars}`}
                        >
                          <div
                            className="h-full rounded-full transition-[width] duration-300"
                            style={{ width: `${pct}%`, background: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </Card>
      </section>
    </MotionPage>
  );
}
