import { useDataStore } from '../store/dataStore.jsx';

/**
 * Admin-only dev tools page. Route: /admin/dev-tools
 * Shows counts and buttons: Reset Demo Data, Run Deadline Check, Refresh.
 */
export function DevToolsPage() {
  const { state, resetDemo, runDeadlineCheck, refresh } = useDataStore();

  const users = state.users?.length ?? 0;
  const projects = state.projects?.length ?? 0;
  const tasks = state.tasks?.length ?? 0;
  const notifications = state.notifications?.length ?? 0;

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-xl font-semibold mb-4">Dev Tools (Phase 1)</h1>
      <div className="text-sm text-gray-600 mb-4">
        <p>Users: {users}</p>
        <p>Projects: {projects}</p>
        <p>Tasks: {tasks}</p>
        <p>Notifications: {notifications}</p>
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => resetDemo()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Reset Demo Data
        </button>
        <button
          type="button"
          onClick={() => runDeadlineCheck()}
          className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
        >
          Run Deadline Check
        </button>
        <button
          type="button"
          onClick={() => refresh()}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
