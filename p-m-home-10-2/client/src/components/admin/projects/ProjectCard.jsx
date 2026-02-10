import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { StatusBadge } from '../../ui/StatusBadge.jsx';
import { Progress } from '../../ui/Progress.jsx';
import { Avatar } from '../../ui/Avatar.jsx';
import { ActionMenu } from '../../ui/ActionMenu.jsx';
import {
  Calendar,
  Users,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Check
} from 'lucide-react';
import { IconButton } from '../../ui/IconButton.jsx';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';

// Status-based themes with gradients and colors
const STATUS_THEMES = {
  ACTIVE: {
    bg: 'bg-[var(--success-light)]',
    border: 'border-[var(--success-muted)]',
    shadow: 'shadow-[var(--shadow-sm)]',
    icon: PlayCircle,
    iconColor: 'text-[var(--success)]',
    labelColor: 'text-[var(--success-muted-fg)]',
    progressColor: 'bg-[var(--success)]'
  },
  ON_HOLD: {
    bg: 'bg-[var(--warning-light)]',
    border: 'border-[var(--warning-muted)]',
    shadow: 'shadow-[var(--shadow-sm)]',
    icon: PauseCircle,
    iconColor: 'text-[var(--warning)]',
    labelColor: 'text-[var(--warning-muted-fg)]',
    progressColor: 'bg-[var(--warning)]'
  },
  COMPLETED: {
    bg: 'bg-[var(--muted)]',
    border: 'border-[var(--border)]',
    shadow: 'shadow-[var(--shadow-sm)]',
    icon: CheckCircle2,
    iconColor: 'text-[var(--fg-muted)]',
    labelColor: 'text-[var(--fg-muted)]',
    progressColor: 'bg-[var(--fg-muted)]'
  }
};

// Project type categorization for avatars
const PROJECT_TYPES = {
  'Portal': { icon: '🌐', color: 'bg-blue-500' },
  'API': { icon: '🔌', color: 'bg-purple-500' },
  'Sales': { icon: '📈', color: 'bg-green-500' },
  'Legacy': { icon: '🏛️', color: 'bg-amber-500' },
  'Mobile': { icon: '📱', color: 'bg-pink-500' },
  'Learning': { icon: '📚', color: 'bg-indigo-500' },
  'default': { icon: '📁', color: 'bg-gray-500' }
};

function getProjectType(name) {
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(PROJECT_TYPES)) {
    if (lowerName.includes(key.toLowerCase())) {
      return value;
    }
  }
  return PROJECT_TYPES.default;
}

function calculateProgress(project, tasks) {
  if (!tasks || tasks.length === 0) return 0;

  const projectTasks = tasks.filter(task => task.projectId === project.id);
  if (projectTasks.length === 0) return 0;

  const completedTasks = projectTasks.filter(task => task.status === 'COMPLETED').length;
  return Math.round((completedTasks / projectTasks.length) * 100);
}

function getProjectTimelineStatus(project) {
  const now = new Date();
  const startDate = new Date(project.startDate);
  const endDate = new Date(project.endDate);

  if (isAfter(now, endDate)) {
    return { status: 'overdue', days: differenceInDays(now, endDate) };
  } else if (isBefore(now, startDate)) {
    return { status: 'upcoming', days: differenceInDays(startDate, now) };
  } else {
    const totalDays = differenceInDays(endDate, startDate);
    const elapsedDays = differenceInDays(now, startDate);
    const progress = Math.min((elapsedDays / totalDays) * 100, 100);
    return { status: 'in-progress', progress: Math.round(progress) };
  }
}

export function ProjectCard({
  project,
  tasks = [],
  users = [],
  selected = false,
  onSelect,
  onEdit,
  onStatusChange,
  onDelete,
  compact = false,
  showActions = true
}) {
  const theme = STATUS_THEMES[project.status] || STATUS_THEMES.ACTIVE;
  const StatusIcon = theme.icon;
  const projectType = getProjectType(project.name);
  const progress = calculateProgress(project, tasks);
  const timelineStatus = getProjectTimelineStatus(project);

  const assignedUsers = useMemo(() => {
    return project.assignedUserIds?.map(userId =>
      users.find(user => user.id === userId)
    ).filter(Boolean) || [];
  }, [project.assignedUserIds, users]);

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const projectTasks = tasks?.filter(t => t.projectId === project.id) || [];
  const completedCount = projectTasks.filter(t => t.status === 'COMPLETED').length;
  const totalTasks = projectTasks.length;

  const timelineLabel =
    timelineStatus.status === 'overdue'
      ? `${timelineStatus.days} day${timelineStatus.days !== 1 ? 's' : ''} overdue`
      : timelineStatus.status === 'upcoming'
        ? `Starts in ${timelineStatus.days} day${timelineStatus.days !== 1 ? 's' : ''}`
        : 'On schedule';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`group relative ${theme.bg} ${theme.border} border-2 rounded-xl shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 overflow-hidden ${compact ? 'p-4' : 'p-6'
        } ${selected ? 'ring-2 ring-[var(--primary)] ring-offset-2' : ''}`}
    >
      {/* Status indicator stripe */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${theme.progressColor}`} />

      {/* Selection checkbox */}
      {onSelect && (
        <div className="absolute top-3 left-3 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(!selected);
            }}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selected
                ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-fg)]'
                : 'border-[var(--border)] hover:border-[var(--primary)]'
              }`}
            aria-label={selected ? 'Deselect project' : 'Select project'}
          >
            {selected && <Check className="w-3 h-3" />}
          </button>
        </div>
      )}

      {/* Header: icon + title + status + actions */}
      <div className={`flex items-start justify-between gap-3 mb-4 ${onSelect ? 'ml-8' : ''}`}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-xl shrink-0 ${projectType.color}`} aria-hidden>
            {projectType.icon}
          </div>
          <div className="min-w-0 flex-1">
            <Link
              to={`/admin/projects/${project.id}`}
              className="block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 group-hover:underline transition-colors">
                {project.name}
              </h3>
            </Link>
            {project.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">
                {project.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${theme.labelColor} border ${theme.border}`}
            aria-label={`Status: ${project.status === 'ACTIVE' ? 'Active' : project.status === 'ON_HOLD' ? 'On Hold' : 'Completed'}`}
          >
            <StatusIcon className={`w-3.5 h-3.5 ${theme.iconColor}`} />
            {project.status === 'ACTIVE' ? 'Active' : project.status === 'ON_HOLD' ? 'On Hold' : 'Completed'}
          </span>
          {showActions && (
            <ActionMenu
              actions={[
                { id: 'view', label: 'View Details', icon: Eye },
                { id: 'edit', label: 'Edit Project', icon: Pencil, onClick: () => onEdit?.(project), disabled: project.status === 'COMPLETED' || project.status === 'ON_HOLD' },
                { type: 'divider' },
                ...(project.status !== 'ACTIVE' ? [{ id: 'activate', label: 'Mark as Active', icon: PlayCircle, onClick: () => onStatusChange?.(project.id, 'ACTIVE') }] : []),
                ...(project.status !== 'ON_HOLD' ? [{ id: 'hold', label: 'Put on Hold', icon: PauseCircle, onClick: () => onStatusChange?.(project.id, 'ON_HOLD') }] : []),
                ...(project.status !== 'COMPLETED' ? [{ id: 'complete', label: 'Mark as Completed', icon: CheckCircle2, onClick: () => onStatusChange?.(project.id, 'COMPLETED') }] : []),
                { type: 'divider' },
                { id: 'delete', label: 'Delete Project', icon: Trash2, onClick: () => onDelete?.(project), destructive: true }
              ]}
              trigger={
                <IconButton
                  icon={MoreVertical}
                  variant="ghost"
                  size="sm"
                  aria-label="Project actions"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              }
            />
          )}
        </div>
      </div>

      {/* Task progress: clear label + count */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="text-gray-600 font-medium">Tasks completed</span>
          <span className="font-semibold text-gray-900">
            {totalTasks === 0 ? 'No tasks' : `${completedCount} of ${totalTasks} tasks`}
          </span>
        </div>
        <div className="w-full bg-white/60 rounded-full h-2 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Task progress: ${progress}%`}>
          <motion.div
            className={`h-full ${theme.progressColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        </div>
      </div>

      {/* Duration: start – end + schedule status */}
      <div className="flex flex-col gap-1 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4 shrink-0 text-gray-500" aria-hidden />
          <span>
            {formatDate(project.startDate)} – {formatDate(project.endDate)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {timelineStatus.status === 'overdue' && (
            <span className="font-medium text-red-600">{timelineLabel}</span>
          )}
          {timelineStatus.status === 'upcoming' && (
            <span className="font-medium text-blue-600">{timelineLabel}</span>
          )}
          {timelineStatus.status === 'in-progress' && (
            <span className="text-gray-600">{timelineLabel}</span>
          )}
        </div>
      </div>

      {/* Team */}
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-gray-500 shrink-0" aria-hidden />
        <div className="flex -space-x-1.5">
          {assignedUsers.slice(0, 3).map((user) => (
            <div
              key={user.id}
              className="w-7 h-7 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-700"
              title={user.name}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {assignedUsers.length > 3 && (
            <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
              +{assignedUsers.length - 3}
            </div>
          )}
        </div>
        <span className="text-sm text-gray-600">
          {assignedUsers.length} {assignedUsers.length === 1 ? 'member' : 'members'}
        </span>
      </div>

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200 rounded-xl pointer-events-none" aria-hidden />
    </motion.div>
  );
}