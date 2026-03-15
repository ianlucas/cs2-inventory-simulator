---
phase: 04-buy-vip
plan: 02
subsystem: ui
tags: [vip, remix, react, tailwind, bynogame, env]

# Dependency graph
requires: []
provides:
  - VIP packages data (1/3/6 month, TRY prices)
  - BYNOGAME_VIP_URL optional env for external purchase link
  - GET /vip route with loader and VipPageContent
  - Header and footer links to /vip with HeaderVipLabel
affects: [04-03 PayTR]

# Tech tracking
tech-stack:
  added: []
  patterns: [loader returns packages + bynogameUrl, rules-page-style cards]

key-files:
  created: [app/data/vip-packages.ts, app/routes/vip._index.tsx, app/components/vip-page-content.tsx]
  modified: [app/env.server.ts, .env.example, app/components/header.tsx, app/components/footer.tsx, app/translations/*.ts]

key-decisions:
  - "VIP label 'VIP' in all locales; Bynogame link only when BYNOGAME_VIP_URL set"
  - "PayTR CTA placeholder (disabled) for 04-03 wiring"

patterns-established:
  - "VIP page mirrors rules page: meta getMetaTitle(HeaderVipLabel), loader + middleware, content component with stone-900/80 cards"

requirements-completed: [VIP-01, VIP-02]

# Metrics
duration: 0min
completed: "2026-03-15"
---

# Phase 04 Plan 02: Buy VIP (data, route, nav) Summary

**VIP packages (1/3/6 month, TRY), optional Bynogame URL env, /vip page with intro and package cards, header/footer VIP link and HeaderVipLabel in all locales.**

## Performance

- **Duration:** short
- **Tasks:** 3
- **Files modified:** 36 (3 new, 33 modified)

## Accomplishments

- `app/data/vip-packages.ts`: VipPackage type, vipPackages array (1 Ay / 3 Ay / 6 Ay, 99/249/449 ₺), vipBenefitsText
- `app/env.server.ts`: BYNOGAME_VIP_URL optional; `.env.example` documented
- `app/routes/vip._index.tsx`: meta = getMetaTitle("HeaderVipLabel"), loader returns { packages, bynogameUrl }, default export uses VipPageContent
- `app/components/vip-page-content.tsx`: Turkish intro, package cards with price in TRY, "Bynogame'da al" link (target=_blank, rel=noopener when bynogameUrl set), "PayTR ile öde (Yakında)" disabled placeholder
- Header: HeaderLink to="/vip" with faCrown and HeaderVipLabel (signed-in and signed-out)
- Footer: Link to="/vip" with HeaderVipLabel after Rules
- HeaderVipLabel added to english, turkish, and all 27 other locales that have HeaderRulesLabel

## Task Commits

1. **Task 1: VIP packages data and Bynogame env** - `413db49` (feat)
2. **Task 2: /vip route and VIP page content** - `79647e6` (feat)
3. **Task 3: Header and footer link; HeaderVipLabel** - `7a9fd8b` (feat)

## Files Created/Modified

- `app/data/vip-packages.ts` - VipPackage type, vipPackages, vipBenefitsText
- `app/env.server.ts` - BYNOGAME_VIP_URL export
- `.env.example` - BYNOGAME_VIP_URL comment
- `app/routes/vip._index.tsx` - VIP route with loader and VipPageContent
- `app/components/vip-page-content.tsx` - VIP intro, package cards, Bynogame link, PayTR placeholder
- `app/components/header.tsx` - HeaderLink to /vip (faCrown, HeaderVipLabel)
- `app/components/footer.tsx` - Link to /vip with HeaderVipLabel
- `app/translations/english.ts`, `turkish.ts`, and 26 other locale files - HeaderVipLabel: "VIP"

## Decisions Made

- Used "VIP" for HeaderVipLabel in all locales (no localized "Buy VIP" per-locale).
- Bynogame link only rendered when bynogameUrl is set; PayTR button disabled with "Yakında" for 04-03.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - BYNOGAME_VIP_URL is optional; set in .env if Bynogame purchase link is used.

## Next Phase Readiness

- 04-03 can wire PayTR iframe/flow to the "PayTR ile öde" CTA.
- Bynogame link works when BYNOGAME_VIP_URL is set.

## Self-Check: PASSED

- app/data/vip-packages.ts: present
- app/routes/vip._index.tsx: present
- app/components/vip-page-content.tsx: present
- Commits 413db49, 79647e6, 7a9fd8b: recorded in Task Commits

---
*Phase: 04-buy-vip*
*Completed: 2026-03-15*
