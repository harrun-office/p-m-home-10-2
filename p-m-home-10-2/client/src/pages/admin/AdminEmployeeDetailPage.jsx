import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore.jsx';
import { getSession } from '../../store/sessionStore.js';
import { todayKey, toLocalDayKey, addDaysToLocalKey } from '../../utils/date.js';
import { Card } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Mail, ListTodo, FolderKanban, ArrowLeft, ArrowRight, ChevronDown, ChevronLeft, ChevronRight, User, Briefcase, CheckSquare, Clock, FolderOpen, Pause, CheckCircle2, MoreHorizontal } from 'lucide-react';

const TASK_STATUS_LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed' };
const TASK_STATUS_VARIANT = { TODO: 'neutral', IN_PROGRESS: 'warning', COMPLETED: 'success' };
const PROJECT_STATUS_LABELS = { ACTIVE: 'Active', ON_HOLD: 'On Hold', COMPLETED: 'Completed' };
const PROJECT_STATUS_VARIANT = { ACTIVE: 'success', ON_HOLD: 'warning', COMPLETED: 'neutral' };

const INITIAL_PAGE_SIZE = 3;
const TASK_PAGE_SIZE_OPTIONS = [10, 50, 100, 200, 0]; // 0 = All
const PROJECT_SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'end-asc', label: 'End date (nearest)' },
  { value: 'end-desc', label: 'End date (latest)' },
  { value: 'status', label: 'Status' }
];
const TASK_SORT_OPTIONS = [
  { value: 'updated-desc', label: 'Updated (newest)' },
  { value: 'updated-asc', label: 'Updated (oldest)' },
  { value: 'assigned-desc', label: 'Assigned (newest)' },
  { value: 'assigned-asc', label: 'Assigned (oldest)' },
  { value: 'title-asc', label: 'Title (A–Z)' },
  { value: 'status', label: 'Status' }
];

function getInitial(name) {
  return (name || '?').charAt(0).toUpperCase();
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

/**
 * Admin Employee Detail: full identification, assigned projects, assigned tasks.
 * Route: /admin/users/:id. View action from Employees list navigates here.
 */
export function AdminEmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useDataStore();
  const session = getSession();

  useEffect(() => {
    if (!session) {
      navigate('/login', { replace: true });
      return;
    }
    if (session.role !== 'ADMIN') {
      navigate('/app', { replace: true });
    }
  }, [session, navigate]);

  const users = state.users || [];
  const tasks = state.tasks || [];
  const projects = state.projects || [];

  const employee = useMemo(() => users.find((u) => u.id === id), [users, id]);
  const employeeProjects = useMemo(
    () => (employee ? projects.filter((p) => p.assignedUserIds && p.assignedUserIds.includes(employee.id)) : []),
    [employee, projects]
  );
  const employeeTasks = useMemo(
    () => (employee ? tasks.filter((t) => t.assigneeId === employee.id) : []),
    [employee, tasks]
  );

  const [activeTab, setActiveTab] = useState('profile');
  const [dateFilter, setDateFilter] = useState('today');
  const [dateFilterCustomStart, setDateFilterCustomStart] = useState('');
  const [dateFilterCustomEnd, setDateFilterCustomEnd] = useState('');
  const [projectsSort, setProjectsSort] = useState('end-asc');
  const [projectsVisible, setProjectsVisible] = useState(INITIAL_PAGE_SIZE);
  const [tasksPageSize, setTasksPageSize] = useState(10);
  const [tasksCurrentPage, setTasksCurrentPage] = useState(1);
  const [taskFilterProjectId, setTaskFilterProjectId] = useState('');

  useEffect(() => {
    setProjectsVisible(INITIAL_PAGE_SIZE);
  }, [dateFilter, dateFilterCustomStart, dateFilterCustomEnd]);

  // Reset to page 1 when filters or page size change
  useEffect(() => {
    setTasksCurrentPage(1);
  }, [dateFilter, dateFilterCustomStart, dateFilterCustomEnd, tasksPageSize, taskFilterProjectId]);

  const today = todayKey();
  const tasksInDateRange = useMemo(() => {
    if (dateFilter === 'all') return employeeTasks;
    let startKey;
    let endKey = today;
    if (dateFilter === 'today') {
      startKey = today;
      endKey = today;
    } else if (dateFilter === 'yesterday') {
      const yesterday = addDaysToLocalKey(today, -1);
      startKey = yesterday;
      endKey = yesterday;
    } else if (dateFilter === 'week') {
      startKey = addDaysToLocalKey(today, -7);
    } else if (dateFilter === 'month') {
      startKey = addDaysToLocalKey(today, -30);
    } else if (dateFilter === 'custom' && dateFilterCustomStart && dateFilterCustomEnd) {
      startKey = dateFilterCustomStart;
      endKey = dateFilterCustomEnd;
    } else if (dateFilter === 'specific' && dateFilterCustomStart) {
      startKey = dateFilterCustomStart;
      endKey = dateFilterCustomStart;
    } else {
      return employeeTasks;
    }
    const inRange = (key) => key && key >= startKey && key <= endKey;
    return employeeTasks.filter((t) => {
      const assignedKey = t.assignedAt ? toLocalDayKey(t.assignedAt) : '';
      const updatedKey = t.updatedAt ? toLocalDayKey(t.updatedAt) : '';
      return inRange(assignedKey) || inRange(updatedKey);
    });
  }, [employeeTasks, dateFilter, dateFilterCustomStart, dateFilterCustomEnd, today]);

  const tasksFilteredByProject = useMemo(() => {
    if (!taskFilterProjectId) return tasksInDateRange;
    return tasksInDateRange.filter((t) => t.projectId === taskFilterProjectId);
  }, [tasksInDateRange, taskFilterProjectId]);

  const projectsInDateRange = useMemo(() => {
    if (dateFilter === 'all') return employeeProjects;
    if (dateFilter === 'today') {
      // Today: show current in-progress projects (today is within start–end and status ACTIVE)
      return employeeProjects.filter((p) => {
        const startKeyP = p.startDate ? toLocalDayKey(p.startDate) : '';
        const endKeyP = p.endDate ? toLocalDayKey(p.endDate) : '';
        const inProgressToday = startKeyP && endKeyP && today >= startKeyP && today <= endKeyP;
        return inProgressToday && p.status === 'ACTIVE';
      });
    }
    let startKey;
    let endKey = today;
    if (dateFilter === 'yesterday') {
      const yesterday = addDaysToLocalKey(today, -1);
      startKey = yesterday;
      endKey = yesterday;
    } else if (dateFilter === 'week') {
      startKey = addDaysToLocalKey(today, -7);
    } else if (dateFilter === 'month') {
      startKey = addDaysToLocalKey(today, -30);
    } else if (dateFilter === 'custom' && dateFilterCustomStart && dateFilterCustomEnd) {
      startKey = dateFilterCustomStart;
      endKey = dateFilterCustomEnd;
    } else if (dateFilter === 'specific' && dateFilterCustomStart) {
      startKey = dateFilterCustomStart;
      endKey = dateFilterCustomStart;
    } else {
      return employeeProjects;
    }
    const inRange = (key) => key && key >= startKey && key <= endKey;
    return employeeProjects.filter((p) => {
      const startKeyP = p.startDate ? toLocalDayKey(p.startDate) : '';
      const endKeyP = p.endDate ? toLocalDayKey(p.endDate) : '';
      return inRange(startKeyP) || inRange(endKeyP);
    });
  }, [employeeProjects, dateFilter, dateFilterCustomStart, dateFilterCustomEnd, today]);

  const sortedProjects = useMemo(() => {
    const list = [...projectsInDateRange];
    if (projectsSort === 'name-asc') return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (projectsSort === 'name-desc') return list.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    if (projectsSort === 'end-asc') return list.sort((a, b) => (a.endDate || '').localeCompare(b.endDate || ''));
    if (projectsSort === 'end-desc') return list.sort((a, b) => (b.endDate || '').localeCompare(a.endDate || ''));
    if (projectsSort === 'status') return list.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
    return list;
  }, [projectsInDateRange, projectsSort]);

  const sortedTasks = useMemo(() => {
    const list = [...tasksFilteredByProject];
    return list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  }, [tasksFilteredByProject]);

  const displayedProjects = sortedProjects.slice(0, projectsVisible);
  const hasMoreProjects = projectsVisible < sortedProjects.length;

  const showMoreProjects = () => setProjectsVisible((n) => Math.min(n + 5, sortedProjects.length));
  const showAllProjects = () => setProjectsVisible(sortedProjects.length);

  // Tasks pagination
  const totalTasks = sortedTasks.length;
  const effectivePageSize = tasksPageSize === 0 ? totalTasks : Math.max(1, Number(tasksPageSize) || 10);
  const totalPages = Math.max(1, effectivePageSize >= totalTasks ? 1 : Math.ceil(totalTasks / effectivePageSize));
  const clampedPage = Math.min(Math.max(1, tasksCurrentPage), totalPages);
  const startIndex = (clampedPage - 1) * effectivePageSize;
  const displayedTasks = sortedTasks.slice(startIndex, startIndex + effectivePageSize);

  if (!employee) {
    return (
      <div className="max-w-6xl">
        <p className="text-red-600 font-medium">Employee not found.</p>
        <Link
          to="/admin/users"
          className="text-[var(--accent)] hover:underline mt-2 inline-block transition-colors"
        >
          ← Back to Employees
        </Link>
      </div>
    );
  }

  const isActive = employee.isActive !== false;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare }
  ];

  return (
    <div className="max-w-6xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Link
          to="/admin/users"
          className="text-gray-600 hover:text-blue-600 transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          Employees
        </Link>
        <span className="text-gray-600" aria-hidden>/</span>
        <span className="font-medium text-gray-900 truncate max-w-[200px] sm:max-w-none" aria-current="page">
          {employee.name}
        </span>
      </nav>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <Card padding="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          <div
            className="w-20 h-20 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl font-bold shrink-0"
            aria-hidden
          >
            {getInitial(employee.name)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{employee.name}</h1>
            <p className="text-gray-600 mt-0.5">
              {employee.department || '—'} · {employee.role || 'Employee'}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Badge variant={isActive ? 'success' : 'neutral'}>
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
              <a
                href={`mailto:${employee.email || ''}`}
                className="text-sm text-[var(--accent)] hover:underline inline-flex items-center gap-1"
              >
                <Mail className="w-3.5 h-3.5" />
                {employee.email || '—'}
              </a>
            </div>
          </div>
        </div>

        {/* Profile details grid */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-3">
            Profile details
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <div>
              <dt className="text-xs text-gray-600">Employee ID</dt>
              <dd className="mt-0.5 font-medium text-gray-900 font-mono text-sm">{employee.employeeId || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-600">Email</dt>
              <dd className="mt-0.5 text-sm text-gray-900">{employee.email || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-600">Contact number</dt>
              <dd className="mt-0.5 text-sm text-gray-900">{employee.personalNumber || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-600">Department</dt>
              <dd className="mt-0.5 text-sm text-gray-900">{employee.department || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-600">Role</dt>
              <dd className="mt-0.5 text-sm text-gray-900">{employee.role || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-600">Status</dt>
              <dd className="mt-0.5">
                <Badge variant={isActive ? 'success' : 'neutral'}>{isActive ? 'Active' : 'Inactive'}</Badge>
              </dd>
            </div>
          </dl>
        </div>

        {/* Employee Projects KPI Cards */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <section aria-labelledby="employee-projects-kpis">
            <div className="flex items-baseline justify-between gap-4 mb-4">
              <div>
                <h2 id="employee-projects-kpis" className="flex items-center gap-2 text-lg font-semibold text-[var(--fg)] mb-0.5">
                  <FolderKanban className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden="true" />
                  Projects Overview
                </h2>
                <p className="text-sm text-[var(--fg-muted)]">Real-time status and performance metrics</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] flex items-center gap-1">
                  View all <ArrowRight className="w-4 h-4" aria-hidden />
                </button>
                <button className="p-1.5 text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--muted)] rounded-lg transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
              {/* Total Projects */}
              <div className="block group">
                <div className="rounded-xl border-2 border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] hover:border-[var(--border-focus)] transition-all duration-300 h-full group-hover:-translate-y-1" style={{ background: 'var(--accent-light)' }}>
                  <div className="relative z-10 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-1">Total</p>
                        <p className="text-2xl sm:text-3xl font-bold tabular-nums truncate" style={{ color: 'var(--accent)' }}>
                          {employeeProjects.length}
                        </p>
                      </div>
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" style={{ background: 'var(--accent)', color: 'white' }}>
                        <FolderKanban className="w-5 h-5" aria-hidden />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Projects */}
              <div className="block group">
                <div className="rounded-xl border-2 border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] hover:border-[var(--border-focus)] transition-all duration-300 h-full group-hover:-translate-y-1" style={{ background: 'var(--success-light)' }}>
                  <div className="relative z-10 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-1">Active</p>
                        <p className="text-2xl sm:text-3xl font-bold tabular-nums truncate" style={{ color: 'var(--success)' }}>
                          {employeeProjects.filter(p => p.status === 'ACTIVE').length}
                        </p>
                      </div>
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" style={{ background: 'var(--success)', color: 'white' }}>
                        <FolderOpen className="w-5 h-5" aria-hidden />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* On Hold Projects */}
              <div className="block group">
                <div className="rounded-xl border-2 border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] hover:border-[var(--border-focus)] transition-all duration-300 h-full group-hover:-translate-y-1" style={{ background: 'var(--warning-light)' }}>
                  <div className="relative z-10 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-1">On hold</p>
                        <p className="text-2xl sm:text-3xl font-bold tabular-nums truncate" style={{ color: 'var(--warning)' }}>
                          {employeeProjects.filter(p => p.status === 'ON_HOLD').length}
                        </p>
                      </div>
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" style={{ background: 'var(--warning)', color: 'white' }}>
                        <Pause className="w-5 h-5" aria-hidden />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Done Projects */}
              <div className="block group">
                <div className="rounded-xl border-2 border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] hover:border-[var(--border-focus)] transition-all duration-300 h-full group-hover:-translate-y-1" style={{ background: 'var(--purple-light)' }}>
                  <div className="relative z-10 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-1">Done</p>
                        <p className="text-2xl sm:text-3xl font-bold tabular-nums truncate" style={{ color: 'var(--purple)' }}>
                          {employeeProjects.filter(p => p.status === 'COMPLETED').length}
                        </p>
                      </div>
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" style={{ background: 'var(--purple)', color: 'white' }}>
                        <CheckCircle2 className="w-5 h-5" aria-hidden />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Project Deadline */}
              {(() => {
                const upcomingDeadlines = employeeProjects
                  .filter(p => p.endDate && p.status === 'ACTIVE')
                  .map(p => ({ ...p, deadline: new Date(p.endDate) }))
                  .filter(p => p.deadline > new Date())
                  .sort((a, b) => a.deadline - b.deadline);

                const soonestDeadlineProject = upcomingDeadlines[0];

                return soonestDeadlineProject ? (
                  <button
                    type="button"
                    className="block group text-left w-full"
                  >
                    <div className="rounded-xl border-2 border-[var(--warning)] bg-gradient-to-br from-yellow-50 to-orange-50 backdrop-blur-sm shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] hover:from-yellow-100 hover:to-orange-100 transition-all duration-300 h-full group-hover:-translate-y-1">
                      <div className="relative z-10 p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[var(--warning)] uppercase tracking-wider mb-1">Upcoming</p>
                            <p className="text-lg font-bold text-[var(--fg)]">
                              Project Deadline
                            </p>
                          </div>
                          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-200 to-orange-200 text-orange-700 shrink-0 group-hover:scale-110 transition-all duration-300">
                            <Clock className="w-5 h-5" aria-hidden />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium text-[var(--fg)] truncate">
                            {soonestDeadlineProject.name}
                          </p>
                          <p className="text-sm text-[var(--fg-muted)]">
                            DUE {formatDate(soonestDeadlineProject.endDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                ) : null;
              })()}
            </div>
          </section>
        </div>
      </Card>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <Card>
          {/* Simple Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-[var(--fg)] flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-[var(--accent)]" />
                Projects ({projectsInDateRange.length})
              </h2>
            </div>
            {projectsInDateRange.length > 0 && (
              <Select
                id="employee-projects-sort"
                value={projectsSort}
                onChange={(e) => setProjectsSort(e.target.value)}
                className="min-w-[180px]"
                aria-label="Sort projects"
              >
                {PROJECT_SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            )}
          </div>

          {/* Date Filter Section */}
          <div className="bg-[var(--muted)]/30 rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--fg)]">📅 Filter by time period:</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Select
                  id="employee-date-filter"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="min-w-[160px]"
                  aria-label="Filter by date range"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Last 7 days</option>
                  <option value="month">Last 30 days</option>
                  <option value="all">All time</option>
                  <option value="custom">Custom range</option>
                  <option value="specific">Specific date</option>
                </Select>
                {(dateFilter === 'custom' || dateFilter === 'specific') && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={dateFilter === 'specific' ? dateFilterCustomStart : dateFilterCustomStart}
                      onChange={(e) => setDateFilterCustomStart(e.target.value)}
                      aria-label={dateFilter === 'specific' ? "Select date" : "From date"}
                      className="min-w-[130px]"
                      placeholder={dateFilter === 'specific' ? "Select date" : "Start date"}
                    />
                    {dateFilter === 'custom' && (
                      <>
                        <span className="text-[var(--fg-muted)] text-sm font-medium">to</span>
                        <Input
                          type="date"
                          value={dateFilterCustomEnd}
                          onChange={(e) => setDateFilterCustomEnd(e.target.value)}
                          aria-label="To date"
                          className="min-w-[130px]"
                          placeholder="End date"
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        {projectsInDateRange.length === 0 ? (
          <div className="rounded-[var(--radius)] bg-gradient-to-br from-[var(--muted)]/30 to-[var(--muted)]/50 border-2 border-dashed border-[var(--border)] p-8 text-center">
            <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="w-8 h-8 text-[var(--accent)]" />
            </div>
            <h3 className="text-lg font-medium text-[var(--fg)] mb-2">No projects found</h3>
            <p className="text-sm text-[var(--fg-muted)] mb-4 max-w-md mx-auto">
              {dateFilter === 'all'
                ? 'This employee hasn\'t been assigned to any projects yet.'
                : `No projects match your current filter (${dateFilter === 'today' ? 'Today' : dateFilter === 'yesterday' ? 'Yesterday' : dateFilter === 'week' ? 'Last 7 days' : dateFilter === 'month' ? 'Last 30 days' : dateFilter === 'custom' ? 'Custom range' : dateFilter === 'specific' ? 'Specific date' : dateFilter}). Try selecting a different time period.`}
            </p>
            {dateFilter !== 'all' && (
              <button
                onClick={() => setDateFilter('all')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-[var(--accent-fg)] rounded-md hover:bg-[var(--accent)]/90 transition-colors text-sm font-medium"
              >
                Show All Projects
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Project Cards */}
            <ul className="space-y-3">
              {displayedProjects.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/admin/projects/${p.id}`}
                    className="block rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 hover:border-[var(--accent)] hover:shadow-sm transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-[var(--fg)] mb-1">
                          {p.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--fg-muted)]">
                          {p.description && <span className="truncate">{p.description}</span>}
                          <span>Start: {formatDate(p.startDate)}</span>
                          <span>End: {formatDate(p.endDate)}</span>
                        </div>
                      </div>
                      <Badge
                        variant={PROJECT_STATUS_VARIANT[p.status] || 'neutral'}
                        className="shrink-0"
                      >
                        {PROJECT_STATUS_LABELS[p.status] ?? p.status}
                      </Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            {hasMoreProjects && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={showAllProjects}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-[var(--accent-fg)] rounded-md hover:bg-[var(--accent)]/90 transition-colors text-sm font-medium"
                >
                  <ChevronDown className="w-4 h-4" />
                  Show all {sortedProjects.length} projects
                </button>
              </div>
            )}
          </>
        )}
      </Card>
      )}

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <Card>
          {/* Simple Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-[var(--fg)] flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-[var(--accent)]" />
                Tasks
              </h2>
            </div>
          </div>

          {/* Task summary cards (reflect current date + project filter) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl border-2 border-[var(--border)] p-4 bg-[var(--accent-light)]">
              <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-1">Total</p>
              <p className="text-2xl font-bold tabular-nums text-[var(--accent)]">{tasksFilteredByProject.length}</p>
            </div>
            <div className="rounded-xl border-2 border-[var(--border)] p-4 bg-[var(--success-light)]">
              <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-1">Completed</p>
              <p className="text-2xl font-bold tabular-nums text-[var(--success)]">
                {tasksFilteredByProject.filter((t) => t.status === 'COMPLETED').length}
              </p>
            </div>
            <div className="rounded-xl border-2 border-[var(--border)] p-4 bg-[var(--danger-light)]">
              <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-1">Overdue</p>
              <p className="text-2xl font-bold tabular-nums text-[var(--danger)]">
                {tasksFilteredByProject.filter((t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'COMPLETED').length}
              </p>
            </div>
            <div className="rounded-xl border-2 border-[var(--border)] p-4 bg-[var(--warning-light)]">
              <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-1">In progress</p>
              <p className="text-2xl font-bold tabular-nums text-[var(--warning)]">
                {tasksFilteredByProject.filter((t) => t.status === 'IN_PROGRESS').length}
              </p>
            </div>
          </div>

          {/* Date + Project filters */}
          <div className="bg-[var(--muted)]/30 rounded-lg p-4 mb-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--fg)]">📅 Filter by time period:</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Select
                    id="employee-tasks-date-filter"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="min-w-[160px]"
                    aria-label="Filter tasks by date range"
                  >
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">Last 7 days</option>
                    <option value="month">Last 30 days</option>
                    <option value="all">All time</option>
                    <option value="custom">Custom range</option>
                    <option value="specific">Specific date</option>
                  </Select>
                  {(dateFilter === 'custom' || dateFilter === 'specific') && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={dateFilter === 'specific' ? dateFilterCustomStart : dateFilterCustomStart}
                        onChange={(e) => setDateFilterCustomStart(e.target.value)}
                        aria-label={dateFilter === 'specific' ? "Select date" : "From date"}
                        className="min-w-[130px]"
                        placeholder={dateFilter === 'specific' ? "Select date" : "Start date"}
                      />
                      {dateFilter === 'custom' && (
                        <>
                          <span className="text-[var(--fg-muted)] text-sm font-medium">to</span>
                          <Input
                            type="date"
                            value={dateFilterCustomEnd}
                            onChange={(e) => setDateFilterCustomEnd(e.target.value)}
                            aria-label="To date"
                            className="min-w-[130px]"
                            placeholder="End date"
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--fg)]">📁 Filter by project:</span>
                </div>
                <Select
                  id="employee-tasks-project-filter"
                  value={taskFilterProjectId}
                  onChange={(e) => setTaskFilterProjectId(e.target.value)}
                  className="min-w-[200px]"
                  aria-label="Filter tasks by project"
                >
                  <option value="">All projects</option>
                  {employeeProjects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          {/* Tasks pagination: page size + page nav */}
          {tasksFilteredByProject.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-[var(--fg-muted)]">Tasks per page:</span>
                <div className="flex items-center gap-1">
                  {TASK_PAGE_SIZE_OPTIONS.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setTasksPageSize(size)}
                      className={`min-w-[2.5rem] px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        tasksPageSize === size
                          ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                          : 'bg-[var(--muted)] text-[var(--fg)] hover:bg-[var(--border)]'
                      }`}
                    >
                      {size === 0 ? 'All' : size}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--fg-muted)]">
                  Page {clampedPage} of {totalPages}
                  {effectivePageSize < totalTasks && (
                    <span className="ml-1">
                      ({startIndex + 1}–{Math.min(startIndex + effectivePageSize, totalTasks)} of {totalTasks})
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setTasksCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={clampedPage <= 1}
                    className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] hover:bg-[var(--muted)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTasksCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={clampedPage >= totalPages}
                    className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] hover:bg-[var(--muted)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

        {tasksFilteredByProject.length === 0 ? (
          <div className="rounded-[var(--radius)] bg-gradient-to-br from-[var(--muted)]/30 to-[var(--muted)]/50 border-2 border-dashed border-[var(--border)] p-8 text-center">
            <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ListTodo className="w-8 h-8 text-[var(--accent)]" />
            </div>
            <h3 className="text-lg font-medium text-[var(--fg)] mb-2">No tasks found</h3>
            <p className="text-sm text-[var(--fg-muted)] mb-4 max-w-md mx-auto">
              {dateFilter === 'all' && !taskFilterProjectId
                ? 'This employee hasn\'t been assigned any tasks yet.'
                : !taskFilterProjectId
                  ? `No tasks match your current date filter. Try selecting a different time period or "All time".`
                  : `No tasks in the selected project for this time period. Try a different project or "All projects".`}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {dateFilter !== 'all' && (
                <button
                  onClick={() => setDateFilter('all')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-[var(--accent-fg)] rounded-md hover:bg-[var(--accent)]/90 transition-colors text-sm font-medium"
                >
                  Show All Tasks (date)
                </button>
              )}
              {taskFilterProjectId && (
                <button
                  onClick={() => setTaskFilterProjectId('')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--muted)] text-[var(--fg)] rounded-md hover:bg-[var(--border)] transition-colors text-sm font-medium"
                >
                  All projects
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Kanban Board Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* To Do Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <h3 className="font-medium text-[var(--fg)]">To Do</h3>
                  <span className="text-xs text-[var(--fg-muted)] bg-[var(--muted)] px-2 py-1 rounded-full">
                    {displayedTasks.filter(t => t.status === 'TODO').length}
                  </span>
                </div>
                <div className="space-y-3 min-h-[200px]">
                  {displayedTasks.filter(t => t.status === 'TODO').map((t) => {
                    const project = projects.find((p) => p.id === t.projectId);
                    return (
                      <Link
                        key={t.id}
                        to={`/admin/projects/${t.projectId}`}
                        className="block rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 hover:border-[var(--accent)] hover:shadow-sm transition-colors"
                      >
                        <h4 className="font-medium text-[var(--fg)] mb-2 text-sm">
                          {t.title || 'Untitled task'}
                        </h4>
                        <div className="space-y-1 text-xs text-[var(--fg-muted)]">
                          {project && <div>Project: {project.name}</div>}
                          {t.assignedAt && <div>Assigned: {formatDate(t.assignedAt)}</div>}
                          {t.deadline && <div>Due: {formatDate(t.deadline)}</div>}
                        </div>
                        {t.deadline && new Date(t.deadline) < new Date() && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            <span className="font-medium">Overdue</span>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                  {displayedTasks.filter(t => t.status === 'TODO').length === 0 && (
                    <div className="text-center py-8 text-[var(--fg-muted)] text-sm border-2 border-dashed border-[var(--border)] rounded-lg">
                      No tasks to do
                    </div>
                  )}
                </div>
              </div>

              {/* In Progress Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <h3 className="font-medium text-[var(--fg)]">In Progress</h3>
                  <span className="text-xs text-[var(--fg-muted)] bg-[var(--muted)] px-2 py-1 rounded-full">
                    {displayedTasks.filter(t => t.status === 'IN_PROGRESS').length}
                  </span>
                </div>
                <div className="space-y-3 min-h-[200px]">
                  {displayedTasks.filter(t => t.status === 'IN_PROGRESS').map((t) => {
                    const project = projects.find((p) => p.id === t.projectId);
                    return (
                      <Link
                        key={t.id}
                        to={`/admin/projects/${t.projectId}`}
                        className="block rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 hover:border-[var(--accent)] hover:shadow-sm transition-colors"
                      >
                        <h4 className="font-medium text-[var(--fg)] mb-2 text-sm">
                          {t.title || 'Untitled task'}
                        </h4>
                        <div className="space-y-1 text-xs text-[var(--fg-muted)]">
                          {project && <div>Project: {project.name}</div>}
                          {t.assignedAt && <div>Assigned: {formatDate(t.assignedAt)}</div>}
                          {t.deadline && <div>Due: {formatDate(t.deadline)}</div>}
                        </div>
                        {t.deadline && new Date(t.deadline) < new Date() && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            <span className="font-medium">Overdue</span>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                  {displayedTasks.filter(t => t.status === 'IN_PROGRESS').length === 0 && (
                    <div className="text-center py-8 text-[var(--fg-muted)] text-sm border-2 border-dashed border-[var(--border)] rounded-lg">
                      No tasks in progress
                    </div>
                  )}
                </div>
              </div>

              {/* Completed Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <h3 className="font-medium text-[var(--fg)]">Completed</h3>
                  <span className="text-xs text-[var(--fg-muted)] bg-[var(--muted)] px-2 py-1 rounded-full">
                    {displayedTasks.filter(t => t.status === 'COMPLETED').length}
                  </span>
                </div>
                <div className="space-y-3 min-h-[200px]">
                  {displayedTasks.filter(t => t.status === 'COMPLETED').map((t) => {
                    const project = projects.find((p) => p.id === t.projectId);
                    return (
                      <Link
                        key={t.id}
                        to={`/admin/projects/${t.projectId}`}
                        className="block rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 hover:border-[var(--accent)] hover:shadow-sm transition-colors opacity-75"
                      >
                        <h4 className="font-medium text-[var(--fg)] mb-2 text-sm line-through">
                          {t.title || 'Untitled task'}
                        </h4>
                        <div className="space-y-1 text-xs text-[var(--fg-muted)]">
                          {project && <div>Project: {project.name}</div>}
                          {t.assignedAt && <div>Assigned: {formatDate(t.assignedAt)}</div>}
                          {t.deadline && <div>Due: {formatDate(t.deadline)}</div>}
                        </div>
                      </Link>
                    );
                  })}
                  {displayedTasks.filter(t => t.status === 'COMPLETED').length === 0 && (
                    <div className="text-center py-8 text-[var(--fg-muted)] text-sm border-2 border-dashed border-[var(--border)] rounded-lg">
                      No completed tasks
                    </div>
                  )}
                </div>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                <span className="text-sm text-[var(--fg-muted)]">
                  Page {clampedPage} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setTasksCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={clampedPage <= 1}
                    className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] hover:bg-[var(--muted)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTasksCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={clampedPage >= totalPages}
                    className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] hover:bg-[var(--muted)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
      )}
    </div>
  );
}
