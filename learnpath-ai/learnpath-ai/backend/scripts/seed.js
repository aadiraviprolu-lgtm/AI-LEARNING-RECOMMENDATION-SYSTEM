// Seeds TEST data only. Demo login: demo@example.com / Demo@1234
const bcrypt = require('bcryptjs');
const db = require('../src/db');

const day = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

(async () => {
  await db.query("DELETE FROM users WHERE email = 'demo@example.com'");
  const hash = await bcrypt.hash('Demo@1234', 12);
  const { rows: [user] } = await db.query(
    "INSERT INTO users (full_name, email, password_hash) VALUES ('Demo Learner', 'demo@example.com', $1) RETURNING id", [hash]);

  const projects = [
    ['Machine Learning Foundations', 'Core ML theory and hands-on practice', 'In Progress', day(-20), day(40), [
      ['Finish linear regression notes', 'High', 'Completed', day(-10)],
      ['Complete classification lab', 'High', 'In Progress', day(1)],
      ['Read bias-variance chapter', 'Medium', 'Pending', day(5)],
      ['Watch gradient descent lecture', 'Low', 'Pending', null],
    ]],
    ['Deep Learning with PyTorch', 'Neural networks from scratch to CNNs', 'Not Started', day(5), day(90), [
      ['Install PyTorch and test GPU', 'Medium', 'Pending', day(6)],
      ['Build a simple MLP', 'High', 'Pending', day(12)],
    ]],
    ['Prompt Engineering Basics', 'Learn to work effectively with LLMs', 'Completed', day(-60), day(-30), [
      ['Write 10 prompt templates', 'Medium', 'Completed', day(-35)],
      ['Evaluate outputs with a rubric', 'Low', 'Completed', day(-31)],
    ]],
    ['Data Structures Revision', 'Interview prep', 'In Progress', day(-5), day(25), [
      ['Practice 5 graph problems', 'High', 'Pending', day(-2)],
    ]],
  ];
  for (const [name, desc, status, start, end, tasks] of projects) {
    const { rows: [p] } = await db.query(
      'INSERT INTO projects (owner_id, name, description, status, start_date, end_date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [user.id, name, desc, status, start, end]);
    for (const [tName, priority, tStatus, due] of tasks) {
      await db.query('INSERT INTO tasks (project_id, name, priority, status, due_date) VALUES ($1,$2,$3,$4,$5)',
        [p.id, tName, priority, tStatus, due]);
    }
  }
  console.log('Seeded demo user: demo@example.com / Demo@1234');
  await db.pool.end();
})().catch((e) => { console.error('Seed failed:', e.message); process.exit(1); });
