-- =============================================================================
-- server/db/schema_tables.sql
-- =============================================================================
-- Paste your CREATE TABLE statements here. Do NOT include CREATE DATABASE or USE.
-- This file is executed by the init_schema migration.
-- Tables (drop order for rollback): notifications, task_attachments, task_links,
-- task_tags, tasks, project_activity_events, project_status_history, project_attachments,
-- project_members, projects, users
-- =============================================================================
/* =========================================================
   Project Management — Tables Only (MySQL 8+)
   - InnoDB + utf8mb4
   - Audit columns on all tables: created_at, updated_at, deleted_at
   - Soft delete supported via deleted_at (your code must filter deleted_at IS NULL)
   ========================================================= */

-- -------------------------
-- USERS
-- -------------------------
CREATE TABLE users (
  id              VARCHAR(64)  NOT NULL,
  name            VARCHAR(150) NOT NULL,
  email           VARCHAR(255) NOT NULL,
  role            ENUM('ADMIN','EMPLOYEE') NOT NULL DEFAULT 'EMPLOYEE',
  department      ENUM('DEV','PRESALES','TESTER') NOT NULL DEFAULT 'DEV',
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  employee_id     VARCHAR(64)  NULL,
  personal_number VARCHAR(32)  NULL,
  password_hash   VARCHAR(255) NULL,

  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at      DATETIME(3)  NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_employee_id (employee_id),

  KEY idx_users_department (department),
  KEY idx_users_active (is_active),
  KEY idx_users_deleted_at (deleted_at),

  FULLTEXT KEY ftx_users_search (name, email, employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- PROJECTS
-- -------------------------
CREATE TABLE projects (
  id          VARCHAR(64)   NOT NULL,
  name        VARCHAR(200)  NOT NULL,
  description TEXT          NOT NULL,
  status      ENUM('ACTIVE','ON_HOLD','COMPLETED') NOT NULL DEFAULT 'ACTIVE',
  start_date  DATE          NOT NULL,
  end_date    DATE          NOT NULL,

  created_at  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at  DATETIME(3)   NULL,

  PRIMARY KEY (id),

  CONSTRAINT chk_projects_dates CHECK (end_date >= start_date),

  KEY idx_projects_status (status),
  KEY idx_projects_dates (start_date, end_date),
  KEY idx_projects_deleted_at (deleted_at),

  FULLTEXT KEY ftx_projects_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Many-to-many: Project members (frontend: project.assignedUserIds[])
CREATE TABLE project_members (
  project_id VARCHAR(64) NOT NULL,
  user_id    VARCHAR(64) NOT NULL,

  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,

  PRIMARY KEY (project_id, user_id),
  KEY idx_pm_user (user_id),
  KEY idx_pm_deleted_at (deleted_at),

  CONSTRAINT fk_pm_project
    FOREIGN KEY (project_id) REFERENCES projects(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_pm_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Project attachments (frontend: project.attachments[] strings)
CREATE TABLE project_attachments (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id VARCHAR(64)     NOT NULL,
  value      TEXT            NOT NULL,  -- URL or filename

  created_at DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3)     NULL,

  PRIMARY KEY (id),
  KEY idx_project_attachments_project (project_id),
  KEY idx_project_attachments_deleted_at (deleted_at),

  CONSTRAINT fk_project_attachments_project
    FOREIGN KEY (project_id) REFERENCES projects(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Project status history (frontend: project.statusHistory[])
CREATE TABLE project_status_history (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id VARCHAR(64)     NOT NULL,
  status     ENUM('ACTIVE','ON_HOLD','COMPLETED') NOT NULL,
  changed_at DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  user_id    VARCHAR(64)     NULL,
  note       TEXT            NULL,

  created_at DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3)     NULL,

  PRIMARY KEY (id),
  KEY idx_psh_project_time (project_id, changed_at),
  KEY idx_psh_user (user_id),
  KEY idx_psh_deleted_at (deleted_at),

  CONSTRAINT fk_psh_project
    FOREIGN KEY (project_id) REFERENCES projects(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_psh_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Project activity events (frontend: project.activityLog[])
CREATE TABLE project_activity_events (
  id          VARCHAR(64) NOT NULL, -- frontend activity event id
  project_id  VARCHAR(64) NOT NULL,
  type        ENUM('date_change','member_added','member_removed','milestone','task_milestone') NOT NULL,
  occurred_at DATETIME(3) NOT NULL, -- frontend "at"
  user_id     VARCHAR(64) NULL,
  note        TEXT        NULL,
  payload     JSON        NULL,     -- varying shapes by type

  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at  DATETIME(3) NULL,

  PRIMARY KEY (id),
  KEY idx_pae_project_time (project_id, occurred_at),
  KEY idx_pae_type (type),
  KEY idx_pae_user (user_id),
  KEY idx_pae_deleted_at (deleted_at),

  CONSTRAINT fk_pae_project
    FOREIGN KEY (project_id) REFERENCES projects(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_pae_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- TASKS
-- -------------------------
CREATE TABLE tasks (
  id            VARCHAR(64)  NOT NULL,
  project_id    VARCHAR(64)  NOT NULL,
  title         VARCHAR(255) NOT NULL,
  description   TEXT         NULL,
  assignee_id   VARCHAR(64)  NOT NULL,
  priority      ENUM('HIGH','MEDIUM','LOW') NOT NULL DEFAULT 'MEDIUM',
  status        ENUM('TODO','IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'TODO',
  created_by_id VARCHAR(64)  NOT NULL,

  assigned_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  deadline      DATE         NULL,

  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at    DATETIME(3)  NULL,

  PRIMARY KEY (id),

  KEY idx_tasks_deleted_at (deleted_at),
  KEY idx_tasks_project_status (project_id, status),
  KEY idx_tasks_assignee_status (assignee_id, status),
  KEY idx_tasks_priority (priority),
  KEY idx_tasks_assigned_at (assigned_at),
  KEY idx_tasks_deadline (deadline),
  KEY idx_tasks_updated_at (updated_at),

  FULLTEXT KEY ftx_tasks_search (title, description),

  CONSTRAINT fk_tasks_project
    FOREIGN KEY (project_id) REFERENCES projects(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_tasks_assignee
    FOREIGN KEY (assignee_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_tasks_created_by
    FOREIGN KEY (created_by_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Task tags (frontend: task.tags[] strings)
CREATE TABLE task_tags (
  task_id    VARCHAR(64) NOT NULL,
  tag        VARCHAR(64) NOT NULL,

  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,

  PRIMARY KEY (task_id, tag),
  KEY idx_task_tags_tag (tag),
  KEY idx_task_tags_deleted_at (deleted_at),

  CONSTRAINT fk_task_tags_task
    FOREIGN KEY (task_id) REFERENCES tasks(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Task links (frontend: task.links[] strings)
CREATE TABLE task_links (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  task_id    VARCHAR(64)     NOT NULL,
  url        TEXT            NOT NULL,

  created_at DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3)     NULL,

  PRIMARY KEY (id),
  KEY idx_task_links_task (task_id),
  KEY idx_task_links_deleted_at (deleted_at),

  CONSTRAINT fk_task_links_task
    FOREIGN KEY (task_id) REFERENCES tasks(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Task attachments (frontend: task.attachments[] strings)
CREATE TABLE task_attachments (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  task_id    VARCHAR(64)     NOT NULL,
  value      TEXT            NOT NULL,  -- URL or filename

  created_at DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3)     NULL,

  PRIMARY KEY (id),
  KEY idx_task_attachments_task (task_id),
  KEY idx_task_attachments_deleted_at (deleted_at),

  CONSTRAINT fk_task_attachments_task
    FOREIGN KEY (task_id) REFERENCES tasks(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------
-- NOTIFICATIONS
-- -------------------------
CREATE TABLE notifications (
  id         VARCHAR(64) NOT NULL,
  user_id    VARCHAR(64) NOT NULL,
  type       ENUM('ASSIGNED','DEADLINE','PROJECT_COMPLETION_REQUEST') NOT NULL,
  message    TEXT        NOT NULL,
  is_read    TINYINT(1)  NOT NULL DEFAULT 0,
  read_at    DATETIME(3) NULL,
  project_id VARCHAR(64) NULL,

  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,

  PRIMARY KEY (id),

  KEY idx_notif_deleted_at (deleted_at),
  KEY idx_notif_user_created (user_id, created_at),
  KEY idx_notif_user_read (user_id, is_read),
  KEY idx_notif_user_type (user_id, type),

  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_notifications_project
    FOREIGN KEY (project_id) REFERENCES projects(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
