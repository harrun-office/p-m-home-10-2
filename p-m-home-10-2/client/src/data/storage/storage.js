import { STORAGE_KEYS } from './storageKeys.js';
import { buildDemoSeed } from '../seed/demoSeed.js';

/**
 * Load JSON from localStorage. Returns fallback if key missing or invalid.
 * If corrupted JSON, returns fallback (caller may reset to seed).
 * @param {string} key
 * @param {unknown} fallback
 * @returns {unknown}
 */
export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Save value as JSON to localStorage.
 * @param {string} key
 * @param {unknown} value
 */
export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('storage.save failed', key, e);
  }
}

/**
 * Remove key from localStorage.
 * @param {string} key
 */
export function clear(key) {
  try {
    localStorage.removeItem(key);
  } catch (_) {}
}

/**
 * @returns {boolean} true if SEEDED_FLAG is set
 */
export function isSeeded() {
  const v = load(STORAGE_KEYS.SEEDED_FLAG, null);
  return v === true || v === 'true' || v === 1;
}

/**
 * On first run: write demo seed to localStorage and set SEEDED_FLAG.
 * If data is corrupted (e.g. invalid JSON or empty users), reset to seed.
 * Also reset if users don't have employeeId (for data migration).
 * Call once at app boot.
 */
export function seedIfNeeded() {
  if (isSeeded()) {
    const users = load(STORAGE_KEYS.USERS, null);
    if (!Array.isArray(users) || users.length === 0) {
      resetAllToSeed();
      save(STORAGE_KEYS.SEEDED_FLAG, true);
      return;
    }
    // Check if users have employeeId (data migration check)
    const hasEmployeeId = users.some(user => user.employeeId);
    if (!hasEmployeeId) {
      console.log('Users missing employeeId, reseeding...');
      resetAllToSeed();
      save(STORAGE_KEYS.SEEDED_FLAG, true);
      return;
    }
    return;
  }
  resetAllToSeed();
  save(STORAGE_KEYS.SEEDED_FLAG, true);
}

/**
 * Reset all app data to demo seed. Clears SEEDED_FLAG and DEADLINE_SENT.
 * Call from Dev Tools or when corrupted data is detected.
 */
export function resetAllToSeed() {
  const seed = buildDemoSeed();
  save(STORAGE_KEYS.USERS, seed.users);
  save(STORAGE_KEYS.PROJECTS, seed.projects);
  save(STORAGE_KEYS.TASKS, seed.tasks);
  save(STORAGE_KEYS.NOTIFICATIONS, seed.notifications);
  clear(STORAGE_KEYS.DEADLINE_SENT);
  // Clear seeded flag so next load will check for employeeId and reseed if needed
  clear(STORAGE_KEYS.SEEDED_FLAG);
}

/**
 * Load and validate array; if corrupted, return fallback.
 * @param {string} key
 * @param {unknown[]} fallback
 * @returns {unknown[]}
 */
export function loadArray(key, fallback = []) {
  const v = load(key, null);
  if (v != null && Array.isArray(v)) return v;
  return fallback;
}
