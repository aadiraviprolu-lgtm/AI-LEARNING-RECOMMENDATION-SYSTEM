const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { taskCreateSchema, taskUpdateSchema, taskQuerySchema, idParamSchema } = require('../validators');
const { AppError, asyncHandler } = require('../utils/errors');
const { buildUpdate, whereBuilder, pagination, pageMeta } = require('../utils/sql');

router.use(auth);

const SORT = {
  createdAt: 't.created_at',
  name: 'lower(t.name)',
  dueDate: 't.due_date',
  priority: "CASE t.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END",
};
const UPDATE_MAP = { name: 'name', description: 'description', priority: 'priority', status: 'status', dueDate: 'due_date' };

// Ownership is enforced by joining through projects.owner_id on every query.
const SELECT = `
  SELECT t.id, t.project_id AS "projectId", p.name AS "projectName", t.name, t.description,
         t.priority, t.status, t.due_date AS "dueDate", t.created_at AS "createdAt"
  FROM tasks t JOIN projects p ON p.id = t.project_id`;

async function findOwned(id, userId) {
  const { rows } = await db.query(`${SELECT} WHERE t.id = $1 AND p.owner_id = $2`, [id, userId]);
  if (!rows.length) throw new AppError(404, 'Task not found', 'NOT_FOUND');
  return rows[0];
}

// GET /api/tasks?projectId=&search=&status=&priority=&sortBy=&order=&page=&limit=
router.get('/', validate(taskQuerySchema, 'query'), asyncHandler(async (req, res) => {
  const { search, status, priority, projectId, sortBy = 'createdAt', order, page, limit } = req.valid.query;
  const w = whereBuilder('p.owner_id = $1', [req.user.id]);
  if (projectId) w.add('t.project_id = ?', projectId);
  if (search) w.add('strpos(lower(t.name), lower(?)) > 0', search);
  if (status) w.add('t.status = ?', status);
  if (priority) w.add('t.priority = ?', priority);

  const total = (await db.query(
    `SELECT COUNT(*)::int AS n FROM tasks t JOIN projects p ON p.id = t.project_id WHERE ${w.sql}`, w.params)).rows[0].n;
  const defaultOrder = sortBy === 'createdAt' ? 'desc' : 'asc';
  const dir = (order || defaultOrder) === 'asc' ? 'ASC' : 'DESC';
  const { limit: lim, offset } = pagination(page, limit);
  const { rows } = await db.query(
    `${SELECT} WHERE ${w.sql} ORDER BY ${SORT[sortBy]} ${dir} NULLS LAST, t.created_at DESC, t.id
     LIMIT $${w.params.length + 1} OFFSET $${w.params.length + 2}`,
    [...w.params, lim, offset]
  );
  res.json({ data: rows, pagination: pageMeta(page, limit, total) });
}));

// GET /api/tasks/:id
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(async (req, res) => {
  res.json({ data: await findOwned(req.valid.params.id, req.user.id) });
}));

// POST /api/tasks
router.post('/', validate(taskCreateSchema), asyncHandler(async (req, res) => {
  const { projectId, name, description, priority, status, dueDate = null } = req.valid.body;
  const project = await db.query('SELECT 1 FROM projects WHERE id = $1 AND owner_id = $2', [projectId, req.user.id]);
  if (!project.rowCount) throw new AppError(404, 'Project not found', 'NOT_FOUND');

  const { rows } = await db.query(
    `INSERT INTO tasks (project_id, name, description, priority, status, due_date)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [projectId, name, description, priority, status, dueDate]
  );
  res.status(201).json({ data: await findOwned(rows[0].id, req.user.id) });
}));

// PUT /api/tasks/:id  (partial updates allowed; used for "mark completed", status and priority changes)
router.put('/:id', validate(idParamSchema, 'params'), validate(taskUpdateSchema), asyncHandler(async (req, res) => {
  const { id } = req.valid.params;
  await findOwned(id, req.user.id);
  const { sets, values } = buildUpdate(UPDATE_MAP, req.valid.body);
  await db.query(`UPDATE tasks SET ${sets} WHERE id = $${values.length + 1}`, [...values, id]);
  res.json({ data: await findOwned(id, req.user.id) });
}));

// DELETE /api/tasks/:id
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(async (req, res) => {
  const { rowCount } = await db.query(
    'DELETE FROM tasks t USING projects p WHERE t.id = $1 AND p.id = t.project_id AND p.owner_id = $2',
    [req.valid.params.id, req.user.id]
  );
  if (!rowCount) throw new AppError(404, 'Task not found', 'NOT_FOUND');
  res.status(204).end();
}));

module.exports = router;
