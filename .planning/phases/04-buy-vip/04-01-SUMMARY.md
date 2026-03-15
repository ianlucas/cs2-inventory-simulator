---
phase: 04-buy-vip
plan: 01
subsystem: payments
tags: paytr, mysql, crypto, callback, vip

# Dependency graph
requires:
  - phase: 03-homepage
    provides: existing app routes and mysql.server
provides:
  - PayTR callback (Bildirim URL) with hash verification and idempotent VIP insert
  - PayTR hash utilities (verifyCallbackHash, buildPaytrToken) and env vars
  - VIP table schema doc for operator (vip_pending, vip)
affects: 04-02 (VIP page), 04-03 (get-token + iframe)

# Tech tracking
tech-stack:
  added: []
  patterns: PayTR callback hash (2. Adım), get-token hash (1. Adım), idempotency by merchant_oid

key-files:
  created: app/utils/paytr.server.ts, app/utils/paytr.server.test.ts, app/routes/api.vip.paytr-callback._index.tsx, .planning/phases/04-buy-vip/VIP_TABLE_SCHEMA.md
  modified: app/env.server.ts, .env.example

key-decisions:
  - "Callback returns plain OK for non-success status to stop PayTR retries"
  - "DELETE vip_pending after successful insert to avoid reuse"

patterns-established:
  - "PayTR callback: verify hash then idempotency check by merchant_oid before INSERT vip"

requirements-completed: [VIP-03]

# Metrics
duration: 0
completed: "2026-03-15"
---

# Phase 4 Plan 01: PayTR Callback & Hash Utils Summary

**PayTR Bildirim URL callback with Node crypto hash verification, idempotent MySQL VIP insert, optional env vars, and VIP table schema for operator.**

## Performance

- **Duration:** ~5 min
- **Tasks:** 3 completed
- **Files modified:** 6 (4 created, 2 modified)

## Accomplishments

- **verifyCallbackHash** and **buildPaytrToken** in `app/utils/paytr.server.ts` using Node `node:crypto` and exact PayTR 2. Adım / 1. Adım formulas.
- Unit tests in `app/utils/paytr.server.test.ts` (5 tests) for hash verification and deterministic token.
- Optional PayTR env vars in `app/env.server.ts` (PAYTR_MERCHANT_ID, PAYTR_MERCHANT_KEY, PAYTR_MERCHANT_SALT, PAYTR_TEST_MODE) and `.env.example` with Bildirim URL comment.
- **VIP_TABLE_SCHEMA.md** with `vip_pending` and `vip` table definitions and CREATE TABLE snippets.
- **POST /api/vip/paytr-callback**: formData parse, hash verify, on success idempotency check (SELECT vip by merchant_oid), lookup vip_pending, INSERT vip, DELETE vip_pending, return `Content-Type: text/plain` "OK". GET returns 405.

## Task Commits

1. **Task 1: PayTR hash utilities and unit tests** - `eee2d31` (feat)
2. **Task 2: Env and VIP table schema doc** - `402cd72` (chore)
3. **Task 3: PayTR callback route** - `254e903` (feat)

## Files Created/Modified

- `app/utils/paytr.server.ts` - verifyCallbackHash, buildPaytrToken (node:crypto)
- `app/utils/paytr.server.test.ts` - unit tests for both functions
- `app/env.server.ts` - optional PAYTR_* env exports
- `.env.example` - PayTR section and Bildirim URL comment
- `.planning/phases/04-buy-vip/VIP_TABLE_SCHEMA.md` - vip_pending, vip schema and CREATE TABLE
- `app/routes/api.vip.paytr-callback._index.tsx` - POST-only action, hash verify, MySQL VIP insert, OK response

## Decisions Made

- Callback returns "OK" for failed payments (status !== "success") so PayTR stops retrying.
- After successful VIP insert, delete the vip_pending row to avoid reuse of the same merchant_oid.

## Deviations from Plan

None - plan executed as written.

## Self-Check: PASSED

- Commits eee2d31, 402cd72, 254e903 exist.
- Files paytr.server.ts, paytr.server.test.ts, api.vip.paytr-callback._index.tsx, VIP_TABLE_SCHEMA.md exist.

## Next Phase Readiness

- Callback URL ready for PayTR panel (Bildirim URL). 04-02 can add VIP page and Bynogame link; 04-03 can add get-token and iframe using buildPaytrToken and vip_pending.

---
*Phase: 04-buy-vip*
*Completed: 2026-03-15*
