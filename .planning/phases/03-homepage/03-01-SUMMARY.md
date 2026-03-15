---
phase: 03-homepage
plan: 01
subsystem: ui
tags: gamedig, counterstrike2, react-router, loaders

# Dependency graph
requires:
  - phase: 02-server-rules
    provides: Route patterns, useRootLayout, middleware
provides:
  - Server list config (app/data/servers.ts) and map thumbnails (app/data/map-thumbnails.ts)
  - Root path (/) hides inventory via ROUTES_WITHOUT_INVENTORY
  - Index loader returns { servers } from gamedig (counterstrike2) or offline placeholders
affects: 03-02 (server list UI), 03-03 (player modal)

# Tech tracking
tech-stack:
  added: gamedig ^5.3.2
  patterns: Promise.allSettled for server queries; server-side-only gamedig in loader

key-files:
  created: app/data/servers.ts, app/data/map-thumbnails.ts
  modified: app/components/hooks/use-root-layout.ts, app/routes/_index.tsx, package.json

key-decisions:
  - "Server list from app/data/servers.ts; map thumbnails from app/data/map-thumbnails.ts with getMapThumbnailUrl and fallback"
  - "Gamedig type counterstrike2; used only in loader; Promise.allSettled so one offline server does not break the list"
  - "Exported ServerState and ServerListItem types for Plan 02 UI typing"

patterns-established:
  - "Loader: middleware(request), SERVER_LIST iteration, gamedig.query counterstrike2, return { servers }"
  - "Offline placeholder: { offline: true, host, port } when Promise.allSettled rejects"

requirements-completed: [HOME-01]

# Metrics
duration: ~15min
completed: "2026-03-15"
---

# Phase 03 Plan 01: Homepage Data Foundation Summary

**Server list config and map thumbnails data modules; root path hides inventory; index loader returns server list from gamedig (CS2) with Promise.allSettled and offline placeholders.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 3
- **Files created:** 2 (servers.ts, map-thumbnails.ts)
- **Files modified:** 3 (use-root-layout.ts, _index.tsx, package.json)

## Accomplishments

- `app/data/servers.ts`: SERVER_LIST with host and optional port; default port 27015 used in loader
- `app/data/map-thumbnails.ts`: MAP_THUMBNAILS record, FALLBACK_MAP_THUMBNAIL_URL, getMapThumbnailUrl(mapName)
- gamedig installed; used only in index loader (server-side)
- ROUTES_WITHOUT_INVENTORY includes "/" so homepage does not show inventory
- Index loader: middleware, Promise.allSettled over SERVER_LIST, type "counterstrike2"; returns { servers } with ServerState or { offline: true, host, port }; exported ServerState and ServerListItem for Plan 02

## Task Commits

1. **Task 1: Server config and map thumbnails data** - `41380e2` (feat)
2. **Task 2: Hide inventory on homepage** - `036a545` (feat)
3. **Task 3: Index loader with gamedig** - `7aa50e8` (feat)

## Files Created/Modified

- `app/data/servers.ts` - SERVER_LIST (ServerEntry[]), host + optional port
- `app/data/map-thumbnails.ts` - MAP_THUMBNAILS, FALLBACK_MAP_THUMBNAIL_URL, getMapThumbnailUrl()
- `app/components/hooks/use-root-layout.ts` - ROUTES_WITHOUT_INVENTORY = ["/", "/rules"]
- `app/routes/_index.tsx` - Loader with gamedig (counterstrike2), Promise.allSettled, ServerState/ServerListItem types
- `package.json` / `package-lock.json` - gamedig dependency

## Decisions Made

- Server list and map thumbnails live in app/data/ per plan; default port 27015 in loader when port omitted
- ServerState interface defined in _index.tsx (gamedig has no TS types); ServerListItem = ServerState | { offline: true, host, port }

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 02 can consume useLoaderData<typeof loader>() for { servers }; use ServerState/ServerListItem for typing
- Map thumbnails via getMapThumbnailUrl(mapName) and fallback
- Homepage at / shows header + outlet + footer without inventory

## Self-Check: PASSED

- SUMMARY.md created at .planning/phases/03-homepage/03-01-SUMMARY.md
- Commits 41380e2, 036a545, 7aa50e8 present in git log

---
*Phase: 03-homepage*
*Completed: 2026-03-15*
