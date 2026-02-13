const crypto = require('crypto');
const db = require('../db/knex');

const SELECT_PUBLIC = [
  'id', 'name', 'email', 'role', 'department', 'is_active',
  'employee_id', 'contact_number', 'created_at', 'updated_at',
];

function toPublic(row) {
  if (!row) return null;
  const out = { ...row };
  delete out.password_hash;
  delete out.deleted_at;
  return out;
}

/**
 * @param {object} filters - { role, department, isActive, search }
 * @returns {Promise<object[]>} Sanitized users (no password_hash, no deleted_at)
 */
async function list(filters = {}) {
  let q = db('users')
    .select(SELECT_PUBLIC)
    .whereNull('deleted_at');

  if (filters.role) {
    q = q.where('role', filters.role);
  }
  if (filters.department) {
    q = q.where('department', filters.department);
  }
  if (filters.isActive !== undefined && filters.isActive !== '') {
    const active = filters.isActive === true || filters.isActive === 'true' || filters.isActive === 1;
    q = q.where('is_active', active ? 1 : 0);
  }
  if (filters.search && typeof filters.search === 'string' && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    q = q.where((builder) => {
      builder
        .where('name', 'like', term)
        .orWhere('email', 'like', term);
    });
  }

  const rows = await q.orderBy('created_at', 'desc');
  return rows.map(toPublic);
}

/**
 * @param {string} id
 * @returns {Promise<object|null>} Sanitized user or null
 */
async function getById(id) {
  const [row] = await db('users')
    .select(SELECT_PUBLIC)
    .where('id', id)
    .whereNull('deleted_at')
    .limit(1);
  return toPublic(row) || null;
}

/**
 * @param {string} id - Include password_hash for internal use
 * @returns {Promise<object|null>}
 */
async function getByIdWithPassword(id) {
  const [row] = await db('users')
    .select('*')
    .where('id', id)
    .whereNull('deleted_at')
    .limit(1);
  return row || null;
}

/**
 * @param {string} email
 * @returns {Promise<object|null>}
 */
async function getByEmail(email) {
  const [row] = await db('users')
    .where('email', email)
    .whereNull('deleted_at')
    .limit(1);
  return row || null;
}

/**
 * Generate a unique id (VARCHAR 64)
 */
function generateId() {
  return crypto.randomUUID();
}

/**
 * @param {object} data - name, email, role, department, is_active, employee_id, contact_number, password_hash
 * @returns {Promise<object>} Sanitized created user
 */
async function create(data) {
  const id = data.id || generateId();
  const now = db.fn.now();
  await db('users').insert({
    id,
    name: data.name,
    email: data.email,
    role: data.role || 'EMPLOYEE',
    department: data.department || 'DEV',
    is_active: data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
    employee_id: data.employee_id || null,
    contact_number: data.contact_number || null,
    password_hash: data.password_hash || null,
    created_at: now,
    updated_at: now,
  });
  return getById(id);
}

/**
 * @param {string} id
 * @param {object} patch - name, department, contact_number, is_active only
 * @returns {Promise<object|null>} Sanitized updated user
 */
async function update(id, patch) {
  const allowed = ['name', 'department', 'contact_number', 'is_active'];
  const updates = {};
  for (const key of allowed) {
    if (patch[key] !== undefined) {
      if (key === 'is_active') {
        updates[key] = patch[key] ? 1 : 0;
      } else {
        updates[key] = patch[key];
      }
    }
  }
  if (Object.keys(updates).length === 0) {
    return getById(id);
  }
  updates.updated_at = db.fn.now();
  const count = await db('users').where('id', id).whereNull('deleted_at').update(updates);
  if (count === 0) return null;
  return getById(id);
}

/**
 * @param {string} id
 * @param {string} passwordHash - bcrypt hash
 * @returns {Promise<object|null>}
 */
async function updatePassword(id, passwordHash) {
  const count = await db('users')
    .where('id', id)
    .whereNull('deleted_at')
    .update({
      password_hash: passwordHash,
      updated_at: db.fn.now(),
    });
  if (count === 0) return null;
  return getById(id);
}

/**
 * Soft delete: set deleted_at = NOW()
 * @param {string} id
 * @returns {Promise<boolean>}
 */
async function softDelete(id) {
  const count = await db('users')
    .where('id', id)
    .whereNull('deleted_at')
    .update({
      deleted_at: db.fn.now(),
      updated_at: db.fn.now(),
    });
  return count > 0;
}

module.exports = {
  list,
  getById,
  getByIdWithPassword,
  getByEmail,
  create,
  update,
  updatePassword,
  softDelete,
};
