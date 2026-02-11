# Project Management Frontend — Logical Audit Report

**Goal:** Detect logical mistakes, flow gaps, and data/state issues before backend + database design.  
**Scope:** Routes, entities, global state, roles, CRUD flows, validation, permissions, and implied API/DB contracts.

---

## 1) App Map

### 1.1 Route Map

| Route | Layout | Page | Auth | Role |
|-------|--------|------|------|------|
| `/` | — | LoginPage | No | — |
| `/login` | — | LoginPage | No | — |
| `/admin` | AdminLayout | AdminDashboardPage | Session + ADMIN | Admin only |
| `/admin/dev-tools` | AdminLayout | DevToolsPage | Session + ADMIN | Admin only |
| `/admin/projects` | AdminLayout | AdminProjectsPage | Session + ADMIN | Admin only |
| `/admin/projects/:id` | AdminLayout | AdminProjectDetailPage | Session + ADMIN | Admin only |
| `/admin/tasks` | AdminLayout | AdminTasksPage | Session + ADMIN | Admin only |
| `/admin/profile` | AdminLayout | AdminProfilePage | Session + ADMIN | Admin only |
| `/admin/notifications` | AdminLayout | AdminNotificationsPage | Session + ADMIN | Admin only |
| `/admin/users` | AdminLayout | AdminUsersPage | Session + ADMIN | Admin only |
| `/admin/users/:id` | AdminLayout | AdminEmployeeDetailPage | Session + ADMIN | Admin only |
| `/app` | RequireAuth → AppLayout | EmployeeDashboardPage | Session | Employee (admin redirected to /admin) |
| `/app/tasks` | RequireAuth → AppLayout | EmployeeTasksPage | Session | Employee |
| `/app/projects` | RequireAuth → AppLayout | EmployeeProjectsPage | Session | Employee |
| `/app/projects/:id` | RequireAuth → AppLayout | EmployeeProjectDetailPage | Session | Employee |
| `/app/profile` | RequireAuth → AppLayout | EmployeeProfilePage | Session | Employee |
| `/app/notifications` | RequireAuth → AppLayout | EmployeeNotificationsPage | Session | Employee |

**Dynamic route params:** `id` (project id or user id depending on segment).

**Note:** `/admin` is **not** wrapped in `RequireAuth`; only `/app` is. AdminLayout performs its own session check and redirects to `/login` if no session, and to `/app` if session.role !== 'ADMIN'. So a user can briefly hit `/admin` without being logged in before redirect.

---

### 1.2 Key Entities (from UI + types/models.js)

| Entity | Key fields (implied) | Notes |
|--------|----------------------|--------|
| **User** | id, name, email, role (ADMIN \| EMPLOYEE), department (DEV \| PRESALES \| TESTER), isActive, employeeId, personalNumber, passwordHash | Used for login, assignees, project members. |
| **Project** | id, name, description, status (ACTIVE \| ON_HOLD \| COMPLETED), startDate, endDate, assignedUserIds[], createdAt, statusHistory[], activityLog[], attachments[] | statusHistory = ProjectStatusEvent[]; activityLog = ProjectActivityEvent[]. |
| **ProjectStatusEvent** | status, at, userId?, note? | Status change history. |
| **ProjectActivityEvent** | id, type (date_change \| member_added \| member_removed \| milestone \| task_milestone), at, userId?, note?, payload? | Timeline events. |
| **Task** | id, projectId, title, description, assigneeId, priority (HIGH \| MEDIUM \| LOW), status (TODO \| IN_PROGRESS \| COMPLETED), createdById, createdAt, assignedAt, deadline?, tags[], links[], attachments[] | **updatedAt** used in UI/sorts but **not** in types/models.js (data contract gap). |
| **Notification** | id, userId, type (ASSIGNED \| DEADLINE \| PROJECT_COMPLETION_REQUEST), message, createdAt, read, projectId? | User-scoped; PROJECT_COMPLETION_REQUEST links to project. |

**Not present as first-class entities:** Board, Sprint, Comment, Attachment (stored as arrays on Project/Task), ActivityLog (embedded in Project), AuditLog (no dedicated “who did what when” beyond activityLog).

---

### 1.3 Global State

| State | Location | Description |
|-------|----------|-------------|
| **Auth / session** | sessionStore.js (localStorage `pm_session`) | { userId, email, role, name }. No in-memory sync; read via getSession(). |
| **Entities** | dataStore (DataStoreProvider) | users, projects, tasks, notifications. Single source; refreshed after every mutation. |
| **Selected project** | **Not stored globally** | projectId only in URL (/admin/projects/:id, /app/projects/:id). No “current project” in store. |
| **Filters** | Local component state per page | AdminProjectsPage: status, searchName, department, startDate, endDate, page, pageSize, selectedProjects. AdminTasksPage: filterProject, filterAssignee, filterStatus, filterPriority, filterDepartment, filterDateStart, filterDateEnd, filterOverdue, searchQuery, etc. Filters reset on navigation (no persistence). |
| **Pagination** | Local component state | AdminProjectsPage: page, pageSize. AdminTasksPage / Employee*: tasksCurrentPage, tasksPageSize. Reset when filters change (intended). |
| **Modals** | Local component state | createModalOpen, editingProject, taskModalOpen, editingTask, addMembersModalOpen, etc. |
| **Optimistic updates** | **None** | All mutations call repo then refresh(); no optimistic UI or rollback on failure. |
| **Cached lists** | **None** | dataStore holds full lists; no separate cache layer. |

---

### 1.4 Roles & Permissions (implied by UI)

| Role | Description | Where enforced |
|------|-------------|----------------|
| **ADMIN** | Full access to admin area; all projects/tasks; user CRUD; project status/members; task assignee change. | AdminLayout (redirect non-ADMIN to /app); taskRepo/projectRepo (session.role === 'ADMIN'). |
| **EMPLOYEE** | Access only to /app; “My Projects” (assignedUserIds includes userId); “My Tasks” (assigneeId === userId); can create tasks only in assigned projects; can edit only tasks assigned to self; can delete only tasks they created; cannot change assignee. | AppLayout (redirect ADMIN to /admin); nav shows only employee routes; taskRepo create/update/remove use canEditTask/canDeleteTask. |

**Project status rules (both roles):** When project status is ON_HOLD or COMPLETED, project and its tasks are read-only (no edit/delete/move status); enforced in projectRepo.update, taskRepo.update/remove, and UI (isReadOnly, disabled buttons).

**Permission helpers:** `utils/permissions.js`: canEditTask(session, task, project), canDeleteTask(session, task, project). Used by taskRepo; UI sometimes duplicates logic (e.g. canDelete passed to KanbanBoard/TaskTable).

---

## 2) Must-Work User Journeys

### 2.1 Admin happy path

1. **Login** → LoginPage → credentials → setSession → navigate to `/admin`.
2. **Dashboard** → AdminDashboardPage → KPIs, quick links (projects, tasks, overdue).
3. **Create project** → Admin Projects → “Create Project” → ProjectFormModal → name, description, start/end, members (required), attachments (optional, not persisted) → createProject + assignMembers → list refresh.
4. **View project** → Click project → `/admin/projects/:id` → tabs: Overview, Timeline, Members, Tasks, Attachments.
5. **Create task** → Project detail → Tasks tab → “Create Task” → TaskModal (project preselected, assignee required) → createTask → notification to assignee → list refresh.
6. **Update task status** → Kanban drag or table/actions → moveTaskStatus → refresh; if COMPLETED, project activityLog gets task_milestone.
7. **Assign user** → Task modal edit → assigneeId change (admin only) → updateTask → optional assignee notification.
8. **Comment** → **Not implemented.** No comment entity or UI.
9. **Attach file** → Task/Project: attachments as URLs or file names; ProjectFormModal “Add files” only stores in local state, not sent to createProject/updateProject (attachments not passed in create payload). **Gap:** project attachments not persisted from form.
10. **Activity log** → Project Timeline tab (statusHistory + activityLog); no global “audit log” screen.
11. **Logout** → Topbar/session clear → clearSession → redirect to login (implementation depends on Topbar).

**Missing or weak from flow:** Comment flow; project attachment upload persistence; explicit “audit log” screen; logout flow (verify Topbar triggers clearSession + redirect).

---

### 2.2 Employee happy path

1. **Login** → LoginPage → employee credentials → navigate to `/app`.
2. **Dashboard** → EmployeeDashboardPage → “Today’s tasks” (due today), “Projects at a glance”, “Tasks at a glance”.
3. **View projects** → “My Projects” → only projects where assignedUserIds includes userId.
4. **View project** → `/app/projects/:id` → same tab structure (Profile, Members, Timeline, Tasks, Attachments); read-only for members (no add/remove); can “Request to mark project as completed” (notifyAdminsProjectCompletionRequest).
5. **Create task** → From project Tasks tab (or My Tasks) → TaskModal with employeeMode: assigneeId fixed to self, project list = assigned ACTIVE projects only.
6. **Update task status** → Kanban/table → moveTaskStatus (only if assignee and project not ON_HOLD/COMPLETED).
7. **Assign user** → **Not allowed** (employee cannot change assignee).
8. **Comment** → **Not implemented.**
9. **Attach file** → Same as admin: task attachments as list; no real upload.
10. **Activity log** → Timeline tab on project.
11. **Notifications** → Employee notifications page; PROJECT_COMPLETION_REQUEST “View project” link goes to `/admin/projects/:id` → **Bug:** employee is redirected to /app, so link is wrong for employees.
12. **Logout** → Same as admin.

**Missing or weak:** Comment flow; attachment upload; notification “View project” should be role-aware (/app/projects/:id for employee).

---

### 2.3 Gaps summary

- **Comments:** No UI or entity; journey assumes “comment” but feature is missing.
- **Attachments:** Project form collects files but they are not persisted; task/project attachments are string arrays (names/URLs), no size/type constraints in UI.
- **Selected project:** Not stored globally; always derived from URL (acceptable).
- **Stale data:** No “refresh” button or stale detection; data refreshed only after mutations.
- **Logout:** Must be verified (Topbar → clearSession + navigate to /login).

---

## 3) Deep Logical Audit Checklist

### A) Navigation & flow integrity

- **Dead ends:** Project not found → “Back to Projects” link present (admin and employee). No modal traps without close/cancel.
- **Context without project:** Project detail pages use `useParams().id`; if project missing, “Project not found” + back link. Admin Tasks and Employee Tasks do not require a selected project (global task lists).
- **Route param naming:** Consistent `:id` for project and user. No naming mismatch.
- **Risk:** `/admin` routes are not under RequireAuth; first paint may show null then redirect (minor).

---

### B) CRUD completeness & consistency

| Entity | Create | View | Edit | Delete | List refresh |
|--------|--------|------|------|--------|--------------|
| Project | ✅ Admin only, ProjectFormModal | ✅ List + detail | ✅ Modal (ACTIVE only); detail edit via ProjectModal (open state not clearly wired in detail) | ✅ With confirm; cascade delete tasks | ✅ refresh() after mutation |
| Task | ✅ Admin + Employee (in assigned projects) | ✅ List + modal | ✅ TaskModal; read-only if project ON_HOLD/COMPLETED | ✅ Admin or creator; read-only when project locked | ✅ refresh() |
| User | ✅ Admin (userRepo.create) | ✅ List + AdminEmployeeDetailPage | ✅ Admin (userRepo.update) | ✅ Admin (userRepo.remove) | ✅ refresh() |
| Notification | System/backend | ✅ Per-user list | — | — | Mark read / mark all read |

- **Edit prefilled:** ProjectFormModal and TaskModal use useEffect to set form from `editingProject` / `task` when open; dependency arrays may cause re-init (e.g. TaskModal depends on task?.id, preselectedProjectId).
- **Delete:** Project delete confirmed (“cannot be undone”); task delete confirmed. No soft-delete UI; repos do hard delete.
- **List refresh:** dataStore calls refresh() after create/update/delete; lists update. No optimistic updates.

---

### C) Validation & required fields

- **Project form:** name, description, start/end required; start <= end validated; at least one member required. No negative or max-length in UI.
- **Task form:** projectId, title required; assignee required (unless employeeMode). No deadline <= start validation; no numeric fields (estimates/budget) in UI.
- **Empty states:** Admin Projects/Tasks and Employee Projects/Tasks show EmptyState when no data or no filter match; actions (Create, Clear filters) provided.
- **Date ranges:** Project Form: end >= start. Filter date ranges (e.g. assigned date) not validated for start <= end in UI (could allow empty results).

---

### D) State management correctness

- **Selected project:** Not in global state; from URL only. Persists across tab switches within detail page.
- **Filters/pagination:** Reset on filter change (e.g. useEffect setPage(1) when filters change). AdminTasksPage has a **bug:** `setFilterDate` is used in presets and EmptyState but state is filterDateStart/filterDateEnd → runtime error when using “My Tasks”, “Overdue”, “Today’s Tasks”, “Clear All” or “Clear All Filters”.
- **Optimistic updates:** None; no rollback on failure (only refresh after success).
- **Loading/error:** Login has loading + error; list pages use sync data from store (no loading flags). Repo errors returned to callers (e.g. deleteProject result.ok, createTask result.error); some surfaces show alert/toast, others may not.

---

### E) Permissions & role boundaries

- **Admin-only:** All /admin routes; user CRUD; project create/edit/delete/status/members; task assignee change; bulk actions on projects/tasks. Enforced by AdminLayout + repo checks.
- **Employee:** Only /app; my projects/tasks; create task in assigned projects; edit/delete own tasks per canEditTask/canDeleteTask. Enforced by AppLayout + repo.
- **Security by hiding:** Admin routes are not under RequireAuth; if someone opens /admin without session, AdminLayout redirects. If employee manually goes to /admin, redirected to /app. So “security by hiding” is mitigated by layout redirect. Direct URL to /admin/projects/123 as employee still redirects.

---

### F) Concurrency & multi-user

- No optimistic locking or version field; no “someone else edited” message.
- No refresh button or automatic re-fetch; data can become stale if another user changes it.
- No real-time collaboration (no WebSocket); backend will need to define conflict handling.

---

### G) Data contract readiness (implied APIs)

**Users**

- List: GET /users → 200, body: User[].
- Get: GET /users/:id → 200 User \| 404.
- Create: POST /users → 201 User (payload: name, email, role, department, password?, employeeId?, personalNumber?).
- Update: PATCH /users/:id → 200 User \| 404.
- Delete: DELETE /users/:id → 204 \| 404.

**Projects**

- List: GET /projects?status=&... → 200 Project[] (filter by status, pagination optional).
- Get: GET /projects/:id → 200 Project \| 404.
- Create: POST /projects → 201 Project (name, description, startDate, endDate, assignedUserIds[], attachments?).
- Update: PATCH /projects/:id → 200 Project \| 400 (if ON_HOLD/COMPLETED and patch not status) \| 404.
- Delete: DELETE /projects/:id → 204 \| 404 (cascade tasks).
- Status: PATCH /projects/:id/status → 200 (body: status, note?).
- Members: PUT /projects/:id/members → 200 (body: userIds[]).
- Milestone: POST /projects/:id/milestones → 201 (body: title, note?).
- Activity: POST /projects/:id/activity → 201 (body: event).

**Tasks**

- List: GET /tasks?projectId=&assigneeId=&status=&priority= → 200 Task[].
- Get: GET /tasks/:id → 200 Task \| 404.
- Create: POST /tasks → 201 Task \| 400 (validation, project not found, project completed/on hold, employee not in project) (body: projectId, title, description, assigneeId, priority?, tags?, links?, attachments?, deadline?).
- Update: PATCH /tasks/:id → 200 Task \| 400 \| 403 \| 404.
- Delete: DELETE /tasks/:id → 204 \| 403 \| 404.
- Move status: PATCH /tasks/:id/status → 200 (body: status).

**Notifications**

- List by user: GET /notifications → 200 Notification[] (user from auth).
- Mark read: PATCH /notifications/:id/read → 200.
- Mark all read: POST /notifications/read-all → 200.

**Pagination:** UI uses client-side slice (page, pageSize). Backend could add ?page=&pageSize= and return { items, total }.

**Errors:** 400 validation, 401 unauthorized, 403 forbidden, 404 not found, 409 conflict (if needed), 500 server error.

---

### H) Special flows

- **Invite/add member:** Add members to project only (Admin Project Detail → Members → “Add members to this project”); no invite-by-email; users must exist (from Employees list).
- **Assignment:** Task assignee in TaskModal; admin can change, employee cannot; assignee notification on create.
- **Status transitions:** Kanban TODO → IN_PROGRESS → COMPLETED; no restricted transition matrix in UI.
- **Attachments:** Project form files not persisted; task/project attachments as string[]; no size/type limits in UI; no preview beyond image URLs.
- **Notifications:** ASSIGNED (task assign), DEADLINE (project endDate within 7 days, once per admin per day), PROJECT_COMPLETION_REQUEST (employee request → all admins).
- **Audit:** activityLog on project; no global audit log screen.

---

## 4) Issue Register

| ID | Severity | Module/Screen | Issue Title | Exact Repro Steps | Expected vs Actual | Root Cause | Fix Recommendation | Backend/DB Impact |
|----|----------|---------------|-------------|-------------------|-------------------|------------|---------------------|-------------------|
| 1 | **Critical** | AdminTasksPage | Filter preset and Clear Filters use undefined setFilterDate | 1) Login as Admin. 2) Go to Admin Tasks. 3) Click “My Tasks”, “Overdue”, “High Priority”, “Today’s Tasks”, or “Clear All” under quick filters; or apply filters then click “Clear All Filters” in EmptyState. | Filters update and no error. | **Actual:** Runtime error (setFilterDate is not a function). State is filterDateStart/filterDateEnd but presets and EmptyState call setFilterDate. | Replace setFilterDate(todayKey()) with setFilterDateStart(todayKey()); setFilterDateEnd(todayKey()). Replace setFilterDate('') with setFilterDateStart(''); setFilterDateEnd(''). Fix EmptyState onAction to clear filterDateStart/filterDateEnd. | None. |
| 2 | **High** | NotificationsList | “View project” link for PROJECT_COMPLETION_REQUEST always goes to /admin | 1) Login as Employee. 2) Have an admin or seed create a PROJECT_COMPLETION_REQUEST notification for that user (or use dev seed). 3) Open Notifications. 4) Click “View project” on that notification. | Navigate to project in employee area (/app/projects/:id). | **Actual:** Link is to /admin/projects/:id; employee is redirected to /app, so project is not shown. | Pass basePath (e.g. from route or session role) into NotificationsList; build link as `${basePath}/projects/${n.projectId}` (e.g. /app for employee, /admin for admin). | None. |
| 3 | **High** | ProjectFormModal | Project attachments from “Add files” are never persisted | 1) Admin → Projects → Create Project. 2) Fill required fields and add one or more files via “Add files”. 3) Submit. | Attachments saved with project. | **Actual:** createProject payload does not include attachments; handleFileChange only updates local state; attachments reset in useEffect and are not sent. | Either: (a) Include attachments in createProject/updateProject (e.g. as upload URLs from backend), or (b) Remove “Add files” from project form until backend supports uploads, and document that attachments are URL-only for now. | Backend: project.attachments as array of URLs or file keys; upload API if files required. |
| 4 | **Medium** | types/models.js | Task type omits updatedAt used across UI | N/A (code review). | Task type includes updatedAt. | **Actual:** UI and seed use task.updatedAt for sorting and date filters; models.js Task typedef does not list updatedAt. | Add optional updatedAt (ISO string) to Task in types/models.js. Ensure taskRepo.update sets updatedAt on patch. | DB: task.updated_at column; set on every update. |
| 5 | **Medium** | Admin Project Detail | Project edit (ProjectModal) open state not clearly driven from header | 1) Admin → Project Detail. 2) Look for “Edit” project in header. | Edit opens ProjectModal with current project. | **Actual:** ProjectModal is rendered with open={modalOpen} but modalOpen is only set to true in code paths that are not obvious from header (e.g. no visible “Edit project” button in Overview). | Add explicit “Edit project” button in header (when !isReadOnly) that setModalOpen(true). Or remove unused ProjectModal if edit is only from list row. | None. |
| 6 | **Medium** | Employee Project Detail – Tasks tab | Kanban shows only current page of tasks | 1) Employee → My Projects → open a project → Tasks tab. 2) Set “Tasks per page” to 10; have >10 tasks. 3) View Kanban. | All tasks visible in Kanban columns (or pagination applied consistently). | **Actual:** Kanban columns show only displayedTasks (paginated slice), so each column shows a subset of that page; UX is confusing (e.g. “To Do” only shows to-do tasks on current page). | Either: (a) For Kanban, use full sorted list (no pagination) or (b) Paginate Kanban by “page of cards” and keep columns consistent with that page. Prefer (a) for small/medium lists or (b) with clear “Page 2” scope. | None. |
| 7 | **Medium** | Admin / Employee | No loading or error state for initial data | 1) Slow network (throttle). 2) Open any list/detail page. | Loading indicator; error message if fetch fails. | **Actual:** dataStore loads from localStorage/seed synchronously; no loading. When replaced with API, no loading/error handling yet. | Add loading flag and error state in dataStore or per-page; show Skeleton/Spinner and error message. | API must return appropriate errors; frontend must handle 4xx/5xx. |
| 8 | **Low** | AdminTasksPage | EmptyState “Clear All Filters” calls setFilterDate('') | Same as issue 1 for the EmptyState action. | All filters cleared. | **Actual:** setFilterDate is undefined; only filterDateStart/End are defined. | Same as issue 1: clear filterDateStart and filterDateEnd in the onAction. | None. |
| 9 | **Low** | ProjectFormModal | Edit project: attachments always reset to [] | 1) Admin → Edit existing project that has attachments. 2) Open edit modal. | Existing attachments shown; can add/remove. | **Actual:** useEffect sets setAttachments([]) on open; editingProject.attachments not preloaded. | In edit mode, initialize attachments from editingProject.attachments (if any); only reset when closing or when switching to create. | None. |
| 10 | **Low** | LoginPage | Duplicate id on demo hint paragraphs | 1) Open Login page. 2) Inspect “login-demo-hint” id. | Single element with id. | **Actual:** Two <p> elements share id="login-demo-hint". | Use a single container with id or unique ids (e.g. login-demo-admin, login-demo-employee). | None. |
| 11 | **Low** | Task create (employee) | No projects available when no assigned projects | 1) Login as Employee not assigned to any project. 2) My Tasks → Create Task. | Empty state or message “You must be assigned to a project first”. | **Actual:** assignedActiveProjects is []; projectId may be ''; createTask will fail with “projectId is required” or similar. | In employeeMode when assignedActiveProjects.length === 0, disable Create Task and show message “You need to be assigned to at least one active project to create tasks.” | None. |

---

## 5) Top 10 Highest-Risk Issues to Fix Before Backend

1. **AdminTasksPage setFilterDate undefined (Critical)** — Breaks filter presets and clear filters.
2. **Notification “View project” link wrong for employees (High)** — Broken navigation from notifications.
3. **Project form attachments not persisted (High)** — Misleading UI; backend contract unclear.
4. **Task type missing updatedAt (Medium)** — Inconsistent contract and possible missing DB column.
5. **Project edit modal not clearly reachable from detail (Medium)** — Confusing UX.
6. **Employee project Tasks tab Kanban pagination (Medium)** — Confusing slice per column.
7. **No loading/error for data (Medium)** — Will surface when switching to API.
8. **EmptyState Clear All Filters references setFilterDate (Low)** — Same fix as #1.
9. **Project edit modal resets attachments (Low)** — Edit flow loses attachment display.
10. **Employee create task with no assigned projects (Low)** — Clear messaging and disable create.

---

## 6) Missing Requirements / Ambiguous Flows

- **Comments:** No comment entity or UI; clarify if comments are in scope for v1.
- **Attachment storage:** Define whether attachments are URLs only or uploads; size/type limits; who can add/remove.
- **Audit log:** activityLog is project-scoped; clarify if global “who did what when” is required.
- **Status transition rules:** UI allows any transition (TODO → IN_PROGRESS → COMPLETED); confirm if business rules restrict transitions.
- **Logout:** Confirm Topbar (or equivalent) calls clearSession() and navigates to /login.
- **Refresh data:** No manual refresh; clarify if needed before real-time or polling.

---

## 7) Suggested Minimal Backend API List (from UI)

- **Auth:** POST /login (email, password) → session/token; logout client-side only if JWT.
- **Users:** GET /users, GET /users/:id, POST /users, PATCH /users/:id, DELETE /users/:id.
- **Projects:** GET /projects, GET /projects/:id, POST /projects, PATCH /projects/:id, DELETE /projects/:id, PATCH /projects/:id/status, PUT /projects/:id/members, POST /projects/:id/milestones, POST /projects/:id/activity (or embed in PATCH).
- **Tasks:** GET /tasks (query params), GET /tasks/:id, POST /tasks, PATCH /tasks/:id, DELETE /tasks/:id, PATCH /tasks/:id/status.
- **Notifications:** GET /notifications, PATCH /notifications/:id/read, POST /notifications/read-all.
- **Optional:** GET /projects/:id/tasks, GET /users/:id/tasks (or rely on GET /tasks?assigneeId=).

---

## 8) Suggested DB Entities + Relationships (ERD-level)

- **users** — id (PK), name, email, role, department, is_active, employee_id, personal_number, password_hash, created_at, updated_at.
- **projects** — id (PK), name, description, status, start_date, end_date, created_at, created_by (FK users). status_history and activity_log as JSONB or separate tables (project_status_events, project_activity_events).
- **project_members** — project_id (FK), user_id (FK), added_at, added_by (FK users). PK (project_id, user_id).
- **tasks** — id (PK), project_id (FK projects), title, description, assignee_id (FK users), created_by_id (FK users), priority, status, created_at, assigned_at, updated_at, deadline; tags (array or JSONB), links (array), attachments (array or table).
- **notifications** — id (PK), user_id (FK users), type, message, project_id (FK nullable), created_at, read.
- **project_attachments** — optional: project_id (FK), url_or_key, uploaded_at, uploaded_by (FK users).

Constraints: project status in (ACTIVE, ON_HOLD, COMPLETED); task status in (TODO, IN_PROGRESS, COMPLETED); task priority in (HIGH, MEDIUM, LOW); user role in (ADMIN, EMPLOYEE). Cascade delete: project → tasks; consider soft delete for projects/tasks if needed.

---

**End of report.** Fix Critical/High items first; then align types and API contracts (including updatedAt and attachments) before locking backend and DB design.
