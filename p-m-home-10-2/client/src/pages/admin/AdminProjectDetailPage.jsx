import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore.jsx';
import { getSession } from '../../store/sessionStore.js';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { ReadOnlyBanner } from '../../components/ui/ReadOnlyBanner.jsx';
import { ProjectModal } from '../../components/admin/projects/ProjectModal.jsx';
import { KanbanBoard } from '../../components/admin/tasks/KanbanBoard.jsx';
import { TaskTable } from '../../components/admin/tasks/TaskTable.jsx';
import { TaskModal } from '../../components/admin/tasks/TaskModal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { daysUntil } from '../../utils/date.js';
import { CalendarDays, Clock, Users, CheckCircle2, AlertCircle, Target, Building2, Timer, UserPlus, X, Search, Check, User } from 'lucide-react';

const TAB_OVERVIEW = 'overview';
const TAB_MEMBERS = 'members';
const TAB_TASKS = 'tasks';

const VIEW_KANBAN = 'kanban';
const VIEW_TABLE = 'table';

const STATUS_LABELS = { ACTIVE: 'Active', ON_HOLD: 'On Hold', COMPLETED: 'Completed' };

/**
 * Admin Project Detail: header + tabs (Overview, Members, Tasks placeholder).
 * Edit and status change only when ACTIVE; ON_HOLD/COMPLETED read-only with tooltip.
 */
export function AdminProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, setProjectStatus, moveTaskStatus, deleteProject, assignMembers } = useDataStore();
  const session = getSession();
  const sessionForRepo = session ? { userId: session.userId, role: session.role } : null;
  const [activeTab, setActiveTab] = useState(TAB_OVERVIEW);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusDropdownId, setStatusDropdownId] = useState(null);
  const [tasksView, setTasksView] = useState(VIEW_KANBAN);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [assigneeNotifyMessage, setAssigneeNotifyMessage] = useState('');
  const [addMembersModalOpen, setAddMembersModalOpen] = useState(false);
  const [addMembersSearch, setAddMembersSearch] = useState('');
  const [addMembersSelected, setAddMembersSelected] = useState([]);

  useEffect(() => {
    if (!session) navigate('/login', { replace: true });
  }, [session, navigate]);

  const projects = state.projects || [];
  const users = state.users || [];
  const tasks = state.tasks || [];
  const project = projects.find((p) => p.id === id);

  const projectTasks = useMemo(
    () => (project ? tasks.filter((t) => t.projectId === project.id) : []),
    [project, tasks]
  );
  const taskCountByStatus = useMemo(() => {
    const m = { TODO: 0, IN_PROGRESS: 0, COMPLETED: 0 };
    projectTasks.forEach((t) => {
      if (t.status in m) m[t.status]++;
    });
    return m;
  }, [projectTasks]);

  const assignedMembers = useMemo(() => {
    if (!project || !Array.isArray(project.assignedUserIds)) return [];
    return project.assignedUserIds
      .map((uid) => users.find((u) => u.id === uid))
      .filter(Boolean);
  }, [project, users]);

  const isReadOnly = project && (project.status === 'ON_HOLD' || project.status === 'COMPLETED');

  // Calculate project progress and metrics
  const projectProgress = useMemo(() => {
    if (!project) return { percentage: 0, status: 'unknown', daysRemaining: 0, isOverdue: false };

    const totalTasks = projectTasks.length;
    const completedTasks = taskCountByStatus.COMPLETED;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    let daysRemaining = 0;
    let isOverdue = false;
    if (project.endDate) {
      daysRemaining = daysUntil(project.endDate);
      isOverdue = daysRemaining < 0;
    }

    return { percentage, status: project.status, daysRemaining, isOverdue };
  }, [project, projectTasks, taskCountByStatus]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate team distribution
  const teamStats = useMemo(() => {
    const deptCount = {};
    assignedMembers.forEach(member => {
      const dept = member.department || 'Other';
      deptCount[dept] = (deptCount[dept] || 0) + 1;
    });
    return deptCount;
  }, [assignedMembers]);

  function handleMoveTaskStatus(taskId, newStatus) {
    if (!sessionForRepo || isReadOnly) return;
    moveTaskStatus(taskId, newStatus, sessionForRepo);
  }

  function handleEditTask(task) {
    setEditingTask(task);
    setTaskModalOpen(true);
  }

  function handleAssigneeNotify(message) {
    setAssigneeNotifyMessage(message || '');
    setTimeout(() => setAssigneeNotifyMessage(''), 4000);
  }

  function handleStatusChange(newStatus) {
    if (project) {
      setProjectStatus(project.id, newStatus);
      setStatusDropdownId(null);
    }
  }

  function handleDelete() {
    if (!project) return;
    if (window.confirm(`Are you sure you want to delete "${project.name}"? This will also delete all associated tasks. This action cannot be undone.`)) {
      const result = deleteProject(project.id);
      if (result.ok) {
        navigate('/admin/projects', { replace: true });
      } else {
        alert(result.error || 'Failed to delete project');
      }
    }
  }

  if (!project) {
    return (
      <div className="max-w-[var(--content-narrow)]">
        <p className="text-[var(--danger)] font-medium">Project not found.</p>
        <Link to="/admin/projects" className="text-[var(--primary)] hover:text-[var(--primary-hover)] hover:underline mt-2 inline-block transition-colors">Back to Projects</Link>
      </div>
    );
  }

  const tabs = [
    { id: TAB_OVERVIEW, label: 'Overview' },
    { id: TAB_MEMBERS, label: 'Members' },
    { id: TAB_TASKS, label: 'Tasks' },
  ];

  return (
    <div className="max-w-[var(--content-max)]">
      <Link to="/admin/projects" className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] hover:underline mb-4 inline-block transition-colors">← Back to Projects</Link>

      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
        <span>Start: {project.startDate ? project.startDate.slice(0, 10) : '—'}</span>
        <span>End: {project.endDate ? project.endDate.slice(0, 10) : '—'}</span>
      </div>

      <nav className="border-b border-[var(--border)] mb-4">
        <ul className="flex gap-4">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 text-sm font-medium ${activeTab === tab.id
                    ? 'border-[var(--primary)] text-[var(--primary)]'
                    : 'border-transparent text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--border-focus)]'
                  }`}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {activeTab === TAB_OVERVIEW && (
        <div className="space-y-6">
          {/* Project Header Card */}
          <Card motionCard className="border-l-4 border-l-[var(--primary)]">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] text-white">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[var(--fg)]">{project.name}</h2>
                    <p className="text-sm text-[var(--fg-muted)]">{project.description || 'No description provided'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={project.status} />
                    <span className="text-[var(--fg-muted)]">{STATUS_LABELS[project.status] ?? project.status}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--fg-muted)]">
                    <CalendarDays className="w-4 h-4" />
                    <span>{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Team Members */}
            <Card motionCard className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold text-[var(--fg)] mb-1">{assignedMembers.length}</div>
              <div className="text-sm text-[var(--fg-muted)] mb-3">Team Members</div>
              {assignedMembers.length > 0 && (
                <div className="flex items-center justify-center gap-1">
                  {assignedMembers.slice(0, 4).map((member, index) => (
                    <div key={member.id} className="relative">
                      <Avatar
                        alt={member.name}
                        size="sm"
                        className="-ml-1 first:ml-0"
                      />
                    </div>
                  ))}
                  {assignedMembers.length > 4 && (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--muted)] text-xs font-medium text-[var(--fg-muted)] -ml-1">
                      +{assignedMembers.length - 4}
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Total Tasks */}
            <Card motionCard className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold text-[var(--fg)] mb-1">{projectTasks.length}</div>
              <div className="text-sm text-[var(--fg-muted)] mb-3">Total Tasks</div>
              <div className="flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[var(--warning)]"></div>
                  <span className="text-[var(--fg-muted)]">{taskCountByStatus.TODO}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[var(--info)]"></div>
                  <span className="text-[var(--fg-muted)]">{taskCountByStatus.IN_PROGRESS}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[var(--success)]"></div>
                  <span className="text-[var(--fg-muted)]">{taskCountByStatus.COMPLETED}</span>
                </div>
              </div>
            </Card>

            {/* Time Remaining */}
            <Card motionCard className="text-center">
              <div className={`flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl ${
                projectProgress.isOverdue
                  ? 'bg-gradient-to-br from-red-500 to-red-600'
                  : 'bg-gradient-to-br from-green-500 to-green-600'
              } text-white`}>
                {projectProgress.isOverdue ? <AlertCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
              </div>
              <div className={`text-2xl font-bold mb-1 ${
                projectProgress.isOverdue ? 'text-[var(--danger)]' : 'text-[var(--fg)]'
              }`}>
                {projectProgress.isOverdue ? Math.abs(projectProgress.daysRemaining) : projectProgress.daysRemaining}
              </div>
              <div className="text-sm text-[var(--fg-muted)] mb-3">
                {projectProgress.isOverdue ? 'Days Overdue' : 'Days Remaining'}
              </div>
              <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                projectProgress.isOverdue
                  ? 'bg-[var(--danger-light)] text-[var(--danger)]'
                  : 'bg-[var(--success-light)] text-[var(--success)]'
              }`}>
                {projectProgress.isOverdue ? 'Overdue' : 'On Track'}
              </div>
            </Card>

            {/* Department Distribution */}
            <Card motionCard className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold text-[var(--fg)] mb-1">{Object.keys(teamStats).length}</div>
              <div className="text-sm text-[var(--fg-muted)] mb-3">Departments</div>
              <div className="flex flex-wrap items-center justify-center gap-1">
                {Object.entries(teamStats).slice(0, 3).map(([dept, count]) => (
                  <span key={dept} className="text-xs px-2 py-1 rounded-md bg-[var(--muted)] text-[var(--fg-muted)]">
                    {dept}: {count}
                  </span>
                ))}
              </div>
            </Card>
          </div>


          {/* Team Members Detail */}
          {assignedMembers.length > 0 && (
            <Card motionCard>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 text-white">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--fg)]">Team Members</h3>
                  <p className="text-sm text-[var(--fg-muted)]">Project team and their roles</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignedMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--muted-tint)] hover:bg-[var(--card)] transition-colors">
                    <Avatar alt={member.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[var(--fg)] truncate">{member.name}</div>
                      <div className="text-sm text-[var(--fg-muted)] truncate">{member.email}</div>
                      <div className="text-xs text-[var(--fg-muted)] mt-1">
                        {member.department || 'No Department'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === TAB_MEMBERS && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--fg)] mb-1">Project Team</h2>
              <p className="text-sm text-[var(--fg-muted)]">Manage team members assigned to this project</p>
            </div>
            {project && !isReadOnly && (
              <Button
                variant="primary"
                leftIcon={UserPlus}
                className="shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-200"
                onClick={() => {
                  setAddMembersSearch('');
                  setAddMembersSelected([]);
                  setAddMembersModalOpen(true);
                }}
              >
                Add members to this project
              </Button>
            )}
          </div>

          {assignedMembers.length > 0 ? (
            <Card>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignedMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--muted-tint)]">
                    <Avatar alt={member.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[var(--fg)] truncate">{member.name}</div>
                      <div className="text-sm text-[var(--fg-muted)] truncate">{member.email}</div>
                      <div className="text-xs text-[var(--fg-muted)]">{member.department || 'No Department'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card>
              <p className="text-sm text-[var(--fg-muted)] py-6 text-center">
                No members assigned yet. Click &quot;Add members to this project&quot; to add team members.
              </p>
            </Card>
          )}
        </div>
      )}

      {project && addMembersModalOpen && (() => {
        const assignedIds = project.assignedUserIds || [];
        const availableUsers = (users || [])
          .filter((u) => u.isActive !== false && u.role !== 'ADMIN' && !assignedIds.includes(u.id))
          .filter(
            (u) =>
              !addMembersSearch.trim() ||
              (u.name || '').toLowerCase().includes(addMembersSearch.toLowerCase()) ||
              (u.email || '').toLowerCase().includes(addMembersSearch.toLowerCase())
          );
        const toggleAdd = (userId) => {
          setAddMembersSelected((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
          );
        };
        const handleAddToProject = () => {
          if (addMembersSelected.length === 0) return;
          assignMembers(project.id, [...assignedIds, ...addMembersSelected]);
          setAddMembersModalOpen(false);
          setAddMembersSelected([]);
          setAddMembersSearch('');
        };
        return createPortal(
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-[var(--backdrop)] backdrop-blur-sm" onClick={() => setAddMembersModalOpen(false)} aria-hidden />
            <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-2xl)] flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
                <h2 className="text-lg font-semibold text-[var(--fg)]">Add members to this project</h2>
                <button
                  type="button"
                  onClick={() => setAddMembersModalOpen(false)}
                  className="flex items-center justify-center w-9 h-9 rounded-[var(--radius)] text-[var(--fg-muted)] hover:bg-[var(--muted)] hover:text-[var(--fg)] transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex flex-col min-h-0 flex-1">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-fg)]" />
                  <Input
                    type="text"
                    placeholder="Search by name or email..."
                    value={addMembersSearch}
                    onChange={(e) => setAddMembersSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)]/50 max-h-64 overflow-y-auto p-2 space-y-1 flex-1 min-h-0">
                  {availableUsers.length === 0 ? (
                    <p className="text-sm text-[var(--fg-muted)] py-6 text-center">
                      {addMembersSearch.trim() ? 'No matching users' : 'All employees are already in this project'}
                    </p>
                  ) : (
                    availableUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => toggleAdd(user.id)}
                        className={`w-full flex items-center gap-3 p-2 rounded-[var(--radius)] text-left transition-colors ${
                          addMembersSelected.includes(user.id)
                            ? 'bg-[var(--primary)]/10 border border-[var(--primary)]/30'
                            : 'hover:bg-[var(--muted)]/50 border border-transparent'
                        }`}
                      >
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
                            addMembersSelected.includes(user.id) ? 'bg-[var(--primary)] text-white' : 'bg-[var(--muted)] text-[var(--muted-fg)]'
                          }`}
                        >
                          {addMembersSelected.includes(user.id) ? <Check className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[var(--fg)] truncate">{user.name}</p>
                          <p className="text-xs text-[var(--fg-muted)] truncate">{user.email}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <p className="text-xs text-[var(--fg-muted)] mt-2 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {addMembersSelected.length} selected
                </p>
              </div>
              <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--bg)]/50 flex items-center justify-end gap-3 shrink-0 rounded-b-2xl">
                <Button type="button" variant="outline" onClick={() => setAddMembersModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleAddToProject}
                  disabled={addMembersSelected.length === 0}
                >
                  Add to project
                </Button>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {activeTab === TAB_TASKS && (
        <div className="space-y-4">
          {isReadOnly && <ReadOnlyBanner />}
          {assigneeNotifyMessage && (
            <div className="px-4 py-2 bg-[var(--info-light)] text-[var(--info-muted-fg)] rounded-lg text-sm">{assigneeNotifyMessage}</div>
          )}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex rounded border border-[var(--border)] overflow-hidden">
              <button
                type="button"
                onClick={() => setTasksView(VIEW_KANBAN)}
                className={`px-3 py-1.5 text-sm font-medium ${tasksView === VIEW_KANBAN ? 'bg-[var(--primary)] text-[var(--primary-fg)]' : 'bg-[var(--surface)] text-[var(--fg)] hover:bg-[var(--muted)]'}`}
              >
                Kanban
              </button>
              <button
                type="button"
                onClick={() => setTasksView(VIEW_TABLE)}
                className={`px-3 py-1.5 text-sm font-medium ${tasksView === VIEW_TABLE ? 'bg-[var(--primary)] text-[var(--primary-fg)]' : 'bg-[var(--surface)] text-[var(--fg)] hover:bg-[var(--muted)]'}`}
              >
                Table
              </button>
            </div>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => { setEditingTask(null); setTaskModalOpen(true); }}
                className="px-3 py-1.5 text-sm bg-[var(--primary)] text-[var(--primary-fg)] rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              >
                Create Task
              </button>
            )}
          </div>
          {tasksView === VIEW_KANBAN ? (
            <KanbanBoard
              tasks={projectTasks}
              users={users}
              onMoveStatus={handleMoveTaskStatus}
              onEdit={handleEditTask}
              readOnly={isReadOnly}
            />
          ) : (
            <TaskTable
              tasks={projectTasks}
              users={users}
              projects={projects}
              onEdit={handleEditTask}
              onMoveStatus={handleMoveTaskStatus}
              readOnly={isReadOnly}
            />
          )}
        </div>
      )}

      <ProjectModal
        open={modalOpen}
        mode="edit"
        project={project}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { }}
        onDelete={() => {
          setModalOpen(false);
          navigate('/admin/projects', { replace: true });
        }}
      />

      <TaskModal
        open={taskModalOpen}
        mode={editingTask ? 'edit' : 'create'}
        task={editingTask}
        preselectedProjectId={project?.id}
        onClose={() => { setTaskModalOpen(false); setEditingTask(null); }}
        onSuccess={() => { }}
        onAssigneeNotify={handleAssigneeNotify}
      />
    </div>
  );
}
