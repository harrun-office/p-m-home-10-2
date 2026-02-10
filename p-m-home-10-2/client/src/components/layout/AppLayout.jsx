import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { getSession } from '../../store/sessionStore.js';
import { LayoutShell } from './LayoutShell.jsx';

/**
 * Employee app: guard (redirect admin to /admin) + LayoutShell. Used inside RequireAuth.
 */
export function AppLayout() {
  const navigate = useNavigate();
  const session = getSession();

  useEffect(() => {
    if (session?.role === 'ADMIN') {
      navigate('/admin', { replace: true });
    }
  }, [session, navigate]);

  if (session?.role === 'ADMIN') return null;

  return (
    <LayoutShell>
      <Outlet />
    </LayoutShell>
  );
}
