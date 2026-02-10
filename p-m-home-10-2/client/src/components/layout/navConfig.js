import {
  LayoutDashboard,
  Users,
  FolderKanban,
  ListTodo,
  Bell,
  FolderOpen,
  CheckSquare,
  User,
  Settings,
} from 'lucide-react';

/** Admin nav groups — Overview, Manage, Role Management, Profile, Alerts. */
export const ADMIN_GROUPS = [
  {
    label: 'Overview',
    links: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Manage',
    links: [
      { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
      { to: '/admin/tasks', label: 'Tasks', icon: ListTodo },
    ],
  },
  {
    label: 'Role Management',
    links: [{ to: '/admin/users', label: 'Employees', icon: Users }],
  },
  { label: 'Profile', links: [{ to: '/admin/profile', label: 'Profile Settings', icon: Settings }] },
  { label: 'Alerts', links: [{ to: '/admin/notifications', label: 'Notifications', icon: Bell, showUnread: true }] },
];

/** Employee nav groups — same routes and labels as before. */
export const EMPLOYEE_GROUPS = [
  { label: 'Overview', links: [{ to: '/app', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    label: 'Work',
    links: [
      { to: '/app/projects', label: 'My Projects', icon: FolderOpen },
      { to: '/app/tasks', label: 'My Tasks', icon: CheckSquare },
    ],
  },
  { label: 'Profile', links: [{ to: '/app/profile', label: 'Profile Settings', icon: Settings }] },
  { label: 'Alerts', links: [{ to: '/app/notifications', label: 'Notifications', icon: Bell, showUnread: true }] },
];

export function getNavGroups(isAdmin) {
  return isAdmin ? ADMIN_GROUPS : EMPLOYEE_GROUPS;
}
