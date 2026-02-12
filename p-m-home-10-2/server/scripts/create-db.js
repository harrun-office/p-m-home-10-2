require('dotenv').config();
const mysql = require('mysql2/promise');

const DB_NAME = process.env.DB_NAME || 'pm_home_db';

async function createDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: false,
    });
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`
    );
    console.log(`Database "${DB_NAME}" created successfully (or already exists).`);
  } catch (err) {
    console.error('Error creating database:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

createDatabase();
