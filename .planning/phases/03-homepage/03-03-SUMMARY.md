---
phase: 03-homepage
plan: 03
subsystem: ui
tags: [gamedig, react-router, useFetcher, modal, counterstrike2]

# Dependency graph
requires:
  - phase: 03-homepage
    provides: Server list, ServerCard with onSelect, Modal/ModalHeader
provides:
  - GET /api/servers/players?host=&port= returning { players } from gamedig
  - Player modal on server card click with loading, list, and empty states
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: Resource route + useFetcher for modal data without navigation

key-files:
  created: app/routes/api.servers.players._index.tsx
  modified: app/routes/_index.tsx

key-decisions:
  - "Players API is a public resource route (no auth) for homepage modal"
  - "Loader attaches host/port to each server so modal can call players API"

patterns-established:
  - "Resource route returns JSON with host/port from searchParams; gamedig counterstrike2 server-side only"
  - "useFetcher().load() when modal opens; Modal hidden when no selectedServer, onClose clears selection"

requirements-completed: [HOME-04]

# Metrics
duration: 15min
completed: "2026-03-15"
---

# Phase 03 Plan 03: Player Modal on Card Click Summary

**Resource route for server players (gamedig counterstrike2) and modal with useFetcher showing player names (fallback "—"), loading and empty states.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 2
- **Files created:** 1
- **Files modified:** 1

## Accomplishments

- GET `/api/servers/players?host=&port=` resource route runs gamedig type `counterstrike2` server-side and returns `{ players }` (name, raw); 400 when params missing/invalid, 503 on query failure.
- Index page: selected server state, Modal + ModalHeader "Players", useFetcher loads players when user clicks a server card; list shows names with fallback "—", loading and empty states; close clears selection.
- Loader now attaches host/port to every server item so the modal can call the players API.

## Task Commits

Each task was committed atomically:

1. **Task 1: Resource route for players** - `e563fc4` (feat)
2. **Task 2: Player modal on card click** - `41d40c8` (feat)

## Files Created/Modified

- `app/routes/api.servers.players._index.tsx` - Resource route: read host/port from searchParams, gamedig.query counterstrike2, return Response.json({ players })
- `app/routes/_index.tsx` - selectedServer state, onSelect on ServerCard, Modal with useFetcher, loader adds host/port to each server

## Decisions Made

- Players endpoint is unauthenticated so the homepage modal can fetch without session.
- On gamedig failure return 503 with empty players so the modal can show "No players" instead of a hard error.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

- HOME-04 satisfied: user can open a modal with players on the server by clicking a server card.
- Phase 3 homepage is complete; ready for Phase 4 (Buy VIP) or verification.

## Self-Check: PASSED

- FOUND: app/routes/api.servers.players._index.tsx
- FOUND: .planning/phases/03-homepage/03-03-SUMMARY.md
- FOUND: commits e563fc4, 41d40c8

---
*Phase: 03-homepage*
*Completed: 2026-03-15*
