import { useState, useMemo, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore.jsx';
import { getSession } from '../../store/sessionStore.js';
import { todayKey, toLocalDayKey, addDaysToLocalKey } from '../../utils/date.js';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { ReadOnlyBanner } from '../../components/ui/ReadOnlyBanner.jsx';
import { ProjectTimeline } from '../../components/admin/projects/ProjectTimeline.jsx';
import { TaskTable } from '../../components/admin/tasks/TaskTable.jsx';
import { TaskModal } from '../../components/admin/tasks/TaskModal.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Input } from '../../components/ui/Input.jsx';
import {
  ArrowLeft,
  FolderKanban,
  Briefcase,
  CheckSquare,
  ListTodo,
  CalendarDays,
  Clock,
  Users,
  FolderOpen,
  Pause,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  FileText,
  CalendarClock,
  Send,
} from 'lucide-react';

const TASK_PAGE_SIZE_OPTIONS = [10, 50, 100, 200, 0];
const STATUS_LABELS = { ACTIVE: 'Active', ON_HOLD: 'On Hold', COMPLETED: 'Completed' };
const VIEW_KANBAN = 'kanban';
const VIEW_TABLE = 'table';

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|bmp|svg)(\?|$)/i;
function isImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (IMAGE_EXTENSIONS.test(trimmed)) return true;
  if (/^https?:\/\//i.test(trimmed) && /(picsum|unsplash|imgur|placeholder)/i.test(trimmed)) return true;
  return false;
}
function getFileName(item) {
  if (!item || typeof item !== 'string') return 'Attachment';
  const trimmed = item.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const name = new URL(trimmed).pathname.split('/').filter(Boolean).pop() || 'Link';
      return decodeURIComponent(name);
    } catch {
      return 'Link';
    }
  }
  return trimmed || 'File';
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

/**
 * Employee project detail: same layout as admin employee detail (/admin/users/:id).
 * Profile = project info + details grid + Tasks Overview KPIs (+ Attachments).
 * Projects = Timeline + Members. Tasks = date filter + KPIs + pagination + Kanban/table.
 */
export function EmployeeProjectDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { state, moveTaskStatus, deleteTask, addProjectMilestone, notifyAdminsProjectCompletionRequest } = useDataStore();
  const session = getSession();
  const sessionForRepo = session ? { userId: session.userId, role: session.role } : null;

  const [activeTab, setActiveTab] = useState('profile');
  const [tasksView, setTasksView] = useState(VIEW_KANBAN);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [assigneeNotifyMessage, setAssigneeNotifyMessage] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [dateFilterCustomStart, setDateFilterCustomStart] = useState('');
  const [dateFilterCustomEnd, setDateFilterCustomEnd] = useState('');
  const [tasksPageSize, setTasksPageSize] = useState(10);
  const [tasksCurrentPage, setTasksCurrentPage] = useState(1);
  const [completionRequestSent, setCompletionRequestSent] = useState(false);

  useEffect(() => {
    if (!session) navigate('/login', { replace: true });
  }, [session, navigate]);

  useEffect(() => {
    const tab = location.state?.tab;
    if (tab && ['profile', 'projects', 'timeline', 'tasks', 'attachments'].includes(tab)) setActiveTab(tab);
  }, [location.state?.tab]);

  useEffect(() => {
    setTasksCurrentPage(1);
  }, [dateFilter, dateFilterCustomStart, dateFilterCustomEnd, tasksPageSize]);

  const projects = state.projects || [];
  const users = state.users || [];
  const tasks = state.tasks || [];
  const project = projects.find((p) => p.id === id);

  const allProjectTasks = useMemo(
    () => (project ? tasks.filter((t) => t.projectId === project.id) : []),
    [project, tasks]
  );

  const projectTasks = useMemo(() => {
    if (!project || !session) return [];
    return allProjectTasks.filter((t) => t.assigneeId === session.userId);
  }, [project, allProjectTasks, session]);

  const today = todayKey();
  const tasksInDateRange = useMemo(() => {
    if (dateFilter === 'all') return projectTasks;
    let startKey, endKey = today;
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
      return projectTasks;
    }
    const inRange = (key) => key && key >= startKey && key <= endKey;
    return projectTasks.filter((t) => {
      const assignedKey = t.assignedAt ? toLocalDayKey(t.assignedAt) : '';
      const updatedKey = t.updatedAt ? toLocalDayKey(t.updatedAt) : '';
      return inRange(assignedKey) || inRange(updatedKey);
    });
  }, [projectTasks, dateFilter, dateFilterCustomStart, dateFilterCustomEnd, today]);

  const sortedTasks = useMemo(
    () => [...tasksInDateRange].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')),
    [tasksInDateRange]
  );

  const totalTasks = sortedTasks.length;
  const effectivePageSize = tasksPageSize === 0 ? totalTasks : Math.max(1, Number(tasksPageSize) || 10);
  const totalPages = Math.max(1, effectivePageSize >= totalTasks ? 1 : Math.ceil(totalTasks / effectivePageSize));
  const clampedPage = Math.min(Math.max(1, tasksCurrentPage), totalPages);
  const startIndex = (clampedPage - 1) * effectivePageSize;
  const displayedTasks = sortedTasks.slice(startIndex, startIndex + effectivePageSize);

  const taskCountByStatus = useMemo(() => {
    const m = { TODO: 0, IN_PROGRESS: 0, COMPLETED: 0 };
    allProjectTasks.forEach((t) => { if (t.status in m) m[t.status]++; });
    return m;
  }, [allProjectTasks]);

  const assignedMembers = useMemo(() => {
    if (!project || !Array.isArray(project.assignedUserIds)) return [];
    return project.assignedUserIds.map((uid) => users.find((u) => u.id === uid)).filter(Boolean);
  }, [project, users]);

  const isReadOnly = project && (project.status === 'ON_HOLD' || project.status === 'COMPLETED');
  const overdueCount = useMemo(
    () => tasksInDateRange.filter((t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'COMPLETED').length,
    [tasksInDateRange]
  );

  function handleMoveTaskStatus(taskId, newStatus) {
    if (!sessionForRepo || isReadOnly) return;
    moveTaskStatus(taskId, newStatus, sessionForRepo);
  }

  function handleEditTask(task) {
    setEditingTask(task);
    setTaskModalOpen(true);
  }

  function handleDeleteTask(task) {
    if (!sessionForRepo || task.createdById !== session.userId || isReadOnly) return;
    deleteTask(task.id, sessionForRepo);
  }

  function handleAssigneeNotify(message) {
    setAssigneeNotifyMessage(message || '');
    setTimeout(() => setAssigneeNotifyMessage(''), 4000);
  }

  if (!session) return null;

  if (!project) {
    return (
      <div className="max-w-6xl">
        <p className="text-[var(--danger)] font-medium">Project not found.</p>
        <Link to="/app/projects" className="text-[var(--accent)] hover:underline mt-2 inline-block transition-colors">← Back to My Projects</Link>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FolderKanban },
    { id: 'projects', label: 'Members', icon: Users },
    { id: 'timeline', label: 'Timeline', icon: CalendarClock },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'attachments', label: 'Attachments', icon: Paperclip },
  ];

  return (
    <div className="max-w-6xl space-y-6">
      {/* Breadcrumb - same as admin employee detail */}
      <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Link to="/app/projects" className="text-gray-600 hover:text-blue-600 transition-colors inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4 shrink-0" />
          My Projects
        </Link>
        <span className="text-gray-600" aria-hidden>/</span>
        <span className="font-medium text-gray-900 truncate max-w-[200px] sm:max-w-none" aria-current="page">
          {project.name}
        </span>
      </nav>

      {/* Tabs - same style as admin employee detail */}
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

      {/* Profile tab - same structure as employee detail: hero + details grid + KPI cards */}
      {activeTab === 'profile' && (
        <Card padding="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0" aria-hidden>
              <FolderKanban className="w-10 h-10" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{project.name}</h1>
              <p className="text-gray-600 mt-0.5">{project.description || 'No description'}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <StatusBadge status={project.status} />
                <span className="text-[var(--fg-muted)]">{STATUS_LABELS[project.status] ?? project.status}</span>
                <span className="text-gray-500">·</span>
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {formatDate(project.startDate)} – {formatDate(project.endDate)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-3">Project details</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
              <div>
                <dt className="text-xs text-gray-600">Status</dt>
                <dd className="mt-0.5">
                  <Badge variant={project.status === 'ACTIVE' ? 'success' : project.status === 'ON_HOLD' ? 'warning' : 'neutral'}>
                    {STATUS_LABELS[project.status] ?? project.status}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-600">Start date</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{formatDate(project.startDate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-600">End date</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{formatDate(project.endDate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-600">Team size</dt>
                <dd className="mt-0.5 font-medium text-gray-900">{assignedMembers.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-600">Total tasks</dt>
                <dd className="mt-0.5 font-medium text-gray-900">{allProjectTasks.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-600">My tasks</dt>
                <dd className="mt-0.5 font-medium text-gray-900">{projectTasks.length}</dd>
              </div>
            </dl>
          </div>

          {/* Request to mark project as completed (employee → notify admins) */}
          {project.status === 'ACTIVE' && (project.assignedUserIds || []).includes(session?.userId) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">Mark project complete</h2>
              <p className="text-sm text-gray-600 mb-3">
                If you have completed this project, you can request an admin to set its status to Completed. All admins will be notified.
              </p>
              {completionRequestSent ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--success-muted)] text-[var(--success-muted-fg)] text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Request sent. Admins have been notified.
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const requesterName = users.find((u) => u.id === session.userId)?.name || 'An employee';
                    notifyAdminsProjectCompletionRequest(project.id, project.name, session.userId, requesterName);
                    setCompletionRequestSent(true);
                  }}
                  className="inline-flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Request to mark project as completed
                </Button>
              )}
            </div>
          )}

          {/* Tasks Overview KPI cards - same style as employee Projects Overview */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <section aria-labelledby="project-tasks-kpis">
              <h2 id="project-tasks-kpis" className="flex items-center gap-2 text-lg font-semibold text-[var(--fg)] mb-0.5">
                <ListTodo className="w-5 h-5 text-[var(--accent)] shrink-0" />
                Tasks Overview
              </h2>
              <p className="text-sm text-[var(--fg-muted)] mb-4">Tasks in this project (yours and team)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
                <div className="block group">
                  <div className="rounded-xl border-2 border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] hover:border-[var(--border-focus)] transition-all duration-300 h-full group-hover:-translate-y-1" style={{ background: 'var(--accent-light)' }}>
                    <div className="relative z-10 p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-1">Total</p>
                          <p className="text-2xl sm:text-3xl font-bold tabular-nums truncate" style={{ color: 'var(--accent)' }}>{allProjectTasks.length}</p>
                        </div>
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 opacity-90" style={{ background: 'var(--accent)', color: 'white' }}>
                          <ListTodo className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="block group">
                  <div className="rounded-xl border-2 border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 h-full group-hover:-translate-y-1" style={{ background: 'var(--success-light)' }}>
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-1">To do</p>
                          <p className="text-2xl sm:text-3xl font-bold tabular-nums truncate" style={{ color: 'var(--success)' }}>{taskCountByStatus.TODO}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center" style={{ background: 'var(--success)', color: 'white' }}>
                          <FolderOpen className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="block group">
                  <div className="rounded-xl border-2 border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 h-full group-hover:-translate-y-1" style={{ background: 'var(--warning-light)' }}>
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-1">In progress</p>
                          <p className="text-2xl sm:text-3xl font-bold tabular-nums truncate" style={{ color: 'var(--warning)' }}>{taskCountByStatus.IN_PROGRESS}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center" style={{ background: 'var(--warning)', color: 'white' }}>
                          <Pause className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="block group">
                  <div className="rounded-xl border-2 border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 h-full group-hover:-translate-y-1" style={{ background: 'var(--purple-light)' }}>
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-1">Done</p>
                          <p className="text-2xl sm:text-3xl font-bold tabular-nums truncate" style={{ color: 'var(--purple)' }}>{taskCountByStatus.COMPLETED}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center" style={{ background: 'var(--purple)', color: 'white' }}>
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="block group">
                  <div className="rounded-xl border-2 border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 h-full group-hover:-translate-y-1" style={{ background: 'var(--danger-light)' }}>
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-1">Overdue</p>
                          <p className="text-2xl sm:text-3xl font-bold tabular-nums truncate" style={{ color: 'var(--danger)' }}>
                            {allProjectTasks.filter((t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'COMPLETED').length}
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center" style={{ background: 'var(--danger)', color: 'white' }}>
                          <Clock className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </Card>
      )}

      {/* Members tab - only project team */}
      {activeTab === 'projects' && (
        <Card>
            <h2 className="text-lg font-semibold text-[var(--fg)] mb-2 flex items-center gap-2">
              <Users className="w-5 h-5 text-[var(--accent)]" />
              Project Team
            </h2>
            <p className="text-sm text-[var(--fg-muted)] mb-4">People working on this project. Only admins can add or remove members.</p>
            {assignedMembers.length > 0 ? (
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
            ) : (
              <p className="text-sm text-[var(--fg-muted)] py-6 text-center">No members assigned yet. Ask your admin to add team members.</p>
            )}
          </Card>
      )}

      {/* Timeline tab - only timeline, no other content */}
      {activeTab === 'timeline' && (
        <Card>
          <section aria-labelledby="project-timeline-heading">
            <h2 id="project-timeline-heading" className="sr-only">Project Timeline</h2>
            <ProjectTimeline
              project={project}
              users={users}
              tasks={allProjectTasks}
              addProjectMilestone={addProjectMilestone}
              isReadOnly={isReadOnly}
              projectsBasePath="/app"
            />
          </section>
        </Card>
      )}

      {/* Attachments tab - only attachments, no other content */}
      {activeTab === 'attachments' && (
        <Card>
          <section aria-labelledby="project-attachments-heading">
            <h2 id="project-attachments-heading" className="flex items-center gap-2 text-lg font-semibold text-[var(--fg)] mb-2">
              <Paperclip className="w-5 h-5 text-[var(--accent)]" />
              Attachments
            </h2>
            <p className="text-sm text-[var(--fg-muted)] mb-4">Files and images linked to this project.</p>
            {project.attachments && project.attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {(project.attachments || []).map((item, index) => {
                  const url = typeof item === 'string' && item.trim().startsWith('http') ? item.trim() : null;
                  const isImage = url && isImageUrl(item);
                  const name = getFileName(item);
                  if (isImage) {
                    return (
                      <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-[var(--border)] overflow-hidden hover:border-[var(--accent)] transition-colors">
                        <div className="aspect-video bg-[var(--muted)]">
                          <img src={url} alt={name} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                        <div className="p-2 border-t border-[var(--border)]">
                          <span className="text-sm font-medium text-[var(--fg)] truncate block">{name}</span>
                        </div>
                      </a>
                    );
                  }
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/30">
                      <FileText className="w-8 h-8 text-[var(--accent)] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--fg)] truncate">{name}</p>
                        {url && (
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--primary)] hover:underline">Open link</a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--muted)]/20 p-8 text-center">
                <Paperclip className="w-12 h-12 text-[var(--fg-muted)] mx-auto mb-3" />
                <p className="text-sm text-[var(--fg-muted)]">No attachments for this project yet.</p>
              </div>
            )}
          </section>
        </Card>
      )}

      {/* Tasks tab - same as admin employee: date filter + KPIs + pagination + Kanban */}
      {activeTab === 'tasks' && (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-[var(--fg)] flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-[var(--accent)]" />
              Tasks
            </h2>
          </div>

          {/* Task summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl border-2 border-[var(--border)] p-4 bg-[var(--accent-light)]">
              <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-1">Total</p>
              <p className="text-2xl font-bold tabular-nums text-[var(--accent)]">{tasksInDateRange.length}</p>
            </div>
            <div className="rounded-xl border-2 border-[var(--border)] p-4 bg-[var(--success-light)]">
              <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-1">Completed</p>
              <p className="text-2xl font-bold tabular-nums text-[var(--success)]">{tasksInDateRange.filter((t) => t.status === 'COMPLETED').length}</p>
            </div>
            <div className="rounded-xl border-2 border-[var(--border)] p-4 bg-[var(--danger-light)]">
              <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-1">Overdue</p>
              <p className="text-2xl font-bold tabular-nums text-[var(--danger)]">{overdueCount}</p>
            </div>
            <div className="rounded-xl border-2 border-[var(--border)] p-4 bg-[var(--warning-light)]">
              <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-1">In progress</p>
              <p className="text-2xl font-bold tabular-nums text-[var(--warning)]">{tasksInDateRange.filter((t) => t.status === 'IN_PROGRESS').length}</p>
            </div>
          </div>

          {/* Date filter */}
          <div className="bg-[var(--muted)]/30 rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--fg)]">Filter by time period:</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Select
                  id="project-tasks-date-filter"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="min-w-[160px]"
                  aria-label="Filter tasks by date"
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
                      value={dateFilterCustomStart}
                      onChange={(e) => setDateFilterCustomStart(e.target.value)}
                      className="min-w-[130px]"
                      aria-label={dateFilter === 'specific' ? 'Select date' : 'From date'}
                    />
                    {dateFilter === 'custom' && (
                      <>
                        <span className="text-[var(--fg-muted)] text-sm">to</span>
                        <Input type="date" value={dateFilterCustomEnd} onChange={(e) => setDateFilterCustomEnd(e.target.value)} className="min-w-[130px]" aria-label="To date" />
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pagination */}
          {tasksInDateRange.length > 0 && (
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

          {isReadOnly && <ReadOnlyBanner />}
          {assigneeNotifyMessage && (
            <div className="px-4 py-2 bg-[var(--info-light)] text-[var(--info-muted-fg)] rounded-lg text-sm mb-4">{assigneeNotifyMessage}</div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
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
              <Button variant="primary" size="sm" onClick={() => { setEditingTask(null); setTaskModalOpen(true); }}>
                Create Task
              </Button>
            )}
          </div>

          {sortedTasks.length === 0 ? (
            <div className="rounded-xl bg-gradient-to-br from-[var(--muted)]/30 to-[var(--muted)]/50 border-2 border-dashed border-[var(--border)] p-8 text-center">
              <ListTodo className="w-12 h-12 text-[var(--fg-muted)] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[var(--fg)] mb-2">No tasks found</h3>
              <p className="text-sm text-[var(--fg-muted)]">
                {dateFilter === 'all' ? 'No tasks assigned to you in this project.' : 'No tasks in this time period. Try "All time".'}
              </p>
              {dateFilter !== 'all' && (
                <button onClick={() => setDateFilter('all')} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-[var(--accent-fg)] rounded-lg text-sm font-medium">
                  Show All Time
                </button>
              )}
            </div>
          ) : tasksView === VIEW_KANBAN ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['TODO', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
                  <div key={status} className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
                      <div className={`w-3 h-3 rounded-full ${status === 'TODO' ? 'bg-gray-400' : status === 'IN_PROGRESS' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                      <h3 className="font-medium text-[var(--fg)]">{status === 'TODO' ? 'To Do' : status === 'IN_PROGRESS' ? 'In Progress' : 'Completed'}</h3>
                      <span className="text-xs text-[var(--fg-muted)] bg-[var(--muted)] px-2 py-1 rounded-full">
                        {sortedTasks.filter((t) => t.status === status).length}
                      </span>
                    </div>
                    <div className="space-y-3 min-h-[200px]">
                      {sortedTasks.filter((t) => t.status === status).map((t) => (
                        <div
                          key={t.id}
                          className="block rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 hover:border-[var(--accent)] hover:shadow-sm transition-colors cursor-pointer"
                          onClick={() => handleEditTask(t)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && handleEditTask(t)}
                        >
                          <h4 className="font-medium text-[var(--fg)] mb-2 text-sm">{t.title || 'Untitled task'}</h4>
                          <div className="space-y-1 text-xs text-[var(--fg-muted)]">
                            {t.assignedAt && <div>Assigned: {formatDate(t.assignedAt)}</div>}
                            {t.deadline && <div>Due: {formatDate(t.deadline)}</div>}
                          </div>
                          {t.deadline && new Date(t.deadline) < new Date() && t.status !== 'COMPLETED' && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                              <span className="w-2 h-2 bg-red-500 rounded-full" />
                              <span className="font-medium">Overdue</span>
                            </div>
                          )}
                        </div>
                      ))}
                      {sortedTasks.filter((t) => t.status === status).length === 0 && (
                        <div className="text-center py-8 text-[var(--fg-muted)] text-sm border-2 border-dashed border-[var(--border)] rounded-lg">None</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <TaskTable
                tasks={displayedTasks}
                users={users}
                projects={projects}
                onEdit={handleEditTask}
                onMoveStatus={handleMoveTaskStatus}
                readOnly={isReadOnly}
                onDelete={handleDeleteTask}
                canDelete={(task) => task.createdById === session.userId}
              />
              {totalPages > 1 && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                  <span className="text-sm text-[var(--fg-muted)]">Page {clampedPage} of {totalPages}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setTasksCurrentPage((p) => Math.max(1, p - 1))} disabled={clampedPage <= 1} className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] disabled:opacity-50"> <ChevronLeft className="w-4 h-4" /> </button>
                    <button type="button" onClick={() => setTasksCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={clampedPage >= totalPages} className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] disabled:opacity-50"> <ChevronRight className="w-4 h-4" /> </button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      <TaskModal
        open={taskModalOpen}
        mode={editingTask ? 'edit' : 'create'}
        task={editingTask}
        preselectedProjectId={project?.id}
        onClose={() => { setTaskModalOpen(false); setEditingTask(null); }}
        onSuccess={() => {}}
        onAssigneeNotify={handleAssigneeNotify}
        employeeMode
      />
    </div>
  );
}
