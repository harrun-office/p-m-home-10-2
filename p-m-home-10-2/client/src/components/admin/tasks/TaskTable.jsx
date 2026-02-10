import { useNavigate } from 'react-router-dom';
import { PriorityBadge } from './PriorityBadge.jsx';
import { IconButton } from '../../ui/IconButton.jsx';
import { ActionMenu } from '../../ui/ActionMenu.jsx';
import { Eye, Pencil, Trash2, CheckCircle2, Circle, Loader2 } from 'lucide-react';

/**
 * Table view: Task ID, Title, Project, Assignee, Priority, Status, Assigned At, Actions (View, Edit, Delete, Options).
 */
export function TaskTable({
  tasks = [],
  users = [],
  projects = [],
  getTaskDisplayId,
  onEdit,
  onDelete,
  canDelete,
  onMoveStatus,
  readOnly,
  getTaskReadOnly,
  onNavigateToProject,
}) {
  const navigate = useNavigate();

  function getUserName(userId) {
    const u = users.find((x) => x.id === userId);
    return u ? u.name : '—';
  }

  function getProjectName(projectId) {
    const p = projects.find((x) => x.id === projectId);
    return p ? p.name : '—';
  }

  const statusLabels = { TODO: 'To Do', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed' };
  const statusIcons = { TODO: Circle, IN_PROGRESS: Loader2, COMPLETED: CheckCircle2 };
  const colCount = 8;

  return (
    <div className="border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden bg-[var(--card)] shadow-[var(--shadow-sm)]">
      <table className="min-w-full divide-y divide-[var(--border)]">
        <thead className="bg-[var(--muted)]/60">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-fg)] uppercase tracking-wider">Task ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-fg)] uppercase tracking-wider">Task Title</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-fg)] uppercase tracking-wider">Project</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-fg)] uppercase tracking-wider">Assignee</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-fg)] uppercase tracking-wider">Priority</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-fg)] uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-fg)] uppercase tracking-wider">Assigned At</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-fg)] uppercase tracking-wider">Deadline</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-fg)] uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-[var(--card)] divide-y divide-[var(--border)]">
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="px-4 py-8 text-center text-[var(--muted-fg)]">
                No tasks match the filter.
              </td>
            </tr>
          ) : (
            tasks.map((task) => {
              const rowReadOnly = getTaskReadOnly ? getTaskReadOnly(task) : readOnly;
              const displayId = getTaskDisplayId ? getTaskDisplayId(task) : task.id;
              const allowDelete = canDelete && canDelete(task) && onDelete;
              const optionsActions = [
                { id: 'view', label: 'View in project', icon: Eye, onClick: () => onNavigateToProject && onNavigateToProject(task.projectId) },
                { id: 'edit', label: 'Edit', icon: Pencil, onClick: () => onEdit && onEdit(task), disabled: rowReadOnly },
                { type: 'divider' },
                { id: 'todo', label: 'To Do', icon: Circle, onClick: () => onMoveStatus && onMoveStatus(task.id, 'TODO'), disabled: rowReadOnly },
                { id: 'progress', label: 'In Progress', icon: Loader2, onClick: () => onMoveStatus && onMoveStatus(task.id, 'IN_PROGRESS'), disabled: rowReadOnly },
                { id: 'completed', label: 'Completed', icon: CheckCircle2, onClick: () => onMoveStatus && onMoveStatus(task.id, 'COMPLETED'), disabled: rowReadOnly },
                ...(allowDelete ? [{ type: 'divider' }, { id: 'delete', label: 'Delete', icon: Trash2, onClick: () => onDelete(task), destructive: true }] : []),
              ];
              return (
                <tr key={task.id} className="hover:bg-[var(--muted)]/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-[var(--fg-muted)] tabular-nums">{displayId}</td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      type="button"
                      onClick={() => onNavigateToProject && onNavigateToProject(task.projectId)}
                      className="font-medium text-[var(--fg)] hover:text-[var(--primary)] transition-colors cursor-pointer text-left"
                    >
                      {task.title}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      type="button"
                      onClick={() => onNavigateToProject && onNavigateToProject(task.projectId)}
                      className="text-[var(--fg-secondary)] hover:text-[var(--primary)] transition-colors cursor-pointer text-left"
                    >
                      {getProjectName(task.projectId)}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--fg-secondary)]">{getUserName(task.assigneeId)}</td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--fg-secondary)]">{statusLabels[task.status] ?? task.status}</td>
                  <td className="px-4 py-3 text-sm text-[var(--fg-secondary)]">
                    {task.assignedAt ? task.assignedAt.slice(0, 10) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--fg-secondary)]">
                    {task.deadline ? (
                      <span className={(() => {
                        const deadline = new Date(task.deadline);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        deadline.setHours(0, 0, 0, 0);
                        const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                        if (daysUntil < 0) {
                          return 'text-[var(--danger)] font-medium';
                        } else if (daysUntil === 0) {
                          return 'text-[var(--warning)] font-medium';
                        } else if (daysUntil <= 2) {
                          return 'text-[var(--warning)]';
                        }
                        return '';
                      })()}>
                        {task.deadline.slice(0, 10)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!rowReadOnly ? (
                      <div className="flex items-center justify-end gap-1">
                        <IconButton icon={Eye} variant="ghost" size="sm" aria-label={`View ${task.title}`} onClick={() => onNavigateToProject && onNavigateToProject(task.projectId)} />
                        <IconButton icon={Pencil} variant="ghost" size="sm" aria-label={`Edit ${task.title}`} onClick={() => onEdit && onEdit(task)} />
                        {canDelete && canDelete(task) && onDelete && (
                          <IconButton icon={Trash2} variant="ghost" size="sm" aria-label={`Delete ${task.title}`} onClick={() => onDelete(task)} className="text-[var(--danger)] hover:bg-[var(--danger-light)]" />
                        )}
                        <ActionMenu actions={optionsActions} />
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--muted-fg)]">Read-only</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
