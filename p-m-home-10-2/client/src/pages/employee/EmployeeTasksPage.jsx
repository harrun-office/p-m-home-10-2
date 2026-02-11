import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore.jsx';
import { getSession } from '../../store/sessionStore.js';
import { todayKey, toDayKey } from '../../utils/date.js';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { KanbanBoard } from '../../components/admin/tasks/KanbanBoard.jsx';
import { TaskTable } from '../../components/admin/tasks/TaskTable.jsx';
import { TaskModal } from '../../components/admin/tasks/TaskModal.jsx';
import { LayoutGrid, List, Filter, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

const VIEW_KANBAN = 'kanban';
const VIEW_TABLE = 'table';
const TASK_PAGE_SIZE_OPTIONS = [10, 50, 100, 200, 0];

/**
 * Employee tasks: only tasks assigneeId === session.userId.
 * View Kanban | Table; filters (Project = assigned only, Status, Priority).
 * Create Task with employeeMode (assigneeId = session.userId, projects = assigned ACTIVE).
 * Read-only per task when project ON_HOLD/COMPLETED.
 */
export function EmployeeTasksPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editTaskId = searchParams.get('edit');
  const { state, moveTaskStatus, deleteTask } = useDataStore();
  const session = getSession();
  const sessionForRepo = session ? { userId: session.userId, role: session.role } : null;

  const [view, setView] = useState(VIEW_KANBAN);
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterDateStart, setFilterDateStart] = useState(''); // From date
  const [filterDateEnd, setFilterDateEnd] = useState(''); // To date
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingTask, setEditingTask] = useState(null);
  const [assigneeNotifyMessage, setAssigneeNotifyMessage] = useState('');
  const [tasksPageSize, setTasksPageSize] = useState(10);
  const [tasksCurrentPage, setTasksCurrentPage] = useState(1);

  useEffect(() => {
    if (!session) navigate('/login', { replace: true });
  }, [session, navigate]);

  useEffect(() => {
    if (editTaskId && state.tasks) {
      const task = state.tasks.find((t) => t.id === editTaskId);
      if (task && task.assigneeId === session?.userId) {
        setEditingTask(task);
        setModalMode('edit');
        setModalOpen(true);
      }
    }
  }, [editTaskId, state.tasks, session?.userId]);

  const tasks = state.tasks || [];
  const projects = state.projects || [];
  const users = (state.users || []).filter((u) => u.isActive !== false);

  const myProjects = useMemo(() => {
    if (!session) return [];
    return projects.filter((p) => (p.assignedUserIds || []).includes(session.userId));
  }, [projects, session]);

  const myTasks = useMemo(() => {
    if (!session) return [];
    return tasks.filter((t) => t.assigneeId === session.userId);
  }, [tasks, session]);

  const filteredTasks = useMemo(() => {
    let list = myTasks;
    if (filterProject) list = list.filter((t) => t.projectId === filterProject);
    if (filterStatus) list = list.filter((t) => t.status === filterStatus);
    if (filterPriority) list = list.filter((t) => t.priority === filterPriority);
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
  }, [myTasks, filterProject, filterStatus, filterPriority, filterDateStart, filterDateEnd]);

  useEffect(() => {
    setTasksCurrentPage(1);
  }, [filterProject, filterStatus, filterPriority, filterDateStart, filterDateEnd, tasksPageSize]);

  const sortedTasks = useMemo(
    () => [...filteredTasks].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')),
    [filteredTasks]
  );
  const totalTasks = sortedTasks.length;
  const effectivePageSize = tasksPageSize === 0 ? totalTasks : Math.max(1, Number(tasksPageSize) || 10);
  const totalPages = Math.max(1, effectivePageSize >= totalTasks ? 1 : Math.ceil(totalTasks / effectivePageSize));
  const clampedPage = Math.min(Math.max(1, tasksCurrentPage), totalPages);
  const startIndex = (clampedPage - 1) * effectivePageSize;
  const displayedTasks = sortedTasks.slice(startIndex, startIndex + effectivePageSize);

  const getTaskReadOnly = useMemo(() => {
    const projectMap = new Map(projects.map((p) => [p.id, p]));
    return (task) => {
      const project = projectMap.get(task.projectId);
      return project && (project.status === 'ON_HOLD' || project.status === 'COMPLETED');
    };
  }, [projects]);

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

  function handleDeleteTask(task) {
    if (!sessionForRepo || task.createdById !== session.userId) return;
    if (getTaskReadOnly(task)) return;
    deleteTask(task.id, sessionForRepo);
  }

  function handleAssigneeNotify(message) {
    setAssigneeNotifyMessage(message || '');
    setTimeout(() => setAssigneeNotifyMessage(''), 4000);
  }

  if (!session) return null;

  return (
    <div className="space-y-6 sm:space-y-8">

      {assigneeNotifyMessage && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--info-light)] text-[var(--info-muted-fg)] px-4 py-3 text-sm font-medium">
          {assigneeNotifyMessage}
        </div>
      )}

      {/* View toggle + filters — aligned grid layout */}
      <Card>
        <div className="flex items-center justify-between mb-4 gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--fg)] uppercase tracking-wider">
            <Filter className="w-4 h-4 text-[var(--fg-muted)]" aria-hidden />
            View & filters
          </h2>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateTask}
            className="inline-flex items-center gap-2"
            aria-label="Create task"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Task</span>
          </Button>
        </div>
        <div className="space-y-6">
          {/* View row */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[var(--fg)] shrink-0">View:</span>
            <div className="flex rounded-[var(--radius)] border-2 border-[var(--border)] overflow-hidden bg-[var(--muted)]/50">
              <button
                type="button"
                onClick={() => setView(VIEW_KANBAN)}
                aria-label="View as Kanban"
                className={`inline-flex items-center justify-center p-2.5 text-sm font-medium transition-colors ${
                  view === VIEW_KANBAN
                    ? 'bg-[var(--primary)] text-[var(--primary-fg)]'
                    : 'bg-transparent text-[var(--fg)] hover:bg-[var(--hover)]'
                }`}
              >
                <LayoutGrid className="w-4 h-4 shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => setView(VIEW_TABLE)}
                aria-label="View as Table"
                className={`inline-flex items-center justify-center p-2.5 text-sm font-medium transition-colors ${
                  view === VIEW_TABLE
                    ? 'bg-[var(--primary)] text-[var(--primary-fg)]'
                    : 'bg-transparent text-[var(--fg)] hover:bg-[var(--hover)]'
                }`}
              >
                <List className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
          {/* Filters row — grid so labels and controls align */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-project" className="text-xs font-medium text-[var(--fg-muted)]">
                Project
              </label>
              <Select
                id="filter-project"
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="w-full min-w-0"
              >
                <option value="">All</option>
                {myProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-status" className="text-xs font-medium text-[var(--fg-muted)]">
                Status
              </label>
              <Select
                id="filter-status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full min-w-0"
              >
                <option value="">All</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-priority" className="text-xs font-medium text-[var(--fg-muted)]">
                Priority
              </label>
              <Select
                id="filter-priority"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full min-w-0"
              >
                <option value="">All</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </Select>
            </div>
          </div>
          {/* Assigned date — own row so it doesn't collide with dropdowns */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--fg-muted)]">Assigned date</span>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="date"
                value={filterDateStart}
                onChange={(e) => setFilterDateStart(e.target.value)}
                className="min-w-[130px]"
                aria-label="Filter from date"
              />
              <span className="text-[var(--fg-muted)] text-xs shrink-0">to</span>
              <Input
                type="date"
                value={filterDateEnd}
                onChange={(e) => setFilterDateEnd(e.target.value)}
                className="min-w-[130px]"
                aria-label="Filter to date"
              />
              <Button
                variant={filterDateStart === todayKey() && filterDateEnd === todayKey() ? 'primary' : 'outline'}
                size="sm"
                onClick={() => {
                  const today = todayKey();
                  setFilterDateStart(today);
                  setFilterDateEnd(today);
                }}
                className="shrink-0 whitespace-nowrap"
              >
                Today
              </Button>
              <Button
                variant={!filterDateStart && !filterDateEnd ? 'primary' : 'outline'}
                size="sm"
                onClick={() => {
                  setFilterDateStart('');
                  setFilterDateEnd('');
                }}
                className="shrink-0 whitespace-nowrap"
              >
                Show all
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {filteredTasks.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
              Page {clampedPage} of {totalPages}
              {effectivePageSize < totalTasks && (
                <span className="ml-1">({startIndex + 1}–{Math.min(startIndex + effectivePageSize, totalTasks)} of {totalTasks})</span>
              )}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTasksCurrentPage((p) => Math.max(1, p - 1))}
                disabled={clampedPage <= 1}
                className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] hover:bg-[var(--muted)] disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setTasksCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={clampedPage >= totalPages}
                className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] hover:bg-[var(--muted)] disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <EmptyState
          title={myTasks.length === 0 ? 'No tasks' : 'No results match your filters'}
          message={myTasks.length === 0 ? 'Create a task or wait for assignments.' : 'Try clearing filters.'}
          actionLabel={myTasks.length === 0 ? 'Create task' : 'Clear filters'}
          onAction={
            myTasks.length === 0
              ? handleCreateTask
              : () => {
                  setFilterProject('');
                  setFilterStatus('');
                  setFilterPriority('');
                  setFilterDateStart('');
                  setFilterDateEnd('');
                }
          }
        />
      ) : view === VIEW_KANBAN ? (
        <KanbanBoard
          tasks={displayedTasks}
          users={users}
          onMoveStatus={handleMoveStatus}
          onEdit={handleEditTask}
          getTaskReadOnly={getTaskReadOnly}
          onDelete={handleDeleteTask}
          canDelete={(task) => task.createdById === session.userId}
        />
      ) : (
        <TaskTable
          tasks={displayedTasks}
          users={users}
          projects={projects}
          onEdit={handleEditTask}
          onMoveStatus={handleMoveStatus}
          getTaskReadOnly={getTaskReadOnly}
          onDelete={handleDeleteTask}
          canDelete={(task) => task.createdById === session.userId}
        />
      )}

      <TaskModal
        open={modalOpen}
        mode={modalMode}
        task={editingTask}
        onClose={() => { setModalOpen(false); setEditingTask(null); }}
        onSuccess={() => {}}
        onAssigneeNotify={handleAssigneeNotify}
        employeeMode
      />
    </div>
  );
}
