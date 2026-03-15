---
phase: 03-homepage
plan: 02
subsystem: ui
tags: react, tailwind, gamedig, server-list, grid, table

# Dependency graph
requires:
  - phase: 03-homepage plan 01
    provides: index loader { servers }, getMapThumbnailUrl, SERVER_LIST
provides:
  - ServerCard component with map background and server data
  - Homepage server list in grid (default) or table with view toggle
  - Empty state when no servers
affects: 03-homepage plan 03 (player modal will use ServerCard onSelect)

# Tech tracking
tech-stack:
  added: []
  patterns: ServerCard + getMapThumbnailUrl; grid/table toggle with client state

key-files:
  created: app/components/server-card.tsx
  modified: app/routes/_index.tsx

key-decisions:
  - "Grid default; view mode in component state (no localStorage persistence)"
  - "ServerCard accepts optional onSelect for Plan 03 modal; omitted on index for now"

patterns-established:
  - "ServerCard: vertical card with map bg (getMapThumbnailUrl), overlay (bg-stone-900/80), rules-page-style border/rounded"
  - "Index: useLoaderData(servers) → grid (ServerCard) or table (same data, helper fns for display)"

requirements-completed: [HOME-01, HOME-02, HOME-03]

# Metrics
duration: 0
completed: "2026-03-15"
---

# Phase 03 Plan 02: Server list UI Summary

**Homepage server list as vertical cards with map background (getMapThumbnailUrl) and grid/table toggle; default grid; ServerCard with rules-page styling.**

## Performance

- **Duration:** (execution)
- **Tasks:** 2
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments

- ServerCard component: vertical card, map background via getMapThumbnailUrl(map), overlay with server name, map, player count; offline state with host:port; optional onSelect for Plan 03.
- Index page: useLoaderData for servers; view mode "grid" | "table" default "grid"; segmented toggle; grid layout (grid-cols-1 sm:2 lg:3) of ServerCard; table layout with server/map/players/connect/ping; empty state message.

## Task Commits

1. **Task 1: Server card component** — `e4b51c9` (feat)
2. **Task 2: Index page with grid/table toggle** — `4eadf5c` (feat)

## Files Created/Modified

- `app/components/server-card.tsx` — New: ServerCard with map bg, overlay, ServerCardServer props, onSelect optional.
- `app/routes/_index.tsx` — useLoaderData, viewMode state, Grid/Table toggle, ServerCard grid, table view, empty state, helper fns for table cells.

## Decisions Made

- View mode not persisted to localStorage (planner discretion per CONTEXT).
- ServerCard onSelect omitted on index until Plan 03; component supports it.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ServerCard accepts optional onSelect(server) for Plan 03 (click → open player modal).
- Grid/table and empty state in place; Plan 03 adds modal and player fetch.

## Self-Check: PASSED

- `app/components/server-card.tsx` — FOUND
- `app/routes/_index.tsx` — modified
- Commits e4b51c9, 4eadf5c — FOUND

---
*Phase: 03-homepage*
*Completed: 2026-03-15*
