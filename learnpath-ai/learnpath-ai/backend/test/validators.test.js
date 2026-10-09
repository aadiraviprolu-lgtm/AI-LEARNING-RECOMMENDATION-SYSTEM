process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://x:x@localhost/x';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test';
const test = require('node:test');
const assert = require('node:assert');
const v = require('../src/validators');

test('register rejects invalid email and weak password', () => {
  assert.ok(!v.registerSchema.safeParse({ fullName: 'Jo Doe', email: 'nope', password: 'Abcdefg1' }).success);
  assert.ok(!v.registerSchema.safeParse({ fullName: 'Jo Doe', email: 'a@b.co', password: 'short1' }).success);
  assert.ok(v.registerSchema.safeParse({ fullName: 'Jo Doe', email: 'A@B.co', password: 'Abcdefg1' }).success);
});
test('register normalizes email to lowercase', () => {
  assert.strictEqual(v.registerSchema.parse({ fullName: 'Jo Doe', email: ' A@B.CO ', password: 'Abcdefg1' }).email, 'a@b.co');
});
test('project rejects bad enum, empty name, invalid dates and reversed range', () => {
  assert.ok(!v.projectCreateSchema.safeParse({ name: 'x', status: 'Done' }).success);
  assert.ok(!v.projectCreateSchema.safeParse({ name: '   ' }).success);
  assert.ok(!v.projectCreateSchema.safeParse({ name: 'x', startDate: '2025-02-30' }).success);
  assert.ok(!v.projectCreateSchema.safeParse({ name: 'x', startDate: '2025-05-02', endDate: '2025-05-01' }).success);
  assert.ok(v.projectCreateSchema.safeParse({ name: 'x', startDate: '', endDate: '' }).success);
});
test('task rejects bad priority/status and non-uuid project', () => {
  const ok = { projectId: '123e4567-e89b-42d3-a456-426614174000', name: 't' };
  assert.ok(v.taskCreateSchema.safeParse(ok).success);
  assert.ok(!v.taskCreateSchema.safeParse({ ...ok, priority: 'Urgent' }).success);
  assert.ok(!v.taskCreateSchema.safeParse({ ...ok, status: 'Done' }).success);
  assert.ok(!v.taskCreateSchema.safeParse({ ...ok, projectId: '1; DROP TABLE tasks' }).success);
});
test('task update requires at least one field', () => {
  assert.ok(!v.taskUpdateSchema.safeParse({}).success);
  assert.ok(v.taskUpdateSchema.safeParse({ status: 'Completed' }).success);
});
