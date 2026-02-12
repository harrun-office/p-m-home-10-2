# Backend scaffold (Node.js + Express + Knex + MySQL)

## Requirements

- **Node.js** (LTS recommended)
- **MySQL 8+** installed and running

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment**
   - Copy `.env.example` to `.env`
   - Edit `.env` with your MySQL host, port, user, password, and database name

3. **Create the database**
   ```bash
   npm run db:create
   ```

4. **Schema**
   - Put your **CREATE TABLE** statements in `server/db/schema_tables.sql`
   - Tables only; do **not** include `CREATE DATABASE` or `USE` in that file

5. **Run migrations**
   ```bash
   npm run db:migrate
   ```

6. **Start the dev server**
   ```bash
   npm run dev
   ```

   The API will be at `http://localhost:3000` (or the `PORT` in `.env`).  
   **Health check:** `GET /health` returns `{ "ok": true }`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start server with nodemon (src/server.js) |
| `npm run start` | Start server (node src/server.js) |
| `npm run db:create` | Create MySQL database if not exists |
| `npm run db:migrate` | Run Knex migrations (development) |
| `npm run db:rollback` | Rollback last migration (development) |

## Where to paste schema

- **File:** `server/db/schema_tables.sql`
- **Content:** Only `CREATE TABLE ...` statements (one or more). No `CREATE DATABASE` or `USE`; the app and migrations use the database name from `.env` (`DB_NAME`).

## MySQL 8 note

This scaffold targets **MySQL 8+**. The create-db script uses `utf8mb4_0900_ai_ci`. If you use an older MySQL version, adjust the collation in `scripts/create-db.js` if needed.

## Folder structure

```
server/
  src/
    db/
      knex.js      # Knex instance (use for routes/repos)
    app.js         # Express app (cors, json, morgan, /health)
    server.js      # Entry: dotenv, listen on PORT
  scripts/
    create-db.js   # Creates DB if not exists
  db/
    schema_tables.sql   # Your CREATE TABLE statements
  migrations/
    ..._init_schema.js  # Runs schema_tables.sql; rollback drops tables
  knexfile.js
  .env.example
  package.json
  README.md
```

Ready for adding routes and repositories later.
