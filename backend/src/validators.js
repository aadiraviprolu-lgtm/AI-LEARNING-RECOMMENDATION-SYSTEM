const { z } = require('zod');

const PROJECT_STATUS = ['Not Started', 'In Progress', 'Completed'];
const TASK_STATUS = ['Pending', 'In Progress', 'Completed'];
const PRIORITY = ['Low', 'Medium', 'High'];

const blankToNull = (v) => (typeof v === 'string' && v.trim() === '' ? null : v);
const blankToUndef = (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

const isoDate = z.preprocess(
  blankToNull,
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((s) => {
      const d = new Date(`${s}T00:00:00Z`);
      return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
    }, 'Invalid date')
    .nullable()
);

const name = z.string({ required_error: 'Name is required', invalid_type_error: 'Name must be text' })
  .trim().min(1, 'Name is required').max(150, 'Name must be at most 150 characters');
const description = z.string().trim().max(2000, 'Description must be at most 2000 characters');
const optEnum = (values) => z.preprocess(blankToUndef, z.enum(values, {
  errorMap: () => ({ message: `Must be one of: ${values.join(', ')}` }),
}).optional());
const uuid = z.string().uuid('Invalid id');

// ---------- Auth ----------
const email = z.string({ required_error: 'Email is required' }).trim().toLowerCase()
  .email('Invalid email address').max(255);

const registerSchema = z.object({
  fullName: z.string({ required_error: 'Full name is required' }).trim()
    .min(2, 'Full name must be at least 2 characters').max(100),
  email,
  password: z.string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/\d/, 'Password must contain a number'),
});
const loginSchema = z.object({
  email,
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required').max(72),
});

// ---------- Projects ----------
const projectBase = z.object({
  name,
  description: description.default(''),
  status: z.enum(PROJECT_STATUS, { errorMap: () => ({ message: `Status must be one of: ${PROJECT_STATUS.join(', ')}` }) }).default('Not Started'),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
});
const dateOrder = [(d) => !d.startDate || !d.endDate || d.endDate >= d.startDate,
  { message: 'End date must be on or after start date', path: ['endDate'] }];
const projectCreateSchema = projectBase.refine(...dateOrder);
const projectUpdateSchema = projectBase.partial()
  .refine((d) => Object.keys(d).length > 0, { message: 'Provide at least one field to update' })
  .refine(...dateOrder);

// ---------- Tasks ----------
const taskBase = z.object({
  name,
  description: description.default(''),
  priority: z.enum(PRIORITY, { errorMap: () => ({ message: `Priority must be one of: ${PRIORITY.join(', ')}` }) }).default('Medium'),
  status: z.enum(TASK_STATUS, { errorMap: () => ({ message: `Status must be one of: ${TASK_STATUS.join(', ')}` }) }).default('Pending'),
  dueDate: isoDate.optional(),
});
const taskCreateSchema = taskBase.extend({ projectId: uuid });
const taskUpdateSchema = taskBase.partial()
  .refine((d) => Object.keys(d).length > 0, { message: 'Provide at least one field to update' });

// ---------- Query / params ----------
const pageQ = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  order: optEnum(['asc', 'desc']),
};
const search = z.preprocess(blankToUndef, z.string().trim().max(100).optional());
const projectQuerySchema = z.object({
  ...pageQ, search, status: optEnum(PROJECT_STATUS),
  sortBy: optEnum(['createdAt', 'name', 'startDate', 'endDate']),
});
const taskQuerySchema = z.object({
  ...pageQ, search, status: optEnum(TASK_STATUS), priority: optEnum(PRIORITY),
  projectId: z.preprocess(blankToUndef, uuid.optional()),
  sortBy: optEnum(['createdAt', 'name', 'dueDate', 'priority']),
});
const idParamSchema = z.object({ id: uuid });

module.exports = {
  registerSchema, loginSchema, projectCreateSchema, projectUpdateSchema,
  taskCreateSchema, taskUpdateSchema, projectQuerySchema, taskQuerySchema, idParamSchema,
};
