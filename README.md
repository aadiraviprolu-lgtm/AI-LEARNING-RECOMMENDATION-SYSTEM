# 🎓 LearnPath AI - Learning Project & Task Manager (Web + Android)

A full-stack project management system themed around learning: **projects are learning goals**, **tasks are study activities**, and a **smart recommendation engine** suggests what to work on next. The web app (React) and the Android app (React Native / Expo) share **one backend and one PostgreSQL database** - log in on either and see the same data.

| | |
|---|---|
| **Live web app** | `https://YOUR-SITE.netlify.app` ← replace after deploying |
| **Live API** | `https://YOUR-API.onrender.com` (`/health`) ← replace |
| **Android APK** | `YOUR EAS / RELEASES LINK` ← replace |
| **Demo login** (after `db:seed`) | `demo@example.com` / `Demo@1234` (test data only) |

## Features
- **Auth:** register, login, logout (server-side token revocation), JWT sessions, bcrypt-hashed passwords, one account for web + mobile
- **Projects:** full CRUD, status, start/end dates, progress bar, search by name, filter by status
- **Tasks:** full CRUD, priority, status, due date, mark completed, search, filter by status/priority, sorting
- **Dashboard:** total projects, total tasks, completed, pending, projects in progress (+ overdue), per authenticated user
- **🤖 Smart recommendations:** ranks your open tasks by priority, deadline urgency and momentum, with a plain-English reason (rule-based, transparent)
- **Mobile:** secure token storage (Android Keystore via `expo-secure-store`), pull-to-refresh, offline banner + friendly network errors, expired-session redirect with message
- **Bonus implemented:** pagination, sorting, Docker, unit tests, CI (GitHub Actions)

## Architecture
```
 React web (Netlify) ──┐
                       ├──► Express REST API (Render) ──► PostgreSQL (Neon)
 Expo Android app ─────┘      JWT · zod validation · rate limiting · helmet · CORS
```
```
backend/   Express API (routes, middleware, validators, migrations, seed, tests)
web/       React + Vite SPA
mobile/    Expo (React Native) Android app
docs/      API.md · ER_DIAGRAM.md · DEPLOYMENT.md · SUBMISSION_CHECKLIST.md
```

## Quick start (local)
Prerequisites: Node 18+ and PostgreSQL 14+ (or Docker).

### 1. Database + backend
```bash
# Option A - Docker (DB + API in one command)
docker compose up --build            # API on http://localhost:4000

# Option B - local PostgreSQL
createdb learnpath
cd backend
cp .env.example .env                 # edit DATABASE_URL and JWT_SECRET
npm install
npm run db:migrate                   # creates tables from db/schema.sql
npm run db:seed                      # optional demo data
npm run dev                          # http://localhost:4000
```
Seed the Docker DB too: `docker compose exec api node scripts/seed.js`

### 2. Web
```bash
cd web
cp .env.example .env                 # VITE_API_URL=http://localhost:4000/api
npm install
npm run dev                          # http://localhost:5173
```

### 3. Mobile (Android)
```bash
cd mobile
cp .env.example .env                 # set EXPO_PUBLIC_API_URL (see below)
npm install
npx expo install --fix               # aligns package versions with your installed Expo Go
npx expo start --android             # emulator, or scan the QR in Expo Go
```
`EXPO_PUBLIC_API_URL` values: Android emulator `http://10.0.2.2:4000/api` · real phone on the same Wi-Fi `http://<PC-LAN-IP>:4000/api` · **deployed backend** `https://YOUR-API.onrender.com/api`.

> **Running the mobile app against your deployed backend:** set `EXPO_PUBLIC_API_URL=https://YOUR-API.onrender.com/api`, restart with `npx expo start -c`. To build an installable APK see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#4-mobile---android-apk-eas-build).

## Environment variables
| Where | Variable | Description |
|---|---|---|
| backend | `DATABASE_URL` | PostgreSQL connection string (required) |
| backend | `JWT_SECRET` | Long random secret for signing tokens (required) |
| backend | `JWT_EXPIRES_IN` | Token lifetime, default `7d` |
| backend | `CORS_ORIGINS` | Comma-separated allowed web origins, default `http://localhost:5173` |
| backend | `DB_SSL` | `true` for hosted DBs requiring SSL |
| backend | `PORT` | Default `4000` |
| web | `VITE_API_URL` | API base URL ending in `/api` |
| mobile | `EXPO_PUBLIC_API_URL` | API base URL ending in `/api` |

## Documentation
- 📘 [API documentation](docs/API.md)
- 🗄️ [Database schema / ER diagram](docs/ER_DIAGRAM.md) · SQL: [`backend/db/schema.sql`](backend/db/schema.sql)
- 🚀 [Deployment guide](docs/DEPLOYMENT.md)
- ✅ [Submission checklist & recording script](docs/SUBMISSION_CHECKLIST.md)

## Security summary
| Requirement | Implementation |
|---|---|
| Password hashing | `bcryptjs`, cost 12; hash never returned in any response |
| AuthN | JWT (HS256) with expiry + `jti`; logout revokes `jti` in DB |
| AuthZ | Every project/task query is scoped by `owner_id` (tasks via join through projects); other users' data → `404` |
| Input validation | `zod` schemas on every body/query/param: required fields, email format, real calendar dates, empty strings, enums, UUIDs, date order |
| SQL injection | Parameterized queries (`$1…`) only; dynamic `ORDER BY`/`SET` columns come from code-owned whitelists |
| Rate limiting | Login: 10 failed attempts / 15 min / IP; register: 20/h; general API: 600 / 15 min |
| Headers / CORS | `helmet`; CORS allow-list from `CORS_ORIGINS` (native apps have no Origin and are allowed) |
| Error handling | Central handler; 5xx details are logged, never returned |
| Mobile token | `expo-secure-store` → Android Keystore / iOS Keychain |

## Tests
```bash
cd backend && npm test      # validation unit tests (no database needed)
```

## License
MIT - Educational project.
