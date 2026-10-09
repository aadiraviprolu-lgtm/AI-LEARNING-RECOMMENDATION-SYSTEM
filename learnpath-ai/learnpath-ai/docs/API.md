# API Documentation

Base URL (local): `http://localhost:4000/api` - one backend serves both the web and mobile apps.

**Auth:** send `Authorization: Bearer <token>` on every endpoint except register/login.
**Format:** JSON. Dates are `YYYY-MM-DD`. IDs are UUIDs.

### Error format
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid email address",
             "details": [{ "field": "email", "message": "Invalid email address" }] } }
```
| Status | Meaning |
|---|---|
| 400 | Validation failed / malformed JSON |
| 401 | Missing, invalid, **expired** (`TOKEN_EXPIRED`) or revoked (`TOKEN_REVOKED`) token; bad credentials |
| 404 | Resource doesn't exist **or belongs to another user** (deliberately indistinguishable) |
| 409 | Email already registered |
| 429 | Rate limit exceeded |
| 500 | Server error (details never leaked; see server logs) |

---
## Authentication
### `POST /auth/register`  (rate limit: 20/hour/IP)
```json
{ "fullName": "Demo Learner", "email": "demo@example.com", "password": "Demo@1234" }
```
Password: 8-72 chars, at least one letter and one number. Email is lower-cased and unique.
**201** → `{ "user": { "id", "fullName", "email", "createdAt" }, "token": "<jwt>" }`

### `POST /auth/login`  (rate limit: 10 failed attempts / 15 min / IP → 429)
```json
{ "email": "demo@example.com", "password": "Demo@1234" }
```
**200** → `{ "user": {...}, "token": "<jwt>" }` · **401** `INVALID_CREDENTIALS`

### `POST /auth/logout` 🔒
Revokes the current token server-side. **200** → `{ "message": "Logged out successfully" }`

### `GET /auth/me` 🔒
**200** → `{ "user": { "id", "fullName", "email", "createdAt" } }`

---
## Projects 🔒
Project object: `{ id, name, description, status, startDate, endDate, createdAt, taskCount, completedTaskCount }`

### `GET /projects`
Query: `search` (name contains, case-insensitive) · `status` (`Not Started|In Progress|Completed`) · `sortBy` (`createdAt|name|startDate|endDate`) · `order` (`asc|desc`) · `page` (default 1) · `limit` (default 20, max 100)
**200** → `{ "data": [Project], "pagination": { "page", "limit", "total", "totalPages" } }`

### `GET /projects/:id` → `{ "data": Project }`
### `POST /projects`
```json
{ "name": "Machine Learning Foundations", "description": "…", "status": "In Progress",
  "startDate": "2026-01-01", "endDate": "2026-03-01" }
```
`name` required (≤150). `status` default `Not Started`. `endDate` must be ≥ `startDate`. **201** → `{ "data": Project }`

### `PUT /projects/:id`
Any subset of the POST fields (at least one). **200** → `{ "data": Project }`
### `DELETE /projects/:id`
Deletes the project and its tasks (cascade). **204**

---
## Tasks 🔒
Task object: `{ id, projectId, projectName, name, description, priority, status, dueDate, createdAt }`

### `GET /tasks`
Query: `projectId` · `search` (name) · `status` (`Pending|In Progress|Completed`) · `priority` (`Low|Medium|High`) · `sortBy` (`createdAt|name|dueDate|priority`) · `order` · `page` · `limit`
**200** → `{ "data": [Task], "pagination": {...} }`

### `GET /tasks/:id` → `{ "data": Task }`
### `POST /tasks`
```json
{ "projectId": "<uuid>", "name": "Finish lab 3", "description": "", "priority": "High",
  "status": "Pending", "dueDate": "2026-11-01" }
```
`projectId` and `name` required; `priority` default `Medium`; `status` default `Pending`. **404** if the project isn't yours. **201** → `{ "data": Task }`

### `PUT /tasks/:id`
Partial update - used for edit, **mark completed** (`{ "status": "Completed" }`), status and priority changes. **200** → `{ "data": Task }`
### `DELETE /tasks/:id` → **204**

---
## Dashboard 🔒
### `GET /dashboard`
```json
{ "data": { "totalProjects": 4, "totalTasks": 9, "completedTasks": 3, "pendingTasks": 5,
            "projectsInProgress": 2, "inProgressTasks": 1, "overdueTasks": 1 } }
```
Counts are scoped to the authenticated user.

## Smart recommendations 🔒 (extra feature)
### `GET /recommendations`
Top 5 non-completed tasks to work on next, each with `score` and a human-readable `reason`.
Scoring is a transparent rule set (priority weight + deadline urgency + "already started" bonus) - not a trained ML model.

## Health
`GET /health` → `{ "status": "ok" }` (no auth; used by hosting platforms).
