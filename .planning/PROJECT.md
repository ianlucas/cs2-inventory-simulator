# CS2 Server Hub & VIP

## What This Is

A CS2 server hub and VIP management layer added to the existing CS2 Inventory Simulator app. The hub provides a new homepage with live server list (via gamedig), server rules page, buy-VIP page (Bynogame link + PayTR integration), and an admin panel to manage VIPs, bans, mutes, and server info. VIP, bans, and mutes data lives in a separate MySQL database; the existing app stays on PostgreSQL. Admins use existing Steam-based auth with an admin flag.

## Core Value

Players and admins get one place to see server status, rules, and VIP purchase options; admins can manage VIPs, bans, and mutes without touching the inventory simulator’s data or flows.

## Requirements

### Validated

<!-- Existing capabilities from codebase. -->

- ✓ Steam sign-in and session — existing
- ✓ Rule-driven app config (branding, limits, feature toggles) — existing
- ✓ User preferences and inventory (PostgreSQL) — existing
- ✓ API with token auth for programmatic access — existing
- ✓ Craft / edit / settings flows and UI — existing
- ✓ Localization (translations) — existing
- ✓ SSR and file-based routes (React Router 7) — existing

### Active

<!-- New scope for this initiative. -->

- [ ] **Homepage:** Server list powered by gamedig; vertical server cards with map background (fixed CS2 map thumbnails) and server data; click opens modal with player list; view toggle for grid and table display
- [ ] **Admin panel:** Manage VIPs, bans, mutes, and server info; access via existing auth + admin flag
- [ ] **Server rules page:** Public page showing server rules for players (e.g. no cheating, be respectful)
- [ ] **Buy VIP page:** VIP info and prices; two CTAs: (1) external Bynogame URL, (2) PayTR integration for direct purchase
- [ ] **MySQL (second DB):** VIP, bans, mutes stored in MySQL; no coupling with existing PostgreSQL/inventory

### Out of Scope

- Changing existing inventory simulator core (craft, edit, settings, rules engine) — preserve as-is
- Bynogame API integration — external URL only
- Admin auth separate from existing app — reuse Steam + admin flag
- Custom or admin-uploaded map images for server cards — fixed CS2 map set only
- Migrating existing PostgreSQL data to MySQL — MySQL is for game-server data only

## Context

- Brownfield: React Router 7, Prisma (PostgreSQL), Remix Auth Steam, Tailwind, `app/routes` + `app/components` + `app/models` (see `.planning/codebase/`).
- New surface: homepage (replacing or alongside current landing), rules page, buy-VIP page, admin panel; new data in MySQL (separate connection, no Prisma schema mixing with existing).
- PayTR: Turkish payment provider; integration will be discovered during implementation phase.
- Gamedig: used to query CS2 servers for live data (players, map, etc.).

## Constraints

- **Dual database:** PostgreSQL unchanged for users, inventory, rules; MySQL for VIP/bans/mutes only — separate connection and tooling (e.g. second client or Prisma datasource).
- **Auth:** Reuse existing Steam auth; add admin role/flag (e.g. in PostgreSQL or config) to gate admin panel.
- **Map assets:** Server card backgrounds use a fixed set of CS2 map thumbnails (CDN or known URLs by map name).
- **Tech stack:** Stay within current stack (TypeScript, React Router 7, Node) for new routes and pages; add only what’s needed (gamedig, MySQL client, PayTR).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Rules page = server rules for players (1A) | Display in-game/server rules on the site | — Pending |
| Admin auth = existing Steam + admin flag | Single sign-in, no separate admin system | — Pending |
| Map backgrounds = fixed CS2 set | No uploads or custom assets for cards | — Pending |
| Bynogame = external URL only | No API; link only | — Pending |
| PayTR = integrate in-app | Direct VIP purchase on buy-VIP page | — Pending |

---
*Last updated: 2025-03-15 after initialization*
