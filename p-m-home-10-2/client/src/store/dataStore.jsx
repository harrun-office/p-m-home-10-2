import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import * as data from '../data/index.js';

const initialState = {
  users: [],
  projects: [],
  tasks: [],
  notifications: [],
};

function reducer(state, action) {
  if (action.type === 'SET_DATA') {
    return {
      users: action.payload.users ?? state.users,
      projects: action.payload.projects ?? state.projects,
      tasks: action.payload.tasks ?? state.tasks,
      notifications: action.payload.notifications ?? state.notifications,
    };
  }
  return state;
}

const DataStoreContext = createContext(null);

export function DataStoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const refresh = useCallback(() => {
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
  }, []);

  const resetDemo = useCallback(() => {
    data.resetAllToSeed();
    refresh();
  }, [refresh]);

  const runDeadlineCheck = useCallback((nowISO) => {
    data.notificationRepo.runDeadlineCheck(nowISO ?? new Date().toISOString());
    refresh();
  }, [refresh]);

  const createProject = useCallback((payload) => {
    data.projectRepo.create(payload);
    refresh();
  }, [refresh]);

  const updateProject = useCallback((id, patch) => {
    data.projectRepo.update(id, patch);
    refresh();
  }, [refresh]);

  const setProjectStatus = useCallback((id, status) => {
    data.projectRepo.setStatus(id, status);
    refresh();
  }, [refresh]);

  const assignMembers = useCallback((projectId, userIds) => {
    data.projectRepo.assignMembers(projectId, userIds);
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
    if (result.ok) refresh();
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
    refresh,
    resetDemo,
    runDeadlineCheck,
    createProject,
    updateProject,
    setProjectStatus,
    assignMembers,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
    moveTaskStatus,
    markNotificationRead,
    markAllRead,
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
