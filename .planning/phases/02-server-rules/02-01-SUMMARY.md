---
phase: 02-server-rules
plan: 01
subsystem: ui
tags: [react-router, tailwind, server-rules, i18n]

# Dependency graph
requires:
  - phase: 01-data-dual-database
    provides: MySQL layer; rules page is static, no DB
provides:
  - Public /rules route with sectioned static content
  - Header and footer links to /rules
  - HeaderRulesLabel in all locales
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [static route with getMetaTitle, middleware(request), sectioned content from app/data]

key-files:
  created: [app/data/server-rules.ts, app/routes/rules._index.tsx, app/routes/rules._index.test.tsx]
  modified: [app/components/header.tsx, app/components/footer.tsx, app/translations/*.ts, vitest.config.ts]

key-decisions:
  - "Server rules content in app/data/server-rules.ts as typed sections (id, title, body)"
  - "Vitest exclude .react-router so generated route type files are not run as tests"

patterns-established:
  - "Public route pattern: meta = getMetaTitle(key), loader calls middleware(request), returns null"
  - "Header/footer Rules link with translate('HeaderRulesLabel') and faScroll icon"

requirements-completed: [RULES-01]

# Metrics
duration: ~12min
completed: "2026-03-15"
---

# Phase 02 Plan 01: Server Rules Summary

**Public /rules page with static sectioned content (Behavior, No cheating, Respect, Consequences), linked from header and footer with localized label in all 30 locales.**

## Performance

- **Duration:** ~12 min
- **Tasks:** 3
- **Files created:** 3
- **Files modified:** 32

## Accomplishments

- Static server rules data in `app/data/server-rules.ts` with `ServerRulesSection` type and four placeholder sections
- Route `/rules` with meta, loader, and sectioned page; automated test for section content
- Header link to `/rules` (faScroll) next to Settings; footer link with `HeaderRulesLabel`; translation key added in all 30 locale files

## Task Commits

Each task was committed atomically:

1. **Task 1: Static server rules data** - `236f021` (feat)
2. **Task 2: Rules route and page** - `f3ff9c6` (feat)
3. **Task 3: Header and footer links plus translation** - `692f1e9` (feat)

## Files Created/Modified

- `app/data/server-rules.ts` - Typed sections array and export
- `app/routes/rules._index.tsx` - Route meta, loader, Rules page component
- `app/routes/rules._index.test.tsx` - Section data and render tests
- `app/components/header.tsx` - HeaderLink to /rules with faScroll
- `app/components/footer.tsx` - Link to /rules with translate(HeaderRulesLabel)
- `app/translations/*.ts` - HeaderRulesLabel in all 30 locales
- `vitest.config.ts` - exclude .react-router for test run

## Decisions Made

- Content in code: `serverRulesSections` in `app/data/server-rules.ts` (no markdown/JSON file)
- Footer: separator " · " between copyright and Rules link; Link from react-router with underline hover

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Exclude .react-router from Vitest**
- **Found during:** Task 2 verification (full test run)
- **Issue:** React Router typegen emits `rules._index.test.ts` in `.react-router/types/`; Vitest ran it as a test suite and failed (no describe/test in that file).
- **Fix:** Added `exclude: ["**/node_modules/**", "**/.react-router/**"]` in vitest.config.ts.
- **Files modified:** vitest.config.ts
- **Committed in:** 692f1e9 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for CI/test runs; no scope creep.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- RULES-01 satisfied; public rules page and nav links are in place.
- Phase 2 plan 01 complete; next phase can depend on /rules and header/footer patterns.

## Self-Check: PASSED

- SUMMARY.md created at .planning/phases/02-server-rules/02-01-SUMMARY.md
- Commits verified: 236f021, f3ff9c6, 692f1e9

---
*Phase: 02-server-rules*
*Completed: 2026-03-15*
