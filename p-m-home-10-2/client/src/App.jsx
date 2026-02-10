import { Routes, Route } from 'react-router-dom';
import { RequireAuth } from './components/auth/RequireAuth.jsx';
import { SidebarProvider } from './context/SidebarContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AdminLayout } from './components/layout/AdminLayout.jsx';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
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
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <div className="flex flex-col min-h-screen bg-[var(--bg)]">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
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
