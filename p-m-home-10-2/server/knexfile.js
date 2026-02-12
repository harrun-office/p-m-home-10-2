require('dotenv').config();

module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'pm_home_db',
    },
    migrations: {
      directory: './migrations',
    },
    pool: { min: 0, max: 10 },
    // multipleStatements only for migration execution (schema file may have many CREATE TABLE statements)
    wrapIdentifier: (value, origImpl, queryContext) => origImpl(value),
  },
};
