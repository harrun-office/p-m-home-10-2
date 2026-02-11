import { load, save, loadArray } from '../storage/storage.js';
import { STORAGE_KEYS } from '../storage/storageKeys.js';
import { uid } from '../../utils/id.js';
import { nowISO, isSameDay } from '../../utils/date.js';
import { canEditTask, canDeleteTask } from '../../utils/permissions.js';
import * as projectRepo from './projectRepo.js';
import * as notificationRepo from './notificationRepo.js';

function getTasks() {
  return loadArray(STORAGE_KEYS.TASKS, []);
}

function projectBlocksTaskEdit(project) {
  return project && (project.status === 'ON_HOLD' || project.status === 'COMPLETED');
}

/**
 * @param {{ projectId?: string, assigneeId?: string, status?: string, priority?: string }} [filters]
 * @returns {import('../../types/models.js').Task[]}
 */
export function list(filters = {}) {
  let list = getTasks();
  if (filters.projectId) list = list.filter((t) => t.projectId === filters.projectId);
  if (filters.assigneeId) list = list.filter((t) => t.assigneeId === filters.assigneeId);
  if (filters.status) list = list.filter((t) => t.status === filters.status);
  if (filters.priority) list = list.filter((t) => t.priority === filters.priority);
  return list;
}

/**
 * @param {string} id
 * @returns {import('../../types/models.js').Task | null}
 */
export function getById(id) {
  return getTasks().find((t) => t.id === id) ?? null;
}

/**
 * Tasks assigned today (assignedAt on same day as nowIso) for the user (My Tasks Today).
 * @param {string} userId
 * @param {string} nowIso
 * @returns {import('../../types/models.js').Task[]}
 */
export function listAssignedToday(userId, nowIso) {
  return getTasks().filter(
    (t) => t.assigneeId === userId && t.assignedAt && isSameDay(t.assignedAt, nowIso)
  );
}

/**
 * Validate required: projectId, title, assigneeId. No deadline; assignedAt=now.
 * G) createdById=session.userId, createdAt=nowISO(), assignedAt=nowISO(),
 * default status TODO, priority MEDIUM, tags [].
 * @param {Partial<import('../../types/models.js').Task>} payload
 * @param {{ userId: string, role: string }} session
 * @returns {{ ok: boolean, task?: import('../../types/models.js').Task, error?: string }}
 */
export function create(payload, session) {
  if (!payload.projectId) return { ok: false, error: 'projectId is required' };
  if (!payload.title) return { ok: false, error: 'title is required' };
  if (!payload.assigneeId) return { ok: false, error: 'assigneeId is required' };

  const project = projectRepo.getById(payload.projectId);
  if (!project) return { ok: false, error: 'Project not found' };
  if (project.status === 'COMPLETED') return { ok: false, error: 'Cannot create tasks in completed project' };
  if (project.status === 'ON_HOLD') return { ok: false, error: 'Cannot create tasks in project on hold' };

  if (session.role === 'EMPLOYEE') {
    const assigned = project.assignedUserIds || [];
    if (!assigned.includes(session.userId)) {
      return { ok: false, error: 'You can only create tasks in projects you are assigned to' };
    }
  }

  const now = nowISO();

  const task = {
    id: uid('task'),
    projectId: payload.projectId,
    title: payload.title,
    description: payload.description ?? '',
    assigneeId: payload.assigneeId,
    priority: payload.priority ?? 'MEDIUM',
    status: payload.status ?? 'TODO',
    createdById: session.userId,
    createdAt: now,
    assignedAt: payload.assignedAt ?? now,
    updatedAt: now,
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    deadline: payload.deadline ?? undefined,
    links: Array.isArray(payload.links) ? payload.links : [],
    attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
  };
  const tasks = getTasks();
  tasks.push(task);
  save(STORAGE_KEYS.TASKS, tasks);

  if (task.assigneeId) {
    notificationRepo.createForUser(task.assigneeId, {
      type: 'ASSIGNED',
      message: `You were assigned to task: ${task.title}`,
    });
  }
  return { ok: true, task };
}

/**
 * B) Employee cannot change assigneeId. C) Employee can edit if task.assigneeId === session.userId.
 * E) ON_HOLD / F) COMPLETED block update.
 * @param {string} id
 * @param {Partial<import('../../types/models.js').Task>} patch
 * @param {{ userId: string, role: string }} session
 * @returns {{ ok: boolean, task?: import('../../types/models.js').Task, error?: string }}
 */
export function update(id, patch, session) {
  const task = getById(id);
  if (!task) return { ok: false, error: 'Task not found' };

  const project = projectRepo.getById(task.projectId);
  if (projectBlocksTaskEdit(project)) {
    return { ok: false, error: 'Project is on hold or completed; task cannot be updated' };
  }

  if (session.role === 'EMPLOYEE') {
    if (patch.assigneeId !== undefined && patch.assigneeId !== task.assigneeId) {
      return { ok: false, error: 'You cannot reassign tasks to others' };
    }
    if (!canEditTask(session, task, project)) {
      return { ok: false, error: 'You can only edit tasks assigned to you' };
    }
  }

  const i = getTasks().findIndex((t) => t.id === id);
  const now = nowISO();
  const next = { ...task, ...patch, updatedAt: now };
  if (patch.links !== undefined) next.links = Array.isArray(patch.links) ? patch.links : (next.links || []);
  if (patch.attachments !== undefined) next.attachments = Array.isArray(patch.attachments) ? patch.attachments : (next.attachments || []);
  const tasks = getTasks();
  tasks[i] = next;
  save(STORAGE_KEYS.TASKS, tasks);
  return { ok: true, task: next };
}

/**
 * D) Employee can delete only if task.createdById === session.userId. E) F) block delete.
 * @param {string} id
 * @param {{ userId: string, role: string }} session
 * @returns {{ ok: boolean, error?: string }}
 */
export function remove(id, session) {
  const task = getById(id);
  if (!task) return { ok: false, error: 'Task not found' };

  const project = projectRepo.getById(task.projectId);
  if (projectBlocksTaskEdit(project)) {
    return { ok: false, error: 'Project is on hold or completed; task cannot be deleted' };
  }

  if (!canDeleteTask(session, task, project)) {
    return { ok: false, error: 'You cannot delete this task' };
  }

  const tasks = getTasks().filter((t) => t.id !== id);
  save(STORAGE_KEYS.TASKS, tasks);
  return { ok: true };
}

/**
 * @param {string} id
 * @param {string} newStatus
 * @param {{ userId: string, role: string }} session
 * @returns {{ ok: boolean, task?: import('../../types/models.js').Task, error?: string }}
 */
export function moveStatus(id, newStatus, session) {
  return update(id, { status: newStatus }, session);
}
