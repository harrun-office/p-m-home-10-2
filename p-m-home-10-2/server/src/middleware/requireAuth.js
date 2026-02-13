const jwt = require('jsonwebtoken');

/**
 * Require valid JWT in Authorization: Bearer <token>.
 * On success sets req.user = { userId, role } and calls next().
 * On failure returns 401 without leaking verification details.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || typeof authHeader !== 'string') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = parts[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error('requireAuth: JWT_SECRET is not set');
    return res.status(500).json({ message: 'Internal server error' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

module.exports = requireAuth;
