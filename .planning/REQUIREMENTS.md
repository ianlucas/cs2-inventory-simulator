# Requirements: CS2 Server Hub & VIP

**Defined:** 2025-03-15
**Core Value:** Players and admins get one place to see server status, rules, and VIP purchase options; admins can manage VIPs, bans, and mutes without touching the inventory simulator's data or flows.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Homepage

- [ ] **HOME-01**: User can see server list on homepage with live data from gamedig (CS2 servers)
- [ ] **HOME-02**: Server list displays as vertical cards with map background (fixed CS2 map thumbnails) and server data on top
- [ ] **HOME-03**: User can toggle server list display between grid and table style
- [ ] **HOME-04**: User can open a modal showing players on the server by clicking a server card

### Admin Panel

- [ ] **ADMN-01**: Admin can access admin panel using existing Steam auth and admin flag
- [ ] **ADMN-02**: Admin can manage VIPs (view, add, remove or equivalent)
- [ ] **ADMN-03**: Admin can manage bans
- [ ] **ADMN-04**: Admin can manage mutes
- [ ] **ADMN-05**: Admin can view and edit server info

### Server Rules

- [ ] **RULES-01**: User can view a public server rules page showing rules for players (e.g. no cheating, be respectful)

### Buy VIP

- [ ] **VIP-01**: User can view Buy VIP page with VIP information and prices
- [ ] **VIP-02**: User can open Bynogame purchase via external link from Buy VIP page
- [ ] **VIP-03**: User can purchase VIP directly on site via PayTR integration

### Data (Dual Database)

- [x] **DATA-01**: VIP, bans, and mutes are stored in a separate MySQL database
- [x] **DATA-02**: MySQL integration does not affect existing PostgreSQL usage (inventory, users, rules)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

(None defined yet.)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Changing inventory simulator core (craft, edit, settings, rules engine) | Preserve existing app as-is |
| Bynogame API integration | External URL only |
| Separate admin auth system | Reuse Steam + admin flag |
| Custom or admin-uploaded map images for server cards | Fixed CS2 map set only |
| Migrating PostgreSQL data to MySQL | MySQL for game-server data only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Complete (01-01) |
| DATA-02 | Phase 1 | Complete (01-01) |
| RULES-01 | Phase 2 | Pending |
| HOME-01 | Phase 3 | Pending |
| HOME-02 | Phase 3 | Pending |
| HOME-03 | Phase 3 | Pending |
| HOME-04 | Phase 3 | Pending |
| VIP-01 | Phase 4 | Pending |
| VIP-02 | Phase 4 | Pending |
| VIP-03 | Phase 4 | Pending |
| ADMN-01 | Phase 5 | Pending |
| ADMN-02 | Phase 5 | Pending |
| ADMN-03 | Phase 5 | Pending |
| ADMN-04 | Phase 5 | Pending |
| ADMN-05 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0 ✓

---
*Requirements defined: 2025-03-15*
*Last updated: 2025-03-15 after initial definition*
