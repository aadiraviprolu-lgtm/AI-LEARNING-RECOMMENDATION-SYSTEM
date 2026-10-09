const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../utils/errors');

router.use(auth);

// GET /api/dashboard - statistics for the authenticated user only
router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT
       (SELECT COUNT(*) FROM projects WHERE owner_id = $1)::int AS "totalProjects",
       (SELECT COUNT(*) FROM projects WHERE owner_id = $1 AND status = 'In Progress')::int AS "projectsInProgress",
       COUNT(t.id)::int AS "totalTasks",
       (COUNT(t.id) FILTER (WHERE t.status = 'Completed'))::int AS "completedTasks",
       (COUNT(t.id) FILTER (WHERE t.status = 'Pending'))::int AS "pendingTasks",
       (COUNT(t.id) FILTER (WHERE t.status = 'In Progress'))::int AS "inProgressTasks",
       (COUNT(t.id) FILTER (WHERE t.status <> 'Completed' AND t.due_date < CURRENT_DATE))::int AS "overdueTasks"
     FROM tasks t JOIN projects p ON p.id = t.project_id
     WHERE p.owner_id = $1`,
    [req.user.id]
  );
  res.json({ data: rows[0] });
}));

module.exports = router;
