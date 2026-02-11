/**
 * Data model shape documentation (plain JS; no TypeScript).
 * Use these as contracts for repositories and UI.
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {"ADMIN"|"EMPLOYEE"} role
 * @property {"DEV"|"PRESALES"|"TESTER"} department
 * @property {boolean} isActive
 * @property {string} employeeId - Employee ID (e.g., "DEV-001", "PRE-001")
 * @property {string} [personalNumber] - Personal phone/contact number
 * @property {string} [passwordHash] - SHA-256 hash of password for login (never store plain password)
 */

/**
 * @typedef {Object} ProjectStatusEvent
 * @property {"ACTIVE"|"ON_HOLD"|"COMPLETED"} status
 * @property {string} at - ISO date string
 * @property {string} [userId] - who made the change
 * @property {string} [note] - optional reason/note
 */

/**
 * @typedef {Object} ProjectActivityEvent
 * @property {string} id
 * @property {"date_change"|"member_added"|"member_removed"|"milestone"|"task_milestone"} type
 * @property {string} at - ISO date string
 * @property {string} [userId] - who did the action
 * @property {string} [note] - optional note
 * @property {Object} [payload] - type-specific data (field, oldValue, newValue for date_change; userId for member_*; title for milestone; taskId, message for task_milestone)
 */

/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {"ACTIVE"|"ON_HOLD"|"COMPLETED"} status
 * @property {string} startDate - ISO date string
 * @property {string} endDate - ISO date string
 * @property {string[]} assignedUserIds
 * @property {string} [createdAt] - ISO date string when project was created
 * @property {ProjectStatusEvent[]} [statusHistory] - history of status changes
 * @property {ProjectActivityEvent[]} [activityLog] - other timeline events (date changes, member changes, milestones)
 * @property {string[]} [attachments] - file names or URLs (images, documents, etc.)
 */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} projectId
 * @property {string} title
 * @property {string} description
 * @property {string} assigneeId
 * @property {"HIGH"|"MEDIUM"|"LOW"} priority
 * @property {"TODO"|"IN_PROGRESS"|"COMPLETED"} status
 * @property {string} createdById
 * @property {string} createdAt - ISO date string
 * @property {string} assignedAt - ISO date string (when task was assigned; "My Tasks Today" uses this)
 * @property {string} [updatedAt] - ISO date string (last update; used for sorting/filters)
 * @property {string} [deadline] - ISO date string (optional due date)
 * @property {string[]} tags - e.g. ["Learning"]
 * @property {string[]} [links] - Optional URLs (e.g. references, docs)
 * @property {string[]} [attachments] - Optional file names or attachment URLs
 */

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} userId
 * @property {"ASSIGNED"|"DEADLINE"|"PROJECT_COMPLETION_REQUEST"} type
 * @property {string} message
 * @property {string} createdAt - ISO date string
 * @property {boolean} read
 * @property {string} [projectId] - optional; for PROJECT_COMPLETION_REQUEST, link to project
 */

export {}
