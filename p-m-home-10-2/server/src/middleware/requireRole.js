/**
 * Require request to have req.user (from requireAuth) with one of the allowed roles.
 * @param  {...string} allowedRoles - e.g. 'ADMIN', 'EMPLOYEE'
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

module.exports = { requireRole };
