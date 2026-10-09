# Submission Checklist

- [ ] Public GitHub repo (open it in a private window to confirm it's visible without login)
- [ ] `README.md`, `docs/API.md`, `docs/ER_DIAGRAM.md` present in the repo
- [ ] Backend deployed - `/health` returns ok
- [ ] Web deployed - can register + log in
- [ ] Android APK link works (installs and logs in against the **deployed** backend)
- [ ] 5-minute screen recording (script below)
- [ ] No real personal data anywhere (demo data only); `.env` files are NOT committed

## 5-minute recording script
1. (0:00) Show repo + deployed URLs briefly.
2. (0:30) Register on **web**; show dashboard (all zeros).
3. (1:00) Create a project and two tasks on web.
4. (1:45) Open the **mobile app**, log in with the **same account** → dashboard + project + tasks appear.
5. (2:30) On mobile: create a task, mark one completed, change priority.
6. (3:15) Back on web: refresh → the mobile changes appear. Then create a task on web → pull-to-refresh on mobile.
7. (4:00) Show security: log in as a second user → cannot see the first user's data; mention bcrypt, JWT, rate limiting, parameterized SQL.
8. (4:40) Turn on airplane mode in the app → friendly offline message. Mention token in Keystore (expo-secure-store).

## Questions to be ready for in the review
- Why 404 instead of 403 for other users' resources? *(avoids confirming that an id exists)*
- How is SQL injection prevented? *(only `$n` bound parameters; sort columns come from whitelists)*
- Where is the token stored on each platform? *(web: localStorage - trade-off: XSS exposure, mitigated by no `dangerouslySetInnerHTML` + helmet; mobile: Keystore/Keychain)*
- How does logout work with stateless JWTs? *(`revoked_tokens` table keyed by `jti`)*
- How do the "AI recommendations" work? *(rule-based scoring in `routes/recommendations.js` - be upfront that it's heuristic, not ML)*
