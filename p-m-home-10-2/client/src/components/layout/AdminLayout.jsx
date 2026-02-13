import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { getToken } from '../../utils/authToken.js';
import { getSession } from '../../store/sessionStore.js';
import { LayoutShell } from './LayoutShell.jsx';

/**
 * Admin area: guard (token + ADMIN role) + LayoutShell.
 * Redirect to /login if no token, to /app if not ADMIN.
 */
export function AdminLayout() {
  const navigate = useNavigate();
  const token = getToken();
  const session = getSession();

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    if (session && session.role !== 'ADMIN') {
      navigate('/app', { replace: true });
    }
  }, [token, session, navigate]);

  if (!token || (session && session.role !== 'ADMIN')) return null;

  return (
    <LayoutShell>
      <Outlet />
    </LayoutShell>
  );
}
