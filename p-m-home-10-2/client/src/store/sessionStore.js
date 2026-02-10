/**
 * Session store for current user. Use getSession() for task/create/update/move.
 * Phase 0: getSession() returns { userId, email, role, name } or null.
 */

const SESSION_KEY = 'pm_session';

/**
 * @returns {{ userId: string, email: string, role: string, name: string } | null}
 */
export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && data.userId && data.role) return data;
    return null;
  } catch {
    return null;
  }
}

/**
 * @param {{ userId: string, email: string, role: string, name: string }} session
 */
export function setSession(session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn('sessionStore.setSession failed', e);
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (_) {}
}
