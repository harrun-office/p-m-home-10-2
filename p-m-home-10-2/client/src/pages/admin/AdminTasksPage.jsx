import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore.jsx';
import { getSession } from '../../store/sessionStore.js';
import { todayKey, toDayKey, toLocalDayKey, addDaysToLocalKey } from '../../utils/date.js';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { MotionPage } from '../../components/motion/MotionPage.jsx';
import { motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { TaskTable } from '../../components/admin/tasks/TaskTable.jsx';
import { TaskModal } from '../../components/admin/tasks/TaskModal.jsx';
import { PriorityBadge } from '../../components/admin/tasks/PriorityBadge.jsx';
import { Search, X, Filter, ChevronDown, ChevronUp, Columns3, Table, Plus, ListTodo, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';

const VIEW_KANBAN = 'kanban';
const VIEW_TABLE = 'table';
const TASK_PAGE_SIZE_OPTIONS = [10, 50, 100, 200, 0];

const PROJECT_COLORS = [
  { bg: 'bg-[var(--danger-light)]', border: 'border-[var(--danger-muted)]', text: 'text-[var(--danger-muted-fg)]' },
  { bg: 'bg-[var(--warning-light)]', border: 'border-[var(--warning-muted)]', text: 'text-[var(--warning-muted-fg)]' },
  { bg: 'bg-[var(--info-light)]', border: 'border-[var(--info-muted)]', text: 'text-[var(--info-muted-fg)]' },
  { bg: 'bg-[var(--success-light)]', border: 'border-[var(--success-muted)]', text: 'text-[var(--success-muted-fg)]' },
  { bg: 'bg-[var(--purple-light)]', border: 'border-[var(--purple-muted)]', text: 'text-[var(--purple-fg)]' },
  { bg: 'bg-[var(--muted)]', border: 'border-[var(--border)]', text: 'text-[var(--fg-muted)]' },
];

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
  // Card view (when Kanban selected): time filter + pagination
  const [taskTimeFilter, setTaskTimeFilter] = useState('all');
  const [taskTimeCustomStart, setTaskTimeCustomStart] = useState('');
  const [taskTimeCustomEnd, setTaskTimeCustomEnd] = useState('');
  const [tasksPageSize, setTasksPageSize] = useState(10);
  const [tasksCurrentPage, setTasksCurrentPage] = useState(1);

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

  // Card view: filter tasks by time period (for when view === VIEW_KANBAN)
  const tasksInTimeRange = useMemo(() => {
    const today = todayKey();
    if (taskTimeFilter === 'all') return filteredTasks;
    let startKey;
    let endKey = today;
    if (taskTimeFilter === 'today') {
      startKey = today;
      endKey = today;
    } else if (taskTimeFilter === 'yesterday') {
      const yesterday = addDaysToLocalKey(today, -1);
      startKey = yesterday;
      endKey = yesterday;
    } else if (taskTimeFilter === 'week') {
      startKey = addDaysToLocalKey(today, -7);
    } else if (taskTimeFilter === 'month') {
      startKey = addDaysToLocalKey(today, -30);
    } else if (taskTimeFilter === 'custom' && taskTimeCustomStart && taskTimeCustomEnd) {
      startKey = taskTimeCustomStart;
      endKey = taskTimeCustomEnd;
    } else if (taskTimeFilter === 'specific' && taskTimeCustomStart) {
      startKey = taskTimeCustomStart;
      endKey = taskTimeCustomStart;
    } else {
      return filteredTasks;
    }
    const inRange = (key) => key && key >= startKey && key <= endKey;
    return filteredTasks.filter((t) => {
      const createdKey = t.createdAt ? toLocalDayKey(t.createdAt) : '';
      return inRange(createdKey);
    });
  }, [filteredTasks, taskTimeFilter, taskTimeCustomStart, taskTimeCustomEnd]);

  const sortedTasksForCard = useMemo(
    () => [...tasksInTimeRange].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')),
    [tasksInTimeRange]
  );
  const totalTasksForCard = sortedTasksForCard.length;
  const effectivePageSize = tasksPageSize === 0 ? totalTasksForCard : Math.max(1, Number(tasksPageSize) || 10);
  const totalPagesForCard = Math.max(1, effectivePageSize >= totalTasksForCard ? 1 : Math.ceil(totalTasksForCard / effectivePageSize));
  const clampedPageForCard = Math.min(Math.max(1, tasksCurrentPage), totalPagesForCard);
  const startIndexForCard = (clampedPageForCard - 1) * effectivePageSize;
  const displayedTasksForCard = sortedTasksForCard.slice(startIndexForCard, startIndexForCard + effectivePageSize);

  const overdueCountForCard = useMemo(
    () => tasksInTimeRange.filter((t) => t.status !== 'COMPLETED' && t.deadline && new Date(t.deadline) < new Date()).length,
    [tasksInTimeRange]
  );

  const projectColorMap = useMemo(() => {
    const map = {};
    projects.forEach((p, i) => {
      map[p.id] = PROJECT_COLORS[i % PROJECT_COLORS.length];
    });
    return map;
  }, [projects]);

  function getProjectName(projectId) {
    const p = projects.find((x) => x.id === projectId);
    return p ? p.name : '—';
  }

  function getUserName(userId) {
    const u = users.find((x) => x.id === userId);
    return u ? u.name : '—';
  }

  function getUserInitials(userId) {
    const u = users.find((x) => x.id === userId);
    if (!u) return '?';
    return u.name.split(' ').map((n) => n[0]).join('').toUpperCase();
  }

  function handleKanbanDragEnd(result) {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;
    handleMoveStatus(draggableId, destination.droppableId);
  }

  useEffect(() => {
    setTasksCurrentPage(1);
  }, [taskTimeFilter, taskTimeCustomStart, taskTimeCustomEnd, tasksPageSize]);

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
        setFilterDateStart(todayKey());
        setFilterDateEnd(todayKey());
        break;
      case 'overdue-tasks':
        setFilterOverdue(true);
        setSearchParams({ filter: 'overdue' }, { replace: true });
        setFilterAssignee('');
        setFilterProject('');
        setFilterStatus('');
        setFilterPriority('');
        setFilterDateStart('');
        setFilterDateEnd('');
        break;
      case 'overdue':
      case 'high-priority':
        setFilterAssignee('');
        setFilterProject('');
        setFilterStatus('');
        setFilterPriority('HIGH');
        setFilterDateStart('');
        setFilterDateEnd('');
        break;
      case 'this-week':
        setFilterAssignee('');
        setFilterProject('');
        setFilterStatus('');
        setFilterPriority('');
        setFilterDateStart(todayKey());
        setFilterDateEnd(todayKey());
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
              : () => { setFilterProject(''); setFilterAssignee(''); setFilterStatus(''); setFilterPriority(''); setFilterDepartment(''); setFilterDateStart(''); setFilterDateEnd(''); }
          }
        />
      ) : view === VIEW_KANBAN ? (
        <Card className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] transition-all duration-150 hover:border-[var(--border-focus)] hover:shadow-[var(--shadow-md)] p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-[var(--fg)] flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-[var(--accent)]" />
              Tasks
            </h2>
          </div>

          {/* Task summary cards - same design as EmployeeProjectDetailPage */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl border-2 border-[var(--border)] p-4 bg-[var(--accent-light)]">
              <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-1">Total</p>
              <p className="text-2xl font-bold tabular-nums text-[var(--accent)]">{tasksInTimeRange.length}</p>
            </div>
            <div className="rounded-xl border-2 border-[var(--border)] p-4 bg-[var(--success-light)]">
              <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-1">Completed</p>
              <p className="text-2xl font-bold tabular-nums text-[var(--success)]">{tasksInTimeRange.filter((t) => t.status === 'COMPLETED').length}</p>
            </div>
            <div className="rounded-xl border-2 border-[var(--border)] p-4 bg-[var(--danger-light)]">
              <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-1">Overdue</p>
              <p className="text-2xl font-bold tabular-nums text-[var(--danger)]">{overdueCountForCard}</p>
            </div>
            <div className="rounded-xl border-2 border-[var(--border)] p-4 bg-[var(--warning-light)]">
              <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-1">In progress</p>
              <p className="text-2xl font-bold tabular-nums text-[var(--warning)]">{tasksInTimeRange.filter((t) => t.status === 'IN_PROGRESS').length}</p>
            </div>
          </div>

          {/* Filter by created date */}
          <div className="bg-[var(--muted)]/30 rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--fg)]">Filter by created date:</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Select
                  value={taskTimeFilter}
                  onChange={(e) => setTaskTimeFilter(e.target.value)}
                  className="min-w-[160px]"
                  aria-label="Filter tasks by created date"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Last 7 days</option>
                  <option value="month">Last 30 days</option>
                  <option value="all">All time</option>
                  <option value="custom">Custom range</option>
                  <option value="specific">Specific date</option>
                </Select>
                {(taskTimeFilter === 'custom' || taskTimeFilter === 'specific') && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={taskTimeCustomStart}
                      onChange={(e) => setTaskTimeCustomStart(e.target.value)}
                      className="min-w-[130px]"
                      aria-label={taskTimeFilter === 'specific' ? 'Select date' : 'From date'}
                    />
                    {taskTimeFilter === 'custom' && (
                      <>
                        <span className="text-[var(--fg-muted)] text-sm">to</span>
                        <Input type="date" value={taskTimeCustomEnd} onChange={(e) => setTaskTimeCustomEnd(e.target.value)} className="min-w-[130px]" aria-label="To date" />
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tasks per page + Pagination */}
          {tasksInTimeRange.length > 0 && (
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
                        tasksPageSize === size ? 'bg-[var(--accent)] text-[var(--accent-fg)]' : 'bg-[var(--muted)] text-[var(--fg)] hover:bg-[var(--border)]'
                      }`}
                    >
                      {size === 0 ? 'All' : size}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--fg-muted)]">
                  Page {clampedPageForCard} of {totalPagesForCard}
                  {effectivePageSize < totalTasksForCard && (
                    <span className="ml-1">({startIndexForCard + 1}–{Math.min(startIndexForCard + effectivePageSize, totalTasksForCard)} of {totalTasksForCard})</span>
                  )}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setTasksCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={clampedPageForCard <= 1}
                    className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] hover:bg-[var(--muted)] disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTasksCurrentPage((p) => Math.min(totalPagesForCard, p + 1))}
                    disabled={clampedPageForCard >= totalPagesForCard}
                    className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] hover:bg-[var(--muted)] disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Kanban columns: To Do | In Progress | Completed (drag and drop) */}
          {displayedTasksForCard.length === 0 ? (
            <div className="rounded-xl bg-gradient-to-br from-[var(--muted)]/30 to-[var(--muted)]/50 border-2 border-dashed border-[var(--border)] p-8 text-center">
              <ListTodo className="w-12 h-12 text-[var(--fg-muted)] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[var(--fg)] mb-2">No tasks in this range</h3>
              <p className="text-sm text-[var(--fg-muted)]">
                {taskTimeFilter === 'all' ? 'No tasks match your filters.' : 'Try "All time" or adjust the filter.'}
              </p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleKanbanDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['TODO', 'IN_PROGRESS', 'COMPLETED'].map((status) => {
                  const columnTasks = displayedTasksForCard.filter((t) => t.status === status);
                  return (
                    <Droppable key={status} droppableId={status}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
                            <div className={`w-3 h-3 rounded-full shrink-0 ${status === 'TODO' ? 'bg-gray-400' : status === 'IN_PROGRESS' ? 'bg-yellow-500' : 'bg-green-500'}`} aria-hidden />
                            <h3 className="font-medium text-[var(--fg)]">{status === 'TODO' ? 'To Do' : status === 'IN_PROGRESS' ? 'In Progress' : 'Completed'}</h3>
                            <span className="text-xs text-[var(--fg-muted)] bg-[var(--muted)] px-2 py-1 rounded-full">
                              {columnTasks.length}
                            </span>
                          </div>
                          <div className="space-y-3 min-h-[200px]">
                            {columnTasks.map((t, index) => {
                              const taskReadOnly = getTaskReadOnly(t);
                              const projectColor = projectColorMap[t.projectId] || { bg: 'bg-[var(--muted)]', border: 'border-[var(--border)]', text: 'text-[var(--fg-muted)]' };
                              const truncate = (text, max = 60) => (!text || text.length <= max ? text : text.slice(0, max) + '...');
                              return (
                                <Draggable key={t.id} draggableId={t.id} index={index} isDragDisabled={taskReadOnly}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`group relative overflow-hidden bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-[var(--shadow)] hover:shadow-[var(--shadow-md)] transition-all duration-200 cursor-pointer hover:border-[var(--border-focus)] ${snapshot.isDragging ? 'shadow-[var(--shadow-xl)] scale-[1.02] opacity-95 z-10' : ''}`}
                                      onClick={(e) => { if (!e.target.closest('[data-drag-handle]')) handleEditTask(t); }}
                                      role="button"
                                      tabIndex={0}
                                      onKeyDown={(e) => e.key === 'Enter' && handleEditTask(t)}
                                    >
                                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${projectColor.bg} ${projectColor.border} border-r`} aria-hidden />
                                      <div className="pl-4 pr-3 py-3">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                          <div className="min-w-0 flex-1">
                                            <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${projectColor.text} ${projectColor.bg} ${projectColor.border}`}>
                                              {getProjectName(t.projectId)}
                                            </span>
                                            {getTaskDisplayId && (
                                              <span className="ml-1.5 text-[10px] text-[var(--muted-fg)] tabular-nums">{getTaskDisplayId(t)}</span>
                                            )}
                                          </div>
                                          {!taskReadOnly && (
                                            <div data-drag-handle {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-[var(--muted)] opacity-60 group-hover:opacity-100" aria-label="Drag to move">
                                              <GripVertical className="w-4 h-4 text-[var(--muted-fg)]" />
                                            </div>
                                          )}
                                        </div>
                                        <h4 className="font-semibold text-[var(--fg)] text-sm mb-1">{t.title || 'Untitled task'}</h4>
                                        {t.description && (
                                          <p className="text-xs text-[var(--fg-muted)] line-clamp-2 mb-3">{truncate(t.description, 80)}</p>
                                        )}
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                          <div className="w-6 h-6 rounded-full bg-[var(--muted)] flex items-center justify-center text-[10px] font-semibold text-[var(--fg)] shrink-0">
                                            {getUserInitials(t.assigneeId)}
                                          </div>
                                          <span className="text-xs text-[var(--fg-secondary)] truncate">{getUserName(t.assigneeId)}</span>
                                          <PriorityBadge priority={t.priority} />
                                        </div>
                                        <div className="space-y-0.5 text-[10px] text-[var(--muted-fg)]">
                                          {t.assignedAt && <div>Assigned: {new Date(t.assignedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>}
                                          {t.deadline && <div>End: {new Date(t.deadline).toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>}
                                        </div>
                                        {t.deadline && new Date(t.deadline) < new Date() && t.status !== 'COMPLETED' && (
                                          <div className="mt-2 flex items-center gap-1 text-xs text-[var(--danger)]">
                                            <span className="w-2 h-2 bg-[var(--danger)] rounded-full shrink-0" aria-hidden />
                                            <span className="font-medium">Overdue</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })}
                            {columnTasks.length === 0 && (
                              <div className="text-center py-8 text-[var(--fg-muted)] text-sm border-2 border-dashed border-[var(--border)] rounded-lg">None</div>
                            )}
                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  );
                })}
              </div>
            </DragDropContext>
          )}
        </Card>
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
