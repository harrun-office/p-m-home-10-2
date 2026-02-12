const knex = require('knex');
const knexfile = require('../../knexfile');

const env = process.env.NODE_ENV || 'development';
const config = knexfile[env];

if (!config) {
  throw new Error(`Knex env "${env}" not found in knexfile`);
}

module.exports = knex(config);
