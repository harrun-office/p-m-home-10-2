import { useMemo, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ListTodo,
  FolderKanban,
  Calendar,
  Users,
  Target,
  FolderOpen,
  Pause,
  CheckCircle2,
  Circle,
  Loader2,
  ArrowRight,
  Sparkles,
  Clock,
  TrendingUp,
  AlertTriangle,
  Zap,
  Activity,
  Plus,
  Bell,
  Settings,
  BarChart3,
  UserCheck,
  CheckSquare,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useDataStore } from '../../store/dataStore.jsx';
import { getSession } from '../../store/sessionStore.js';
import { groupCountBy } from '../../utils/dashboard.js';
import { todayKey, toDayKey, toLocalDayKey, addDaysToLocalKey } from '../../utils/date.js';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { SkeletonCard } from '../../components/ui/Skeleton.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { MotionPage } from '../../components/motion/MotionPage.jsx';
import { MotionCard } from '../../components/motion/MotionCard.jsx';
import { MotionModal } from '../../components/motion/MotionModal.jsx';

/**
 * Admin Dashboard: eye-catching, easy to scan. Hero strip, grouped KPIs, clear sections.
 */
const SKELETON_DELAY_MS = 250;

const PROJECT_KPIS = [
  { key: 'totalProjects', label: 'Total', icon: FolderKanban, accent: 'var(--accent)', bg: 'var(--accent-light)' },
  { key: 'activeProjects', label: 'Active', icon: FolderOpen, accent: 'var(--success)', bg: 'var(--success-light)' },
  { key: 'onHoldProjects', label: 'On hold', icon: Pause, accent: 'var(--warning)', bg: 'var(--warning-light)' },
  { key: 'completedProjects', label: 'Done', icon: CheckCircle2, accent: 'var(--purple)', bg: 'var(--purple-light)' },
];

const TASK_KPIS = [
  { key: 'totalTasks', label: 'All tasks', icon: ListTodo, accent: 'var(--info)', bg: 'var(--info-light)' },
  { key: 'totalOpenTasks', label: 'To do', icon: Circle, accent: 'var(--warning)', bg: 'var(--warning-light)' },
  { key: 'tasksInProgress', label: 'In progress', icon: Loader2, accent: 'var(--teal)', bg: 'var(--teal-light)' },
  { key: 'tasksOverdue', label: 'Overdue', icon: AlertTriangle, accent: 'var(--danger)', bg: 'var(--danger-light)' },
  { key: 'tasksCompleted', label: 'Done', icon: CheckCircle2, accent: 'var(--success)', bg: 'var(--success-light)' },
];

export function AdminDashboardPage() {
  const { state, runDeadlineCheck, resetDemo } = useDataStore();
  const session = getSession();
  const { showToast } = useToast();
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [loadingStates, setLoadingStates] = useState({
    kpis: false,
    activity: false
  });
  const [showDueProjectsModal, setShowDueProjectsModal] = useState(false);
  const [showOverdueTasksModal, setShowOverdueTasksModal] = useState(false);
  const [taskOverviewFilter, setTaskOverviewFilter] = useState('today');
  const [taskOverviewCustomStart, setTaskOverviewCustomStart] = useState('');
  const [taskOverviewCustomEnd, setTaskOverviewCustomEnd] = useState('');


  useEffect(() => {
    const t = setTimeout(() => setShowSkeleton(false), SKELETON_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  // Keyboard shortcuts for workflow optimization
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only trigger shortcuts when not typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'p':
            e.preventDefault();
            window.location.href = '/admin/projects';
            break;
          case 't':
            e.preventDefault();
            window.location.href = '/admin/tasks';
            break;
          case 'u':
            e.preventDefault();
            window.location.href = '/admin/users';
            break;
          case 'd':
            e.preventDefault();
            runDeadlineCheck();
            showToast({ title: 'Deadline check', message: 'Completed.' });
            break;
          case 'b':
            e.preventDefault();
            showToast({ title: 'Bulk Actions', message: 'Select multiple items to enable bulk operations' });
            break;
          case '/':
            e.preventDefault();
            showToast({ title: 'Search', message: 'Global search coming soon (Ctrl+K)' });
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [runDeadlineCheck, showToast]);

  const projects = state.projects || [];
  const tasks = state.tasks || [];
  const users = state.users || [];

  const todayLabel = useMemo(() => new Date().toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }), []);

  // Task overview: current day only (assigned today or due today), using local date so timezone matches
  const currentDayTasks = useMemo(() => {
    const today = todayKey();
    return tasks.filter((t) => {
      const assignedToday = t.assignedAt && toLocalDayKey(t.assignedAt) === today;
      const dueToday = t.deadline && toLocalDayKey(t.deadline) === today;
      return assignedToday || dueToday;
    });
  }, [tasks]);

  // Task overview date filter: which tasks to include (by assignedAt or deadline in range)
  const taskOverviewFilteredTasks = useMemo(() => {
    const today = todayKey();
    if (taskOverviewFilter === 'all') return tasks;
    let startKey;
    let endKey = today;
    if (taskOverviewFilter === 'today') {
      startKey = today;
      endKey = today;
    } else if (taskOverviewFilter === 'yesterday') {
      const yesterday = addDaysToLocalKey(today, -1);
      startKey = yesterday;
      endKey = yesterday;
    } else if (taskOverviewFilter === 'week') {
      startKey = addDaysToLocalKey(today, -7);
    } else if (taskOverviewFilter === 'month') {
      startKey = addDaysToLocalKey(today, -30);
    } else if (taskOverviewFilter === 'custom' && taskOverviewCustomStart && taskOverviewCustomEnd) {
      startKey = taskOverviewCustomStart;
      endKey = taskOverviewCustomEnd;
    } else {
      return tasks;
    }
    return tasks.filter((t) => {
      const assignedKey = t.assignedAt ? toLocalDayKey(t.assignedAt) : '';
      const deadlineKey = t.deadline ? toLocalDayKey(t.deadline) : '';
      const inRange = (key) => key && key >= startKey && key <= endKey;
      return inRange(assignedKey) || inRange(deadlineKey);
    });
  }, [tasks, taskOverviewFilter, taskOverviewCustomStart, taskOverviewCustomEnd]);

  const taskKpis = useMemo(() => {
    const list = taskOverviewFilteredTasks;
    return {
      totalTasks: list.length,
      totalOpenTasks: list.filter((t) => t.status === 'TODO').length,
      tasksInProgress: list.filter((t) => t.status === 'IN_PROGRESS').length,
      tasksCompleted: list.filter((t) => t.status === 'COMPLETED').length,
      tasksOverdue: list.filter((t) =>
        t.status !== 'COMPLETED' && t.deadline && new Date(t.deadline) < new Date()
      ).length,
    };
  }, [taskOverviewFilteredTasks]);

  const kpis = useMemo(() => {
    const active = projects.filter((p) => p.status === 'ACTIVE').length;
    const onHold = projects.filter((p) => p.status === 'ON_HOLD').length;
    const completed = projects.filter((p) => p.status === 'COMPLETED').length;
    const pendingTasks = tasks.filter((t) => t.status === 'TODO').length;
    const tasksInProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const tasksCompleted = tasks.filter((t) => t.status === 'COMPLETED').length;
    const tasksOverdue = tasks.filter((t) =>
      t.status !== 'COMPLETED' &&
      t.deadline &&
      new Date(t.deadline) < new Date()
    ).length;
    return {
      totalProjects: projects.length,
      activeProjects: active,
      onHoldProjects: onHold,
      completedProjects: completed,
      totalTasks: tasks.length,
      totalOpenTasks: pendingTasks,
      tasksInProgress,
      tasksCompleted,
      tasksOverdue,
    };
  }, [projects, tasks]);

  const activeUsers = useMemo(() => users.filter((u) => u.isActive !== false && u.role !== 'ADMIN'), [users]);
  const devCount = useMemo(() => activeUsers.filter((u) => u.department === 'DEV').length, [activeUsers]);
  const presalesCount = useMemo(() => activeUsers.filter((u) => u.department === 'PRESALES').length, [activeUsers]);
  const testerCount = useMemo(() => activeUsers.filter((u) => u.department === 'TESTER').length, [activeUsers]);
  const statusCounts = useMemo(() => groupCountBy(tasks, 'status'), [tasks]);
  const totalForBars = tasks.length || 1;
  const todoCount = statusCounts.TODO || 0;
  const inProgressCount = statusCounts.IN_PROGRESS || 0;
  const completedCount = statusCounts.COMPLETED || 0;


  // Find project with soonest deadline + sorted upcoming list
  const upcomingProjects = useMemo(() => {
    const today = new Date();
    return projects
      .filter((p) => p.status === 'ACTIVE' && p.endDate && new Date(p.endDate) >= today)
      .sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
  }, [projects]);

  const soonestDeadlineProject = upcomingProjects[0] ?? null;

  const todayTasks = useMemo(() => {
    const today = todayKey();
    return tasks.filter((t) => t.assignedAt && toDayKey(t.assignedAt) === today);
  }, [tasks]);

  // Real-time connection monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Simulate real-time updates with performance considerations
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // Only update activity feed if tab is visible to save resources
      if (!document.hidden) {
        setLoadingStates(prev => ({ ...prev, activity: true }));
        setTimeout(() => {
          setLoadingStates(prev => ({ ...prev, activity: false }));
        }, 500);
      }
    }, 30000); // Update every 30 seconds

    // Handle visibility change for performance
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible, refresh data
        setLastUpdate(new Date());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);


  // Enhanced insights for hero section
  const urgentTasks = useMemo(() => {
    const today = new Date();
    return tasks.filter(t =>
      t.status !== 'COMPLETED' &&
      t.deadline &&
      new Date(t.deadline).toDateString() === today.toDateString()
    );
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    const today = new Date();
    return tasks.filter(t =>
      t.status !== 'COMPLETED' &&
      t.deadline &&
      new Date(t.deadline) < today
    );
  }, [tasks]);


  const recentActivity = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return tasks.filter(t =>
      t.updatedAt &&
      new Date(t.updatedAt) > yesterday
    ).slice(0, 3);
  }, [tasks]);


  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);




  const teamRows = [
    { label: 'Total active employees', value: activeUsers.length },
    { label: 'DEV', value: devCount },
    { label: 'PRESALES', value: presalesCount },
    { label: 'TESTER', value: testerCount },
  ];

  const statusBars = [
    { label: 'To Do', count: todoCount, color: 'var(--warning)' },
    { label: 'In Progress', count: inProgressCount, color: 'var(--info)' },
    { label: 'Completed', count: completedCount, color: 'var(--success)' },
  ];

  if (!session) return null;

  return (
    <MotionPage
      className="space-y-8 sm:space-y-10"
      role="main"
      aria-labelledby="dashboard-heading"
    >
      {/* Skip to main content link is handled by App.jsx */}

      {/* Greeting at the top */}
      <div className="flex items-center gap-2 text-sm font-medium text-[var(--fg-muted)] mb-4">
        <Sparkles className="w-4 h-4 text-[var(--primary)]" aria-hidden />
        {timeGreeting} · {todayLabel}
      </div>

      {/* Real-time Status Bar - Mobile Optimized */}
      <div
        className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-sm overflow-hidden"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="px-3 py-2 sm:px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1.5">
                {isOnline ? (
                  <Wifi className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                ) : (
                  <WifiOff className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                )}
                <span className="text-xs sm:text-sm text-[var(--fg-muted)]">
                  {isOnline ? 'Live' : 'Offline'}
                </span>
              </div>
              <div className="hidden sm:block text-xs sm:text-sm text-[var(--fg-muted)]">
                Updated {lastUpdate.toLocaleTimeString()}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => {
                  setLastUpdate(new Date());
                  showToast({ title: 'Data Refreshed', message: 'Dashboard data has been updated.' });
                }}
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
              >
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>

            </div>
          </div>
        </div>

        {/* Mobile-only last updated time */}
        <div className="sm:hidden px-3 pb-2">
          <div className="text-xs text-[var(--fg-muted)]">
            Updated {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>



      {/* Enhanced Projects KPI Cards */}
      <section aria-labelledby="projects-kpis">
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <div>
            <h2 id="projects-kpis" className="flex items-center gap-2 section-heading mb-0.5">
              <FolderKanban className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden="true" />
              Projects Overview
            </h2>
            <p className="text-sm text-[var(--fg-muted)]">Real-time status and performance metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/projects"
              className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
            <button className="p-1.5 text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--muted)] rounded-lg transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          {showSkeleton || loadingStates.kpis ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} lines={3} />)
          ) : (
            <>
              {PROJECT_KPIS.map(({ key, label, icon: Icon, accent, bg }) => (
                <Link key={key} to="/admin/projects" className="block group">
                  <MotionCard
                    asListItem
                    className="rounded-xl border-2 border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] hover:border-[var(--border-focus)] transition-all duration-300 h-full group-hover:-translate-y-1"
                    style={{ background: bg }}
                  >

                    <div className="relative z-10 p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-1">{label}</p>
                          <p className="text-2xl sm:text-3xl font-bold tabular-nums truncate" style={{ color: accent }}>
                            {kpis[key]}
                          </p>
                        </div>
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" style={{ background: accent, color: 'white' }}>
                          <Icon className="w-5 h-5" aria-hidden />
                        </div>
                      </div>

                    </div>
                  </MotionCard>
                </Link>
              ))}
              {/* Upcoming Project Deadline */}
              {soonestDeadlineProject && (
                <button
                  type="button"
                  onClick={() => setShowDueProjectsModal(true)}
                  className="block group text-left w-full"
                >
                  <MotionCard
                    asListItem
                    className="rounded-xl border-2 border-[var(--warning)] bg-gradient-to-br from-yellow-50 to-orange-50 backdrop-blur-sm shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] hover:from-yellow-100 hover:to-orange-100 transition-all duration-300 h-full group-hover:-translate-y-1"
                  >
                    <div className="relative z-10 p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[var(--warning)] uppercase tracking-wider mb-1">Upcoming</p>
                          <p className="text-lg font-bold text-[var(--fg)]">
                            Project Deadline
                          </p>
                        </div>
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-200 to-orange-200 text-orange-700 shrink-0 group-hover:scale-110 transition-all duration-300">
                          <Target className="w-5 h-5" aria-hidden />
                        </div>
                      </div>
                      <div className="text-xs text-[var(--warning)] uppercase tracking-wider">
                        {soonestDeadlineProject.name} - Due {new Date(soonestDeadlineProject.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </MotionCard>
                </button>
              )}
            </>
          )}
        </div>
      </section>

      {/* Enhanced Tasks KPI Cards */}
      <section aria-labelledby="tasks-kpis">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 id="tasks-kpis" className="flex items-center gap-2 section-heading mb-0.5">
              <Target className="w-5 h-5 text-[var(--info)] shrink-0" aria-hidden />
              Task Performance
            </h2>
            <p className="text-sm text-[var(--fg-muted)]">Tasks by status — filter by date range</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={taskOverviewFilter}
              onChange={(e) => setTaskOverviewFilter(e.target.value)}
              className="min-w-[140px]"
              aria-label="Filter task overview by date"
            >
              <option value="today">Today</option>
              <option value="all">All time</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="custom">Custom range</option>
            </Select>
            {taskOverviewFilter === 'custom' && (
              <div className="flex items-center gap-2 flex-wrap">
                <Input
                  type="date"
                  value={taskOverviewCustomStart}
                  onChange={(e) => setTaskOverviewCustomStart(e.target.value)}
                  aria-label="Custom range start"
                  className="min-w-[130px]"
                />
                <span className="text-[var(--fg-muted)] text-sm">to</span>
                <Input
                  type="date"
                  value={taskOverviewCustomEnd}
                  onChange={(e) => setTaskOverviewCustomEnd(e.target.value)}
                  aria-label="Custom range end"
                  className="min-w-[130px]"
                />
              </div>
            )}
            <Link
              to="/admin/tasks"
              className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] flex items-center gap-1 shrink-0"
            >
              View all <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          {showSkeleton || loadingStates.kpis ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} lines={3} />)
          ) : (
            TASK_KPIS.map(({ key, label, icon: Icon, accent, bg }) => {

              const card = (
                <MotionCard
                  asListItem
                  className="rounded-xl border-2 border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] hover:border-[var(--border-focus)] transition-all duration-300 h-full group-hover:-translate-y-1"
                  style={{ background: bg }}
                >
                  <div className="relative z-10 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-1">{label}</p>
                        <p className="text-2xl sm:text-3xl font-bold tabular-nums truncate" style={{ color: accent }}>
                          {taskKpis[key]}
                        </p>
                      </div>
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" style={{ background: accent, color: 'white' }}>
                        <Icon className={`w-5 h-5 ${key === 'tasksInProgress' ? 'animate-spin' : ''}`} aria-hidden />
                      </div>
                    </div>
                  </div>
                </MotionCard>
              );

              if (key === 'tasksOverdue') {
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setShowOverdueTasksModal(true)}
                    className="block group text-left w-full"
                  >
                    {card}
                  </button>
                );
              }

              return (
                <Link key={key} to="/admin/tasks" className="block group">
                  {card}
                </Link>
              );
            })
          )}
        </div>
      </section>

      {/* Two-column: Team + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Team Allocation */}
        <section aria-labelledby="team-allocation">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h2 id="team-allocation" className="flex items-center gap-2 section-heading mb-0.5">
                <Users className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden />
                Your team
              </h2>
              <p className="text-sm text-[var(--fg-muted)]">Active members by department</p>
            </div>
            <Link
              to="/admin/users"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded shrink-0"
            >
              View users
              <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>
          <Card padding="p-0" className="overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/50">
              <span className="text-sm font-medium text-[var(--fg-muted)]">Total active</span>
              <span className="inline-flex items-center justify-center min-w-[2rem] h-7 rounded-full bg-[var(--primary)] text-[var(--primary-fg)] text-sm font-bold tabular-nums px-2">
                {activeUsers.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]">
              {teamRows.slice(1).map((row) => (
                <div
                  key={row.label}
                  className="flex flex-col items-start sm:items-center justify-center px-4 py-4 text-left sm:text-center gap-1 hover:bg-[var(--muted)]/50 transition-colors"
                >
                  <span className="text-lg sm:text-2xl font-bold tabular-nums text-[var(--fg)]">
                    {row.value}
                  </span>
                  <span className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider">
                    {row.label}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </section>
        {/* Quick Actions Panel */}
        <section aria-labelledby="workflow-optimization">
          <Card className="h-full flex flex-col p-4 sm:p-6">
            <h3 id="workflow-optimization" className="font-semibold text-[var(--fg)] mb-3 sm:mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
              Quick Actions
            </h3>
            <div className="space-y-2.5 sm:space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-sm"
                onClick={() => showToast({ title: 'Create Project', message: 'Opening project creation form...' })}
                leftIcon={Plus}
              >
                <span className="truncate">Create New Project</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-sm"
                onClick={() => showToast({ title: 'Add Team Member', message: 'Opening user invitation form...' })}
                leftIcon={UserCheck}
              >
                <span className="truncate">Invite Team Member</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-sm"
                onClick={() => showToast({ title: 'Generate Report', message: 'Creating performance report...' })}
                leftIcon={BarChart3}
              >
                <span className="truncate">Generate Report</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-sm"
                onClick={() => showToast({ title: 'Schedule Meeting', message: 'Opening calendar...' })}
                leftIcon={Calendar}
              >
                <span className="truncate">Schedule Meeting</span>
              </Button>
            </div>

            <div className="mt-4 sm:mt-6 pt-4 border-t border-[var(--border)]">
              <h4 className="text-sm font-medium text-[var(--fg-muted)] mb-3">Keyboard Shortcuts</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-[var(--fg-muted)]">
                <div className="flex justify-between items-center">
                  <span>Projects</span>
                  <kbd className="px-1 py-0.5 bg-[var(--muted)] rounded text-[var(--fg)] text-xs">Ctrl+P</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>Tasks</span>
                  <kbd className="px-1 py-0.5 bg-[var(--muted)] rounded text-[var(--fg)] text-xs">Ctrl+T</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>Team</span>
                  <kbd className="px-1 py-0.5 bg-[var(--muted)] rounded text-[var(--fg)] text-xs">Ctrl+U</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span>Check</span>
                  <kbd className="px-1 py-0.5 bg-[var(--muted)] rounded text-[var(--fg)] text-xs">Ctrl+D</kbd>
                </div>
              </div>
            </div>
          </Card>
        </section>

      </div>

      {/* Upcoming project deadlines modal */}
      <MotionModal open={showDueProjectsModal} onClose={() => setShowDueProjectsModal(false)}>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-lg)] max-w-lg w-full max-h-[80vh] overflow-y-auto text-[var(--card-fg)]">
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--fg)]">Upcoming project deadlines</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDueProjectsModal(false)}
            >
              Close
            </Button>
          </div>
          <div className="p-4 space-y-3">
            {upcomingProjects.length === 0 ? (
              <p className="text-sm text-[var(--fg-muted)]">No upcoming project deadlines.</p>
            ) : (
              upcomingProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--fg)] truncate">{project.name}</p>
                    {project.description && (
                      <p className="text-xs text-[var(--fg-muted)] truncate">{project.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-xs font-semibold text-[var(--warning)] uppercase tracking-wider">
                      Due {new Date(project.endDate).toLocaleDateString()}
                    </span>
                    <Link
                      to={`/admin/projects/${project.id}`}
                      className="mt-1 text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium"
                      onClick={() => setShowDueProjectsModal(false)}
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </MotionModal>

      {/* Overdue tasks modal */}
      <MotionModal open={showOverdueTasksModal} onClose={() => setShowOverdueTasksModal(false)}>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-lg)] max-w-xl w-full max-h-[80vh] overflow-y-auto text-[var(--card-fg)]">
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--fg)]">Overdue tasks</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOverdueTasksModal(false)}
            >
              Close
            </Button>
          </div>
          <div className="p-4 space-y-3">
            {overdueTasks.length === 0 ? (
              <p className="text-sm text-[var(--fg-muted)]">No overdue tasks. Great job staying on track!</p>
            ) : (
              overdueTasks
                .slice()
                .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
                .map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--fg)] truncate">{task.title}</p>
                      {task.priority && (
                        <p className="text-xs text-[var(--fg-muted)] truncate">Priority: {task.priority}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs font-semibold text-[var(--danger)] uppercase tracking-wider">
                        Due {task.deadline ? new Date(task.deadline).toLocaleDateString() : '—'}
                      </span>
                      <Link
                        to="/admin/tasks?filter=overdue"
                        className="mt-1 text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium"
                        onClick={() => setShowOverdueTasksModal(false)}
                      >
                        View in board
                      </Link>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </MotionModal>
    </MotionPage>
  );
}
