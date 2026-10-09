const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../utils/errors');

router.use(auth);

const PRIORITY_SCORE = { High: 30, Medium: 20, Low: 10 };

/**
 * Transparent, rule-based "what should I study next?" scoring (not a trained ML model).
 * Score = priority weight + deadline urgency + momentum bonus for tasks already started.
 */
function scoreTask(task, today) {
  let score = PRIORITY_SCORE[task.priority] || 0;
  const reasons = [`${task.priority} priority`];
  if (task.dueDate) {
    const days = Math.round((new Date(`${task.dueDate}T00:00:00Z`) - today) / 86400000);
    if (days < 0) { score += 50; reasons.push(`overdue by ${-days} day${days === -1 ? '' : 's'}`); }
    else if (days <= 2) { score += 35; reasons.push(days === 0 ? 'due today' : `due in ${days} day${days === 1 ? '' : 's'}`); }
    else if (days <= 7) { score += 20; reasons.push('due this week'); }
  }
  if (task.status === 'In Progress') { score += 10; reasons.push('already in progress - finish it'); }
  return { score, reason: reasons.join(', ') };
}

// GET /api/recommendations - top suggested next tasks for the authenticated user
router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT t.id, t.name, t.priority, t.status, t.due_date AS "dueDate",
            t.project_id AS "projectId", p.name AS "projectName"
     FROM tasks t JOIN projects p ON p.id = t.project_id
     WHERE p.owner_id = $1 AND t.status <> 'Completed'`,
    [req.user.id]
  );
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const data = rows
    .map((t) => ({ ...t, ...scoreTask(t, today) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  res.json({ data });
}));

module.exports = router;
