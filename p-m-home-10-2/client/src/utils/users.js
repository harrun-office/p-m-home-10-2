import { getTasksDueSoon } from './dashboard.js';

/**
 * Count tasks assigned to user where status !== COMPLETED.
 * @param {string} userId
 * @param {Array<{ assigneeId: string, status: string }>} tasks
 * @returns {number}
 */
export function countOpenTasksByUser(userId, tasks) {
  if (!Array.isArray(tasks)) return 0;
  return tasks.filter((t) => t.assigneeId === userId && t.status !== 'COMPLETED').length;
}

/**
 * Count tasks assigned to user due within 7 days or overdue, not completed.
 * @param {string} userId
 * @param {Array<{ assigneeId: string, status: string, deadline?: string }>} tasks
 * @param {string} [nowISO]
 * @param {number} [days]
 * @returns {number}
 */
export function countDueSoonTasksByUser(userId, tasks, nowISO, days = 7) {
  if (!Array.isArray(tasks)) return 0;
  const dueSoon = getTasksDueSoon(tasks, nowISO ?? new Date().toISOString(), days);
  return dueSoon.filter((t) => t.assigneeId === userId).length;
}

/**
 * Count projects where assignedUserIds includes userId.
 * @param {string} userId
 * @param {Array<{ assignedUserIds: string[] }>} projects
 * @returns {number}
 */
export function countProjectsByUser(userId, projects) {
  if (!Array.isArray(projects)) return 0;
  return projects.filter((p) => p.assignedUserIds && p.assignedUserIds.includes(userId)).length;
}
