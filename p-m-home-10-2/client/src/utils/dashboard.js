import { daysUntil } from './date.js';

/**
 * Tasks (not completed) whose deadline is within `days` days or overdue.
 * @param {Array<{ status: string, deadline: string }>} tasks
 * @param {string} nowISO
 * @param {number} [days=7]
 * @returns {Array}
 */
export function getTasksDueSoon(tasks, nowISO, days = 7) {
  if (!Array.isArray(tasks)) return [];
  return tasks.filter((t) => {
    if (t.status === 'COMPLETED' || !t.deadline) return false;
    const d = daysUntil(t.deadline, nowISO);
    return d <= days;
  });
}

/**
 * @param {Array} items
 * @param {string} key
 * @returns {Record<string, number>}
 */
export function groupCountBy(items, key) {
  const out = {};
  if (!Array.isArray(items)) return out;
  items.forEach((item) => {
    const v = item[key];
    const k = v != null ? String(v) : 'unknown';
    out[k] = (out[k] || 0) + 1;
  });
  return out;
}

/**
 * Sort tasks by deadline ascending (nearest first). Missing deadlines last.
 * @param {Array<{ deadline?: string }>} tasks
 * @returns {Array}
 */
export function sortByDeadline(tasks) {
  if (!Array.isArray(tasks)) return [];
  return [...tasks].sort((a, b) => {
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });
}
