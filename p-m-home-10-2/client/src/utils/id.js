/**
 * Unique ID generation for mock data.
 * Uses crypto.randomUUID() with fallback when not present.
 * @param {string} [prefix="id"]
 * @returns {string}
 */
export function uid(prefix = 'id') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}
