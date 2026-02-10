import { useDataStore } from '../../store/dataStore.jsx';
import { getSession } from '../../store/sessionStore.js';
import { Button } from '../../components/ui/Button.jsx';
import { MotionPage } from '../../components/motion/MotionPage.jsx';
import { NotificationsList } from '../../components/notifications/NotificationsList.jsx';

/**
 * Employee notifications: only notifications where userId === session.userId.
 * Guard via RequireAuth + AppLayout. "Run Deadline Check" allowed for demo.
 */
export function EmployeeNotificationsPage() {
  const { state, runDeadlineCheck, markNotificationRead, markAllRead } = useDataStore();
  const session = getSession();

  const allNotifications = state.notifications || [];
  const myNotifications = session
    ? allNotifications.filter((n) => n.userId === session.userId)
    : [];

  function handleMarkRead(id) {
    if (session) markNotificationRead(id, session.userId);
  }

  function handleMarkAllRead() {
    if (session) markAllRead(session.userId);
  }

  if (!session) return null;

  return (
    <MotionPage className="space-y-6 sm:space-y-8">

      <NotificationsList
        notifications={myNotifications}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        emptyMessage="No notifications."
        showFilters
      />
    </MotionPage>
  );
}
