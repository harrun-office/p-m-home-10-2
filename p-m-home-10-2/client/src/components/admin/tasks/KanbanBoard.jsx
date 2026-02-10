import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { PriorityBadge } from './PriorityBadge.jsx';
import { MotionCard } from '../../motion/MotionCard.jsx';
import { daysUntil, isOverdue } from '../../../utils/date.js';
import { MoreHorizontal, Edit, Trash2, Calendar, Tag, GripVertical, CheckSquare, X, Eye, Circle, Loader2, CheckCircle2 } from 'lucide-react';
import { IconButton } from '../../ui/IconButton.jsx';
import { Button } from '../../ui/Button.jsx';
import { Skeleton } from '../../ui/Skeleton.jsx';

const COLUMNS = [
  {
    id: 'TODO',
    label: 'To Do',
    icon: Circle,
    // Neutral column background so it matches the overall theme in light and dark mode
    colorClass: 'bg-[var(--card)] border-[var(--border)]',
  },
  {
    id: 'IN_PROGRESS',
    label: 'In Progress',
    icon: Loader2,
    colorClass: 'bg-[var(--card)] border-[var(--border)]',
  },
  {
    id: 'COMPLETED',
    label: 'Completed',
    icon: CheckCircle2,
    colorClass: 'bg-[var(--card)] border-[var(--border)]',
  },
];

// Enhanced project color palette with more sophisticated colors and gradients
const PROJECT_COLORS = [
  // Frontend/UI Projects - Warm, creative colors
  { bg: 'bg-[var(--danger-light)]', border: 'border-[var(--danger-muted)]', shadow: 'shadow-[var(--shadow-sm)]', text: 'text-[var(--danger-muted-fg)]' },
  { bg: 'bg-[var(--warning-light)]', border: 'border-[var(--warning-muted)]', shadow: 'shadow-[var(--shadow-sm)]', text: 'text-[var(--warning-muted-fg)]' },
  { bg: 'bg-[var(--warning-light)]', border: 'border-[var(--warning-muted)]', shadow: 'shadow-[var(--shadow-sm)]', text: 'text-[var(--warning-muted-fg)]' },

  // Backend/API Projects - Cool, technical colors
  { bg: 'bg-[var(--info-light)]', border: 'border-[var(--info-muted)]', shadow: 'shadow-[var(--shadow-sm)]', text: 'text-[var(--info-muted-fg)]' },
  { bg: 'bg-[var(--info-light)]', border: 'border-[var(--info-muted)]', shadow: 'shadow-[var(--shadow-sm)]', text: 'text-[var(--info-muted-fg)]' },
  { bg: 'bg-[var(--muted)]', border: 'border-[var(--border)]', shadow: 'shadow-[var(--shadow-sm)]', text: 'text-[var(--fg-muted)]' },

  // Business/Sales Projects - Professional colors
  { bg: 'bg-[var(--success-light)]', border: 'border-[var(--success-muted)]', shadow: 'shadow-[var(--shadow-sm)]', text: 'text-[var(--success-muted-fg)]' },
  { bg: 'bg-[var(--purple-light)]', border: 'border-[var(--purple-muted)]', shadow: 'shadow-[var(--shadow-sm)]', text: 'text-[var(--purple-fg)]' },
  { bg: 'bg-[var(--danger-light)]', border: 'border-[var(--danger-muted)]', shadow: 'shadow-[var(--shadow-sm)]', text: 'text-[var(--danger-muted-fg)]' },
];

/**
 * Enhanced Kanban board with improved UI/UX and drag & drop.
 * Props: tasks, users, projects, onMoveStatus(taskId, newStatus), onEdit(task), readOnly, getTaskReadOnly(task).
 * onDelete(task), canDelete(task) optional - show Delete when canDelete returns true.
 */
export function KanbanBoard({
  tasks = [],
  users = [],
  projects = [],
  onMoveStatus,
  onEdit,
  readOnly,
  getTaskReadOnly,
  onDelete,
  canDelete,
  getTaskDisplayId,
  selectedTasks = new Set(),
  onSelectTask,
  onSelectAll,
  onBulkStatusChange,
  onClearSelection,
  loading = false,
  onNavigateToProject,
  selectedProjects = new Set(),
  onSelectProject
}) {
  const [quickActionsTask, setQuickActionsTask] = useState(null);

  function handleDragEnd(result) {
    const { destination, source, draggableId } = result;

    // Dropped outside a droppable area
    if (!destination) return;

    // Dropped in the same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Move the task to the new status
    const newStatus = destination.droppableId;
    onMoveStatus && onMoveStatus(draggableId, newStatus);
  }

  const byStatus = useMemo(() => {
    const m = { TODO: [], IN_PROGRESS: [], COMPLETED: [] };
    tasks.forEach((t) => {
      if (m[t.status]) m[t.status].push(t);
    });
    return m;
  }, [tasks]);

  const projectColorMap = useMemo(() => {
    const map = {};
    projects.forEach((project, index) => {
      map[project.id] = PROJECT_COLORS[index % PROJECT_COLORS.length];
    });
    return map;
  }, [projects]);

  function getUserName(userId) {
    const u = users.find((x) => x.id === userId);
    return u ? u.name : '—';
  }

  function getUserInitials(userId) {
    const u = users.find((x) => x.id === userId);
    if (!u) return '?';
    return u.name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  function getProjectName(projectId) {
    const p = projects.find((x) => x.id === projectId);
    return p ? p.name : '—';
  }

  function getDeadlineStatus(task) {
    if (!task.deadline) return null;

    const days = daysUntil(task.deadline);
    const overdue = isOverdue(task.deadline);

    if (overdue) {
      return { status: 'overdue', text: `${Math.abs(days)} days overdue`, color: 'text-[var(--danger-muted-fg)] bg-[var(--danger-muted)] border-[var(--danger)]/30' };
    } else if (days === 0) {
      return { status: 'due-today', text: 'Due today', color: 'text-[var(--warning-muted-fg)] bg-[var(--warning-muted)] border-[var(--warning)]/30' };
    } else if (days <= 2) {
      return { status: 'due-soon', text: `Due in ${days} day${days > 1 ? 's' : ''}`, color: 'text-[var(--warning-muted-fg)] bg-[var(--warning-light)] border-[var(--warning)]/20' };
    } else if (days <= 7) {
      return { status: 'due-week', text: `Due in ${days} days`, color: 'text-[var(--info-muted-fg)] bg-[var(--info-muted)] border-[var(--info)]/20' };
    }
    return null;
  }

  function truncateText(text, maxLength = 80) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  function renderSkeletonCard() {
    return (
      <div className="bg-[var(--card)] rounded-[var(--radius-lg)] border border-[var(--border)] p-4 shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-3" />
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="w-6 h-6 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-5 w-12" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {/* Bulk Actions Bar */}
      {selectedTasks.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="bg-[var(--primary-muted)] border border-[var(--primary)]/20 rounded-[var(--radius-lg)] px-4 py-3 mb-5 flex flex-wrap items-center justify-between gap-3 shadow-[var(--shadow-sm)]"
        >
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-[var(--primary)] shrink-0" aria-hidden />
            <span className="text-sm font-medium text-[var(--primary-muted-fg)]">
              {selectedTasks.size} task{selectedTasks.size > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => onBulkStatusChange && onBulkStatusChange(e.target.value)}
              className="text-sm rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--border-focus)]"
              defaultValue=""
              aria-label="Bulk move status"
            >
              <option value="" disabled>Bulk actions...</option>
              <option value="TODO">Move to To Do</option>
              <option value="IN_PROGRESS">Move to In Progress</option>
              <option value="COMPLETED">Move to Completed</option>
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onClearSelection && onClearSelection()}
              className="text-[var(--primary-muted-fg)] hover:bg-[var(--primary)]/10"
            >
              <X className="w-4 h-4 mr-1" aria-hidden />
              Clear
            </Button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6" role="list" aria-label="Task columns">
        {COLUMNS.map((col) => {
          const columnTasks = byStatus[col.id] || [];
          const ColumnIcon = col.icon;
          return (
            <Droppable key={col.id} droppableId={col.id}>
              {(provided, snapshot) => (
                <section
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`rounded-[var(--radius-xl)] border-2 p-4 sm:p-5 min-h-[320px] sm:min-h-[420px] transition-all duration-200 ${col.colorClass} ${snapshot.isDraggingOver ? 'ring-2 ring-[var(--ring)] ring-offset-2 ring-offset-[var(--bg)]' : ''
                    }`}
                  aria-label={`${col.label}, ${columnTasks.length} task${columnTasks.length !== 1 ? 's' : ''}`}
                >
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => {
                          const allSelected = columnTasks.every(task => selectedTasks.has(task.id));
                          if (allSelected) {
                            columnTasks.forEach(task => {
                              if (selectedTasks.has(task.id)) onSelectTask && onSelectTask(task.id, false);
                            });
                          } else {
                            columnTasks.forEach(task => {
                              if (!selectedTasks.has(task.id)) onSelectTask && onSelectTask(task.id, true);
                            });
                          }
                        }}
                        className="flex items-center justify-center w-7 h-7 shrink-0 rounded-[var(--radius)] border-2 border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)] hover:bg-[var(--hover-tint)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                        aria-label={`Select all tasks in ${col.label}`}
                      >
                        {columnTasks.length > 0 && columnTasks.every(task => selectedTasks.has(task.id)) ? (
                          <CheckSquare className="w-4 h-4 text-[var(--primary)]" aria-hidden />
                        ) : null}
                      </button>
                      <ColumnIcon className="w-5 h-5 shrink-0 text-[var(--fg-muted)]" aria-hidden />
                      <h3 className="text-base font-semibold text-[var(--fg)] truncate">{col.label}</h3>
                    </div>
                    <span className="flex h-8 min-w-[2rem] items-center justify-center rounded-full bg-[var(--card)]/90 border border-[var(--border)] px-2.5 text-sm font-medium text-[var(--fg)] tabular-nums shadow-[var(--shadow-sm)]">
                      {columnTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, index) => (
                        <div key={`skeleton-${col.id}-${index}`}>{renderSkeletonCard()}</div>
                      ))
                    ) : columnTasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--border)] bg-[var(--card)]/50">
                        {col.id === 'COMPLETED' ? (
                          <>
                            <span className="text-3xl mb-2" aria-hidden>✓</span>
                            <p className="text-sm font-medium text-[var(--fg)]">All caught up!</p>
                            <p className="text-xs text-[var(--muted-fg)] mt-0.5">Great job completing your tasks</p>
                          </>
                        ) : (
                          <p className="text-sm text-[var(--muted-fg)]">No tasks in {col.label.toLowerCase()}</p>
                        )}
                      </div>
                    ) : (
                      columnTasks.map((task, index) => {
                        const taskReadOnly = getTaskReadOnly ? getTaskReadOnly(task) : readOnly;
                        const deadlineStatus = getDeadlineStatus(task);
                        const projectColor = projectColorMap[task.projectId] || { bg: 'bg-[var(--muted)]', border: 'border-[var(--border)]', shadow: '', text: 'text-[var(--fg-muted)]' };

                        return (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                            isDragDisabled={taskReadOnly}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="group relative"
                              >
                                <div
                                  className={`relative overflow-hidden bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-[var(--shadow)] hover:shadow-[var(--shadow-md)] transition-all duration-200 cursor-pointer hover:border-[var(--border-focus)] ${snapshot.isDragging ? 'shadow-[var(--shadow-xl)] scale-[1.02] opacity-95 z-10' : ''
                                    } ${selectedTasks.has(task.id) ? 'ring-2 ring-[var(--ring)] ring-offset-2 ring-offset-[var(--bg)]' : ''}`}
                                  onClick={(e) => {
                                    if (e.target.closest('button, select, input, textarea, [role="menu"]')) return;
                                    if (onNavigateToProject) onNavigateToProject(task.projectId);
                                  }}
                                >
                                  {/* Left accent bar (project color) */}
                                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${projectColor.bg} ${projectColor.border} border-r`} aria-hidden />

                                  <div className="pl-4 pr-3 py-3.5">
                                    {/* Header: project + ID + actions */}
                                    <div className="flex items-center justify-between gap-3 mb-2.5">
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${projectColor.text} ${projectColor.bg} ${projectColor.border} shrink-0`}>
                                          {getProjectName(task.projectId)}
                                        </span>
                                        {getTaskDisplayId && (
                                          <span className="text-[10px] text-[var(--muted-fg)] tabular-nums shrink-0">
                                            {getTaskDisplayId(task)}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectTask && onSelectTask(task.id, !selectedTasks.has(task.id));
                                          }}
                                          className={`flex items-center justify-center w-6 h-6 rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${selectedTasks.has(task.id)
                                              ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-fg)]'
                                              : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)] hover:bg-[var(--hover-tint)]'
                                            }`}
                                          aria-label={`Select task ${task.title}`}
                                        >
                                          {selectedTasks.has(task.id) && <CheckSquare className="w-3.5 h-3.5" aria-hidden />}
                                        </button>
                                        {!taskReadOnly && (
                                          <div
                                            {...provided.dragHandleProps}
                                            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-[var(--muted)] opacity-60 group-hover:opacity-100 transition-opacity"
                                            aria-label="Drag to reorder"
                                          >
                                            <GripVertical className="w-4 h-4 text-[var(--muted-fg)]" aria-hidden />
                                          </div>
                                        )}
                                        {!taskReadOnly && (
                                          <div className="relative">
                                            <IconButton
                                              icon={MoreHorizontal}
                                              variant="ghost"
                                              size="sm"
                                              aria-label="Task actions"
                                              aria-haspopup="true"
                                              aria-expanded={quickActionsTask === task.id}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setQuickActionsTask(quickActionsTask === task.id ? null : task.id);
                                              }}
                                              className="opacity-60 group-hover:opacity-100 transition-opacity text-[var(--muted-fg)]"
                                            />
                                            <AnimatePresence>
                                              {quickActionsTask === task.id && (
                                                <motion.div
                                                  initial={{ opacity: 0, scale: 0.96 }}
                                                  animate={{ opacity: 1, scale: 1 }}
                                                  exit={{ opacity: 0, scale: 0.96 }}
                                                  role="menu"
                                                  className="absolute right-0 top-full mt-1 z-20 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] py-1 min-w-[160px]"
                                                >
                                                  <button
                                                    role="menuitem"
                                                    onClick={() => {
                                                      onNavigateToProject && onNavigateToProject(task.projectId);
                                                      setQuickActionsTask(null);
                                                    }}
                                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--fg)] hover:bg-[var(--muted)]"
                                                  >
                                                    <Eye className="w-4 h-4 shrink-0" />
                                                    View in project
                                                  </button>
                                                  <button
                                                    role="menuitem"
                                                    onClick={() => {
                                                      onEdit && onEdit(task);
                                                      setQuickActionsTask(null);
                                                    }}
                                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--fg)] hover:bg-[var(--muted)]"
                                                  >
                                                    <Edit className="w-4 h-4 shrink-0" />
                                                    Edit
                                                  </button>
                                                  <div className="border-t border-[var(--border)] my-1" />
                                                  <div role="menuitem" className="px-3 py-1.5 text-xs font-medium text-[var(--muted-fg)]">Move to</div>
                                                  <select
                                                    value={task.status}
                                                    onChange={(e) => {
                                                      onMoveStatus && onMoveStatus(task.id, e.target.value);
                                                      setQuickActionsTask(null);
                                                    }}
                                                    className="w-full px-3 py-2 text-sm text-[var(--fg)] hover:bg-[var(--muted)] border-none bg-transparent cursor-pointer focus:outline-none focus:ring-0"
                                                  >
                                                    <option value="TODO">To Do</option>
                                                    <option value="IN_PROGRESS">In Progress</option>
                                                    <option value="COMPLETED">Completed</option>
                                                  </select>
                                                  {canDelete && canDelete(task) && onDelete && (
                                                    <button
                                                      role="menuitem"
                                                      onClick={() => {
                                                        onDelete(task);
                                                        setQuickActionsTask(null);
                                                      }}
                                                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--danger)] hover:bg-[var(--danger-muted)]"
                                                    >
                                                      <Trash2 className="w-4 h-4 shrink-0" />
                                                      Delete
                                                    </button>
                                                  )}
                                                </motion.div>
                                              )}
                                            </AnimatePresence>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Title — primary focus */}
                                    <h4 className="font-semibold text-[var(--fg)] text-[15px] leading-snug line-clamp-2 mb-1">
                                      {task.title}
                                    </h4>

                                    {task.description && (
                                      <p className="text-[13px] text-[var(--fg-secondary)] line-clamp-2 leading-relaxed mb-3">
                                        {truncateText(task.description, 90)}
                                      </p>
                                    )}

                                    {/* Deadline pill when present */}
                                    {deadlineStatus && (
                                      <div className="mb-3">
                                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md border ${deadlineStatus.color}`}>
                                          <Calendar className="w-3 h-3 shrink-0" aria-hidden />
                                          {deadlineStatus.text}
                                        </span>
                                      </div>
                                    )}

                                    {/* Footer: assignee + priority */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)]">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-6 h-6 rounded-full bg-[var(--muted)] flex items-center justify-center text-[10px] font-semibold text-[var(--fg)] shrink-0">
                                          {getUserInitials(task.assigneeId)}
                                        </div>
                                        <span className="text-xs text-[var(--fg-secondary)] truncate">{getUserName(task.assigneeId)}</span>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <PriorityBadge priority={task.priority} />
                                      </div>
                                    </div>

                                    {/* Dates: assigned + end */}
                                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] text-[var(--muted-fg)]">
                                      <span className="tabular-nums">
                                        Assigned: {task.assignedAt ? task.assignedAt.slice(0, 10) : '—'}
                                      </span>
                                      <span className="tabular-nums">
                                        End: {task.deadline ? task.deadline.slice(0, 10) : '—'}
                                      </span>
                                    </div>

                                    {/* Tags row */}
                                    {(task.tags || []).length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {(task.tags || []).includes('Learning') && (
                                          <span className="inline-flex items-center gap-0.5 rounded-md bg-[var(--info-muted)] text-[var(--info-muted-fg)] px-1.5 py-0.5 text-[10px] font-medium">
                                            <Tag className="w-2.5 h-2.5 shrink-0" />
                                            Learning
                                          </span>
                                        )}
                                        {(task.tags || []).filter((t) => t !== 'Learning').map((tag) => (
                                          <span key={tag} className="inline-flex items-center gap-0.5 rounded-md bg-[var(--muted)] text-[var(--fg-secondary)] px-1.5 py-0.5 text-[10px] font-medium">
                                            <Tag className="w-2.5 h-2.5 shrink-0" />
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    {taskReadOnly && (
                                      <div className="mt-2 text-[10px] text-[var(--muted-fg)] bg-[var(--muted)] px-2 py-1 rounded-md">
                                        Read-only · Project {projects.find(p => p.id === task.projectId)?.status?.toLowerCase()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })
                    )}
                    {provided.placeholder}
                  </div>
                </section>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}
