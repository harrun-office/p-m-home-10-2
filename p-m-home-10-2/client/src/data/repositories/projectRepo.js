import { load, save, loadArray } from '../storage/storage.js';
import { STORAGE_KEYS } from '../storage/storageKeys.js';
import { uid } from '../../utils/id.js';

function getProjects() {
  return loadArray(STORAGE_KEYS.PROJECTS, []);
}

/**
 * @param {{ status?: string }} [filters]
 * @returns {import('../../types/models.js').Project[]}
 */
export function list(filters = {}) {
  let list = getProjects();
  if (filters.status) {
    list = list.filter((p) => p.status === filters.status);
  }
  return list;
}

/**
 * @param {string} id
 * @returns {import('../../types/models.js').Project | null}
 */
export function getById(id) {
  return getProjects().find((p) => p.id === id) ?? null;
}

/**
 * @param {{ name: string, description: string, startDate: string, endDate: string, assignedUserIds?: string[] }} payload
 * @param {string} [createdByUserId]
 * @returns {import('../../types/models.js').Project}
 */
export function create(payload, createdByUserId) {
  const projects = getProjects();
  const now = new Date().toISOString();
  const project = {
    id: uid('proj'),
    name: payload.name,
    description: payload.description ?? '',
    status: 'ACTIVE',
    startDate: payload.startDate,
    endDate: payload.endDate,
    assignedUserIds: Array.isArray(payload.assignedUserIds) ? payload.assignedUserIds : [],
    createdAt: now,
    statusHistory: [{ status: 'ACTIVE', at: now, userId: createdByUserId }],
    activityLog: [],
    attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
  };
  projects.push(project);
  save(STORAGE_KEYS.PROJECTS, projects);
  return project;
}

/**
 * If project status is ON_HOLD or COMPLETED, block update except setStatus.
 * @param {string} id
 * @param {Partial<import('../../types/models.js').Project>} patch
 * @param {string} [userId] - who made the update (for activity log)
 * @returns {import('../../types/models.js').Project | null}
 */
export function update(id, patch, userId) {
  const projects = getProjects();
  const i = projects.findIndex((p) => p.id === id);
  if (i === -1) return null;
  const proj = projects[i];
  if (proj.status === 'ON_HOLD' || proj.status === 'COMPLETED') {
    if (patch.status === undefined) return proj;
    const next = { ...proj, status: patch.status };
    projects[i] = next;
    save(STORAGE_KEYS.PROJECTS, projects);
    return next;
  }
  const log = Array.isArray(proj.activityLog) ? [...proj.activityLog] : [];
  const now = new Date().toISOString();
  if (patch.startDate !== undefined && patch.startDate !== proj.startDate) {
    log.push({ id: uid('evt'), type: 'date_change', at: now, userId, payload: { field: 'startDate', oldValue: proj.startDate, newValue: patch.startDate } });
  }
  if (patch.endDate !== undefined && patch.endDate !== proj.endDate) {
    log.push({ id: uid('evt'), type: 'date_change', at: now, userId, payload: { field: 'endDate', oldValue: proj.endDate, newValue: patch.endDate } });
  }
  const next = { ...proj, ...patch, activityLog: log };
  projects[i] = next;
  save(STORAGE_KEYS.PROJECTS, projects);
  return next;
}

/**
 * @param {string} id
 * @param {string} status
 * @param {string} [userId]
 * @param {string} [note]
 * @returns {import('../../types/models.js').Project | null}
 */
export function setStatus(id, status, userId, note) {
  const projects = getProjects();
  const i = projects.findIndex((p) => p.id === id);
  if (i === -1) return null;
  const proj = projects[i];
  const now = new Date().toISOString();
  let history = Array.isArray(proj.statusHistory) ? [...proj.statusHistory] : [];
  if (history.length === 0) {
    const created = proj.createdAt || proj.startDate || now;
    history = [{ status: proj.status, at: created }];
  }
  if (proj.status !== status) {
    history.push({ status, at: now, userId, note });
  }
  const next = { ...proj, status, statusHistory: history };
  projects[i] = next;
  save(STORAGE_KEYS.PROJECTS, projects);
  return next;
}

/**
 * @param {string} projectId
 * @param {string[]} userIds
 * @param {string} [byUserId] - who made the change
 * @returns {import('../../types/models.js').Project | null}
 */
export function assignMembers(projectId, userIds, byUserId) {
  const projects = getProjects();
  const i = projects.findIndex((p) => p.id === projectId);
  if (i === -1) return null;
  const proj = projects[i];
  const prev = new Set(Array.isArray(proj.assignedUserIds) ? proj.assignedUserIds : []);
  const next = new Set(Array.isArray(userIds) ? userIds : []);
  const log = Array.isArray(proj.activityLog) ? [...proj.activityLog] : [];
  const now = new Date().toISOString();
  prev.forEach((uid) => { if (!next.has(uid)) log.push({ id: uid('evt'), type: 'member_removed', at: now, userId: byUserId, payload: { userId: uid } }); });
  next.forEach((uid) => { if (!prev.has(uid)) log.push({ id: uid('evt'), type: 'member_added', at: now, userId: byUserId, payload: { userId: uid } }); });
  const updated = { ...proj, assignedUserIds: [...next], activityLog: log };
  projects[i] = updated;
  save(STORAGE_KEYS.PROJECTS, projects);
  return updated;
}

/**
 * @param {string} projectId
 * @param {string} title - milestone title
 * @param {string} [userId]
 * @param {string} [note]
 * @returns {import('../../types/models.js').Project | null}
 */
export function addMilestone(projectId, title, userId, note) {
  const projects = getProjects();
  const i = projects.findIndex((p) => p.id === projectId);
  if (i === -1) return null;
  const proj = projects[i];
  const log = Array.isArray(proj.activityLog) ? [...proj.activityLog] : [];
  log.push({ id: uid('evt'), type: 'milestone', at: new Date().toISOString(), userId, note, payload: { title } });
  const next = { ...proj, activityLog: log };
  projects[i] = next;
  save(STORAGE_KEYS.PROJECTS, projects);
  return next;
}

/**
 * Record a generic activity event (e.g. task milestone).
 * @param {string} projectId
 * @param {{ type: 'task_milestone', payload: { taskId: string, message: string } }} event
 * @param {string} [userId]
 * @returns {import('../../types/models.js').Project | null}
 */
export function recordActivity(projectId, event, userId) {
  const projects = getProjects();
  const i = projects.findIndex((p) => p.id === projectId);
  if (i === -1) return null;
  const proj = projects[i];
  const log = Array.isArray(proj.activityLog) ? [...proj.activityLog] : [];
  log.push({ id: uid('evt'), ...event, at: new Date().toISOString(), userId });
  const next = { ...proj, activityLog: log };
  projects[i] = next;
  save(STORAGE_KEYS.PROJECTS, projects);
  return next;
}

/**
 * Delete a project by ID. Also deletes all associated tasks.
 * @param {string} id
 * @returns {{ ok: boolean, error?: string }}
 */
export function remove(id) {
  const projects = getProjects();
  const project = projects.find((p) => p.id === id);
  if (!project) {
    return { ok: false, error: 'Project not found' };
  }

  // Delete associated tasks
  const tasks = loadArray(STORAGE_KEYS.TASKS, []);
  const remainingTasks = tasks.filter((t) => t.projectId !== id);
  save(STORAGE_KEYS.TASKS, remainingTasks);

  // Delete the project
  const remainingProjects = projects.filter((p) => p.id !== id);
  save(STORAGE_KEYS.PROJECTS, remainingProjects);
  
  return { ok: true };
}