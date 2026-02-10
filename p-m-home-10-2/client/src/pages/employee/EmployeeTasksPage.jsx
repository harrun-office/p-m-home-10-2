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
import { LayoutGrid, List, Filter } from 'lucide-react';

const VIEW_KANBAN = 'kanban';
const VIEW_TABLE = 'table';

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

      {/* View toggle + filters — design tokens for light and dark mode */}
      <Card>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--fg)] uppercase tracking-wider mb-4">
          <Filter className="w-4 h-4 text-[var(--fg-muted)]" aria-hidden />
          View & filters
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-[var(--fg)]">View:</span>
            <div className="flex rounded-[var(--radius)] border-2 border-[var(--border)] overflow-hidden bg-[var(--muted)]/50">
              <button
                type="button"
                onClick={() => setView(VIEW_KANBAN)}
                className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                  view === VIEW_KANBAN
                    ? 'bg-[var(--primary)] text-[var(--primary-fg)]'
                    : 'bg-transparent text-[var(--fg)] hover:bg-[var(--hover)]'
                }`}
              >
                <LayoutGrid className="w-4 h-4 shrink-0" aria-hidden />
                Kanban
              </button>
              <button
                type="button"
                onClick={() => setView(VIEW_TABLE)}
                className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                  view === VIEW_TABLE
                    ? 'bg-[var(--primary)] text-[var(--primary-fg)]'
                    : 'bg-transparent text-[var(--fg)] hover:bg-[var(--hover)]'
                }`}
              >
                <List className="w-4 h-4 shrink-0" aria-hidden />
                Table
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-project" className="text-xs font-medium text-[var(--fg-muted)]">
                Project
              </label>
              <Select
                id="filter-project"
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="min-w-[160px]"
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
                className="min-w-[140px]"
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
                className="min-w-[120px]"
              >
                <option value="">All</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[var(--fg-muted)]">
                Assigned date
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  value={filterDateStart}
                  onChange={(e) => setFilterDateStart(e.target.value)}
                  className="min-w-[140px]"
                  aria-label="Filter from date"
                />
                <span className="text-[var(--fg-muted)] text-xs">to</span>
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
                  onClick={() => {
                    const today = todayKey();
                    setFilterDateStart(today);
                    setFilterDateEnd(today);
                  }}
                  className="whitespace-nowrap"
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
                  className="whitespace-nowrap"
                >
                  Show all
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

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
          tasks={filteredTasks}
          users={users}
          onMoveStatus={handleMoveStatus}
          onEdit={handleEditTask}
          getTaskReadOnly={getTaskReadOnly}
          onDelete={handleDeleteTask}
          canDelete={(task) => task.createdById === session.userId}
        />
      ) : (
        <TaskTable
          tasks={filteredTasks}
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
