/**
 * Centralized JWT token storage (localStorage).
 * Key: pm_token
 */

const TOKEN_KEY = 'pm_token';

/**
 * @returns {string | null}
 */
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * @param {string} token
 */
export function setToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (_) {}
}

export function removeToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (_) {}
}
