# Phase 3: Homepage - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Users see a live server list with rich display and player detail. Server list is powered by gamedig (CS2); vertical cards with map background (fixed CS2 map thumbnails); grid/table toggle; clicking a server opens a modal with the current player list. This phase delivers the homepage experience only — no admin editing of server list or server info (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Homepage placement
- **Server list is the new landing at `/`** — replace the current index route so the main content at `/` is the server list
- Hide inventory on `/` (add `/` or index to the “no inventory” list in `useRootLayout` so the root shows header + server list + footer, no inventory)
- Splash still runs on first load; after that the index route renders the server list as the main content

### Server list source
- **Config file in repo** — list of servers to query (host:port or equivalent) comes from a config file in the project (e.g. JSON or TypeScript in `app/data/` or `config/`), not from env vars or MySQL in this phase
- Phase 5 will add “server info” in the admin panel (likely MySQL); when that exists, the source could be switched later if desired, but for Phase 3 the planner uses a static config file

### Map thumbnails for card backgrounds
- **Data file in app** — map name → thumbnail URL (or path) in a dedicated module (e.g. `app/data/map-thumbnails.ts` or similar)
- Map names come from gamedig response; use a lookup with a **fallback** for unknown maps (e.g. placeholder image or a default CS2 map image)
- Fixed CS2 map set only (no custom uploads; see PROJECT.md)

### Grid/table toggle and default
- **Default view: grid**
- Whether to persist the user’s choice (e.g. localStorage) is left to the planner

### Player modal (what to show and where data comes from)
- **Source of player data:** gamedig (node-gamedig), query type `cs2`. For Valve/Source games, gamedig returns a `state` object that includes:
  - **`players`**: array of objects
  - **`players[].name`**: string (player name; may be empty if unknown)
  - **`players[].raw`**: object — protocol-specific extra data (e.g. score, duration); structure may vary by game/protocol and is not guaranteed stable across gamedig versions
- **Display:** Show at least **player names**. Optionally show **score** and **duration** (or other `raw` fields) if the CS2/Valve protocol exposes them and the planner deems it useful
- **Ordering:** Sort by name by default; alternatively by score if available and desired (planner’s choice)
- **Empty/loading:** Modal should handle “no players” and loading state (e.g. while (re)fetching player list)

### Claude's Discretion
- Exact config file path and format (e.g. `app/data/servers.ts` vs `config/servers.json`), and whether to support both host and optional port per entry
- Map thumbnail fallback asset (placeholder URL or in-repo image)
- Whether to persist grid/table preference (localStorage or not)
- Modal layout and optional use of `players[].raw` (score, duration, etc.) after checking gamedig CS2 response
- Caching/refresh strategy for gamedig queries (e.g. loader cache, revalidation)
- How to add `/` to `ROUTES_WITHOUT_INVENTORY` (or equivalent) so the root route does not show the inventory UI

</decisions>

<specifics>
## Specific Ideas

- Reuse existing `Modal` + `ModalHeader` for the player list modal (see `app/components/modal.tsx`)
- Card styling can follow the rules page panel pattern (e.g. rounded, border, subtle background) for consistency
- Map thumbnails: same pattern as `app/data/backgrounds.ts` (list or map of identifiers to values) but for map name → image URL/path

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- **root.tsx** — Renders Header, Footer, Inventory (when `inventory` true), and `<Outlet />`. Index route content will render in Outlet; add `/` to `ROUTES_WITHOUT_INVENTORY` in `useRootLayout` so inventory is hidden on homepage.
- **useRootLayout** (`app/components/hooks/use-root-layout.ts`) — Currently excludes inventory for `/rules`; add `/` (or the index path) so the server list homepage does not show the inventory.
- **Modal, ModalHeader** (`app/components/modal.tsx`) — Use for the “players on this server” modal; `onClose` or `linkTo` for closing.
- **app/data/backgrounds.ts** — Pattern for a fixed set of options (value list); map thumbnails can follow a similar pattern (map name → URL or path).
- **rules-page-content** — Card/panel styling (rounded-xl, border, bg-stone-900/80, shadow, backdrop-blur) can be echoed for server cards if desired.

### Established Patterns
- Routes: file-based; `_index.tsx` at root of routes = `/`. Replace or extend `app/routes/_index.tsx` so its default export is the server list page component; loader can run gamedig (server-side) and return server list (and optionally per-server player data or a way to fetch it).
- Loaders: run on server; use `middleware(request)`; return data for the page. Gamedig must run server-side (no browser UDP); expose data via loader or a resource route if client needs to refresh.
- Styling: Tailwind; existing dark theme (stone/neutral, white text).

### Integration Points
- **New or modified:** `app/routes/_index.tsx` — server list as main content; loader that reads server config and runs gamedig, returns list (and optionally player data per server or endpoint for modal).
- **New:** Config file for server list (e.g. `app/data/servers.ts` or `config/servers.json`).
- **New:** Map thumbnail mapping (e.g. `app/data/map-thumbnails.ts`).
- **Modify:** `app/components/hooks/use-root-layout.ts` — include `/` in routes that hide inventory.
- Optional: Resource route or loader revalidation for “refresh” or for fetching players when opening modal (if not preloaded).

</code_context>

<deferred>
## Deferred Ideas

- Server list from MySQL or admin-editable config — Phase 5 (admin panel will manage “server info”).
- Custom or user-uploaded map images — out of scope; fixed CS2 set only.

</deferred>

---
*Phase: 03-homepage*
*Context gathered: 2026-03-15*
