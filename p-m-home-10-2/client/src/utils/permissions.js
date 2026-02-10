/**
 * Permission helpers for repositories.
 * session: { userId: string, role: "ADMIN" | "EMPLOYEE" }
 * task: { assigneeId, createdById, projectId }; project status checked separately in repos.
 */

/**
 * @param {{ userId: string, role: string }} session
 * @param {{ assigneeId: string }} task
 * @param {{ status: string } | null} project - if ON_HOLD or COMPLETED, no one can edit
 * @returns {boolean}
 */
export function canEditTask(session, task, project) {
  if (!session || !task) return false;
  if (project && (project.status === 'ON_HOLD' || project.status === 'COMPLETED')) return false;
  if (session.role === 'ADMIN') return true;
  return task.assigneeId === session.userId;
}

/**
 * @param {{ userId: string, role: string }} session
 * @param {{ createdById: string }} task
 * @param {{ status: string } | null} project - if ON_HOLD or COMPLETED, no one can delete
 * @returns {boolean}
 */
export function canDeleteTask(session, task, project) {
  if (!session || !task) return false;
  if (project && (project.status === 'ON_HOLD' || project.status === 'COMPLETED')) return false;
  if (session.role === 'ADMIN') return true;
  return task.createdById === session.userId;
}
