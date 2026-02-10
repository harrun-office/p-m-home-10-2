import { nowISO, todayKey, addDays } from '../../utils/date.js';

/**
 * Returns fresh demo seed with dynamic dates based on current day so "today", "overdue", and "due today" always work.
 * All dates are derived from todayKey() and addDays() at build time.
 * @returns {{ users: import('../../../types/models.js').User[], projects: import('../../../types/models.js').Project[], tasks: import('../../../types/models.js').Task[], notifications: import('../../../types/models.js').Notification[] }}
 */
export function buildDemoSeed() {
  const now = nowISO();
  const today = todayKey();
  // Use noon UTC so "today" stays today in all timezones (midnight UTC can be previous day in western zones)
  const todayISO = `${today}T12:00:00.000Z`;
  const tomorrow = addDays(todayISO, 1);
  const in3 = addDays(todayISO, 3);
  const in5 = addDays(todayISO, 5);
  const in7 = addDays(todayISO, 7);
  const past1 = addDays(todayISO, -1);
  const past3 = addDays(todayISO, -3);
  const in1 = addDays(todayISO, 1);
  const in2 = addDays(todayISO, 2);
  const in14 = addDays(todayISO, 14);
  const past5 = addDays(todayISO, -5);

  const users = [
    { id: 'user-admin', name: 'Admin Demo', email: 'admin@demo.com', role: 'ADMIN', department: 'DEV', isActive: true, employeeId: 'CIPL1985', personalNumber: '' },
    { id: 'user-emp', name: 'Employee Demo', email: 'employee@demo.com', role: 'EMPLOYEE', department: 'DEV', isActive: true, employeeId: 'CIPL1887', personalNumber: '+1 555-0101' },
    { id: 'user-2', name: 'Jane Dev', email: 'jane@example.com', role: 'EMPLOYEE', department: 'DEV', isActive: true, employeeId: 'T113', personalNumber: '+1 555-0102' },
    { id: 'user-3', name: 'Bob Presales', email: 'bob@example.com', role: 'EMPLOYEE', department: 'PRESALES', isActive: true, employeeId: 'T114', personalNumber: '+1 555-0103' },
    { id: 'user-4', name: 'Alice Dev', email: 'alice@example.com', role: 'EMPLOYEE', department: 'DEV', isActive: true, employeeId: 'T115', personalNumber: '' },
    { id: 'user-5', name: 'Charlie Presales', email: 'charlie@example.com', role: 'EMPLOYEE', department: 'PRESALES', isActive: true, employeeId: 'T116', personalNumber: '' },
    { id: 'user-6', name: 'Dana Dev', email: 'dana@example.com', role: 'EMPLOYEE', department: 'DEV', isActive: true, employeeId: 'T117', personalNumber: '' },
    { id: 'user-7', name: 'Eve Tester', email: 'eve@example.com', role: 'EMPLOYEE', department: 'TESTER', isActive: true, employeeId: 'T118', personalNumber: '' },
  ];

  const projects = [
    { id: 'proj-1', name: 'Portal Redesign', description: 'Customer portal UI overhaul', status: 'ACTIVE', startDate: past3, endDate: in7, assignedUserIds: ['user-emp', 'user-2'] },
    { id: 'proj-2', name: 'API v2', description: 'REST API version 2', status: 'ACTIVE', startDate: past1, endDate: in5, assignedUserIds: ['user-2', 'user-4'] },
    { id: 'proj-3', name: 'Sales Playbook', description: 'Presales materials and scripts', status: 'ACTIVE', startDate: todayISO, endDate: addDays(todayISO, 14), assignedUserIds: ['user-3', 'user-5'] },
    { id: 'proj-4', name: 'Legacy Migration', description: 'Migrate legacy services', status: 'ON_HOLD', startDate: past3, endDate: in3, assignedUserIds: ['user-4'] },
    { id: 'proj-5', name: 'Mobile App', description: 'React Native app', status: 'COMPLETED', startDate: addDays(todayISO, -60), endDate: past1, assignedUserIds: ['user-emp', 'user-6'] },
    { id: 'proj-6', name: 'Learning Hub', description: 'Internal training and docs', status: 'ACTIVE', startDate: past1, endDate: in7, assignedUserIds: ['user-emp', 'user-2', 'user-4'] },
  ];

  const tasks = [
    { id: 'task-1', projectId: 'proj-1', title: 'Design system tokens', description: 'Define colors and spacing', assigneeId: 'user-emp', priority: 'HIGH', status: 'IN_PROGRESS', createdById: 'user-admin', createdAt: past1, assignedAt: todayISO, updatedAt: now, deadline: in7, tags: [] },
    { id: 'task-2', projectId: 'proj-1', title: 'Login page mockup', description: 'Figma mockup for login', assigneeId: 'user-2', priority: 'MEDIUM', status: 'TODO', createdById: 'user-admin', createdAt: past1, assignedAt: todayISO, updatedAt: todayISO, deadline: in14, tags: [] },
    { id: 'task-3', projectId: 'proj-1', title: 'Accessibility audit', description: 'WCAG audit for portal', assigneeId: 'user-emp', priority: 'MEDIUM', status: 'TODO', createdById: 'user-admin', createdAt: todayISO, assignedAt: todayISO, updatedAt: now, deadline: in2, tags: ['Learning'] },
    { id: 'task-4', projectId: 'proj-1', title: 'API integration', description: 'Wire portal to backend', assigneeId: 'user-2', priority: 'HIGH', status: 'TODO', createdById: 'user-admin', createdAt: past3, assignedAt: todayISO, updatedAt: now, deadline: in5, tags: [] },
    { id: 'task-5', projectId: 'proj-1', title: 'E2E tests', description: 'Cypress tests for flows', assigneeId: 'user-emp', priority: 'LOW', status: 'COMPLETED', createdById: 'user-admin', createdAt: past3, assignedAt: todayISO, updatedAt: now, tags: [] },
    { id: 'task-6', projectId: 'proj-2', title: 'OpenAPI spec', description: 'Define OpenAPI 3 spec', assigneeId: 'user-2', priority: 'HIGH', status: 'IN_PROGRESS', createdById: 'user-admin', createdAt: past1, assignedAt: todayISO, updatedAt: now, deadline: todayISO, tags: [] },
    { id: 'task-7', projectId: 'proj-2', title: 'Auth middleware', description: 'JWT validation middleware', assigneeId: 'user-4', priority: 'HIGH', status: 'TODO', createdById: 'user-admin', createdAt: past1, assignedAt: todayISO, updatedAt: todayISO, deadline: in1, tags: [] },
    { id: 'task-8', projectId: 'proj-2', title: 'Rate limiting', description: 'Per-client rate limits', assigneeId: 'user-2', priority: 'MEDIUM', status: 'TODO', createdById: 'user-admin', createdAt: todayISO, assignedAt: todayISO, updatedAt: todayISO, tags: [] },
    { id: 'task-9', projectId: 'proj-2', title: 'Documentation', description: 'API docs and examples', assigneeId: 'user-4', priority: 'MEDIUM', status: 'TODO', createdById: 'user-2', createdAt: past1, assignedAt: todayISO, updatedAt: now, deadline: past1, tags: ['Learning'] },
    { id: 'task-10', projectId: 'proj-2', title: 'Health check endpoint', description: '/health for load balancer', assigneeId: 'user-4', priority: 'LOW', status: 'COMPLETED', createdById: 'user-admin', createdAt: past3, assignedAt: todayISO, updatedAt: now, tags: [] },
    { id: 'task-11', projectId: 'proj-3', title: 'Competitor comparison', description: 'One-pager vs competitors', assigneeId: 'user-3', priority: 'HIGH', status: 'TODO', createdById: 'user-admin', createdAt: todayISO, assignedAt: todayISO, updatedAt: todayISO, tags: [] },
    { id: 'task-12', projectId: 'proj-3', title: 'Demo script', description: 'Standard demo script', assigneeId: 'user-5', priority: 'MEDIUM', status: 'IN_PROGRESS', createdById: 'user-3', createdAt: past1, assignedAt: todayISO, updatedAt: now, deadline: todayISO, tags: [] },
    { id: 'task-13', projectId: 'proj-3', title: 'Pricing FAQ', description: 'FAQ for pricing questions', assigneeId: 'user-5', priority: 'LOW', status: 'TODO', createdById: 'user-3', createdAt: todayISO, assignedAt: todayISO, updatedAt: todayISO, tags: [] },
    { id: 'task-14', projectId: 'proj-4', title: 'Inventory legacy APIs', description: 'List all legacy endpoints', assigneeId: 'user-4', priority: 'MEDIUM', status: 'TODO', createdById: 'user-admin', createdAt: past3, assignedAt: todayISO, updatedAt: now, deadline: past5, tags: [] },
    { id: 'task-15', projectId: 'proj-5', title: 'Release notes', description: 'Final release notes', assigneeId: 'user-emp', priority: 'LOW', status: 'COMPLETED', createdById: 'user-admin', createdAt: past3, assignedAt: todayISO, updatedAt: now, tags: [] },
    { id: 'task-16', projectId: 'proj-6', title: 'React 19 guide', description: 'Internal guide for React 19', assigneeId: 'user-emp', priority: 'MEDIUM', status: 'IN_PROGRESS', createdById: 'user-admin', createdAt: past1, assignedAt: todayISO, updatedAt: now, deadline: in7, tags: ['Learning'] },
    { id: 'task-17', projectId: 'proj-6', title: 'Vite setup doc', description: 'Vite + React setup', assigneeId: 'user-2', priority: 'MEDIUM', status: 'TODO', createdById: 'user-emp', createdAt: todayISO, assignedAt: todayISO, updatedAt: todayISO, tags: ['Learning'] },
    { id: 'task-18', projectId: 'proj-6', title: 'Code review checklist', description: 'Team checklist for PRs', assigneeId: 'user-4', priority: 'LOW', status: 'TODO', createdById: 'user-admin', createdAt: todayISO, assignedAt: todayISO, updatedAt: todayISO, tags: [] },
    { id: 'task-19', projectId: 'proj-1', title: 'Responsive breakpoints', description: 'Define breakpoints', assigneeId: 'user-emp', priority: 'MEDIUM', status: 'TODO', createdById: 'user-2', createdAt: past1, assignedAt: todayISO, updatedAt: now, deadline: todayISO, tags: [] },
    { id: 'task-20', projectId: 'proj-2', title: 'Error responses', description: 'Standard error JSON schema', assigneeId: 'user-4', priority: 'MEDIUM', status: 'TODO', createdById: 'user-admin', createdAt: todayISO, assignedAt: todayISO, updatedAt: todayISO, tags: [] },
    { id: 'task-21', projectId: 'proj-6', title: 'Security best practices', description: 'OWASP summary for devs', assigneeId: 'user-emp', priority: 'HIGH', status: 'TODO', createdById: 'user-admin', createdAt: past1, assignedAt: todayISO, updatedAt: todayISO, deadline: in14, tags: ['Learning'] },
    { id: 'task-22', projectId: 'proj-1', title: 'Performance budget', description: 'Lighthouse targets', assigneeId: 'user-2', priority: 'LOW', status: 'TODO', createdById: 'user-admin', createdAt: todayISO, assignedAt: todayISO, updatedAt: now, deadline: todayISO, tags: [] },
    { id: 'task-23', projectId: 'proj-3', title: 'Objection handling', description: 'Common objections and replies', assigneeId: 'user-3', priority: 'MEDIUM', status: 'TODO', createdById: 'user-5', createdAt: todayISO, assignedAt: todayISO, updatedAt: todayISO, deadline: in7, tags: [] },
    { id: 'task-24', projectId: 'proj-6', title: 'Onboarding checklist', description: 'New hire onboarding', assigneeId: 'user-emp', priority: 'HIGH', status: 'TODO', createdById: 'user-admin', createdAt: past1, assignedAt: todayISO, updatedAt: now, deadline: todayISO, tags: [] },
    { id: 'task-25', projectId: 'proj-2', title: 'Versioning strategy', description: 'API versioning doc', assigneeId: 'user-2', priority: 'MEDIUM', status: 'TODO', createdById: 'user-admin', createdAt: todayISO, assignedAt: todayISO, deadline: in14, tags: ['Learning'] },
  ];

  const notifications = [];

  return { users, projects, tasks, notifications };
}
