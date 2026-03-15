---
phase: 03-homepage
verified: "2026-03-15"
status: passed
score: 9/9 must-haves verified
gaps: []
gaps_resolved:
  - truth: "User can click a server and see a modal with the current player list"
    fix: "Table rows made clickable (onClick + onKeyDown) to set selectedServer and open player modal; toSelectedServer helper added."
human_verification:
  - test: "Load homepage with at least one online server; confirm server list shows live map, players, connect."
    expected: "Cards/table show gamedig data (map name, player count, etc.)."
    why_human: "Requires live CS2 server; automated check cannot run gamedig against real host."
  - test: "Toggle Grid / Table and click a server card in grid; confirm modal opens with player list (or loading/empty)."
    expected: "Modal shows 'Players', loading then list or 'No players'; close button closes modal."
    why_human: "UI flow and modal behavior need visual confirmation."
---

# Phase 3: Homepage Verification Report

**Phase Goal:** Users see a live server list with rich display and player detail.

**Verified:** 2025-03-15  
**Status:** gaps_found  
**Re-verification:** No — initial verification

## Goal Achievement

### Success Criteria (from ROADMAP)

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | User sees a list of CS2 servers with live data (map, players, etc.) from gamedig | ✓ VERIFIED | `_index.tsx` loader uses `GameDig.query({ type: "counterstrike2", ... })`, `Promise.allSettled(SERVER_LIST.map(...))`, returns `{ servers }`; page consumes via `useLoaderData`. |
| 2 | Each server shown as vertical card with map background (fixed CS2 map thumbnails) and server data | ✓ VERIFIED | `server-card.tsx` uses `getMapThumbnailUrl(server.map)`, vertical card with name, map, player count, connect; `map-thumbnails.ts` has fixed map set + fallback. |
| 3 | User can switch between grid and table display | ✓ VERIFIED | `_index.tsx` has `viewMode` state `"grid" \| "table"`, default `"grid"`, Grid/Table toggle buttons; grid renders `ServerCard` list, table renders same data in `<table>`. |
| 4 | User can click a server and see a modal with the current player list | ⚠️ PARTIAL | Grid: `ServerCard` has `onSelect` → sets `selectedServer` → modal opens; `useFetcher().load('/api/servers/players?host=...&port=...')`; modal shows loading/players/empty. **Table:** rows are not clickable; no way to open player modal from table view. |

**Score:** 8/9 (one criterion partially met — modal only from grid)

### Observable Truths (from Plans)

#### Plan 03-01

| Truth | Status | Evidence |
|-------|--------|----------|
| Homepage loader returns server list from gamedig (CS2) | ✓ VERIFIED | Loader imports `GameDig`, `SERVER_LIST`; `Promise.allSettled` with `type: "counterstrike2"`; returns `{ servers }` with fulfilled value or `{ offline: true, host, port }`. |
| Server list source is repo config; map thumbnails have fallback | ✓ VERIFIED | `app/data/servers.ts` exports `SERVER_LIST`; `app/data/map-thumbnails.ts` has `MAP_THUMBNAILS`, `FALLBACK_MAP_THUMBNAIL_URL`, `getMapThumbnailUrl(mapName)`. |
| Root path (/) hides inventory so server list is main content | ✓ VERIFIED | `use-root-layout.ts`: `ROUTES_WITHOUT_INVENTORY = ["/", "/rules"]`; inventory hidden when pathname matches `/`. |

#### Plan 03-02

| Truth | Status | Evidence |
|-------|--------|----------|
| User sees server list as vertical cards with map background and server data | ✓ VERIFIED | `ServerCard` uses `getMapThumbnailUrl(mapName)`, overlay with name, map, players; grid of cards in `_index.tsx`. |
| User can switch between grid and table display; default is grid | ✓ VERIFIED | `viewMode` state default `"grid"`; toggle buttons; grid and table both render same `servers` data. |

#### Plan 03-03

| Truth | Status | Evidence |
|-------|--------|----------|
| User can click a server card and see a modal with the current player list | ⚠️ PARTIAL | Grid cards: `onSelect` → modal + fetcher; API returns `{ players }`; modal shows names or "—", loading/empty. Table: no click → modal. |
| Modal shows player names (with fallback for empty); optional score/duration from raw | ✓ VERIFIED | Modal body: `player.name?.trim() ? player.name : "—"`; empty state "No players"; sorted by name. |
| Modal handles loading and empty states | ✓ VERIFIED | `fetcher.state === "loading"` → "Loading players…"; `sortedPlayers.length === 0` → "No players"; list otherwise. |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/data/servers.ts` | List of servers to query (host, port) | ✓ VERIFIED | Exports `SERVER_LIST: ServerEntry[]`, `ServerEntry { host, port? }`. |
| `app/data/map-thumbnails.ts` | Map name → thumbnail URL + getMapThumbnailUrl with fallback | ✓ VERIFIED | `MAP_THUMBNAILS` record, `FALLBACK_MAP_THUMBNAIL_URL`, `getMapThumbnailUrl(mapName)`. |
| `app/components/hooks/use-root-layout.ts` | Root path hides inventory | ✓ VERIFIED | `ROUTES_WITHOUT_INVENTORY` includes `"/"`. |
| `app/routes/_index.tsx` | Loader gamedig per server, returns { servers }; page grid/table + modal | ✓ VERIFIED | Loader: gamedig, allSettled, returns servers. Page: useLoaderData, viewMode, ServerCard grid, table, Modal, useFetcher for players. |
| `app/components/server-card.tsx` | Vertical card with map background, server name, map, player count | ✓ VERIFIED | getMapThumbnailUrl, overlay, onSelect optional, clickable when onSelect provided. |
| `app/routes/api.servers.players._index.tsx` | GET { players } for host+port query params | ✓ VERIFIED | searchParams host/port, validation, gamedig counterstrike2, Response.json({ players }), 400/503 on error. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `app/routes/_index.tsx` | gamedig | GameDig.query type counterstrike2 | ✓ WIRED | Loader: `gamedig.query({ type: "counterstrike2", host, port })`. |
| `app/routes/_index.tsx` | `app/data/servers.ts` | Import and iterate | ✓ WIRED | `import { SERVER_LIST } from "~/data/servers"`; `SERVER_LIST.map(...)` in loader. |
| `app/components/server-card.tsx` | `app/data/map-thumbnails.ts` | getMapThumbnailUrl(server.map) | ✓ WIRED | `import { getMapThumbnailUrl } from "~/data/map-thumbnails"`; `getMapThumbnailUrl(mapName)` for background. |
| `app/routes/_index.tsx` | loader data | useLoaderData for servers | ✓ WIRED | `const { servers } = useLoaderData<typeof loader>()`; used in grid and table. |
| `app/routes/_index.tsx` | `app/routes/api.servers.players._index.tsx` | useFetcher().load with host&port | ✓ WIRED | `fetcher.load(\`/api/servers/players?host=...&port=...\`)` in useEffect when selectedServer set. |
| `app/routes/api.servers.players._index.tsx` | gamedig | GameDig.query counterstrike2 | ✓ WIRED | `gamedig.query({ type: "counterstrike2", host, port })`; returns state.players. |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| HOME-01 | 03-01 | User can see server list on homepage with live data from gamedig (CS2 servers) | ✓ SATISFIED | Loader runs gamedig per server; page displays list from loader data. |
| HOME-02 | 03-02 | Server list as vertical cards with map background (fixed CS2 map thumbnails) and server data | ✓ SATISFIED | ServerCard + getMapThumbnailUrl; fixed map-thumbnails + fallback. |
| HOME-03 | 03-02 | User can toggle server list between grid and table style | ✓ SATISFIED | viewMode grid/table, toggle buttons, both layouts render. |
| HOME-04 | 03-03 | User can open a modal showing players on the server by clicking a server card | ⚠️ PARTIAL | Satisfied in grid (card click → modal). Not in table (no row click). |

All phase requirement IDs (HOME-01–HOME-04) are accounted for in the plans; no orphaned phase-3 requirements.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | None | — | No TODO/FIXME/placeholder stubs; no empty handlers; loader and API return real data. |

(Comment uses of "placeholder" in _index.tsx and server-card.tsx refer to offline server type, not UI placeholders.)

### Human Verification Required

1. **Live server data**  
   **Test:** Load homepage with at least one online CS2 server in `SERVER_LIST`.  
   **Expected:** Server list shows live map name, player count, connect, ping.  
   **Why human:** Requires real gamedig target; cannot automate against arbitrary host.

2. **Grid → modal flow**  
   **Test:** Grid view → click a server card → modal opens; wait for load; see player list or "No players"; close modal.  
   **Expected:** Modal title "Players", loading then content; close clears modal.  
   **Why human:** UI and fetcher flow need visual confirmation.

3. **Table view and modal (gap)**  
   **Test:** Switch to Table view; click a server row.  
   **Expected (current):** Nothing.  
   **Expected (if gap closed):** Same modal as grid, with that server’s players.

### Gaps Summary

- **One gap:** In table view, users cannot open the player modal. Only grid cards have `onSelect` and set `selectedServer`. Table rows are plain `<tr>` with no click handler.  
- **Fix:** In `app/routes/_index.tsx`, make table body rows clickable (e.g. `onClick` on `<tr>` or on a cell) to set `selectedServer` to that row’s server (host/port) so the same modal and fetcher show that server’s players.

---

_Verified: 2025-03-15_  
_Verifier: Claude (gsd-verifier)_
