import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { RequireAuth } from './components/auth/RequireAuth.jsx';
import { SidebarProvider } from './context/SidebarContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AdminLayout } from './components/layout/AdminLayout.jsx';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.jsx';
import { ResetPasswordPage } from './pages/ResetPasswordPage.jsx';
import { DevToolsPage } from './pages/DevToolsPage.jsx';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.jsx';
import { AdminProjectsPage } from './pages/admin/AdminProjectsPage.jsx';
import { AdminProjectDetailPage } from './pages/admin/AdminProjectDetailPage.jsx';
import { AdminTasksPage } from './pages/admin/AdminTasksPage.jsx';
import { AdminNotificationsPage } from './pages/admin/AdminNotificationsPage.jsx';
import { AdminUsersPage } from './pages/admin/AdminUsersPage.jsx';
import { AdminEmployeeDetailPage } from './pages/admin/AdminEmployeeDetailPage.jsx';
import { AdminProfilePage } from './pages/admin/AdminProfilePage.jsx';
import { EmployeeDashboardPage } from './pages/employee/EmployeeDashboardPage.jsx';
import { EmployeeTasksPage } from './pages/employee/EmployeeTasksPage.jsx';
import { EmployeeProjectsPage } from './pages/employee/EmployeeProjectsPage.jsx';
import { EmployeeProjectDetailPage } from './pages/employee/EmployeeProjectDetailPage.jsx';
import { EmployeeNotificationsPage } from './pages/employee/EmployeeNotificationsPage.jsx';
import { EmployeeProfilePage } from './pages/employee/EmployeeProfilePage.jsx';
import { getCurrentUser } from './api/auth.js';
import { getToken, removeToken } from './utils/authToken.js';
import { setSession, clearSession } from './store/sessionStore.js';
import { useDataStore } from './store/dataStore.jsx';
import './App.css';

function App() {
  const { error, retry, loading } = useDataStore();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (getToken()) {
        try {
          const user = await getCurrentUser();
          if (!cancelled) setSession(user);
        } catch {
          if (!cancelled) {
            removeToken();
            clearSession();
          }
        }
      } else {
        clearSession();
      }
      if (!cancelled) setAuthReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]" role="status" aria-label="Loading">
        <div className="text-sm text-[var(--fg-muted)]">Loading…</div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <SidebarProvider>
        <div className="flex flex-col min-h-screen bg-[var(--bg)]">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      {loading && (
        <div className="px-4 py-2 text-sm text-[var(--fg-muted)] bg-[var(--muted)]" role="status">
          Loading…
        </div>
      )}
      {error && (
        <div className="px-4 py-2 text-sm bg-[var(--danger-light)] text-[var(--danger-muted-fg)] flex items-center justify-between gap-4" role="alert">
          <span>Error loading data. {error}</span>
          <button type="button" onClick={retry} className="px-2 py-1 rounded border border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger-muted)] text-xs font-medium">
            Retry
          </button>
        </div>
      )}
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="dev-tools" element={<DevToolsPage />} />
          <Route path="projects" element={<AdminProjectsPage />} />
          <Route path="projects/:id" element={<AdminProjectDetailPage />} />
          <Route path="tasks" element={<AdminTasksPage />} />
          <Route path="profile" element={<AdminProfilePage />} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/:id" element={<AdminEmployeeDetailPage />} />
        </Route>
        <Route path="/app" element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route index element={<EmployeeDashboardPage />} />
          <Route path="tasks" element={<EmployeeTasksPage />} />
          <Route path="projects" element={<EmployeeProjectsPage />} />
          <Route path="projects/:id" element={<EmployeeProjectDetailPage />} />
          <Route path="profile" element={<EmployeeProfilePage />} />
          <Route path="notifications" element={<EmployeeNotificationsPage />} />
        </Route>
      </Routes>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
