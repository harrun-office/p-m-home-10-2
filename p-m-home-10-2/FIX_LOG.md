# Fix Log — Logical/Flow Bugs & Backend-Ready Scaffolding

Applied minimal, safe fixes from the Logical Audit Report. No refactors for style; no new libraries.

---

## Summary

| Issue | Description | Status |
|-------|-------------|--------|
| **A** | AdminTasksPage: date filter used undefined `setFilterDate` | ✅ Fixed (previously) |
| **B** | Notifications: "View project" link hardcoded to `/admin` | ✅ Fixed |
| **C** | ProjectFormModal: attachments not persisted | ✅ Fixed |
| **D** | Task type missing `updatedAt`; repo not setting it | ✅ Fixed |
| **E** | Project edit modal not reachable from detail header | ✅ Fixed |
| **F** | Employee project detail: Kanban showed only current page | ✅ Fixed |
| **G** | No loading/error scaffolding for future API | ✅ Fixed |

---

## Changes by Issue ID

### A) AdminTasksPage date filter handlers

- **Root cause:** State used `filterDateStart` and `filterDateEnd` with setters `setFilterDateStart` / `setFilterDateEnd`, but quick-filter presets and EmptyState "Clear All Filters" called non-existent `setFilterDate(...)`, causing a runtime error.
- **Files changed:** `client/src/pages/admin/AdminTasksPage.jsx` (fixed in a prior session).
- **Code notes:** All preset branches in `applyFilterPreset` and the EmptyState `onAction` now use `setFilterDateStart` / `setFilterDateEnd` (e.g. for "Today" both set to `todayKey()`; for clear, both set to `''`).
- **Manual test steps:**
  1. Login as Admin → Admin → Tasks.
  2. Click "My Tasks", "Overdue", "High Priority", "Today's Tasks", "Clear All" — no error; date filters update.
  3. Apply any filters so list is empty → click "Clear All Filters" — no error; filters clear.

---

### B) Notification "View project" link role-aware

- **Root cause:** NotificationsList always linked to `/admin/projects/${n.projectId}`. Employees viewing notifications were sent to admin route and then redirected to `/app`, so they never reached the project.
- **Files changed:**
  - `client/src/components/notifications/NotificationsList.jsx`
  - `client/src/pages/admin/AdminNotificationsPage.jsx`
  - `client/src/pages/employee/EmployeeNotificationsPage.jsx`
- **Code notes:** NotificationsList now accepts optional `projectsBasePath` (default `'/admin'`). AdminNotificationsPage passes `projectsBasePath="/admin"`, EmployeeNotificationsPage passes `projectsBasePath="/app"`. Link is `to={\`${projectsBasePath}/projects/${n.projectId}\`}`.
- **Manual test steps:**
  1. As Employee, open Notifications; have a PROJECT_COMPLETION_REQUEST (or any notification with projectId).
  2. Click "View project →" → should go to `/app/projects/:id` and show the project.
  3. As Admin, same notification → "View project" → should go to `/admin/projects/:id`.

---

### C) ProjectFormModal attachments persist as URLs

- **Root cause:** "Add files" stored File objects in local state only; create/update payloads did not include attachments; edit mode reset attachments to `[]`.
- **Files changed:** `client/src/components/admin/projects/ProjectFormModal.jsx`
- **Code notes:** Replaced file picker with an "Attachment URLs" textarea (one URL per line). State: `attachmentUrls` (string). On submit, `attachments` = split by newline, trim, filter empty; passed in `createProject({ ..., attachments })` and `updateProject(id, { ..., attachments })`. Edit mode prefill: `setAttachmentUrls(editingProject.attachments.join('\n'))`. projectRepo already accepts `attachments` in create/update.
- **Manual test steps:**
  1. Admin → Projects → Create Project → fill required fields and add 1–2 URLs (one per line) in Attachment URLs → submit. Open project → Attachments tab: URLs appear.
  2. Edit same project → change/add URLs → Save. Attachments tab shows updated list.
  3. Create with no URLs → Attachments tab shows empty (optional field).

---

### D) Task type and repo updatedAt

- **Root cause:** UI and seed use `task.updatedAt` for sorting/filters; `types/models.js` did not define it; taskRepo create/update did not set it.
- **Files changed:**
  - `client/src/types/models.js`
  - `client/src/data/repositories/taskRepo.js`
- **Code notes:** In models.js, Task typedef: added `@property {string} [updatedAt] - ISO date string (last update)`. In taskRepo create: added `updatedAt: now`. In taskRepo update: added `updatedAt: now` (via `nowISO()`) to the `next` object.
- **Manual test steps:**
  1. Create or update a task; in store/seed inspect task object — should have `updatedAt`.
  2. Employee/Admin task list sort by "Recently updated" — order should reflect updates (already used `updatedAt` in UI).

---

### E) Project edit modal reachable from detail header

- **Root cause:** ProjectModal existed on AdminProjectDetailPage with `open={modalOpen}` but nothing in the Overview header set `modalOpen` to true, so "Edit project" was not discoverable.
- **Files changed:** `client/src/pages/admin/AdminProjectDetailPage.jsx`
- **Code notes:** In the Overview tab Project Header Card, added an "Edit project" button (with Pencil icon) when `!isReadOnly`, calling `onClick={() => setModalOpen(true)}`. Imported `Pencil` from lucide-react.
- **Manual test steps:**
  1. Admin → Projects → open an ACTIVE project → Overview tab.
  2. See "Edit project" button in header → click → ProjectModal opens.
  3. Open an ON_HOLD or COMPLETED project → "Edit project" button not shown.

---

### F) Kanban uses full list on Employee project detail

- **Root cause:** Kanban view used `displayedTasks` (paginated slice), so each column showed only tasks on the current page, making counts and columns inconsistent.
- **Files changed:** `client/src/pages/employee/EmployeeProjectDetailPage.jsx`
- **Code notes:** Kanban section now uses `sortedTasks` (full filtered/sorted list) instead of `displayedTasks`. Column counts and card lists use `sortedTasks.filter((t) => t.status === status)`. Removed the extra pagination block that appeared below Kanban (since Kanban now shows all tasks). Table view still uses `displayedTasks` and keeps its pagination.
- **Manual test steps:**
  1. Employee → My Projects → open project → Tasks tab.
  2. Select Kanban view; ensure "To Do" / "In Progress" / "Completed" counts match total and all tasks appear in the correct column.
  3. Switch to Table view → pagination still works; only one page of rows shown.

---

### G) Loading/error scaffolding

- **Root cause:** dataStore had no loading or error state; when switching to API, there was no place to show loading or errors.
- **Files changed:**
  - `client/src/store/dataStore.jsx`
  - `client/src/App.jsx`
- **Code notes:** dataStore: added `loading` and `error` to initialState; reducer handles `SET_LOADING` and `SET_ERROR`; `refresh()` clears error and wraps load in try/catch, dispatching SET_ERROR on throw. Exposed `loading`, `error`, `setLoading`, `setError`, `retry` (retry = refresh). App.jsx: uses `useDataStore()` and renders a "Loading…" bar when `loading`, and an error bar with message + "Retry" button when `error`; Retry calls `retry()`.
- **Manual test steps:**
  1. Normal run: no loading/error bars (refresh is sync).
  2. To test error: temporarily throw in dataStore refresh (e.g. after SET_ERROR(null)) → error bar appears; click Retry → if refresh succeeds, error clears.
  3. When backend is added: set `setLoading(true)` before fetch, `setLoading(false)` and optionally `setError(...)` in catch; same UI will show.

---

## Remaining known issues (from audit, not fixed here)

- **Comment feature:** Not implemented; no comment entity or UI.
- **Login duplicate id:** Two demo hint `<p>` elements share `id="login-demo-hint"` (low; a11y).
- **Employee create task with no projects:** When employee has no assigned projects, Create Task still opens; repo returns error — consider disabling button and showing message (low).
- **ProjectModal vs ProjectFormModal:** Admin project detail uses ProjectModal for view/edit; project list uses ProjectFormModal for create/edit. Both exist; behavior is consistent.

---

## Role/permission verification

- Employee cannot change assignee (taskRepo + TaskModal employeeMode).
- canEditTask / canDeleteTask still used in repo; UI passes canDelete etc. where needed.
- Read-only when project ON_HOLD/COMPLETED: enforced in repo and UI (isReadOnly, disabled buttons).
- Admin redirect to /admin, Employee to /app: unchanged (AdminLayout / AppLayout).
