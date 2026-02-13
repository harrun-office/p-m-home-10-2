/**
 * Seed script: create or update an admin user with a bcrypt-hashed password.
 * Usage: node scripts/seed-admin-bcrypt.js
 *
 * Expects .env (or environment) with DB_* and JWT_SECRET not required for this script.
 * Requires: bcrypt, knex, dotenv
 *
 * This script:
 * 1. Hashes the given password with bcrypt (10 rounds)
 * 2. Inserts or updates the admin user in `users` (id, name, email, role, department, password_hash, is_active).
 *
 * Default admin: email admin@demo.com, password admin123 (change in production).
 * Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to override.
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const knex = require('knex');
const knexfile = require('../knexfile');

const env = process.env.NODE_ENV || 'development';
const config = knexfile[env];
const db = knex(config);

const DEFAULT_EMAIL = 'admin@demo.com';
const DEFAULT_PASSWORD = 'admin123';
const BCRYPT_ROUNDS = 10;

async function run() {
  const email = (process.env.SEED_ADMIN_EMAIL || DEFAULT_EMAIL).trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || DEFAULT_PASSWORD;

  if (!email) {
    console.error('SEED_ADMIN_EMAIL must be set or use default.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const adminId = 'user-admin';
  const name = 'Admin Demo';
  const role = 'ADMIN';
  const department = 'DEV';

  try {
    const existing = await db('users').where('email', email).whereNull('deleted_at').first();
    if (existing) {
      await db('users').where('id', existing.id).update({
        password_hash: passwordHash,
        updated_at: db.fn.now(),
      });
      console.log(`Updated existing admin user: ${email}`);
    } else {
      await db('users').insert({
        id: adminId,
        name,
        email,
        role,
        department,
        is_active: 1,
        password_hash: passwordHash,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      });
      console.log(`Inserted new admin user: ${email}`);
    }
    console.log('Admin password is bcrypt-hashed. Use the same password to login via POST /auth/login.');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

run();
