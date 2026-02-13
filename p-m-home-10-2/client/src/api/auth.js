import api from './axios.js';

/**
 * Login with email and password.
 * POST /auth/login
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ token: string, user: { userId: string, email: string, role: string, name: string, department: string } }>}
 */
export async function login(email, password) {
  const { data } = await api.post('/auth/login', {
    email: (email || '').trim().toLowerCase(),
    password: password || '',
  });
  return data;
}

/**
 * Get current user from token.
 * GET /auth/me (Authorization header added by interceptor)
 * @returns {Promise<{ userId: string, email: string, role: string, name: string, department: string }>}
 */
export async function getCurrentUser() {
  const { data } = await api.get('/auth/me');
  return data;
}

/**
 * Request password reset email.
 * POST /auth/forgot-password with body: { email }
 * @param {string} email - User email
 * @returns {Promise<{ ok: boolean }>} Resolves when request completes; ok false on non-2xx
 */
export async function requestForgotPassword(email) {
  const res = await api.post('/auth/forgot-password', {
    email: (email || '').trim().toLowerCase(),
  });
  return { ok: res.status >= 200 && res.status < 300 };
}

/**
 * Reset password with token from email link.
 * POST /auth/reset-password with body: { token, newPassword }
 * @param {object} payload
 * @param {string} payload.token - Reset token from URL
 * @param {string} payload.newPassword - New password
 * @returns {Promise<{ ok: boolean }>} Resolves when request completes; ok false on non-2xx
 */
export async function requestResetPassword({ token, newPassword }) {
  try {
    const res = await api.post('/auth/reset-password', { token, newPassword });
    return { ok: res.status >= 200 && res.status < 300 };
  } catch (err) {
    return { ok: false };
  }
}
