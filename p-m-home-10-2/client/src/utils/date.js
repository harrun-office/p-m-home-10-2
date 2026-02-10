/**
 * Date helpers for consistent ISO handling and "today" logic.
 */

/**
 * @returns {string} Current time as ISO string
 */
export function nowISO() {
  return new Date().toISOString();
}

/**
 * @returns {string} YYYY-MM-DD in local timezone
 */
export function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * @param {string} iso - ISO date string
 * @returns {string} YYYY-MM-DD (first 10 chars, UTC date)
 */
export function toDayKey(iso) {
  return iso ? String(iso).slice(0, 10) : '';
}

/**
 * @param {string} iso - ISO date string
 * @returns {string} YYYY-MM-DD in local timezone (for "today" comparisons)
 */
export function toLocalDayKey(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * @param {string} localDateKey - YYYY-MM-DD (local date key)
 * @param {number} n - days to add (can be negative)
 * @returns {string} YYYY-MM-DD in local timezone
 */
export function addDaysToLocalKey(localDateKey, n) {
  if (!localDateKey) return '';
  const [y, m, d] = localDateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + n);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/**
 * @param {string} iso - ISO date string
 * @param {number} n - days to add (can be negative)
 * @returns {string} ISO date string
 */
export function addDays(iso, n) {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString();
}

/**
 * @param {string} aISO
 * @param {string} bISO
 * @returns {boolean}
 */
export function isSameDay(aISO, bISO) {
  return toDayKey(aISO) === toDayKey(bISO);
}

/**
 * @param {string} deadlineISO
 * @param {string} [fromISO] - defaults to now
 * @returns {number} days until deadline (negative = overdue)
 */
export function daysUntil(deadlineISO, fromISO) {
  const from = fromISO ? new Date(fromISO) : new Date();
  const to = new Date(deadlineISO);
  const fromDay = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const toDay = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.floor((toDay - fromDay) / (24 * 60 * 60 * 1000));
}

/**
 * @param {string} deadlineISO
 * @param {string} [fromISO]
 * @returns {boolean}
 */
export function isOverdue(deadlineISO, fromISO) {
  return daysUntil(deadlineISO, fromISO) < 0;
}
