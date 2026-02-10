/**
 * Theme store: light/dark with localStorage persistence.
 * No libs; applyTheme() sets document.documentElement.dataset.theme.
 */

const STORAGE_KEY = 'pm-theme';

export function getTheme() {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  // Default to dark mode
  return 'dark';
}

export function setTheme(theme) {
  const next = theme === 'dark' ? 'dark' : 'light';
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }
  return next;
}

export function toggleTheme() {
  const current = getTheme();
  const next = current === 'light' ? 'dark' : 'light';
  setTheme(next);
  return next;
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  const value = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', value);
}
