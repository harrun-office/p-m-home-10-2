const bcrypt = require('bcrypt');
const userRepo = require('../repos/user.repo');
const { generatePassword } = require('../utils/generatePassword');

const BCRYPT_ROUNDS = 10;

/**
 * GET /users - List users with optional filters (role, department, isActive, search)
 */
async function list(req, res, next) {
  try {
    const { role, department, isActive, search } = req.query;
    const filters = {};
    if (role) filters.role = role;
    if (department) filters.department = department;
    if (isActive !== undefined && isActive !== '') filters.isActive = isActive;
    if (search) filters.search = search;

    const users = await userRepo.list(filters);
    return res.status(200).json(users);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /users - Create user with auto-generated password
 * Body: name, email, department, employeeId?, contactNumber?, role?
 */
async function create(req, res, next) {
  try {
    const { name, email, department, employeeId, contactNumber, role } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'name is required' });
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'email is required' });
    }
    const emailTrimmed = email.trim().toLowerCase();
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(emailTrimmed)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const existing = await userRepo.getByEmail(emailTrimmed);
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const dept = (department && ['DEV', 'PRESALES', 'TESTER'].includes(department)) ? department : 'DEV';
    const userRole = (role && (role === 'ADMIN' || role === 'EMPLOYEE')) ? role : 'EMPLOYEE';

    const generatedPassword = generatePassword(12);
    const passwordHash = await bcrypt.hash(generatedPassword, BCRYPT_ROUNDS);

    const user = await userRepo.create({
      name: name.trim(),
      email: emailTrimmed,
      role: userRole,
      department: dept,
      employee_id: employeeId != null ? String(employeeId).trim() || null : null,
      contact_number: contactNumber != null ? String(contactNumber).trim() || null : null,
      password_hash: passwordHash,
    });

    return res.status(201).json({
      user,
      generatedPassword,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /users/:id - Update user (name, department, contactNumber, is_active only)
 */
async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { name, department, contactNumber, is_active } = req.body || {};

    const existing = await userRepo.getById(id);
    if (!existing) {
      return res.status(404).json({ message: 'User not found' });
    }

    const patch = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: 'name must be a non-empty string' });
      }
      patch.name = name.trim();
    }
    if (department !== undefined) {
      if (!['DEV', 'PRESALES', 'TESTER'].includes(department)) {
        return res.status(400).json({ message: 'Invalid department' });
      }
      patch.department = department;
    }
    if (contactNumber !== undefined) {
      patch.contact_number = contactNumber == null ? null : String(contactNumber).trim() || null;
    }
    if (is_active !== undefined) {
      patch.is_active = !!is_active;
    }

    const updated = await userRepo.update(id, patch);
    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /users/:id/reset-password - Admin sets new random password
 */
async function resetPassword(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await userRepo.getById(id);
    if (!existing) {
      return res.status(404).json({ message: 'User not found' });
    }

    const generatedPassword = generatePassword(12);
    const passwordHash = await bcrypt.hash(generatedPassword, BCRYPT_ROUNDS);

    const updated = await userRepo.updatePassword(id, passwordHash);
    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ generatedPassword });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /users/:id - Soft delete (set deleted_at)
 */
async function remove(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await userRepo.getById(id);
    if (!existing) {
      return res.status(404).json({ message: 'User not found' });
    }

    const ok = await userRepo.softDelete(id);
    if (!ok) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  create,
  update,
  resetPassword,
  remove,
};
