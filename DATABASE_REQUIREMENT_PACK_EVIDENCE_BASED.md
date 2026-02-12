# Database Requirement Pack (Evidence-Based) — Project Management App

**Role:** Frontend-to-Database Requirement Extractor (no schema/SQL/ERD in this step).  
**Scope:** React (Vite) client; data from localStorage + repositories + seed.  
**Rule:** Every item backed by file path + key/label or code reference.

---

## 1) Project Summary

The app is a **Project Management** frontend with two roles (Admin, Employee). Data is currently in-memory via a global store fed by **localStorage** and **repositories** (userRepo, projectRepo, taskRepo, notificationRepo). Seed data is built in `client/src/data/seed/demoSeed.js` and persisted under keys in `client/src/data/storage/storageKeys.js`. The UI supports **Projects** (with status, members, timeline, attachments), **Tasks** (kanban/table, assignee, priority, status, tags, links, attachments), **Users/Employees** (CRUD, department, active flag), and **Notifications** (per-user, read flag, types). No Zod/Yup schemas exist; validation is inline in form components and repositories.

**Evidence:** `client/src/App.jsx`, `client/src/store/dataStore.jsx`, `client/src/data/index.js`, `client/src/data/seed/demoSeed.js`, `client/src/types/models.js`.

---

## 2) Screen Inventory

| # | Screen | Route | File | Type |
|---|--------|-------|------|------|
| 1 | Login | `/`, `/login` | `client/src/pages/LoginPage.jsx` | (Auth) |
| 2 | Admin Dashboard | `/admin` | `client/src/pages/admin/AdminDashboardPage.jsx` | Dashboard |
| 3 | Dev Tools | `/admin/dev-tools` | `client/src/pages/DevToolsPage.jsx` | (Utility) |
| 4 | Admin Projects | `/admin/projects` | `client/src/pages/admin/AdminProjectsPage.jsx` | List |
| 5 | Admin Project Detail | `/admin/projects/:id` | `client/src/pages/admin/AdminProjectDetailPage.jsx` | Detail |
| 6 | Admin Tasks | `/admin/tasks` | `client/src/pages/admin/AdminTasksPage.jsx` | List |
| 7 | Admin Profile | `/admin/profile` | `client/src/pages/admin/AdminProfilePage.jsx` | Profile |
| 8 | Admin Notifications | `/admin/notifications` | `client/src/pages/admin/AdminNotificationsPage.jsx` | List |
| 9 | Admin Users (Employees) | `/admin/users` | `client/src/pages/admin/AdminUsersPage.jsx` | List |
| 10 | Admin Employee Detail | `/admin/users/:id` | `client/src/pages/admin/AdminEmployeeDetailPage.jsx` | Detail |
| 11 | Employee Dashboard | `/app` | `client/src/pages/employee/EmployeeDashboardPage.jsx` | Dashboard |
| 12 | Employee Tasks | `/app/tasks` | `client/src/pages/employee/EmployeeTasksPage.jsx` | List |
| 13 | Employee Projects | `/app/projects` | `client/src/pages/employee/EmployeeProjectsPage.jsx` | List |
| 14 | Employee Project Detail | `/app/projects/:id` | `client/src/pages/employee/EmployeeProjectDetailPage.jsx` | Detail |
| 15 | Employee Profile | `/app/profile` | `client/src/pages/employee/EmployeeProfilePage.jsx` | Profile |
| 16 | Employee Notifications | `/app/notifications` | `client/src/pages/employee/EmployeeNotificationsPage.jsx` | List |

**Modals (not routes):**  
- **Create/Edit Project:** `ProjectFormModal.jsx` (used on Admin Projects + Project Detail edit).  
- **Edit Project (step wizard):** `ProjectModal.jsx` (edit/delete on Project Detail).  
- **Create/Edit Task:** `TaskModal.jsx` (Admin Tasks, Project Detail Tasks tab, Employee flows).  
- **Add/Edit Employee:** `UserFormModal` (inline in AdminUsersPage.jsx).  
- **Add members to project:** In-page modal in AdminProjectDetailPage (TAB_MEMBERS).

**Evidence:** `client/src/App.jsx` (Routes), `client/src/components/layout/navConfig.js`, page and modal imports in listed files.

---

## 3) Mock Data Sources (where data is sourced)

- **Primary entry:** `client/src/data/index.js` — re-exports storage, seed, `STORAGE_KEYS`, and repos.
- **Seed (initial data):** `client/src/data/seed/demoSeed.js` — `buildDemoSeed()` returns `{ users, projects, tasks, notifications }`. Dates are dynamic (todayKey, addDays). Seed is written to storage on first run via `seedIfNeeded()`.
- **Persistence:** `client/src/data/storage/storage.js` — `load(key, fallback)`, `save(key, value)`, `loadArray(key, fallback)`, `clear(key)`, `seedIfNeeded()`, `resetAllToSeed()`.
- **Storage keys:** `client/src/data/storage/storageKeys.js` — `USERS: 'pm_users'`, `PROJECTS: 'pm_projects'`, `TASKS: 'pm_tasks'`, `NOTIFICATIONS: 'pm_notifications'`, `SEEDED_FLAG: 'pm_seeded'`, `DEADLINE_SENT: 'pm_deadline_sent'`.
- **Repositories (read/write):**  
  - `client/src/data/repositories/userRepo.js` — list(), getById(id), create(payload), update(id, patch), setActive(id, isActive), remove(id).  
  - `client/src/data/repositories/projectRepo.js` — list(filters), getById(id), create(payload, createdByUserId), update(id, patch, userId), setStatus(id, status, userId, note), assignMembers(projectId, userIds, byUserId), addMilestone(projectId, title, userId, note), recordActivity(projectId, event, userId), remove(id).  
  - `client/src/data/repositories/taskRepo.js` — list(filters), getById(id), listAssignedToday(userId, nowIso), create(payload, session), update(id, patch, session), remove(id, session), moveStatus(id, newStatus, session).  
  - `client/src/data/repositories/notificationRepo.js` — listByUser(userId), markRead(id, userId), markAllRead(userId), createForUser(userId, notification), runDeadlineCheck(nowISO).
- **Store:** `client/src/store/dataStore.jsx` — holds `state.{ users, projects, tasks, notifications }`, loads via repos + storage, exposes refresh, createProject, updateProject, setProjectStatus, assignMembers, addProjectMilestone, recordProjectActivity, deleteProject, createTask, updateTask, deleteTask, moveTaskStatus, markNotificationRead, markAllRead, notifyAdminsProjectCompletionRequest, setUserActive, createUser, updateUser, deleteUser.

**Evidence:** Paths above; `dataStore.jsx` lines 39–52 (refresh), 79–203 (actions).

---

## 4) Entities (Evidence-First)

### Entity: User (suggested DB name: `user`)

- **Evidence:** `client/src/types/models.js` (User typedef), `client/src/data/seed/demoSeed.js` (users array), `client/src/data/repositories/userRepo.js`, `client/src/pages/admin/AdminUsersPage.jsx` (columns, UserFormModal).
- **Primary identifier:** `id` (string, e.g. `user-admin`, `user-emp`). Generated in userRepo with `uid('user')` from `client/src/utils/id.js`.
- **Fields:**

| Field | Type guess | Required | Default / Note | Evidence |
|-------|------------|----------|----------------|----------|
| id | string | yes | generated | models.js; userRepo.create uid('user') |
| name | string | yes | — | models.js; UserFormModal "Full name" required |
| email | string | yes | — | models.js; UserFormModal "Email" required, type=email |
| role | enum | yes | EMPLOYEE | models.js "ADMIN"\|"EMPLOYEE"; userRepo.create payload.role ?? 'EMPLOYEE' |
| department | enum | yes | DEV | models.js "DEV"\|"PRESALES"\|"TESTER"; userRepo payload.department ?? 'DEV' |
| isActive | boolean | yes | true | models.js; userRepo.create isActive: true; AdminUsersPage Status Active/Inactive |
| employeeId | string | optional | auto-generated | models.js; userRepo generateEmployeeId(); form "Employee ID" placeholder "Auto-generated if blank" |
| personalNumber | string | optional | '' | models.js; UserFormModal "Personal number" type=tel |
| passwordHash | string | optional | — | models.js; userRepo create/update hashes password; never sent to UI |

- **CRUD seen:** Create (Add Employee modal), Read (list, getById, Admin Users list, Employee Detail), Update (Edit Employee, setActive), Delete (remove, Delete user).  
- **Evidence:** dataStore createUser, updateUser, deleteUser, setUserActive; AdminUsersPage UserFormModal, handleToggleActive, handleDeleteUser.

---

### Entity: Project (suggested DB name: `project`)

- **Evidence:** `client/src/types/models.js` (Project typedef), demoSeed.js (projects), projectRepo.js, AdminProjectsPage, AdminProjectDetailPage, ProjectFormModal.jsx.
- **Primary identifier:** `id` (string, e.g. `proj-1`). Generated with `uid('proj')`.
- **Fields:**

| Field | Type guess | Required | Default / Note | Evidence |
|-------|------------|----------|----------------|----------|
| id | string | yes | generated | models.js; projectRepo uid('proj') |
| name | string | yes | — | models.js; ProjectFormModal validate "Project name is required" |
| description | string | yes | — | ProjectFormModal "Description is required" |
| status | enum | yes | ACTIVE | models.js "ACTIVE"\|"ON_HOLD"\|"COMPLETED"; projectRepo create status: 'ACTIVE' |
| startDate | string (ISO date) | yes | — | models.js; ProjectFormModal startDate required |
| endDate | string (ISO date) | yes | — | ProjectFormModal endDate required; endDate >= startDate validated |
| assignedUserIds | string[] | yes | [] | models.js; ProjectFormModal "At least one team member is required" |
| createdAt | string (ISO) | optional | set on create | models.js; projectRepo create createdAt: now |
| statusHistory | ProjectStatusEvent[] | optional | [initial] | models.js; projectRepo create statusHistory |
| activityLog | ProjectActivityEvent[] | optional | [] | models.js; projectRepo create activityLog: [] |
| attachments | string[] | optional | [] | models.js (file names or URLs); ProjectFormModal attachment URLs textarea; Project Detail Attachments tab |

- **ProjectStatusEvent (embedded):** status, at (ISO), userId (optional), note (optional). Evidence: models.js; projectRepo setStatus.
- **ProjectActivityEvent (embedded):** id, type (`date_change`|`member_added`|`member_removed`|`milestone`|`task_milestone`), at, userId (optional), note (optional), payload (type-specific). Evidence: models.js; projectRepo update, assignMembers, addMilestone, recordActivity.
- **CRUD seen:** Create (ProjectFormModal), Read (list, getById, list by status), Update (edit project, setStatus, assignMembers, addMilestone, recordActivity), Delete (deleteProject; cascades to tasks in projectRepo.remove).  
- **Evidence:** dataStore createProject, updateProject, setProjectStatus, assignMembers, addProjectMilestone, recordProjectActivity, deleteProject; AdminProjectsPage table, ProjectFormModal; projectRepo.remove deletes tasks.

---

### Entity: Task (suggested DB name: `task`)

- **Evidence:** `client/src/types/models.js` (Task typedef), demoSeed.js (tasks), taskRepo.js, TaskModal.jsx, TaskTable.jsx, AdminTasksPage, AdminProjectDetailPage.
- **Primary identifier:** `id` (string, e.g. `task-1`). Generated with `uid('task')`.
- **Fields:**

| Field | Type guess | Required | Default / Note | Evidence |
|-------|------------|----------|----------------|----------|
| id | string | yes | generated | models.js; taskRepo uid('task') |
| projectId | string | yes | — | models.js; taskRepo create "projectId is required"; TaskModal "Project is required" |
| title | string | yes | — | models.js; taskRepo create "title is required"; TaskModal "Title is required" |
| description | string | optional | '' | models.js; TaskModal description textarea |
| assigneeId | string | yes | — | taskRepo "assigneeId is required"; TaskModal assignee required (unless employeeMode) |
| priority | enum | yes | MEDIUM | models.js "HIGH"\|"MEDIUM"\|"LOW"; taskRepo payload.priority ?? 'MEDIUM' |
| status | enum | yes | TODO | models.js "TODO"\|"IN_PROGRESS"\|"COMPLETED"; taskRepo payload.status ?? 'TODO' |
| createdById | string | yes | session | models.js; taskRepo create createdById: session.userId |
| createdAt | string (ISO) | yes | now | models.js; taskRepo nowISO() |
| assignedAt | string (ISO) | yes | now | models.js; taskRepo payload.assignedAt ?? now; "My Tasks Today" uses this |
| updatedAt | string (ISO) | optional | set on update | models.js; taskRepo update |
| deadline | string (ISO date) | optional | — | models.js; taskRepo create payload.deadline ?? undefined; TaskTable "Deadline" column; filters "overdue" |
| tags | string[] | optional | [] | models.js; TaskModal Learning tag + extra tags |
| links | string[] | optional | [] | models.js; TaskModal links textarea |
| attachments | string[] | optional | [] | models.js; TaskModal attachment list/URL |

- **CRUD seen:** Create (TaskModal), Read (list, getById, listAssignedToday, by projectId/assigneeId/status/priority), Update (edit task, moveStatus), Delete (deleteTask).  
- **Evidence:** dataStore createTask, updateTask, deleteTask, moveTaskStatus; taskRepo create/update/remove/moveStatus; AdminTasksPage Kanban + TaskTable; TaskModal validate.

---

### Entity: Notification (suggested DB name: `notification`)

- **Evidence:** `client/src/types/models.js` (Notification typedef), notificationRepo.js, NotificationsList.jsx, AdminNotificationsPage, EmployeeNotificationsPage.
- **Primary identifier:** `id` (string). Generated with `uid('notif')`.
- **Fields:**

| Field | Type guess | Required | Default / Note | Evidence |
|-------|------------|----------|----------------|----------|
| id | string | yes | generated | models.js; notificationRepo uid('notif') |
| userId | string | yes | — | models.js; listByUser(userId); markRead(id, userId) |
| type | enum | yes | — | models.js "ASSIGNED"\|"DEADLINE"\|"PROJECT_COMPLETION_REQUEST"; NotificationsList filter by type |
| message | string | yes | — | models.js; notificationRepo createForUser |
| createdAt | string (ISO) | yes | now | models.js; notificationRepo nowISO() |
| read | boolean | yes | false | models.js; markRead sets read: true |
| projectId | string | optional | — | models.js; for PROJECT_COMPLETION_REQUEST link |

- **CRUD seen:** Create (createForUser — on task assign, deadline check, completion request), Read (listByUser), Update (markRead, markAllRead). No delete in UI/repos.  
- **Evidence:** notificationRepo; dataStore markNotificationRead, markAllRead, notifyAdminsProjectCompletionRequest; taskRepo create calls notificationRepo.createForUser for assignee.

---

## 5) Relationships

- **User — Project (many-to-many via project.assignedUserIds)**  
  - Evidence: models.js Project.assignedUserIds: string[]; projectRepo assignMembers(projectId, userIds); AdminProjectDetailPage "Add members", ProjectFormModal "At least one team member".  
  - UI supports multiple members per project; no separate junction table in frontend, only array of user IDs on project.

- **Project — Task (one-to-many)**  
  - Evidence: Task.projectId; taskRepo list({ projectId }); projectRepo.remove deletes tasks where projectId === id; AdminProjectDetailPage TAB_TASKS.

- **Task — User (assignee, many-to-one)**  
  - Evidence: Task.assigneeId; taskRepo list({ assigneeId }); TaskModal assignee dropdown; TaskTable "Assignee".

- **Task — User (createdBy, many-to-one)**  
  - Evidence: Task.createdById; taskRepo create createdById: session.userId; permissions canEditTask/canDeleteTask use createdById.

- **Notification — User (many-to-one)**  
  - Evidence: Notification.userId; listByUser(userId); markRead(id, userId).

- **Notification — Project (optional, many-to-one)**  
  - Evidence: Notification.projectId optional; PROJECT_COMPLETION_REQUEST links to project; NotificationsList "View project" link.

**Junction needs:**  
- **Project–User:** UI supports multiple members per project; stored as `project.assignedUserIds[]`. For DB, a junction table (e.g. project_members) is implied by the many-to-many usage; not explicitly a separate entity in frontend.  
- No task_assignees junction: each task has a single assigneeId.

**Evidence:** types/models.js; projectRepo.assignMembers; taskRepo filters and create; notificationRepo listByUser, createForUser.

---

## 6) Query Requirements

### Screen: Admin Projects (`AdminProjectsPage.jsx`)

- **Filters:** Status (ACTIVE, ON_HOLD, COMPLETED, or all via KPI cards); Project name (search text); Department (DEV, PRESALES, TESTER — via assigned members); Date range (start date from, end date to; overlap logic).  
- **Sorting:** Not explicitly (table order is filtered list order).  
- **Search:** Project name (input "Search projects…").  
- **Pagination:** Page size 10/20/50/100, page number; "Showing X–Y of Z".  
- **Grouping:** None (flat table).  
- **Evidence:** AdminProjectsPage.jsx filteredProjects useMemo (statusFilter, searchName, departmentFilter, startDateFilter, endDateFilter), paginatedProjects, PAGE_SIZE_OPTIONS, table with Th "Project name", "Status", "Start date", "End date", "Members".

### Screen: Admin Tasks (`AdminTasksPage.jsx`)

- **Filters:** Project (dropdown), Assignee (dropdown), Status (TODO, IN_PROGRESS, COMPLETED), Priority (HIGH, MEDIUM, LOW), Department (assignee’s department), Date range (assignedAt from/to), Overdue (boolean); Quick presets: My Tasks, Overdue, High Priority, Today’s Tasks, Clear All.  
- **Sorting:** In Kanban card view: by updatedAt (newest first). In Table view: TaskTable columns (sorting not explicitly implemented in TaskTable; parent passes filtered list).  
- **Search:** Free text over title, description, assignee name, project name, tags.  
- **Pagination (Kanban):** Tasks per page 10/50/100/200/All; page prev/next. Filter by created date: Today, Yesterday, Last 7 days, Last 30 days, All, Custom range, Specific date.  
- **Grouping:** Kanban columns by status (TODO, IN_PROGRESS, COMPLETED); drag-and-drop move between columns.  
- **Evidence:** AdminTasksPage.jsx filterProject, filterAssignee, filterStatus, filterPriority, filterDepartment, filterDateStart, filterDateEnd, filterOverdue, searchQuery; taskTimeFilter; VIEW_KANBAN/VIEW_TABLE; Droppable droppableId={status}; sortedTasksForCard sort by updatedAt.

### Screen: Admin Project Detail — Tasks tab (`AdminProjectDetailPage.jsx`)

- **Filters:** Assignee (project members), Priority (HIGH, MEDIUM, LOW).  
- **Sorting:** Priority · Deadline, Deadline (soonest), Recently updated.  
- **Search:** None on this tab.  
- **Grouping:** Kanban by status or Table view.  
- **Evidence:** taskFilterAssignee, taskFilterPriority, taskSort options; filteredProjectTasks; KanbanBoard / TaskTable.

### Screen: Admin Users (`AdminUsersPage.jsx`)

- **Filters:** Search (name, email, employee ID); Department (DEV, PRESALES, TESTER); Status (Active, Inactive); Date range (Tasks & Projects — for workload counts).  
- **Sorting:** Not explicit (ResponsiveDataGrid order).  
- **Search:** "Search by name, email or employee ID…".  
- **Pagination:** None (full list in grid).  
- **Grouping:** None.  
- **Evidence:** filteredUsers useMemo (search, filterDept, filterStatus); dateFilter for tasksInDateRange/projectsInDateRange (workload columns).

### Screen: Admin Employee Detail (`AdminEmployeeDetailPage.jsx`)

- **Projects tab:** Filter by date (today, yesterday, week, month, all, custom, specific); Sort: Name A–Z/Z–A, End date nearest/latest, Status. Pagination: "Show more" / "Show all" (initial 3, then +5).  
- **Tasks tab:** Filter by date (same options), Filter by project (dropdown); Sort: by updatedAt (newest); Page size 10/50/100/200/All, page nav.  
- **Evidence:** dateFilter, projectsSort, projectsVisible, displayedProjects; taskFilterProjectId, tasksPageSize, tasksCurrentPage, sortedTasks.

### Screen: Notifications (`AdminNotificationsPage`, `EmployeeNotificationsPage`)

- **Filters:** Read (All / Unread); Type (All, Assigned, Deadline, Completion request).  
- **Evidence:** NotificationsList.jsx readFilter, typeFilter; FILTER_TYPE_*.

---

## 7) Constraints & Enums

### Enums (allowed values)

- **User.role:** ADMIN, EMPLOYEE. Evidence: models.js; navConfig Admin vs Employee; session.role.  
- **User.department:** DEV, PRESALES, TESTER. Evidence: models.js; UserFormModal Select; AdminUsersPage filter.  
- **Project.status:** ACTIVE, ON_HOLD, COMPLETED. Evidence: models.js; StatusBadge; projectRepo setStatus.  
- **Task.priority:** HIGH, MEDIUM, LOW. Evidence: models.js; TaskModal Select; PriorityBadge.  
- **Task.status:** TODO, IN_PROGRESS, COMPLETED. Evidence: models.js; Kanban columns; taskRepo moveStatus.  
- **Notification.type:** ASSIGNED, DEADLINE, PROJECT_COMPLETION_REQUEST. Evidence: models.js; NotificationsList typeLabel/TypeIcon.

### Required fields (from forms / repo validation)

- **User (create):** name, email; password (min 6 chars), confirm password match. Role default EMPLOYEE; department default DEV. Evidence: UserFormModal validate (password length, match); userRepo create.  
- **Project (create/edit):** name, description, startDate, endDate; endDate >= startDate; at least one team member. Evidence: ProjectFormModal validate().  
- **Task (create):** projectId, title, assigneeId (unless employeeMode). Evidence: taskRepo create checks; TaskModal validate().

### Uniqueness implied

- **User.email:** Used for login; UI does not enforce uniqueness in form (repo does not check duplicate email). Mark as **Needs Clarification** for DB (unique email expected for login).  
- **User.employeeId:** Displayed as unique identifier; userRepo generateEmployeeId produces Tnnn or CIPLnnnn. Uniqueness not validated in repo.  
- **Project/Task/Notification id:** Generated unique (uid).

### Length / format

- **Password:** Min 6 characters (create and change). Evidence: UserFormModal "Password must be at least 6 characters".  
- **Dates:** ISO date strings (YYYY-MM-DD or full ISO); start/end compared as date only.  
- **Attachments:** Stored as array of strings (URLs or file names); no size/type validation in UI.

**Evidence:** ProjectFormModal.jsx validate; TaskModal.jsx validate; UserFormModal handleSubmit (password length, confirm); userRepo create; taskRepo create.

---

## 8) Attachments, Comments, Notifications, Activity Logs

### Attachments

- **Project attachments:** `project.attachments` — array of strings (URLs or file names). Display: Project Detail TAB_ATTACHMENTS; images vs non-images (isImageUrl); getFileName(item). No metadata (size, type, createdBy, createdAt) in types or UI — only the string (URL or name). Evidence: models.js Project.attachments; demoSeed.js attachments array; AdminProjectDetailPage TAB_ATTACHMENTS.  
- **Task attachments:** `task.attachments` — array of strings (file names or URLs). TaskModal: file names from input + URL input; no upload, only names/URLs. No extra metadata in frontend. Evidence: models.js Task.attachments; TaskModal attachmentList, addAttachmentUrl, handleFileSelect (names only).

### Comments

- **Not present.** No comment entity or UI for tasks/projects.

### Notifications

- **Metadata in frontend:** id, userId, type, message, createdAt, read, projectId (optional). Display: NotificationsList (date/time, type icon, message, "View project" when projectId). Created by: createForUser (task assign, deadline check, project completion request). Evidence: models.js Notification; notificationRepo; NotificationsList.jsx.

### Activity logs

- **Project activity:** `project.activityLog` — array of ProjectActivityEvent (id, type, at, userId, note, payload). Types: date_change, member_added, member_removed, milestone, task_milestone. Display: ProjectTimeline on Project Detail TAB_TIMELINE. Evidence: models.js ProjectActivityEvent, activityLog; projectRepo update, assignMembers, addMilestone, recordActivity; ProjectTimeline.jsx.  
- **Project status history:** `project.statusHistory` — array of { status, at, userId, note }. Evidence: models.js statusHistory; projectRepo setStatus.

---

## 9) Needs Clarification (Blockers)

- **User email uniqueness:** Login uses email; duplicate emails would break login. Frontend/repos do not validate uniqueness — DB design should clarify unique constraint on email.  
- **User.employeeId uniqueness:** Treated as display identifier; generation avoids collision but no explicit unique check — DB may want unique or unique-per-role/department.  
- **Task deadline in Create/Edit form:** Task has optional `deadline` in types and repo; TaskModal (first 200 lines read) does not show a deadline field. Confirm whether deadline is set only via API/backend or should be added to Create/Edit Task form.

---

## 10) Safe Assumptions (Non-blocking)

- **IDs:** Keep string IDs (uid) for compatibility unless backend dictates integer UUIDs.  
- **Dates:** Store as ISO strings or date-only; frontend uses both date and datetime.  
- **Pagination:** All list pagination is client-side (slice); DB can support server-side page/size for projects, tasks, notifications.  
- **Soft delete:** No soft delete in UI; User has isActive (deactivate), Project/Task have hard delete.  
- **Sessions:** Session (userId, role) is in memory (sessionStore); no session entity in mock data — auth/DB design out of scope for this pack.

---

**End of Database Requirement Pack. Use this document to derive MySQL (or other) schema and queries; do not infer entities or fields beyond the evidence above.**
