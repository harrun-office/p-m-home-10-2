import { Navigate, useLocation } from 'react-router-dom';
import { getSession } from '../../store/sessionStore.js';

/**
 * If no session, redirect to /login. Otherwise render children.
 */
export function RequireAuth({ children }) {
  const session = getSession();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
