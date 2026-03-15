---
phase: 05-admin-panel
plan: 01
subsystem: auth
tags: [admin, steam, react-router, tailwind]

# Dependency graph
requires: []
provides:
  - forbidden (403) response in responses.server
  - isAdmin(request) using getRequestUserId + ADMIN_STEAM_IDS env
  - Admin layout route gating /admin/* with requireUser + isAdmin
  - Admin dashboard index with nav to VIP, Bans, Mutes, Server info sections
affects: [05-admin-panel]

# Tech tracking
tech-stack:
  added: []
  patterns: [layout loader auth gate, env-based admin list]

key-files:
  created: [app/routes/admin.tsx, app/routes/admin._index.tsx]
  modified: [app/auth.server.ts, app/responses.server.ts, .env.example]

key-decisions:
  - "Admin gating via ADMIN_STEAM_IDS env (comma-separated Steam IDs); no DB/Prisma change"
  - "Single-page dashboard with in-page anchors (#vips, #bans, #mutes, #servers) for future CRUD"

patterns-established:
  - "Admin layout: middleware(request) then requireUser then isAdmin or throw forbidden"

requirements-completed: [ADMN-01]

# Metrics
duration: ~5min
completed: 2025-03-15
---

# Phase 05 Plan 01: Admin Gate and Dashboard Summary

**Admin panel gated by Steam auth and ADMIN_STEAM_IDS; layout returns 403 for non-admins; dashboard with placeholder sections for VIP, Bans, Mutes, Server info.**

## Performance

- **Duration:** ~5 min
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added `forbidden` (403) response and `isAdmin(request)` using `getRequestUserId` + `ADMIN_STEAM_IDS` env.
- Documented optional `ADMIN_STEAM_IDS` in `.env.example` (commented).
- Created admin layout route: loader runs `middleware`, `requireUser`, then `isAdmin` or throws `forbidden`; component renders `<Outlet />`.
- Created admin index: dashboard with nav links to sections `#vips`, `#bans`, `#mutes`, `#servers` and placeholder section content; Tailwind styling; title "Admin".

## Task Commits

1. **Task 1: Admin check and 403 response** - `561e913` (feat)
2. **Task 2: Admin layout and index route** - `4ddc7dc` (feat)

## Files Created/Modified

- `app/responses.server.ts` - Added `export const forbidden = new Response(null, { status: 403 })`
- `app/auth.server.ts` - Added `isAdmin(request)` (getRequestUserId + ADMIN_STEAM_IDS split/trim/filter/includes)
- `.env.example` - Added commented block for Admin panel and ADMIN_STEAM_IDS
- `app/routes/admin.tsx` - Layout route with loader (middleware, requireUser, isAdmin or 403), Component = Outlet
- `app/routes/admin._index.tsx` - Index route with loader `return {}`, dashboard UI with nav and placeholder sections

## Decisions Made

- Admin flag via env only: `ADMIN_STEAM_IDS` optional; app runs without it (no admins). Not added to env.server assert.
- Dashboard is single page with in-page anchors for future child content; no CRUD in this plan.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

To access `/admin`, set `ADMIN_STEAM_IDS` in `.env` to a comma-separated list of Steam IDs (e.g. your own). Unauthenticated users are redirected to sign-in; authenticated non-admins receive 403.

## Next Phase Readiness

- Admin layout and dashboard in place; later plans can add CRUD under `/admin` or within the same page sections.
- ADMN-01 satisfied: admin can access panel via Steam auth and admin flag; non-admin gets 403.

## Self-Check: PASSED

- `app/responses.server.ts`, `app/auth.server.ts`, `.env.example`, `app/routes/admin.tsx`, `app/routes/admin._index.tsx` exist.
- Commits `561e913`, `4ddc7dc`, `c03492c` present in git log.

---
*Phase: 05-admin-panel*
*Completed: 2025-03-15*
