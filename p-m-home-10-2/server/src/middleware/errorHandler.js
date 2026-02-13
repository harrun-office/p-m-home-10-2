/**
 * Centralized error handler. Must be registered after all routes.
 */
function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  const message = status === 500 ? 'Internal server error' : (err.message || 'Internal server error');
  res.status(status).json({ message });
}

module.exports = { errorHandler };
