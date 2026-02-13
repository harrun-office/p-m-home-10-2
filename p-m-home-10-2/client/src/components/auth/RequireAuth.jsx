import { Navigate, useLocation } from 'react-router-dom';
import { getToken } from '../../utils/authToken.js';

/**
 * If no JWT token, redirect to /login. Otherwise render children.
 * Session may still be restoring; token is the source of truth.
 */
export function RequireAuth({ children }) {
  const location = useLocation();
  const token = getToken();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
