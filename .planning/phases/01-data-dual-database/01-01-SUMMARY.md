---
phase: 01-data-dual-database
plan: 01
subsystem: database
tags: [mysql, mysql2, env, singleton, vitest]

# Dependency graph
requires: []
provides:
  - Optional MYSQL_URL in env; getMySQLPool() returning Pool | null; unit tests for MySQL pool
affects: []

# Tech tracking
tech-stack:
  added: [mysql2 ^3.11.0]
  patterns: [server-only MySQL pool via singleton, optional env var for hub]

key-files:
  created: [app/mysql.server.ts, app/mysql.server.test.ts]
  modified: [app/env.server.ts, .env.example, package.json, package-lock.json]

key-decisions:
  - "getMySQLPool() reads process.env.MYSQL_URL at call time so tests can stub env without resetModules"

patterns-established:
  - "MySQL pool: singleton('mysql-pool', () => mysql.createPool(url)); no Prisma/Postgres in same module"

requirements-completed: [DATA-01, DATA-02]

# Metrics
duration: 0
completed: 2025-03-15
---

# Phase 01 Plan 01: Data Dual Database Summary

**Optional MySQL connection layer with getMySQLPool() (Pool | null), MYSQL_URL in env, and unit tests; PostgreSQL/Prisma unchanged.**

## Performance

- **Duration:** ~5 min
- **Tasks:** 3
- **Files modified:** 6 (4 modified, 2 created)

## Accomplishments

- MYSQL_URL exported optionally from env.server.ts; documented in .env.example
- mysql2 dependency added and lockfile updated
- app/mysql.server.ts: getMySQLPool() returns Pool when MYSQL_URL set, null otherwise; uses singleton and mysql2/promise createPool
- app/mysql.server.test.ts: tests for null when unset/empty, singleton when set; full test suite green
- app/db.server.ts and Prisma usage untouched; no file imports both MySQL and Prisma

## Task Commits

1. **Task 1: Add MYSQL_URL and install mysql2** - `071a85c` (feat)
2. **Task 2: Create MySQL pool module** - `1568ea1` (feat)
3. **Task 3: Add unit tests and verify Postgres untouched** - `29bdfcd` (test)

## Files Created/Modified

- `app/env.server.ts` - Export optional MYSQL_URL (no assert)
- `.env.example` - MYSQL_URL comment and example line
- `package.json` / `package-lock.json` - mysql2 ^3.11.0
- `app/mysql.server.ts` - getMySQLPool() using singleton and mysql2/promise
- `app/mysql.server.test.ts` - Vitest tests for null and singleton behavior

## Decisions Made

- getMySQLPool() reads `process.env.MYSQL_URL` at call time instead of importing from env.server so Vitest can stub env and test both null and singleton without vi.resetModules(); env.server still exports MYSQL_URL for other use.

## Deviations from Plan

None - plan executed as written. Implementation choice above (read env in getter) was for testability and is consistent with the plan’s “read only in getter” option.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- MySQL pool is available when MYSQL_URL is set; next steps can add VIP/bans/mutes tables or use getMySQLPool() in loaders/actions.
- No blockers.

## Self-Check: PASSED

- app/mysql.server.ts, app/mysql.server.test.ts present
- Commits 071a85c, 1568ea1, 29bdfcd present

---
*Phase: 01-data-dual-database*
*Completed: 2025-03-15*
