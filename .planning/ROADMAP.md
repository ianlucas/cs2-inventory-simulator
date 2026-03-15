# Roadmap: CS2 Server Hub & VIP

## Overview

Deliver the hub and VIP layer in five phases: establish the dual-database foundation (MySQL for VIP/bans/mutes, PostgreSQL unchanged), then add the public server rules page, homepage with live server list and gamedig, Buy VIP page with Bynogame link and PayTR, and finally the admin panel for VIPs, bans, mutes, and server info.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Data (Dual database)** - MySQL for VIP, bans, mutes; PostgreSQL unchanged
 (completed 2026-03-15)
- [x] **Phase 2: Server Rules** - Public server rules page for players (completed 2026-03-15)
- [ ] **Phase 3: Homepage** - Live server list (gamedig), cards, grid/table toggle, player modal
- [ ] **Phase 4: Buy VIP** - VIP info and prices; Bynogame link and PayTR purchase
- [ ] **Phase 5: Admin Panel** - Manage VIPs, bans, mutes, server info (Steam + admin flag)

## Phase Details

### Phase 1: Data (Dual database)
**Goal**: VIP, bans, and mutes are stored in MySQL; existing PostgreSQL usage is unaffected.
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02
**Success Criteria** (what must be TRUE):
  1. VIP, bans, and mutes can be persisted and read from a separate MySQL database
  2. Existing PostgreSQL flows (inventory, users, rules) continue to work unchanged
  3. There is no schema or connection mixing between the two databases
**Plans:** 1/1 plans complete

Plans:
- [x] 01-01-PLAN.md — MySQL connection layer (MYSQL_URL, mysql.server.ts, getMySQLPool, unit tests); Postgres untouched ✓ 01-01-SUMMARY.md

### Phase 2: Server Rules
**Goal**: Users can view a public server rules page.
**Depends on**: Phase 1
**Requirements**: RULES-01
**Success Criteria** (what must be TRUE):
  1. User can open a server rules page from the app
  2. Page displays server rules for players (e.g. no cheating, be respectful)
**Plans:** 1/1 plans complete

Plans:
- [x] 02-01-PLAN.md — Public /rules page (static sections, header+footer links, translation key, route test) ✓ 02-01-SUMMARY.md

### Phase 3: Homepage
**Goal**: Users see a live server list with rich display and player detail.
**Depends on**: Phase 2
**Requirements**: HOME-01, HOME-02, HOME-03, HOME-04
**Success Criteria** (what must be TRUE):
  1. User sees a list of CS2 servers with live data (map, players, etc.) from gamedig
  2. Each server is shown as a vertical card with map background (fixed CS2 map thumbnails) and server data
  3. User can switch between grid and table display for the server list
  4. User can click a server and see a modal with the current player list
**Plans:** 3 plans

Plans:
- [x] 03-01-PLAN.md — Data foundation: servers config, map thumbnails, hide inventory on /, index loader (gamedig) ✓ 03-01-SUMMARY.md
- [x] 03-02-PLAN.md — Server list UI: vertical cards with map background, grid/table toggle (default grid) ✓ 03-02-SUMMARY.md
- [ ] 03-03-PLAN.md — Player modal on card click (resource route + useFetcher, Modal + ModalHeader)

### Phase 4: Buy VIP
**Goal**: Users can view VIP offer and purchase via Bynogame link or PayTR.
**Depends on**: Phase 3
**Requirements**: VIP-01, VIP-02, VIP-03
**Success Criteria** (what must be TRUE):
  1. User can open the Buy VIP page and see VIP information and prices
  2. User can follow a link to Bynogame for external purchase
  3. User can complete a VIP purchase on-site via PayTR integration
**Plans**: TBD

### Phase 5: Admin Panel
**Goal**: Admins can manage VIPs, bans, mutes, and server info using existing Steam auth and admin flag.
**Depends on**: Phase 4
**Requirements**: ADMN-01, ADMN-02, ADMN-03, ADMN-04, ADMN-05
**Success Criteria** (what must be TRUE):
  1. Only users with the admin flag can access the admin panel (Steam auth)
  2. Admin can manage VIPs (view, add, remove or equivalent)
  3. Admin can manage bans
  4. Admin can manage mutes
  5. Admin can view and edit server info
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Data (Dual database) | 0/1 | Complete    | 2026-03-15 |
| 2. Server Rules | 0/0 | Complete    | 2026-03-15 |
| 3. Homepage | 0/0 | Not started | - |
| 4. Buy VIP | 0/0 | Not started | - |
| 5. Admin Panel | 0/0 | Not started | - |
