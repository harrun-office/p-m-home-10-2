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
 * @returns {import('../../types/models.js').Project}
 */
export function create(payload) {
  const projects = getProjects();
  const project = {
    id: uid('proj'),
    name: payload.name,
    description: payload.description ?? '',
    status: 'ACTIVE',
    startDate: payload.startDate,
    endDate: payload.endDate,
    assignedUserIds: Array.isArray(payload.assignedUserIds) ? payload.assignedUserIds : [],
  };
  projects.push(project);
  save(STORAGE_KEYS.PROJECTS, projects);
  return project;
}

/**
 * If project status is ON_HOLD or COMPLETED, block update except setStatus.
 * @param {string} id
 * @param {Partial<import('../../types/models.js').Project>} patch
 * @returns {import('../../types/models.js').Project | null}
 */
export function update(id, patch) {
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
  const next = { ...proj, ...patch };
  projects[i] = next;
  save(STORAGE_KEYS.PROJECTS, projects);
  return next;
}

/**
 * @param {string} id
 * @param {string} status
 * @returns {import('../../types/models.js').Project | null}
 */
export function setStatus(id, status) {
  return update(id, { status });
}

/**
 * @param {string} projectId
 * @param {string[]} userIds
 * @returns {import('../../types/models.js').Project | null}
 */
export function assignMembers(projectId, userIds) {
  return update(projectId, { assignedUserIds: Array.isArray(userIds) ? userIds : [] });
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