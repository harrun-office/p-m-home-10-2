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
  const past7 = addDays(todayISO, -7);
  const past14 = addDays(todayISO, -14);
  const past2 = addDays(todayISO, -2);
  const past4 = addDays(todayISO, -4);
  const past6 = addDays(todayISO, -6);

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
    {
      id: 'proj-1',
      name: 'Portal Redesign',
      description: 'Customer portal UI overhaul',
      status: 'ACTIVE',
      startDate: past3,
      endDate: in7,
      assignedUserIds: ['user-emp', 'user-2'],
      attachments: ['https://picsum.photos/seed/portal1/400/300', 'https://picsum.photos/seed/portal2/400/300', 'design-brief.pdf', 'wireframes.fig', 'brand-guidelines.pdf'],
      createdAt: past7,
      statusHistory: [
        { status: 'ACTIVE', at: past7, userId: 'user-admin' },
      ],
      activityLog: [
        { id: 'evt-p1-1', type: 'milestone', at: past7, userId: 'user-admin', note: 'Project kickoff', payload: { title: 'Kickoff meeting' } },
        { id: 'evt-p1-2', type: 'date_change', at: past6, userId: 'user-admin', payload: { field: 'startDate', oldValue: past14, newValue: past3 } },
        { id: 'evt-p1-3', type: 'member_added', at: past5, userId: 'user-admin', payload: { userId: 'user-2' } },
        { id: 'evt-p1-4', type: 'milestone', at: past5, userId: 'user-admin', payload: { title: 'Sprint 1 planning done' } },
        { id: 'evt-p1-5', type: 'date_change', at: past3, userId: 'user-admin', payload: { field: 'endDate', oldValue: in5, newValue: in7 } },
        { id: 'evt-p1-6', type: 'milestone', at: past2, userId: 'user-admin', note: 'Stakeholder sign-off', payload: { title: 'UI components approved' } },
        { id: 'evt-p1-7', type: 'task_milestone', at: past2, userId: 'user-emp', payload: { taskId: 'task-5', message: 'Task completed' } },
        { id: 'evt-p1-8', type: 'milestone', at: past1, userId: 'user-admin', note: 'Design approved', payload: { title: 'Design review completed' } },
        { id: 'evt-p1-9', type: 'milestone', at: past1, userId: 'user-2', payload: { title: 'Figma handoff to dev' } },
        { id: 'evt-p1-10', type: 'task_milestone', at: todayISO, userId: 'user-emp', payload: { taskId: 'task-3', message: 'Task completed' } },
        { id: 'evt-p1-11', type: 'milestone', at: now, userId: 'user-admin', note: 'Ready for QA', payload: { title: 'Development phase complete' } },
      ],
    },
    {
      id: 'proj-2',
      name: 'API v2',
      description: 'REST API version 2',
      status: 'ACTIVE',
      startDate: past1,
      endDate: in5,
      assignedUserIds: ['user-2', 'user-4'],
      createdAt: past5,
      statusHistory: [{ status: 'ACTIVE', at: past5, userId: 'user-admin' }],
      activityLog: [
        { id: 'evt-p2-1', type: 'milestone', at: past5, userId: 'user-admin', payload: { title: 'API spec finalized' } },
        { id: 'evt-p2-2', type: 'member_added', at: past4, userId: 'user-admin', payload: { userId: 'user-4' } },
        { id: 'evt-p2-3', type: 'milestone', at: past3, userId: 'user-2', note: 'OpenAPI 3.0', payload: { title: 'Schema review done' } },
        { id: 'evt-p2-4', type: 'task_milestone', at: past2, userId: 'user-4', payload: { taskId: 'task-10', message: 'Task completed' } },
        { id: 'evt-p2-5', type: 'date_change', at: past1, userId: 'user-admin', payload: { field: 'endDate', oldValue: in3, newValue: in5 } },
        { id: 'evt-p2-6', type: 'milestone', at: past1, userId: 'user-admin', payload: { title: 'Sprint 2 started' } },
      ],
    },
    {
      id: 'proj-3',
      name: 'Sales Playbook',
      description: 'Presales materials and scripts',
      status: 'ACTIVE',
      startDate: todayISO,
      endDate: addDays(todayISO, 14),
      assignedUserIds: ['user-3', 'user-5'],
      createdAt: todayISO,
      statusHistory: [{ status: 'ACTIVE', at: todayISO, userId: 'user-admin' }],
      activityLog: [
        { id: 'evt-p3-1', type: 'milestone', at: todayISO, userId: 'user-admin', note: 'Presales initiative started', payload: { title: 'Project started' } },
        { id: 'evt-p3-2', type: 'milestone', at: todayISO, userId: 'user-3', payload: { title: 'Kickoff with sales team' } },
      ],
    },
    {
      id: 'proj-4',
      name: 'Legacy Migration',
      description: 'Migrate legacy services',
      status: 'ON_HOLD',
      startDate: past3,
      endDate: in3,
      assignedUserIds: ['user-4'],
      createdAt: past14,
      statusHistory: [
        { status: 'ACTIVE', at: past14, userId: 'user-admin' },
        { status: 'ON_HOLD', at: past5, userId: 'user-admin', note: 'Waiting on infrastructure' },
      ],
      activityLog: [
        { id: 'evt-p4-1', type: 'milestone', at: past14, userId: 'user-admin', payload: { title: 'Discovery phase' } },
        { id: 'evt-p4-2', type: 'date_change', at: past7, userId: 'user-admin', payload: { field: 'endDate', oldValue: past1, newValue: in3 } },
        { id: 'evt-p4-3', type: 'milestone', at: past6, userId: 'user-4', payload: { title: 'Legacy API inventory done' } },
        { id: 'evt-p4-4', type: 'milestone', at: past5, userId: 'user-admin', note: 'Waiting on infrastructure', payload: { title: 'Project put on hold' } },
      ],
    },
    {
      id: 'proj-5',
      name: 'Mobile App',
      description: 'React Native app',
      status: 'COMPLETED',
      startDate: addDays(todayISO, -60),
      endDate: past1,
      assignedUserIds: ['user-emp', 'user-6'],
      createdAt: addDays(todayISO, -60),
      statusHistory: [
        { status: 'ACTIVE', at: addDays(todayISO, -60), userId: 'user-admin' },
        { status: 'COMPLETED', at: past1, userId: 'user-admin', note: 'Shipped to store' },
      ],
      activityLog: [
        { id: 'evt-p5-1', type: 'milestone', at: addDays(todayISO, -45), userId: 'user-admin', payload: { title: 'Alpha build' } },
        { id: 'evt-p5-2', type: 'milestone', at: addDays(todayISO, -30), userId: 'user-admin', payload: { title: 'Beta release' } },
        { id: 'evt-p5-3', type: 'task_milestone', at: addDays(todayISO, -7), userId: 'user-6', payload: { taskId: 'task-15', message: 'Task completed' } },
        { id: 'evt-p5-4', type: 'milestone', at: past3, userId: 'user-admin', note: 'Shipped to store', payload: { title: 'Production release' } },
        { id: 'evt-p5-5', type: 'task_milestone', at: past1, userId: 'user-emp', payload: { taskId: 'task-15', message: 'Release notes published' } },
      ],
    },
    {
      id: 'proj-6',
      name: 'Learning Hub',
      description: 'Internal training and docs',
      status: 'ACTIVE',
      startDate: past1,
      endDate: in7,
      assignedUserIds: ['user-emp', 'user-2', 'user-4'],
      createdAt: past5,
      statusHistory: [{ status: 'ACTIVE', at: past5, userId: 'user-admin' }],
      activityLog: [
        { id: 'evt-p6-1', type: 'milestone', at: past5, userId: 'user-admin', payload: { title: 'Hub launched' } },
        { id: 'evt-p6-2', type: 'member_added', at: past4, userId: 'user-admin', payload: { userId: 'user-4' } },
        { id: 'evt-p6-3', type: 'milestone', at: past3, userId: 'user-emp', payload: { title: 'React 19 guide published' } },
        { id: 'evt-p6-4', type: 'task_milestone', at: past2, userId: 'user-2', payload: { taskId: 'task-17', message: 'Task completed' } },
        { id: 'evt-p6-5', type: 'milestone', at: past1, userId: 'user-admin', payload: { title: 'Q1 learning goals set' } },
      ],
    },
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
