# Deployment Guide (free tiers)

Order matters: **database → backend → web → mobile APK**.

## 1. Database - Neon (or Render Postgres / Supabase)
1. Create a Postgres project, copy the connection string (`postgresql://user:pass@host/db?sslmode=require`).
2. From `backend/`, run the schema against it:
   ```bash
   DATABASE_URL="<neon-url>" DB_SSL=true npm run db:migrate
   DATABASE_URL="<neon-url>" DB_SSL=true npm run db:seed   # optional demo data
   ```

## 2. Backend - Render (Web Service)
- Root directory `backend` · Build `npm install` · Start `npm start`
- Environment variables:
  | Key | Value |
  |---|---|
  | `DATABASE_URL` | your Neon URL |
  | `DB_SSL` | `true` |
  | `JWT_SECRET` | output of `openssl rand -hex 48` |
  | `JWT_EXPIRES_IN` | `7d` |
  | `CORS_ORIGINS` | your Netlify URL, e.g. `https://learnpath-ai.netlify.app` (no trailing slash; comma-separate several) |
- Verify: open `https://<service>.onrender.com/health` → `{"status":"ok"}`.
- Free instances sleep after inactivity; the first request can take ~30 s. Open it once before recording/demoing.

## 3. Web - Netlify
- Base directory `web` · Build `npm run build` · Publish `dist` (already in `web/netlify.toml`)
- Environment variable: `VITE_API_URL=https://<service>.onrender.com/api`
- After you know the Netlify URL, put it in the backend's `CORS_ORIGINS` and redeploy the backend.

## 4. Mobile - Android APK (EAS Build)
```bash
cd mobile
npm install -g eas-cli && eas login
# point the app at the deployed backend (baked in at build time):
eas build:configure                      # first time only
EXPO_PUBLIC_API_URL=https://<service>.onrender.com/api eas build -p android --profile preview
```
EAS prints a download link to the `.apk` - that link (or the file uploaded to GitHub Releases) is your submission artifact.
Tip: on EAS you can also set `EXPO_PUBLIC_API_URL` under *Project → Environment variables* instead of the command line.

## Troubleshooting
| Symptom | Fix |
|---|---|
| Web shows "Cannot reach the server" | `VITE_API_URL` wrong, or backend asleep; check `/health` |
| Browser console CORS error | Add the exact web origin to `CORS_ORIGINS`, redeploy backend |
| Mobile "server is unreachable" on emulator | Use `http://10.0.2.2:4000/api`, not `localhost` |
| Mobile on a real phone, local backend | Use your PC's LAN IP; phone and PC on the same Wi-Fi; allow port 4000 in the firewall |
| `self-signed certificate` / SSL error to DB | Set `DB_SSL=true` |
