---
phase: 04-buy-vip
plan: "03"
subsystem: payments
tags: [paytr, iframe, vip, mysql, react-router]

# Dependency graph
requires:
  - phase: 04-buy-vip
    provides: buildPaytrToken, callback route (04-01); vip-packages, VipPageContent (04-02)
provides:
  - POST /api/vip/paytr-token: validate packageId + email, insert vip_pending, call PayTR get-token, return token
  - VIP page: email input, PayTR CTA, iframe with PayTR script and token URL
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: PayTR get-token server-side (no merchant_key/merchant_salt in POST body); iframeResizer script load in useEffect

key-files:
  created:
    - app/routes/api.vip.paytr-token._index.tsx
  modified:
    - app/components/vip-page-content.tsx

key-decisions:
  - "merchant_ok_url and merchant_fail_url point to /vip?success=1 and /vip?fail=1 (redirect only; order confirmation only in callback)"
  - "Single global email input for PayTR; per-package PayTR button submits packageId + email"

patterns-established:
  - "PayTR get-token: buildPaytrToken server-side, POST form body without secrets; vip_pending insert before token request for callback lookup"

requirements-completed: [VIP-03]

# Metrics
duration: 0min
completed: "2026-03-15"
---

# Phase 4 Plan 03: PayTR get-token and iframe Summary

**PayTR get-token API with vip_pending insert and VIP page iframe flow: token request (no secrets in body), email + package validation, iframeResizer script.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 2
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments

- POST /api/vip/paytr-token: parse packageId + email (JSON or form), validate package in vip-packages and email format, get MySQL pool and PayTR env; insert vip_pending; build paytr_token via buildPaytrToken; POST to PayTR get-token (no merchant_key/merchant_salt in body); return { token } or 502
- VIP page: required email input, "PayTR ile öde" per package; useFetcher POST to /api/vip/paytr-token; on success render iframe (paytr.com/odeme/guvenli/{token}), load iframeResizer.min.js?v2 and call iFrameResize; loading and error states
- Optional: merchant_ok_url / merchant_fail_url in get-token point to /vip?success=1 and /vip?fail=1

## Task Commits

1. **Task 1: PayTR get-token API route and vip_pending insert** - `36d4a21` (feat)
2. **Task 2: VIP page PayTR CTA, token fetch, and iframe** - `fe6e702` (feat)

## Files Created/Modified

- `app/routes/api.vip.paytr-token._index.tsx` - POST action: validate packageId + email, insert vip_pending, buildPaytrToken, POST to PayTR get-token, return token or 502
- `app/components/vip-page-content.tsx` - Email input, PayTR button per package, useFetcher to token API, iframe + iframeResizer on token success

## Decisions Made

- merchant_ok_url and merchant_fail_url built from request URL origin so redirects go to /vip?success=1 and /vip?fail=1; order confirmation remains only in callback (04-01).
- Single email input at top of VIP page; each package "PayTR ile öde" submits that email with package id.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None beyond 04-01 (PayTR env vars, MySQL, vip_pending/vip tables). Local IP (127.0.0.1) may cause PayTR "Geçersiz paytr_token" in dev; use public IP or proxy headers in production.

## Next Phase Readiness

Phase 4 complete. User can purchase VIP on-site via PayTR (token + iframe; callback and VIP insert in 04-01). Ready for Phase 5 (Admin Panel).

## Self-Check: PASSED

- `app/routes/api.vip.paytr-token._index.tsx` — FOUND
- `app/components/vip-page-content.tsx` — modified, FOUND
- Commits 36d4a21, fe6e702 — present in git log

---
*Phase: 04-buy-vip*
*Completed: 2026-03-15*
