const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { projectCreateSchema, projectUpdateSchema, projectQuerySchema, idParamSchema } = require('../validators');
const { AppError, asyncHandler } = require('../utils/errors');
const { buildUpdate, whereBuilder, pagination, pageMeta } = require('../utils/sql');

router.use(auth); // every project route is protected

const SORT = { createdAt: 'p.created_at', name: 'lower(p.name)', startDate: 'p.start_date', endDate: 'p.end_date' };
const UPDATE_MAP = { name: 'name', description: 'description', status: 'status', startDate: 'start_date', endDate: 'end_date' };

const SELECT = `
  SELECT p.id, p.name, p.description, p.status,
         p.start_date AS "startDate", p.end_date AS "endDate", p.created_at AS "createdAt",
         COUNT(t.id)::int AS "taskCount",
         (COUNT(t.id) FILTER (WHERE t.status = 'Completed'))::int AS "completedTaskCount"
  FROM projects p LEFT JOIN tasks t ON t.project_id = p.id`;

async function findOwned(id, userId) {
  const { rows } = await db.query(`${SELECT} WHERE p.id = $1 AND p.owner_id = $2 GROUP BY p.id`, [id, userId]);
  if (!rows.length) throw new AppError(404, 'Project not found', 'NOT_FOUND'); // 404 (not 403) so ids can't be probed
  return rows[0];
}

// GET /api/projects?search=&status=&sortBy=&order=&page=&limit=
router.get('/', validate(projectQuerySchema, 'query'), asyncHandler(async (req, res) => {
  const { search, status, sortBy = 'createdAt', order = 'desc', page, limit } = req.valid.query;
  const w = whereBuilder('p.owner_id = $1', [req.user.id]);
  if (search) w.add('strpos(lower(p.name), lower(?)) > 0', search);
  if (status) w.add('p.status = ?', status);

  const total = (await db.query(`SELECT COUNT(*)::int AS n FROM projects p WHERE ${w.sql}`, w.params)).rows[0].n;
  const { limit: lim, offset } = pagination(page, limit);
  const dir = order === 'asc' ? 'ASC' : 'DESC';
  const { rows } = await db.query(
    `${SELECT} WHERE ${w.sql} GROUP BY p.id ORDER BY ${SORT[sortBy]} ${dir} NULLS LAST, p.id
     LIMIT $${w.params.length + 1} OFFSET $${w.params.length + 2}`,
    [...w.params, lim, offset]
  );
  res.json({ data: rows, pagination: pageMeta(page, limit, total) });
}));

// GET /api/projects/:id
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(async (req, res) => {
  res.json({ data: await findOwned(req.valid.params.id, req.user.id) });
}));

// POST /api/projects
router.post('/', validate(projectCreateSchema), asyncHandler(async (req, res) => {
  const { name, description, status, startDate = null, endDate = null } = req.valid.body;
  const { rows } = await db.query(
    `INSERT INTO projects (owner_id, name, description, status, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [req.user.id, name, description, status, startDate, endDate]
  );
  res.status(201).json({ data: await findOwned(rows[0].id, req.user.id) });
}));

// PUT /api/projects/:id
router.put('/:id', validate(idParamSchema, 'params'), validate(projectUpdateSchema), asyncHandler(async (req, res) => {
  const { id } = req.valid.params;
  const current = await findOwned(id, req.user.id);

  // Re-check date ordering against the merged result (partial updates)
  const start = req.valid.body.startDate !== undefined ? req.valid.body.startDate : current.startDate;
  const end = req.valid.body.endDate !== undefined ? req.valid.body.endDate : current.endDate;
  if (start && end && end < start) throw new AppError(400, 'End date must be on or after start date', 'VALIDATION_ERROR');

  const { sets, values } = buildUpdate(UPDATE_MAP, req.valid.body);
  await db.query(`UPDATE projects SET ${sets} WHERE id = $${values.length + 1} AND owner_id = $${values.length + 2}`,
    [...values, id, req.user.id]);
  res.json({ data: await findOwned(id, req.user.id) });
}));

// DELETE /api/projects/:id  (tasks are removed via ON DELETE CASCADE)
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM projects WHERE id = $1 AND owner_id = $2', [req.valid.params.id, req.user.id]);
  if (!rowCount) throw new AppError(404, 'Project not found', 'NOT_FOUND');
  res.status(204).end();
}));

module.exports = router;
