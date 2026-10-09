const { Pool, types } = require('pg');
const config = require('./config');

types.setTypeParser(1082, (v) => v);             // DATE -> 'YYYY-MM-DD' string (no TZ shifts)
types.setTypeParser(20, (v) => parseInt(v, 10)); // BIGINT -> number

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.dbSsl ? { rejectUnauthorized: false } : undefined,
  max: 10,
});

// All queries MUST use $1, $2... placeholders (parameterized) - never string-concatenate user input.
module.exports = { query: (text, params) => pool.query(text, params), pool };
