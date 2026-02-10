/**
 * Minimal toast system (no dependency). Context + showToast, auto dismiss 3–4s.
 * Use for "Saved", "Created", "Updated", "Reset Demo", etc.
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

const TOAST_DURATION_MS = 3500;

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { showToast: () => {} };
  return ctx;
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback(({ type = 'info', title, message }) => {
    setToast({ type, title, message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          role="alert"
          className="fixed bottom-6 right-6 z-[100] flex max-w-sm flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-lg)] text-[var(--card-fg)]"
        >
          {toast.title && <p className="font-semibold text-sm">{toast.title}</p>}
          {toast.message && <p className="text-sm text-[var(--muted-fg)] mt-0.5">{toast.message}</p>}
          {!toast.title && !toast.message && <p className="text-sm">{toast.type}</p>}
        </div>
      )}
    </ToastContext.Provider>
  );
}
