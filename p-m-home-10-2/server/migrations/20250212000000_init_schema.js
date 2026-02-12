require('dotenv').config();
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

const schemaPath = path.join(__dirname, '..', 'db', 'schema_tables.sql');

const TABLE_DROP_ORDER = [
  'notifications',
  'task_attachments',
  'task_links',
  'task_tags',
  'tasks',
  'project_activity_events',
  'project_status_history',
  'project_attachments',
  'project_members',
  'projects',
  'users',
];

/**
 * @param { import("knex").Knex } knex
 */
async function up(knex) {
  const sql = fs.readFileSync(schemaPath, 'utf8').trim();
  if (!sql) return;

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pm_home_db',
    multipleStatements: true,
  });
  try {
    await connection.query(sql);
  } finally {
    await connection.end();
  }
}

/**
 * @param { import("knex").Knex } knex
 */
async function down(knex) {
  for (const table of TABLE_DROP_ORDER) {
    await knex.raw('DROP TABLE IF EXISTS ??', [table]);
  }
}

module.exports = { up, down };
