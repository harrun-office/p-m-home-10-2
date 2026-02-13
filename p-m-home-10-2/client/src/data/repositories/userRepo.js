import { load, save, loadArray } from '../storage/storage.js';
import { STORAGE_KEYS } from '../storage/storageKeys.js';
import { uid } from '../../utils/id.js';

/** Local hash for admin-created user passwords (demo storage only). */
async function hashPassword(plain) {
  const encoded = new TextEncoder().encode(plain);
  const buffer = await crypto.subtle.digest('SHA-256', encoded);
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function getUsers() {
  return loadArray(STORAGE_KEYS.USERS, []);
}

/**
 * @returns {import('../../types/models.js').User[]}
 */
export function list() {
  return getUsers();
}

/**
 * @param {string} id
 * @returns {import('../../types/models.js').User | null}
 */
export function getById(id) {
  return getUsers().find((u) => u.id === id) ?? null;
}

/**
 * @param {{ name: string, email: string, role: string, department: string, employeeId?: string, personalNumber?: string, password?: string }} payload
 * @returns {Promise<import('../../types/models.js').User>}
 */
export async function create(payload) {
  const users = getUsers();
  const passwordHash = payload.password ? await hashPassword(payload.password) : '';
  const user = {
    id: uid('user'),
    name: payload.name,
    email: payload.email,
    role: payload.role ?? 'EMPLOYEE',
    department: payload.department ?? 'DEV',
    isActive: true,
    employeeId: payload.employeeId || generateEmployeeId(payload.role ?? 'EMPLOYEE', payload.department ?? 'DEV'),
    personalNumber: payload.personalNumber ?? '',
    passwordHash: passwordHash || undefined,
  };
  users.push(user);
  save(STORAGE_KEYS.USERS, users);
  return user;
}

/**
 * Generate employee ID based on role and department
 * @param {string} role
 * @param {string} department
 * @returns {string}
 */
function generateEmployeeId(role, department) {
  const users = getUsers();

  if (role === 'ADMIN') {
    // For admins, use CIPL format with random number
    const randomNum = Math.floor(Math.random() * 1000) + 1000;
    return `CIPL${randomNum}`;
  }

  // For employees, use T format with sequential number
  const employeeUsers = users.filter(u => u.role === 'EMPLOYEE');
  const maxId = employeeUsers.length > 0
    ? Math.max(...employeeUsers.map(u => {
        const match = u.employeeId?.match(/^T(\d+)$/);
        return match ? parseInt(match[1]) : 100;
      }))
    : 100;

  return `T${maxId + 1}`;
}

/**
 * @param {string} id
 * @param {Partial<import('../../types/models.js').User> & { password?: string }} patch
 * @returns {Promise<import('../../types/models.js').User | null>}
 */
export async function update(id, patch) {
  const users = getUsers();
  const i = users.findIndex((u) => u.id === id);
  if (i === -1) return null;
  const { password, ...rest } = patch;
  const passwordHash = password !== undefined ? (password ? await hashPassword(password) : '') : undefined;
  const next = {
    ...users[i],
    ...rest,
    ...(passwordHash !== undefined && { passwordHash: passwordHash || undefined }),
  };
  users[i] = next;
  save(STORAGE_KEYS.USERS, users);
  return next;
}

/**
 * @param {string} id
 * @param {boolean} isActive
 * @returns {import('../../types/models.js').User | null}
 */
export function setActive(id, isActive) {
  return update(id, { isActive });
}

/**
 * @param {string} id
 * @returns {boolean} true if deleted successfully
 */
export function remove(id) {
  const users = getUsers();
  const i = users.findIndex((u) => u.id === id);
  if (i === -1) return false;
  users.splice(i, 1);
  save(STORAGE_KEYS.USERS, users);
  return true;
}
