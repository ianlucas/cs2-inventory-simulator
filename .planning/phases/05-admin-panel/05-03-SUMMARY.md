---
phase: 05-admin-panel
plan: 03
subsystem: admin
tags: [mysql, sa_bans, sa_mutes, sa_unbans, sa_unmutes, react-router, tailwind]

# Dependency graph
requires:
  - phase: 05-01
    provides: Admin route and MySQL pool
provides:
  - listBans(), addBan(), unban() using sa_bans and sa_unbans
  - listMutes(), addMute(), unmute() using sa_mutes and sa_unmutes
  - Admin Bans and Mutes sections with tables, add forms, Unban/Unmute actions
affects: [05-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [server-only ban/mute modules, form actions with intent, useFetcher for mutations]

key-files:
  created: [app/admin/bans.server.ts, app/admin/mutes.server.ts]
  modified: [app/routes/admin._index.tsx]

key-decisions:
  - "adminId for unban/unmute passed as 0 (caller can resolve sa_admins.id later)"
  - "Bans and mutes columns match EXISTING_MYSQL_SCHEMA.md (player_name, player_steamid, reason, duration, ends, status, etc.)"

patterns-established:
  - "Intent-based action: formData intent add-ban | unban | add-mute | unmute dispatches to server functions"
  - "Unban/Unmute: INSERT sa_unbans/sa_unmutes then UPDATE sa_bans/sa_mutes status and unban_id/unmute_id"

requirements-completed: [ADMN-03, ADMN-04]

# Metrics
duration: 0
completed: 2026-03-15
---

# Phase 05 Plan 03: Bans and Mutes Summary

**Admin bans and mutes using sa_bans, sa_mutes, sa_unbans, sa_unmutes: server modules (list/add/unban, list/add/unmute) and admin UI with tables, add forms, and Unban/Unmute buttons.**

## Performance

- **Duration:** short
- **Tasks:** 2
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments

- `app/admin/bans.server.ts`: listBans() (SELECT sa_bans ORDER BY created DESC), addBan(params), unban(banId, adminId, reason) with INSERT sa_unbans + UPDATE sa_bans.
- `app/admin/mutes.server.ts`: listMutes(), addMute(params), unmute(muteId, adminId, reason) with INSERT sa_unmutes + UPDATE sa_mutes.
- Admin route loader returns bans and mutes; action handles add-ban, unban, add-mute, unmute (adminId=0).
- Bans section: table (player_name, player_steamid, reason, duration, ends, status, created), add form, Unban button per ACTIVE row.
- Mutes section: table with type (GAG/MUTE/SILENCE), add form, Unmute button per ACTIVE row. Tailwind; errors shown inline.

## Task Commits

1. **Task 1: Bans and mutes server modules** - `9e9d73e` (feat)
2. **Task 2: Admin Bans and Mutes UI** - `f7d487c` (feat)

## Files Created/Modified

- `app/admin/bans.server.ts` - listBans, addBan, unban; typed SaBan, AddBanParams; getMySQLPool.
- `app/admin/mutes.server.ts` - listMutes, addMute, unmute; typed SaMute, AddMuteParams, MuteType; getMySQLPool.
- `app/routes/admin._index.tsx` - loader(listBans, listMutes), action(add-ban, unban, add-mute, unmute), Bans/Mutes sections with tables and forms.

## Decisions Made

- adminId for unban/unmute is passed as 0; future work can resolve sa_admins.id from session.
- Column names and unban/unmute flow follow EXISTING_MYSQL_SCHEMA.md (sa_unbans.ban_id, sa_unmutes.mute_id, date, admin_id).

## Deviations from Plan

None - plan executed as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Bans and mutes are manageable from the admin panel (view, add, unban/unmute).
- Ready for 05-04 (e.g. server info or other admin sections).

## Self-Check: PASSED

- FOUND: app/admin/bans.server.ts, app/admin/mutes.server.ts
- FOUND: commits 9e9d73e, f7d487c

---
*Phase: 05-admin-panel*
*Completed: 2026-03-15*
