import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore.jsx';
import { getSession } from '../../store/sessionStore.js';
import { todayKey, toDayKey } from '../../utils/date.js';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { MotionPage } from '../../components/motion/MotionPage.jsx';
import { motion } from 'framer-motion';
import { KanbanBoard } from '../../components/admin/tasks/KanbanBoard.jsx';
import { TaskTable } from '../../components/admin/tasks/TaskTable.jsx';
import { TaskModal } from '../../components/admin/tasks/TaskModal.jsx';
import { Search, X, Filter, ChevronDown, ChevronUp, Columns3, Table, Plus } from 'lucide-react';

const VIEW_KANBAN = 'kanban';
const VIEW_TABLE = 'table';

/**
 * Admin global tasks: filters (Project, Assignee, Status, Priority), view toggle Kanban | Table.
 * Create/Edit/Move via DataStore. Read-only per task when project is ON_HOLD or COMPLETED.
 */
export function AdminTasksPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { state, moveTaskStatus, deleteTask } = useDataStore();
  const session = getSession();
  const [view, setView] = useState(VIEW_KANBAN);
  const [filterProject, setFilterProject] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterDateStart, setFilterDateStart] = useState(''); // From date
  const [filterDateEnd, setFilterDateEnd] = useState(''); // To date
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Sync overdue filter from URL (e.g. /admin/tasks?filter=overdue from dashboard)
  useEffect(() => {
    const filter = searchParams.get('filter');
    setFilterOverdue(filter === 'overdue');
  }, [searchParams]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingTask, setEditingTask] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!session) navigate('/login', { replace: true });
  }, [session, navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }

      // Ctrl/Cmd + K or F: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-tasks')?.focus();
      } else if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        document.getElementById('search-tasks')?.focus();
      }

      // C: Create new task
      if (e.key === 'c' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleCreateTask();
      }

      // Esc: Clear search if focused
      if (e.key === 'Escape' && document.activeElement?.id === 'search-tasks') {
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const tasks = state.tasks || [];
  const projects = state.projects || [];
  const users = (state.users || []).filter((u) => u.isActive !== false);
  const sessionForRepo = session ? { userId: session.userId, role: session.role } : null;

  // Create a map of user IDs to departments for quick lookup
  const userDepartmentMap = useMemo(() => {
    const map = new Map();
    users.forEach((u) => {
      if (u.department) map.set(u.id, u.department);
    });
    return map;
  }, [users]);

  const filteredTasks = useMemo(() => {
    let list = tasks;

    // Apply search filter first
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter((task) => {
        const searchableText = [
          task.title,
          task.description,
          users.find(u => u.id === task.assigneeId)?.name,
          projects.find(p => p.id === task.projectId)?.name,
          ...(task.tags || [])
        ].filter(Boolean).join(' ').toLowerCase();

        return searchableText.includes(query);
      });
    }

    // Apply other filters
    if (filterOverdue) {
      const now = new Date();
      list = list.filter(
        (t) => t.status !== 'COMPLETED' && t.deadline && new Date(t.deadline) < now
      );
    }
    if (filterProject) list = list.filter((t) => t.projectId === filterProject);
    if (filterAssignee) list = list.filter((t) => t.assigneeId === filterAssignee);
    if (filterStatus) list = list.filter((t) => t.status === filterStatus);
    if (filterPriority) list = list.filter((t) => t.priority === filterPriority);
    if (filterDepartment) {
      list = list.filter((t) => {
        const assigneeDepartment = userDepartmentMap.get(t.assigneeId);
        return assigneeDepartment === filterDepartment;
      });
    }
    if (filterDateStart || filterDateEnd) {
      list = list.filter((t) => {
        if (!t.assignedAt) return false;
        const key = toDayKey(t.assignedAt);
        if (filterDateStart && key < filterDateStart) return false;
        if (filterDateEnd && key > filterDateEnd) return false;
        return true;
      });
    }
    return list;
  }, [tasks, projects, users, searchQuery, filterOverdue, filterProject, filterAssignee, filterStatus, filterPriority, filterDateStart, filterDateEnd, filterDepartment, userDepartmentMap]);

  const getTaskReadOnly = useMemo(() => {
    const projectMap = new Map(projects.map((p) => [p.id, p]));
    return (task) => {
      const project = projectMap.get(task.projectId);
      return project && (project.status === 'ON_HOLD' || project.status === 'COMPLETED');
    };
  }, [projects]);

  /** Stable display ID: "Task 1", "Task 2", ... by creation order. */
  const getTaskDisplayId = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '') || (a.id || '').localeCompare(b.id || ''));
    const indexById = new Map(sorted.map((t, i) => [t.id, i + 1]));
    return (task) => `Task ${indexById.get(task.id) ?? '—'}`;
  }, [tasks]);

  function canDeleteTask(task) {
    if (!session) return false;
    if (getTaskReadOnly(task)) return false;
    return session.role === 'ADMIN' || task.createdById === session.userId;
  }

  function handleDeleteTask(task) {
    if (!session) return;
    if (!window.confirm(`Delete task "${task.title}"? This cannot be undone.`)) return;
    const result = deleteTask(task.id, session);
    if (!result.ok) showToast({ title: 'Error', message: result.error || 'Could not delete task' });
    else showToast({ title: 'Deleted', message: 'Task removed.' });
  }

  function handleCreateTask() {
    setModalMode('create');
    setEditingTask(null);
    setModalOpen(true);
  }

  function handleEditTask(task) {
    setModalMode('edit');
    setEditingTask(task);
    setModalOpen(true);
  }

  function handleMoveStatus(taskId, newStatus) {
    if (!sessionForRepo) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || getTaskReadOnly(task)) return;
    moveTaskStatus(taskId, newStatus, sessionForRepo);
  }

  function handleAssigneeNotify(message) {
    if (message) showToast({ title: 'Notification', message });
  }

  function handleSelectTask(taskId, selected) {
    const newSelected = new Set(selectedTasks);
    if (selected) {
      newSelected.add(taskId);
    } else {
      newSelected.delete(taskId);
    }
    setSelectedTasks(newSelected);
  }

  function handleSelectAll(selected) {
    if (selected) {
      setSelectedTasks(new Set(filteredTasks.map(t => t.id)));
    } else {
      setSelectedTasks(new Set());
    }
  }

  function handleBulkStatusChange(newStatus) {
    if (selectedTasks.size === 0) return;

    selectedTasks.forEach(taskId => {
      const task = tasks.find(t => t.id === taskId);
      if (task && !getTaskReadOnly(task)) {
        moveTaskStatus(taskId, newStatus, sessionForRepo);
      }
    });

    setSelectedTasks(new Set());
    showToast({
      title: 'Bulk Update',
      message: `Updated ${selectedTasks.size} task${selectedTasks.size > 1 ? 's' : ''} to ${newStatus === 'TODO' ? 'To Do' : newStatus === 'IN_PROGRESS' ? 'In Progress' : 'Completed'}`
    });
  }

  function clearSelection() {
    setSelectedTasks(new Set());
  }

  function handleNavigateToProject(projectId) {
    navigate(`/admin/projects/${projectId}`);
  }

  function applyFilterPreset(preset) {
    switch (preset) {
      case 'my-tasks':
        setFilterAssignee(session?.userId || '');
        setFilterProject('');
        setFilterStatus('');
        setFilterPriority('');
        setFilterDate(todayKey());
        break;
      case 'overdue-tasks':
        setFilterOverdue(true);
        setSearchParams({ filter: 'overdue' }, { replace: true });
        setFilterAssignee('');
        setFilterProject('');
        setFilterStatus('');
        setFilterPriority('');
        setFilterDate('');
        break;
      case 'overdue':
      case 'high-priority':
        setFilterAssignee('');
        setFilterProject('');
        setFilterStatus('');
        setFilterPriority('HIGH');
        setFilterDate('');
        break;
      case 'this-week':
        setFilterAssignee('');
        setFilterProject('');
        setFilterStatus('');
        setFilterPriority('');
        setFilterDate(todayKey());
        break;
      case 'clear-all':
        setFilterOverdue(false);
        setFilterProject('');
        setFilterAssignee('');
        setFilterStatus('');
        setFilterPriority('');
        setFilterDepartment('');
        setFilterDateStart('');
        setFilterDateEnd('');
        setSearchQuery('');
        searchParams.delete('filter');
        setSearchParams(searchParams, { replace: true });
        break;
    }
  }

  function getActiveFilterCount() {
    let count = 0;
    if (filterOverdue) count++;
    if (filterProject) count++;
    if (filterAssignee) count++;
    if (filterStatus) count++;
    if (filterPriority) count++;
    if (filterDepartment) count++;
    if (filterDateStart || filterDateEnd) count++;
    if (searchQuery.trim()) count++;
    return count;
  }

  function clearOverdueFilter() {
    setFilterOverdue(false);
    searchParams.delete('filter');
    setSearchParams(searchParams, { replace: true });
  }

  return (
    <MotionPage className="space-y-[var(--section-gap)]">

      <Card padding="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-heading text-base">View & filters</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateTask}
              className="flex items-center gap-2"
              aria-label="Create task"
            >
              <Plus className="w-4 h-4" />
              Create Task
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {getActiveFilterCount() > 0 && (
                <span className="bg-[var(--primary)] text-[var(--primary-fg)] text-xs rounded-full px-2 py-0.5">
                  {getActiveFilterCount()}
                </span>
              )}
              {filtersExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-4">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label htmlFor="search-tasks" className="text-sm font-medium text-[var(--fg)]">Search Tasks</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--fg-muted)] w-4 h-4" />
              <Input
                id="search-tasks"
                type="text"
                placeholder="Search by title, description, assignee, project, or tags... (Press F or Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
                aria-label="Search tasks"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--fg-muted)] hover:text-[var(--fg)]"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(getActiveFilterCount() > 0 || filtersExpanded) && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 mb-3">
              {searchQuery && (
                <span className="inline-flex items-center gap-1 bg-[var(--info-light)] text-[var(--info-muted-fg)] px-2 py-1 rounded-full text-sm">
                  Search: "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="hover:bg-[var(--info-muted)] rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterOverdue && (
                <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
                  Overdue
                  <button
                    onClick={clearOverdueFilter}
                    className="hover:bg-red-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterProject && (
                <span className="inline-flex items-center gap-1 bg-[var(--success-light)] text-[var(--success-muted-fg)] px-2 py-1 rounded-full text-sm">
                  Project: {projects.find(p => p.id === filterProject)?.name}
                  <button
                    onClick={() => setFilterProject('')}
                    className="hover:bg-[var(--success-muted)] rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterAssignee && (
                <span className="inline-flex items-center gap-1 bg-[var(--purple-light)] text-[var(--purple-fg)] px-2 py-1 rounded-full text-sm">
                  Assignee: {users.find(u => u.id === filterAssignee)?.name}
                  <button
                    onClick={() => setFilterAssignee('')}
                    className="hover:bg-[var(--purple-muted)] rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterStatus && (
                <span className="inline-flex items-center gap-1 bg-[var(--warning-light)] text-[var(--warning-muted-fg)] px-2 py-1 rounded-full text-sm">
                  Status: {filterStatus === 'TODO' ? 'To Do' : filterStatus === 'IN_PROGRESS' ? 'In Progress' : 'Completed'}
                  <button
                    onClick={() => setFilterStatus('')}
                    className="hover:bg-[var(--warning-muted)] rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterPriority && (
                <span className="inline-flex items-center gap-1 bg-[var(--danger-light)] text-[var(--danger-muted-fg)] px-2 py-1 rounded-full text-sm">
                  Priority: {filterPriority === 'HIGH' ? 'High' : filterPriority === 'MEDIUM' ? 'Medium' : 'Low'}
                  <button
                    onClick={() => setFilterPriority('')}
                    className="hover:bg-[var(--danger-muted)] rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterDepartment && (
                <span className="inline-flex items-center gap-1 bg-[var(--teal-light)] text-[var(--teal-muted-fg)] px-2 py-1 rounded-full text-sm">
                  Department: {filterDepartment}
                  <button
                    onClick={() => setFilterDepartment('')}
                    className="hover:bg-[var(--teal-muted)] rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {(filterDateStart || filterDateEnd) && (
                <span className="inline-flex items-center gap-1 bg-[var(--info-light)] text-[var(--info-muted-fg)] px-2 py-1 rounded-full text-sm">
                  Date: {filterDateStart || '…'} → {filterDateEnd || '…'}
                  <button
                    onClick={() => { setFilterDateStart(''); setFilterDateEnd(''); }}
                    className="hover:bg-[var(--info-muted)] rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            {/* Filter Presets */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-sm font-medium text-[var(--fg-muted)] mr-2">Quick filters:</span>
              <button
                onClick={() => applyFilterPreset('my-tasks')}
                className="text-sm bg-[var(--muted)] hover:bg-[var(--active)] px-3 py-1 rounded-full transition-colors text-[var(--fg)]"
              >
                My Tasks
              </button>
              <button
                onClick={() => applyFilterPreset('overdue-tasks')}
                className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors"
              >
                Overdue
              </button>
              <button
                onClick={() => applyFilterPreset('high-priority')}
                className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors"
              >
                High Priority
              </button>
              <button
                onClick={() => applyFilterPreset('this-week')}
                className="text-sm bg-[var(--muted)] hover:bg-[var(--active)] px-3 py-1 rounded-full transition-colors text-[var(--fg)]"
              >
                Today's Tasks
              </button>
              <button
                onClick={() => applyFilterPreset('clear-all')}
                className="text-sm bg-[var(--danger-light)] hover:bg-[var(--danger-muted)] text-[var(--danger-muted-fg)] px-3 py-1 rounded-full transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Collapsible Filters */}
        {filtersExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t pt-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="flex flex-col gap-1.5 sm:col-span-2 xl:col-span-1">
                <label htmlFor="search-tasks-in-filters" className="text-sm font-medium text-[var(--fg)]">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-fg)]" aria-hidden />
                  <Input
                    id="search-tasks-in-filters"
                    type="text"
                    placeholder="Title, description, tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-9 w-full"
                    aria-label="Search tasks"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[var(--muted-fg)] hover:text-[var(--fg)] hover:bg-[var(--muted)]"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="filter-project" className="text-sm font-medium text-[var(--fg)]">Project</label>
                <Select id="filter-project" value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="min-w-[140px]" aria-label="Filter by project">
                  <option value="">All</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="filter-assignee" className="text-sm font-medium text-[var(--fg)]">Assignee</label>
                <Select id="filter-assignee" value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} className="min-w-[120px]" aria-label="Filter by assignee">
                  <option value="">All</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="filter-status" className="text-sm font-medium text-[var(--fg)]">Status</label>
                <Select id="filter-status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="min-w-[100px]" aria-label="Filter by status">
                  <option value="">All</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="filter-priority" className="text-sm font-medium text-[var(--fg)]">Priority</label>
                <Select id="filter-priority" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="min-w-[100px]" aria-label="Filter by priority">
                  <option value="">All</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="filter-department" className="text-sm font-medium text-[var(--fg)]">Department</label>
                <Select id="filter-department" value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className="min-w-[100px]" aria-label="Filter by department">
                  <option value="">All</option>
                  <option value="DEV">DEV</option>
                  <option value="PRESALES">PRESALES</option>
                  <option value="TESTER">TESTER</option>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--fg)]">Assigned date</label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="date"
                    value={filterDateStart}
                    onChange={(e) => setFilterDateStart(e.target.value)}
                    className="min-w-[140px]"
                    aria-label="Filter from date"
                  />
                  <span className="text-[var(--fg-muted)] text-sm">to</span>
                  <Input
                    type="date"
                    value={filterDateEnd}
                    onChange={(e) => setFilterDateEnd(e.target.value)}
                    className="min-w-[140px]"
                    aria-label="Filter to date"
                  />
                  <Button
                    variant={filterDateStart === todayKey() && filterDateEnd === todayKey() ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => { const today = todayKey(); setFilterDateStart(today); setFilterDateEnd(today); }}
                    className="whitespace-nowrap"
                  >
                    Today
                  </Button>
                  <Button
                    variant={!filterDateStart && !filterDateEnd ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => { setFilterDateStart(''); setFilterDateEnd(''); }}
                    className="whitespace-nowrap"
                  >
                    Show All
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* View Toggle - Always visible */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--fg)]">View</span>
            <div className="flex rounded-[var(--radius)] border border-[var(--border)] overflow-hidden bg-[var(--card)]" role="group" aria-label="View mode">
              <button
                type="button"
                onClick={() => setView(VIEW_KANBAN)}
                className={`p-2 transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)] ${view === VIEW_KANBAN ? 'bg-[var(--primary)] text-[var(--primary-fg)]' : 'text-[var(--fg-muted)] hover:bg-[var(--muted)] hover:text-[var(--fg)]'}`}
                aria-pressed={view === VIEW_KANBAN}
                aria-label="Kanban view"
                title="Kanban view"
              >
                <Columns3 className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setView(VIEW_TABLE)}
                className={`p-2 transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)] ${view === VIEW_TABLE ? 'bg-[var(--primary)] text-[var(--primary-fg)]' : 'text-[var(--fg-muted)] hover:bg-[var(--muted)] hover:text-[var(--fg)]'}`}
                aria-pressed={view === VIEW_TABLE}
                aria-label="Table view"
                title="Table view"
              >
                <Table className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {filteredTasks.length === 0 ? (
        <EmptyState
          title={tasks.length === 0 ? 'No tasks' : 'No results match your filters'}
          message={tasks.length === 0 ? 'Create a task to get started.' : 'Try clearing filters.'}
          actionLabel={tasks.length === 0 ? 'Create Task' : 'Clear All Filters'}
          onAction={
            tasks.length === 0
              ? handleCreateTask
              : () => { setFilterProject(''); setFilterAssignee(''); setFilterStatus(''); setFilterPriority(''); setFilterDepartment(''); setFilterDate(''); }
          }
        />
      ) : view === VIEW_KANBAN ? (
        <section aria-labelledby="kanban-heading" className="space-y-0">
          <h2 id="kanban-heading" className="sr-only">Task board</h2>
          <KanbanBoard
            tasks={filteredTasks}
            users={users}
            projects={projects}
            onMoveStatus={handleMoveStatus}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            canDelete={canDeleteTask}
            readOnly={false}
            getTaskReadOnly={getTaskReadOnly}
            getTaskDisplayId={getTaskDisplayId}
            selectedTasks={selectedTasks}
            onSelectTask={handleSelectTask}
            onSelectAll={handleSelectAll}
            onBulkStatusChange={handleBulkStatusChange}
            onClearSelection={clearSelection}
            onNavigateToProject={handleNavigateToProject}
            loading={false}
          />
        </section>
      ) : (
        <TaskTable
          tasks={filteredTasks}
          users={users}
          projects={projects}
          getTaskDisplayId={getTaskDisplayId}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
          canDelete={canDeleteTask}
          onMoveStatus={handleMoveStatus}
          getTaskReadOnly={getTaskReadOnly}
          onNavigateToProject={handleNavigateToProject}
        />
      )}

      <TaskModal
        open={modalOpen}
        mode={modalMode}
        task={editingTask}
        onClose={() => { setModalOpen(false); setEditingTask(null); }}
        onSuccess={() => { }}
        onAssigneeNotify={handleAssigneeNotify}
      />
    </MotionPage>
  );
}
