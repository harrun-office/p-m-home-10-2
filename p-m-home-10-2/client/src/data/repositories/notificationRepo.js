import { load, save, loadArray } from '../storage/storage.js';
import { STORAGE_KEYS } from '../storage/storageKeys.js';
import { uid } from '../../utils/id.js';
import { nowISO, toDayKey, daysUntil, isOverdue } from '../../utils/date.js';

function getNotifications() {
  return loadArray(STORAGE_KEYS.NOTIFICATIONS, []);
}

function getDeadlineSent() {
  const raw = load(STORAGE_KEYS.DEADLINE_SENT, {});
  return typeof raw === 'object' && raw !== null ? raw : {};
}

function setDeadlineSent(map) {
  save(STORAGE_KEYS.DEADLINE_SENT, map);
}

/**
 * @param {string} userId
 * @returns {import('../../types/models.js').Notification[]}
 */
export function listByUser(userId) {
  return getNotifications().filter((n) => n.userId === userId);
}

/**
 * @param {string} id
 * @param {string} userId
 * @returns {import('../../types/models.js').Notification | null}
 */
export function markRead(id, userId) {
  const list = getNotifications();
  const i = list.findIndex((n) => n.id === id && n.userId === userId);
  if (i === -1) return null;
  list[i] = { ...list[i], read: true };
  save(STORAGE_KEYS.NOTIFICATIONS, list);
  return list[i];
}

/**
 * @param {string} userId
 */
export function markAllRead(userId) {
  const list = getNotifications();
  let changed = false;
  for (let i = 0; i < list.length; i++) {
    if (list[i].userId === userId && !list[i].read) {
      list[i] = { ...list[i], read: true };
      changed = true;
    }
  }
  if (changed) save(STORAGE_KEYS.NOTIFICATIONS, list);
}

/**
 * @param {string} userId
 * @param {{ type: string, message: string }} notification
 * @returns {import('../../types/models.js').Notification}
 */
export function createForUser(userId, notification) {
  const list = getNotifications();
  const now = nowISO();
  const item = {
    id: uid('notif'),
    userId,
    type: notification.type,
    message: notification.message,
    createdAt: now,
    read: false,
  };
  list.push(item);
  save(STORAGE_KEYS.NOTIFICATIONS, list);
  return item;
}

/**
 * Project deadlines: for each project whose endDate is within 7 days or overdue,
 * create DEADLINE notification once per day for every ADMIN user.
 * Duplicate prevention: DEADLINE_SENT => { [p_projectId_adminId_dayKey]: true }
 * @param {string} nowISO - current time ISO (e.g. nowISO())
 */
export function runDeadlineCheck(nowISO) {
  const dayKey = toDayKey(nowISO);
  const projectsRaw = load(STORAGE_KEYS.PROJECTS, []);
  const projects = Array.isArray(projectsRaw) ? projectsRaw : [];
  const usersRaw = load(STORAGE_KEYS.USERS, []);
  const users = Array.isArray(usersRaw) ? usersRaw : [];
  const admins = users.filter((u) => u.role === 'ADMIN');
  const sent = getDeadlineSent();
  let changed = false;

  // Project deadlines: notify every admin once per day per project (when project endDate within 7 days or overdue)
  for (const project of projects) {
    if (!project.endDate) continue;
    const days = daysUntil(project.endDate, nowISO);
    if (days > 7 && !isOverdue(project.endDate, nowISO)) continue;

    for (const admin of admins) {
      const key = `p_${project.id}_${admin.id}_${dayKey}`;
      if (sent[key]) continue;

      const message = `Project "${project.name}" deadline: ${toDayKey(project.endDate)}`;
      createForUser(admin.id, { type: 'DEADLINE', message });
      sent[key] = true;
      changed = true;
    }
  }

  if (changed) setDeadlineSent(sent);
}
