import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { getSession } from '../../store/sessionStore.js';
import { LayoutShell } from './LayoutShell.jsx';

/**
 * Admin area: guard (session + ADMIN) + LayoutShell (floating sidebar + content canvas).
 * Redirect to /login if no session, to /app if not ADMIN.
 */
export function AdminLayout() {
  const navigate = useNavigate();
  const session = getSession();

  useEffect(() => {
    if (!session) {
      navigate('/login', { replace: true });
      return;
    }
    if (session.role !== 'ADMIN') {
      navigate('/app', { replace: true });
    }
  }, [session, navigate]);

  if (!session || session.role !== 'ADMIN') return null;

  return (
    <LayoutShell>
      <Outlet />
    </LayoutShell>
  );
}
