import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import * as data from '../data/index.js';
import { getSession } from './sessionStore.js';

const initialState = {
  users: [],
  projects: [],
  tasks: [],
  notifications: [],
  loading: false,
  error: null,
};

function reducer(state, action) {
  if (action.type === 'SET_DATA') {
    return {
      ...state,
      users: action.payload.users ?? state.users,
      projects: action.payload.projects ?? state.projects,
      tasks: action.payload.tasks ?? state.tasks,
      notifications: action.payload.notifications ?? state.notifications,
    };
  }
  if (action.type === 'SET_LOADING') {
    return { ...state, loading: !!action.payload };
  }
  if (action.type === 'SET_ERROR') {
    return { ...state, error: action.payload ?? null };
  }
  return state;
}

const DataStoreContext = createContext(null);

export function DataStoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const refresh = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const users = data.userRepo.list();
      const projects = data.projectRepo.list();
      const tasks = data.taskRepo.list();
      const notifications = data.load(data.STORAGE_KEYS.NOTIFICATIONS, []);
      dispatch({
        type: 'SET_DATA',
        payload: {
          users,
          projects,
          tasks,
          notifications: Array.isArray(notifications) ? notifications : [],
        },
      });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err?.message || 'Failed to load data' });
    }
  }, []);

  const setLoading = useCallback((value) => {
    dispatch({ type: 'SET_LOADING', payload: value });
  }, []);

  const setError = useCallback((message) => {
    dispatch({ type: 'SET_ERROR', payload: message ?? null });
  }, []);

  const retry = useCallback(() => {
    refresh();
  }, [refresh]);

  const resetDemo = useCallback(() => {
    data.resetAllToSeed();
    refresh();
  }, [refresh]);

  const runDeadlineCheck = useCallback((nowISO) => {
    data.notificationRepo.runDeadlineCheck(nowISO ?? new Date().toISOString());
    refresh();
  }, [refresh]);

  const createProject = useCallback((payload) => {
    const session = getSession();
    data.projectRepo.create(payload, session?.userId);
    refresh();
  }, [refresh]);

  const updateProject = useCallback((id, patch) => {
    const session = getSession();
    data.projectRepo.update(id, patch, session?.userId);
    refresh();
  }, [refresh]);

  const setProjectStatus = useCallback((id, status, note) => {
    const session = getSession();
    data.projectRepo.setStatus(id, status, session?.userId, note);
    refresh();
  }, [refresh]);

  const assignMembers = useCallback((projectId, userIds) => {
    const session = getSession();
    data.projectRepo.assignMembers(projectId, userIds, session?.userId);
    refresh();
  }, [refresh]);

  const addProjectMilestone = useCallback((projectId, title, note) => {
    const session = getSession();
    data.projectRepo.addMilestone(projectId, title, session?.userId, note);
    refresh();
  }, [refresh]);

  const recordProjectActivity = useCallback((projectId, event) => {
    const session = getSession();
    data.projectRepo.recordActivity(projectId, event, session?.userId);
    refresh();
  }, [refresh]);

  const deleteProject = useCallback((id) => {
    const result = data.projectRepo.remove(id);
    if (result.ok) refresh();
    return result;
  }, [refresh]);

  const createTask = useCallback((payload, session) => {
    const result = data.taskRepo.create(payload, session);
    if (result.ok) refresh();
    return result;
  }, [refresh]);

  const updateTask = useCallback((id, patch, session) => {
    const result = data.taskRepo.update(id, patch, session);
    if (result.ok) refresh();
    return result;
  }, [refresh]);

  const deleteTask = useCallback((id, session) => {
    const result = data.taskRepo.remove(id, session);
    if (result.ok) refresh();
    return result;
  }, [refresh]);

  const moveTaskStatus = useCallback((id, newStatus, session) => {
    const result = data.taskRepo.moveStatus(id, newStatus, session);
    if (result.ok) {
      if (newStatus === 'COMPLETED') {
        const tasks = data.taskRepo.list();
        const task = tasks.find((t) => t.id === id);
        if (task?.projectId) {
          data.projectRepo.recordActivity(
            task.projectId,
            { type: 'task_milestone', payload: { taskId: id, message: 'Task completed' } },
            session?.userId
          );
        }
      }
      refresh();
    }
    return result;
  }, [refresh]);

  const markNotificationRead = useCallback((id, userId) => {
    data.notificationRepo.markRead(id, userId);
    refresh();
  }, [refresh]);

  const markAllRead = useCallback((userId) => {
    data.notificationRepo.markAllRead(userId);
    refresh();
  }, [refresh]);

  /** Notify all admins that an employee requested to mark a project as completed. */
  const notifyAdminsProjectCompletionRequest = useCallback((projectId, projectName, requestedByUserId, requestedByName) => {
    const users = data.userRepo.list();
    const admins = users.filter((u) => u.role === 'ADMIN');
    const message = `${requestedByName || 'An employee'} requested to mark project "${projectName}" as completed.`;
    for (const admin of admins) {
      data.notificationRepo.createForUser(admin.id, {
        type: 'PROJECT_COMPLETION_REQUEST',
        message,
        projectId,
      });
    }
    refresh();
  }, [refresh]);

  const setUserActive = useCallback((userId, isActive) => {
    data.userRepo.setActive(userId, isActive);
    refresh();
  }, [refresh]);

  const createUser = useCallback(async (payload) => {
    const user = await data.userRepo.create(payload);
    refresh();
    return user;
  }, [refresh]);

  const updateUser = useCallback(async (id, patch) => {
    const user = await data.userRepo.update(id, patch);
    refresh();
    return user;
  }, [refresh]);

  const deleteUser = useCallback((id) => {
    const result = data.userRepo.remove(id);
    if (result) refresh();
    return result;
  }, [refresh]);

  useEffect(() => {
    data.seedIfNeeded();
    refresh();
  }, [refresh]);

  const value = {
    state,
    loading: state.loading,
    error: state.error,
    refresh,
    setLoading,
    setError,
    retry,
    resetDemo,
    runDeadlineCheck,
    createProject,
    updateProject,
    setProjectStatus,
    assignMembers,
    addProjectMilestone,
    recordProjectActivity,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
    moveTaskStatus,
    markNotificationRead,
    markAllRead,
    notifyAdminsProjectCompletionRequest,
    setUserActive,
    createUser,
    updateUser,
    deleteUser,
  };

  return (
    <DataStoreContext.Provider value={value}>
      {children}
    </DataStoreContext.Provider>
  );
}

export function useDataStore() {
  const ctx = useContext(DataStoreContext);
  if (!ctx) throw new Error('useDataStore must be used within DataStoreProvider');
  return ctx;
}
