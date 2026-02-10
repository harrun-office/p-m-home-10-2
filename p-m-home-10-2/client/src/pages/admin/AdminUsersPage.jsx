import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Eye, X, User, Building2, ListTodo, Search, Users, UserCheck, UserX, Filter, CalendarClock, CheckCircle2, Plus, Edit, Trash2, ChevronDown } from 'lucide-react';
import { useDataStore } from '../../store/dataStore.jsx';
import { getSession } from '../../store/sessionStore.js';
import { countOpenTasksByUser, countProjectsByUser } from '../../utils/users.js';
import { todayKey, toLocalDayKey, addDaysToLocalKey } from '../../utils/date.js';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { ResponsiveDataGrid } from '../../components/ui/DataCard.jsx';
import { ActionMenu } from '../../components/ui/ActionMenu.jsx';

function getInitial(name) {
  return (name || '?').charAt(0).toUpperCase();
}

function isToday(isoDateStr) {
  if (!isoDateStr) return false;
  const d = new Date(isoDateStr);
  const today = new Date();
  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
}

/**
 * Admin Employees: list, search/filter, activate/deactivate, workload summary.
 * Guard: session required, role ADMIN; else redirect /login or /app.
 */
export function AdminUsersPage() {
  const navigate = useNavigate();
  const { state, setUserActive, createUser, updateUser, deleteUser } = useDataStore();
  const session = getSession();
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [dateFilterCustomStart, setDateFilterCustomStart] = useState('');
  const [dateFilterCustomEnd, setDateFilterCustomEnd] = useState('');


  useEffect(() => {
    if (!session) {
      navigate('/login', { replace: true });
      return;
    }
    if (session.role !== 'ADMIN') {
      navigate('/app', { replace: true });
    }
  }, [session, navigate]);

  const users = (state.users || []).filter((u) => u.role !== 'ADMIN');
  const tasks = state.tasks || [];
  const projects = state.projects || [];

  const filteredUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) return [];

    let list = users;
    const q = (search || '').trim().toLowerCase();
    if (q) {
      list = list.filter(
        (u) =>
          (u?.name && u.name.toLowerCase().includes(q)) ||
          (u?.email && u.email.toLowerCase().includes(q)) ||
          (u?.employeeId && u.employeeId.toLowerCase().includes(q))
      );
    }
    if (filterDept) list = list.filter((u) => u?.department === filterDept);
    if (filterStatus === 'active') list = list.filter((u) => u?.isActive !== false);
    if (filterStatus === 'inactive') list = list.filter((u) => u?.isActive === false);
    return list;
  }, [users, search, filterDept, filterStatus]);

  const today = todayKey();
  const tasksInDateRange = useMemo(() => {
    if (dateFilter === 'all') return tasks;
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
    } else {
      return tasks;
    }
    const inRange = (key) => key && key >= startKey && key <= endKey;
    return tasks.filter((t) => {
      const assignedKey = t.assignedAt ? toLocalDayKey(t.assignedAt) : '';
      const deadlineKey = t.deadline ? toLocalDayKey(t.deadline) : '';
      return inRange(assignedKey) || inRange(deadlineKey);
    });
  }, [tasks, dateFilter, dateFilterCustomStart, dateFilterCustomEnd, today]);

  const projectsInDateRange = useMemo(() => {
    if (dateFilter === 'all') return projects;
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
    } else {
      return projects;
    }
    const inRange = (key) => key && key >= startKey && key <= endKey;
    return projects.filter((p) => {
      const startKeyP = p.startDate ? toLocalDayKey(p.startDate) : '';
      const endKeyP = p.endDate ? toLocalDayKey(p.endDate) : '';
      return inRange(startKeyP) || inRange(endKeyP);
    });
  }, [projects, dateFilter, dateFilterCustomStart, dateFilterCustomEnd, today]);

  function handleToggleActive(user) {
    if (user.id === session?.userId) return;
    setUserActive(user.id, !user.isActive);
  }

  function handleDeleteUser(user) {
    if (user.id === session?.userId) return;
    if (window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      deleteUser(user.id);
    }
  }

  if (!session) return null;
  if (session.role !== 'ADMIN') return null;

  // Add loading state check
  if (!state.users) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  const projectById = useMemo(() => {
    const m = new Map();
    (projects || []).forEach((p) => m.set(p.id, p));
    return m;
  }, [projects]);

  const allTasksForUser = (userId) =>
    (tasks || []).filter((t) => t.assigneeId === userId);
  const assignedProjectsForUser = (userId) =>
    (projects || []).filter((p) => p.assignedUserIds && p.assignedUserIds.includes(userId));

  const hasActiveFilters = search.trim() || filterDept || filterStatus || dateFilter !== 'all' || (dateFilter === 'custom' && (dateFilterCustomStart || dateFilterCustomEnd));
  const activeCount = users.filter((u) => u.isActive !== false).length;
  const inactiveCount = users.filter((u) => u.isActive === false).length;
  const devCount = users.filter((u) => u.department === 'DEV').length;
  const testerCount = users.filter((u) => u.department === 'TESTER').length;
  const presalesCount = users.filter((u) => u.department === 'PRESALES').length;

  const clearFilters = () => {
    setSearch('');
    setFilterDept('');
    setFilterStatus('');
    setDateFilter('all');
    setDateFilterCustomStart('');
    setDateFilterCustomEnd('');
  };

  const statCards = [
    { label: 'Total', value: users.length, icon: Users, bg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: 'DEV', value: devCount, icon: Building2, bg: 'bg-cyan-50', iconColor: 'text-cyan-600' },
    { label: 'TESTER', value: testerCount, icon: Building2, bg: 'bg-purple-50', iconColor: 'text-purple-600' },
    { label: 'PRESALES', value: presalesCount, icon: Building2, bg: 'bg-teal-50', iconColor: 'text-teal-600' },
    { label: 'Active', value: activeCount, icon: UserCheck, bg: 'bg-green-50', iconColor: 'text-green-600' },
    { label: 'Inactive', value: inactiveCount, icon: UserX, bg: 'bg-red-50', iconColor: 'text-red-600' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">

      {/* Stats strip: Total, DEV, TESTER, PRESALES, Active, Inactive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {statCards.map(({ label, value, icon: Icon, bg, iconColor }) => (
          <Card key={label} padding="p-4" className="flex items-center gap-4">
            <span className={`flex items-center justify-center w-12 h-12 rounded-xl shrink-0 ${bg} ${iconColor}`}>
              <Icon className="w-6 h-6" aria-hidden />
            </span>
            <div>
              <p className="text-2xl font-bold tabular-nums text-gray-900">{value}</p>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">{label}</p>
            </div>
          </Card>
        ))}
        {hasActiveFilters && (
          <Card padding="p-4" className="flex items-center gap-4 col-span-2 sm:col-span-3 lg:col-span-1">
            <span className="text-2xl font-bold tabular-nums text-[var(--primary-muted-fg)]">{filteredUsers.length}</span>
            <div>
              <p className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wider">Results</p>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-1 h-auto py-0.5 text-xs">
                Clear filters
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Search & filters */}
      <section aria-labelledby="filters-heading">
        <Card>
          <h2 id="filters-heading" className="flex items-center gap-2 text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
            <Filter className="w-4 h-4 text-[var(--fg-muted)]" aria-hidden />
            Search & filter
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <label htmlFor="users-search" className="block text-xs font-medium text-gray-600 mb-1.5">
                Name, email or employee ID
              </label>
              <Input
                id="users-search"
                type="search"
                placeholder="Search by name, email or employee ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={Search}
              />
            </div>
            <div>
              <label htmlFor="users-dept" className="block text-xs font-medium text-gray-600 mb-1.5">
                Department
              </label>
              <Select id="users-dept" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                <option value="">All</option>
                <option value="DEV">DEV</option>
                <option value="PRESALES">PRESALES</option>
                <option value="TESTER">TESTER</option>
              </Select>
            </div>
            <div>
              <label htmlFor="users-status" className="block text-xs font-medium text-gray-600 mb-1.5">
                Status
              </label>
              <Select id="users-status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="users-date-filter" className="block text-xs font-medium text-gray-600">
                Date range (Tasks & Projects)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  id="users-date-filter"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="min-w-[140px]"
                  aria-label="Filter tasks and projects by date"
                >
                  <option value="all">All time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Last 7 days</option>
                  <option value="month">Last 30 days</option>
                  <option value="custom">Custom range</option>
                </Select>
                {dateFilter === 'custom' && (
                  <>
                    <Input
                      type="date"
                      value={dateFilterCustomStart}
                      onChange={(e) => setDateFilterCustomStart(e.target.value)}
                      aria-label="From date"
                      className="min-w-[130px]"
                    />
                    <span className="text-[var(--fg-muted)] text-sm">to</span>
                    <Input
                      type="date"
                      value={dateFilterCustomEnd}
                      onChange={(e) => setDateFilterCustomEnd(e.target.value)}
                      aria-label="To date"
                      className="min-w-[130px]"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Team members list */}
      <section aria-labelledby="team-list-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="team-list-heading" className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Users className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden />
            {hasActiveFilters ? `Results (${filteredUsers.length})` : 'All team members'}
          </h2>
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <span className="text-sm text-gray-600">
                {filteredUsers.length} of {users.length} shown
              </span>
            )}
            <Button
              variant="primary"
              size="sm"
              leftIcon={Plus}
              onClick={() => setIsCreateModalOpen(true)}
              aria-label="Add new employee"
            >
              Add Employee
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden border-0 hover:border-0">
          <ResponsiveDataGrid
            data={filteredUsers || []}
            columns={[
              {
                key: 'name',
                label: 'Member',
                align: 'left',
                width: '26%',
                render: (user) => (
                  <div className="flex flex-col items-start justify-center gap-0.5 text-left min-w-0">
                    <p className="font-medium text-gray-900 truncate w-full">{user.name || '—'}</p>
                    <p className="text-xs text-gray-600 truncate w-full">{user.email || '—'}</p>
                  </div>
                )
              },
              {
                key: 'employeeId',
                label: 'Employee ID',
                align: 'center',
                width: '12%',
                render: (user) => (
                  <span className="font-mono text-sm font-medium text-[var(--fg)]">
                    {user.employeeId || '—'}
                  </span>
                )
              },
              {
                key: 'department',
                label: 'Department',
                align: 'center',
                width: '10%',
                render: (user) => (
                  <span className="text-gray-900">{user.department || '—'}</span>
                )
              },
              {
                key: 'status',
                label: 'Status',
                align: 'center',
                width: '10%',
                render: (user) => (
                  <Badge variant={user.isActive !== false ? 'success' : 'neutral'}>
                    {user.isActive !== false ? 'Active' : 'Inactive'}
                  </Badge>
                )
              },
              {
                key: 'tasks',
                label: 'Tasks',
                align: 'center',
                width: '8%',
                render: (user) => countOpenTasksByUser(user.id, tasksInDateRange)
              },
              {
                key: 'projects',
                label: 'Projects',
                align: 'center',
                width: '8%',
                render: (user) => countProjectsByUser(user.id, projectsInDateRange)
              },
              {
                key: 'actions',
                label: 'Actions',
                align: 'center',
                width: '10%',
                render: (user) => {
                  const isCurrentUser = user.id === session.userId;
                  const actions = [
                    { id: 'view', label: 'View', icon: Eye, onClick: () => navigate(`/admin/users/${user.id}`) },
                    { id: 'edit', label: 'Edit', icon: Edit, onClick: () => setEditingUser(user) },
                    {
                      id: 'toggle',
                      label: user.isActive !== false ? 'Deactivate' : 'Activate',
                      icon: user.isActive !== false ? UserX : UserCheck,
                      onClick: () => handleToggleActive(user),
                      disabled: isCurrentUser
                    },
                    { type: 'divider' },
                    {
                      id: 'delete',
                      label: 'Delete',
                      icon: Trash2,
                      onClick: () => handleDeleteUser(user),
                      destructive: true,
                      disabled: isCurrentUser
                    }
                  ];
                  return (
                    <div className="flex justify-center">
                      <ActionMenu
                        trigger={
                          <Button variant="outline" size="sm" rightIcon={ChevronDown} className="min-w-[5.5rem]">
                            Actions
                          </Button>
                        }
                        actions={actions}
                        disabled={false}
                      />
                    </div>
                  );
                }
              }
            ]}

            emptyState={
              <EmptyState
                title={users.length === 0 ? 'No team members yet' : 'No results match your filters'}
                message={
                  users.length === 0
                    ? 'Add team members to start assigning tasks and managing projects.'
                    : 'Try adjusting your search terms or clearing filters to see more team members.'
                }
                actionLabel={users.length > 0 ? 'Clear filters' : 'Add Team Member'}
                onAction={users.length > 0 ? clearFilters : () => setIsCreateModalOpen(true)}
                icon={Users}
              />
            }
          />
        </Card>
      </section>

      {selectedUser && (() => {
        const userProjects = assignedProjectsForUser(selectedUser.id);
        const userTasks = [...allTasksForUser(selectedUser.id)].sort(
          (a, b) => (b.assignedAt ? new Date(b.assignedAt).getTime() : 0) - (a.assignedAt ? new Date(a.assignedAt).getTime() : 0)
        );
        const completedProjects = userProjects.filter((p) => p.status === 'COMPLETED');
        const tasksDueToday = userTasks.filter((t) => isToday(t.deadline));
        const profileRows = [
          { label: 'Name', value: selectedUser.name || '—' },
          { label: 'Email', value: selectedUser.email || '—' },
          { label: 'Employee ID', value: selectedUser.employeeId || '—', mono: true },
          { label: 'Department', value: selectedUser.department || '—' },
          { label: 'Personal Number', value: selectedUser.personalNumber || '—' },
          { label: 'Status', value: selectedUser.isActive !== false ? 'Active' : 'Inactive' },
        ];
        return createPortal(
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6"
            aria-modal="true"
            role="dialog"
            aria-labelledby="employee-detail-title"
          >
            <div
              className="absolute inset-0 bg-[var(--backdrop)] backdrop-blur-sm"
              onClick={() => setSelectedUser(null)}
              aria-hidden
            />
            <div
              className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-2xl)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 shrink-0 px-6 py-5 border-b border-[var(--border)] bg-[var(--card)] rounded-t-2xl">
                <div className="flex items-start gap-4 min-w-0">
                  <span
                    className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--primary-muted)] text-[var(--primary-muted-fg)] font-bold text-xl shrink-0"
                    aria-hidden
                  >
                    {getInitial(selectedUser.name)}
                  </span>
                  <div className="min-w-0">
                    <h2 id="employee-detail-title" className="text-xl font-bold text-[var(--fg)]">
                      {selectedUser.name || 'Unnamed'}
                    </h2>
                    <p className="text-sm text-[var(--fg-muted)] mt-0.5 truncate">{selectedUser.email || '—'}</p>
                    <p className="text-xs text-[var(--fg-muted)] mt-1">Full profile and workload</p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--muted)] px-3 py-1.5 text-xs font-medium text-[var(--fg)]">
                        <Building2 className="w-3.5 h-3.5 text-[var(--fg-muted)]" aria-hidden />
                        {userProjects.length} project{userProjects.length !== 1 ? 's' : ''}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--muted)] px-3 py-1.5 text-xs font-medium text-[var(--fg)]">
                        <ListTodo className="w-3.5 h-3.5 text-[var(--fg-muted)]" aria-hidden />
                        {userTasks.length} task{userTasks.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex items-center justify-center w-10 h-10 rounded-xl text-[var(--fg-muted)] hover:bg-[var(--muted)] hover:text-[var(--fg)] transition-colors shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" aria-hidden />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6 space-y-8 min-h-0">
                {/* Profile — clear key-value table */}
                <section aria-labelledby="profile-heading">
                  <h3 id="profile-heading" className="flex items-center gap-2 text-base font-semibold text-[var(--fg)] mb-4">
                    <User className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden />
                    Profile information
                  </h3>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                    <table className="min-w-full" role="presentation">
                      <tbody className="divide-y divide-[var(--border)]">
                        {profileRows.map((row) => (
                          <tr key={row.label} className="hover:bg-[var(--muted)]/30 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-[var(--fg-muted)] w-36 shrink-0 align-top">
                              {row.label}
                            </td>
                            <td className="px-4 py-3 text-sm text-[var(--fg)] align-top">
                              {row.mono ? (
                                <code className="text-xs font-mono text-[var(--fg-muted)] break-all" title={row.value}>
                                  {row.value}
                                </code>
                              ) : (
                                row.value
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Tasks due today */}
                <section aria-labelledby="tasks-due-today-heading">
                  <h3 id="tasks-due-today-heading" className="flex items-center gap-2 text-base font-semibold text-[var(--fg)] mb-4">
                    <CalendarClock className="w-5 h-5 text-[var(--warning-muted-fg)] shrink-0" aria-hidden />
                    Tasks due today
                    <span className="text-sm font-normal text-[var(--fg-muted)]">({tasksDueToday.length})</span>
                  </h3>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                    {tasksDueToday.length === 0 ? (
                      <p className="px-5 py-6 text-sm text-[var(--fg-muted)]">No tasks due today.</p>
                    ) : (
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                            <th className="px-4 py-3 text-left font-semibold text-[var(--fg-secondary)]">Task</th>
                            <th className="px-4 py-3 text-left font-semibold text-[var(--fg-secondary)]">Project</th>
                            <th className="px-4 py-3 text-left font-semibold text-[var(--fg-secondary)]">Status</th>
                            <th className="px-4 py-3 text-left font-semibold text-[var(--fg-secondary)]">Priority</th>
                            <th className="px-4 py-3 text-left font-semibold text-[var(--fg-secondary)]">Due</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {tasksDueToday.map((t) => (
                            <tr key={t.id} className="hover:bg-[var(--muted)]/30">
                              <td className="px-4 py-3 font-medium text-[var(--fg)]">{t.title}</td>
                              <td className="px-4 py-3 text-[var(--fg-secondary)]">{projectById.get(t.projectId)?.name || '—'}</td>
                              <td className="px-4 py-3">
                                <Badge variant={t.status === 'COMPLETED' ? 'success' : t.status === 'IN_PROGRESS' ? 'info' : 'neutral'}>
                                  {t.status === 'TODO' ? 'To Do' : t.status === 'IN_PROGRESS' ? 'In Progress' : 'Completed'}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-[var(--fg-muted)]">{t.priority || '—'}</td>
                              <td className="px-4 py-3 text-[var(--fg-muted)]">
                                {t.deadline ? new Date(t.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </section>

                {/* Completed projects */}
                <section aria-labelledby="completed-projects-heading">
                  <h3 id="completed-projects-heading" className="flex items-center gap-2 text-base font-semibold text-[var(--fg)] mb-4">
                    <CheckCircle2 className="w-5 h-5 text-[var(--success-muted-fg)] shrink-0" aria-hidden />
                    Completed projects
                    <span className="text-sm font-normal text-[var(--fg-muted)]">({completedProjects.length})</span>
                  </h3>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                    {completedProjects.length === 0 ? (
                      <p className="px-5 py-6 text-sm text-[var(--fg-muted)]">No completed projects.</p>
                    ) : (
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                            <th className="px-4 py-3 text-left font-semibold text-[var(--fg-secondary)]">Project name</th>
                            <th className="px-4 py-3 text-left font-semibold text-[var(--fg-secondary)]">Start — End</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {completedProjects.map((p) => (
                            <tr key={p.id} className="hover:bg-[var(--muted)]/30">
                              <td className="px-4 py-3 font-medium text-[var(--fg)]">{p.name}</td>
                              <td className="px-4 py-3 text-[var(--fg-muted)]">
                                {p.startDate ? new Date(p.startDate).toLocaleDateString() : '—'}
                                {' — '}
                                {p.endDate ? new Date(p.endDate).toLocaleDateString() : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </section>

                {/* Assigned projects — table with headers */}
                <section aria-labelledby="projects-heading">
                  <h3 id="projects-heading" className="flex items-center gap-2 text-base font-semibold text-[var(--fg)] mb-4">
                    <Building2 className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden />
                    All assigned projects
                    <span className="text-sm font-normal text-[var(--fg-muted)]">({userProjects.length})</span>
                  </h3>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                    {userProjects.length === 0 ? (
                      <p className="px-5 py-6 text-sm text-[var(--fg-muted)]">No projects assigned to this user.</p>
                    ) : (
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                            <th className="px-4 py-3 text-left font-semibold text-[var(--fg-secondary)]">Project name</th>
                            <th className="px-4 py-3 text-left font-semibold text-[var(--fg-secondary)]">Status</th>
                            <th className="px-4 py-3 text-left font-semibold text-[var(--fg-secondary)]">Start — End</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {userProjects.map((p) => (
                            <tr key={p.id} className="hover:bg-[var(--muted)]/30">
                              <td className="px-4 py-3 font-medium text-[var(--fg)]">{p.name}</td>
                              <td className="px-4 py-3">
                                <Badge variant={p.status === 'ACTIVE' ? 'success' : p.status === 'ON_HOLD' ? 'warning' : 'neutral'}>
                                  {p.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-[var(--fg-muted)]">
                                {p.startDate ? new Date(p.startDate).toLocaleDateString() : '—'}
                                {' — '}
                                {p.endDate ? new Date(p.endDate).toLocaleDateString() : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </section>

                {/* All tasks — table with clear headers */}
                <section aria-labelledby="tasks-heading" className="border-t border-[var(--border)] pt-8">
                  <h3 id="tasks-heading" className="flex items-center gap-2 text-base font-semibold text-[var(--fg)] mb-1">
                    <ListTodo className="w-5 h-5 text-[var(--accent)] shrink-0" aria-hidden />
                    All assigned tasks
                    <span className="text-sm font-normal text-[var(--fg-muted)]">({userTasks.length})</span>
                  </h3>
                  <p className="text-sm text-[var(--fg-muted)] mb-3">
                    {userTasks.length > 0
                      ? 'Scroll the table below to see every task. Columns: task name, project, status, priority, assigned date, due date.'
                      : 'Task name, project, status, priority, and dates.'}
                  </p>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                    {userTasks.length === 0 ? (
                      <p className="px-5 py-6 text-sm text-[var(--fg-muted)]">No tasks assigned to this user.</p>
                    ) : (
                      <div className="max-h-80 overflow-y-auto">
                        <table className="text-xs border-collapse w-full" role="table">
                          <thead className="sticky top-0 z-10 bg-[var(--muted)] border-b-2 border-[var(--border)]">
                            <tr>
                              <th scope="col" className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)]">
                                Task
                              </th>
                              <th scope="col" className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)]">
                                Project
                              </th>
                              <th scope="col" className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)]">
                                Status
                              </th>
                              <th scope="col" className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)]">
                                Priority
                              </th>
                              <th scope="col" className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)]">
                                Assigned
                              </th>
                              <th scope="col" className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[var(--fg-secondary)]">
                                Due
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border)] bg-[var(--card)]">
                            {userTasks.map((t) => (
                              <tr key={t.id} className="hover:bg-[var(--muted)]/30">
                                <td className="px-2 py-2 font-medium text-[var(--fg)] align-top max-w-[200px] truncate" title={t.title}>
                                  {t.title}
                                </td>
                                <td className="px-2 py-2 text-[var(--fg-secondary)] align-top max-w-[120px] truncate" title={projectById.get(t.projectId)?.name || '—'}>
                                  {projectById.get(t.projectId)?.name || '—'}
                                </td>
                                <td className="px-2 py-2 align-top">
                                  <Badge variant={t.status === 'COMPLETED' ? 'success' : t.status === 'IN_PROGRESS' ? 'info' : 'neutral'} className="text-xs">
                                    {t.status === 'TODO' ? 'To Do' : t.status === 'IN_PROGRESS' ? 'In Progress' : 'Completed'}
                                  </Badge>
                                </td>
                                <td className="px-2 py-2 text-[var(--fg-muted)] align-top text-xs">{t.priority || '—'}</td>
                                <td className="px-2 py-2 text-[var(--fg-muted)] align-top text-xs">
                                  {t.assignedAt ? new Date(t.assignedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                </td>
                                <td className="px-2 py-2 text-[var(--fg-muted)] align-top text-xs">
                                  {t.deadline ? new Date(t.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* Create/Edit User Modal */}
      {(isCreateModalOpen || editingUser) && (
        <UserFormModal
          user={editingUser}
          isOpen={isCreateModalOpen || !!editingUser}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingUser(null);
          }}
          onSave={(userData) => {
            if (editingUser) {
              updateUser(editingUser.id, userData);
            } else {
              createUser(userData);
            }
            setIsCreateModalOpen(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}

function UserFormModal({ user, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || 'DEV',
    employeeId: user?.employeeId || '',
    personalNumber: user?.personalNumber || '',
    password: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        department: user.department || 'DEV',
        employeeId: user.employeeId || '',
        personalNumber: user.personalNumber || '',
        password: '',
        confirmPassword: '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        department: 'DEV',
        employeeId: '',
        personalNumber: '',
        password: '',
        confirmPassword: '',
      });
    }
    setPasswordError('');
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!user) {
      if (!formData.password || formData.password.length < 6) {
        setPasswordError('Password must be at least 6 characters.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setPasswordError('Password and Confirm password do not match.');
        return;
      }
    } else if (formData.password || formData.confirmPassword) {
      if (formData.password.length < 6) {
        setPasswordError('New password must be at least 6 characters.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setPasswordError('New password and Confirm do not match.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const { password, confirmPassword, ...rest } = formData;
      const userData = { ...rest, role: 'EMPLOYEE' };
      if (!user) {
        userData.password = password;
      } else if (password) {
        userData.password = password;
      }
      await onSave(userData);
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const fieldClass = 'space-y-1.5';
  const labelClass = 'block text-sm font-medium text-[var(--fg)]';

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-[var(--backdrop)] backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-2xl)] flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
          <h2 className="text-lg font-semibold text-[var(--fg)]">
            {user ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-[var(--radius)] text-[var(--fg-muted)] hover:bg-[var(--muted)] hover:text-[var(--fg)] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Basic info */}
            <section className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                Basic information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={fieldClass}>
                  <label htmlFor="user-name" className={labelClass}>Full name</label>
                  <Input
                    id="user-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>
                <div className={fieldClass}>
                  <label htmlFor="user-email" className={labelClass}>Email</label>
                  <Input
                    id="user-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@company.com"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={fieldClass}>
                  <label htmlFor="user-employeeId" className={labelClass}>Employee ID</label>
                  <Input
                    id="user-employeeId"
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="Auto-generated if blank"
                  />
                </div>
                <div className={fieldClass}>
                  <label htmlFor="user-department" className={labelClass}>Department</label>
                  <Select
                    id="user-department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    <option value="DEV">Development</option>
                    <option value="PRESALES">Presales</option>
                    <option value="TESTER">Testing</option>
                  </Select>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                Contact
              </h3>
              <div className={fieldClass}>
                <label htmlFor="user-personalNumber" className={labelClass}>Personal number</label>
                <Input
                  id="user-personalNumber"
                  type="tel"
                  value={formData.personalNumber}
                  onChange={(e) => setFormData({ ...formData, personalNumber: e.target.value })}
                  placeholder="e.g. +1 234 567 8900"
                />
              </div>
            </section>

            {/* Login password */}
            <section className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                {user ? 'Change password' : 'Login password'}
              </h3>
              {!user ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={fieldClass}>
                      <label htmlFor="user-password" className={labelClass}>
                        Password <span className="text-[var(--danger)]">*</span>
                      </label>
                      <Input
                        id="user-password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Min 6 characters"
                        minLength={6}
                        autoComplete="new-password"
                      />
                    </div>
                    <div className={fieldClass}>
                      <label htmlFor="user-confirmPassword" className={labelClass}>
                        Confirm password <span className="text-[var(--danger)]">*</span>
                      </label>
                      <Input
                        id="user-confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-[var(--fg-muted)]">
                    Employee will use this password with their email to sign in.
                  </p>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={fieldClass}>
                      <label htmlFor="user-newPassword" className={labelClass}>New password</label>
                      <Input
                        id="user-newPassword"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Leave blank to keep current"
                        minLength={6}
                        autoComplete="new-password"
                      />
                    </div>
                    <div className={fieldClass}>
                      <label htmlFor="user-confirmNewPassword" className={labelClass}>Confirm new password</label>
                      <Input
                        id="user-confirmNewPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="Re-enter if changing"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </>
              )}
            </section>

            {passwordError && (
              <div className="rounded-[var(--radius)] bg-[var(--danger-muted)]/50 border border-[var(--danger)]/30 px-3 py-2" role="alert">
                <p className="text-sm text-[var(--danger)]">{passwordError}</p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--bg)]/50 flex items-center justify-end gap-3 shrink-0 rounded-b-2xl">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (user ? 'Update Employee' : 'Add Employee')}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
