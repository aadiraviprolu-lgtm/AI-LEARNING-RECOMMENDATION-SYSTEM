const fs = require('fs');
const path = require('path');
const db = require('../src/db');

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  await db.query(sql);
  console.log('Database schema is up to date.');
  await db.pool.end();
})().catch((e) => { console.error('Migration failed:', e.message); process.exit(1); });
