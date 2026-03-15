---
phase: 05-admin-panel
plan: 04
subsystem: admin
tags: [mysql, server_list, getServerListForDisplay, react-router, tailwind]

# Dependency graph
requires:
  - phase: 05-01
    provides: Admin route and MySQL pool
provides:
  - listServers(), getServerListForDisplay(), addServer(), updateServer(), removeServer() using server_list
  - Homepage loader uses getServerListForDisplay() (MySQL or SERVER_LIST fallback)
  - Admin Servers section: table, Add form, Edit/Remove per row
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [server_list table, getServerListForDisplay fallback to app/data/servers]

key-files:
  created: [app/admin/servers.server.ts]
  modified: [app/routes/_index.tsx, app/routes/admin._index.tsx]

key-decisions:
  - "Table name server_list; columns id, host, port, gamemode, sort_order (existing schema)"
  - "getServerListForDisplay(): pool null or 0 rows/error → SERVER_LIST from ~/data/servers"

patterns-established:
  - "Homepage server list: single source getServerListForDisplay() so MySQL or fallback is transparent"
  - "Admin Servers: listServers in loader; add-server, update-server, remove-server in action; inline edit row with Save/Cancel"

requirements-completed: [ADMN-05]

# Metrics
duration: 0
completed: 2026-03-15
---

# Phase 05 Plan 04: Admin Server List Summary

**Server list from MySQL (server_list); getServerListForDisplay() for homepage with SERVER_LIST fallback; admin Servers section with add/edit/remove and Tailwind table.**

## Performance

- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- `app/admin/servers.server.ts`: listServers() (SELECT server_list ORDER BY sort_order, id), getServerListForDisplay() (pool null or 0 rows/error → SERVER_LIST), addServer(), updateServer(), removeServer() using getMySQLPool().
- Homepage loader: server entries from getServerListForDisplay(); gamedig runs over returned list; behavior unchanged when MySQL empty (fallback to app/data/servers).
- Admin route: loader includes listServers(); action handles add-server, update-server, remove-server; Servers section with table (host, port, gamemode, sort_order), Add form, per-row Edit (inline) and Remove. Tailwind styling; empty state message when no servers.

## Task Commits

1. **Task 1: servers.server.ts** - `5c87dac` (feat)
2. **Task 2: Homepage loader + admin Servers section** - `6de6ac1` (feat)

## Files Created/Modified

- `app/admin/servers.server.ts` - listServers, getServerListForDisplay, addServer, updateServer, removeServer; ServerRow, AddServerParams, UpdateServerParams; table server_list.
- `app/routes/_index.tsx` - loader uses getServerListForDisplay() then gamedig over serverEntries.
- `app/routes/admin._index.tsx` - loader adds listServers(); action add-server, update-server, remove-server; Servers section table + Add form + ServerRowWithActions (Edit/Remove, inline edit).

## Decisions Made

- Table name `server_list`; columns id, host, port, gamemode, sort_order to match existing schema.
- getServerListForDisplay() returns SERVER_LIST from ~/data/servers when pool is null or query returns 0 rows or throws.

## Deviations from Plan

None - plan executed as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. If MySQL has no server_list table, listServers returns [] and getServerListForDisplay() falls back to SERVER_LIST; admin can add servers once table exists.

## Next Phase Readiness

- ADMN-05 satisfied: admin can view and edit server list; homepage displays from MySQL when available, fallback to app/data/servers when not.

## Self-Check: PASSED

- app/admin/servers.server.ts exists
- .planning/phases/05-admin-panel/05-04-SUMMARY.md exists
- Commits 5c87dac, 6de6ac1 present in git log

---
*Phase: 05-admin-panel*
*Completed: 2026-03-15*
