const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/knex');

/**
 * POST /auth/login
 * Body: { email, password }
 * Returns: { token, user: { userId, email, role, name, department } }
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const emailTrimmed = email.trim().toLowerCase();
    if (!emailTrimmed) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const [user] = await db('users')
      .select('id', 'name', 'email', 'role', 'department', 'is_active', 'password_hash')
      .where('email', emailTrimmed)
      .whereNull('deleted_at')
      .limit(1);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.is_active === 0 || user.is_active === false) {
      return res.status(403).json({ message: 'User account is inactive' });
    }

    if (!user.password_hash) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    if (!secret) {
      console.error('JWT_SECRET is not set');
      return res.status(500).json({ message: 'Internal server error' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      secret,
      { expiresIn }
    );

    return res.status(200).json({
      token,
      user: {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        department: user.department,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /auth/me
 * Requires requireAuth. Returns current user from req.user.userId.
 * Returns: { userId, email, role, name, department }
 */
async function getCurrentUser(req, res, next) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [user] = await db('users')
      .select('id', 'name', 'email', 'role', 'department', 'is_active')
      .where('id', userId)
      .whereNull('deleted_at')
      .limit(1);

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (user.is_active === 0 || user.is_active === false) {
      return res.status(403).json({ message: 'User account is inactive' });
    }

    return res.status(200).json({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      department: user.department,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  getCurrentUser,
};
