---
phase: 05-admin-panel
plan: 02
subsystem: admin
tags: [mysql2, react-router, vip_users, admin-panel]

# Dependency graph
requires:
  - phase: 05-01
    provides: Admin layout and route
provides:
  - listVips(), addVip(), removeVip() in app/admin/vip.server.ts
  - Admin VIP section: table, add form, remove per row
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: "Server-only VIP module with getMySQLPool; parameterized queries for vip_users"

key-files:
  created: [app/admin/vip.server.ts]
  modified: [app/routes/admin._index.tsx]

key-decisions:
  - "Quoted MySQL reserved word `group` in SQL; return { ok, error } from addVip/removeVip for action feedback"

patterns-established:
  - "VIP server module: getMySQLPool null → empty/failure; typed VipUser; parameterized queries"

requirements-completed: [ADMN-02]

# Metrics
duration: 0
completed: "2026-03-15"
---

# Phase 05 Plan 02: VIP Management Summary

**VIP management in admin panel: listVips/addVip/removeVip against vip_users via getMySQLPool; admin route loader and action with table, add form, and per-row remove.**

## Performance

- **Duration:** Short (2 tasks)
- **Tasks:** 2
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments

- `app/admin/vip.server.ts`: listVips() (SELECT ORDER BY expires DESC), addVip(params), removeVip(account_id, sid) using getMySQLPool and parameterized queries
- Admin route: loader returns vips from listVips(); action handles intent "add-vip" and "remove-vip"; VIP section shows table (account_id, name, lastvisit, sid, group, expires), Add VIP form, Remove button per row with Tailwind styling

## Task Commits

1. **Task 1: VIP server module (list, add, remove)** - `48d2994` (feat)
2. **Task 2: Admin VIP section UI and actions** - `5843d4a` (feat)

## Files Created/Modified

- `app/admin/vip.server.ts` - Server-only VIP CRUD: listVips, addVip, removeVip; uses getMySQLPool; typed VipUser; backtick-quoted `group` in SQL
- `app/routes/admin._index.tsx` - Loader calls listVips(); action dispatches add-vip/remove-vip; VIP section table, add form, remove per row; inline error display

## Decisions Made

- Quoted MySQL reserved keyword `group` as `` `group` `` in all vip_users queries
- addVip/removeVip return `{ ok: true }` or `{ ok: false, error: string }` for action feedback and inline error display

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required beyond existing MYSQL_URL for vip_users table.

## Next Phase Readiness

- VIP list/add/remove working; admin can manage vip_users from /admin
- Ready for bans/mutes sections (05-03+) using same loader/action pattern

## Self-Check: PASSED

- app/admin/vip.server.ts: FOUND
- Commits 48d2994, 5843d4a: FOUND

---
*Phase: 05-admin-panel*
*Completed: 2026-03-15*
