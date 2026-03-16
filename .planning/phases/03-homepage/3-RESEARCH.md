# Phase 3: Homepage - Research

**Researched:** 2026-03-15
**Domain:** Server list UI (gamedig CS2, React Router 7 loaders, grid/table + modal)
**Confidence:** HIGH

## Summary

The phase delivers a homepage at `/` showing a live CS2 server list: vertical cards with map backgrounds, grid/table toggle (default grid), and a modal with player list on card click. Server list comes from a repo config file; data is fetched server-side via **gamedig** (Node-only; no browser UDP). Use **React Router 7** loaders for initial server list; use **useFetcher().load()** to fetch player list when opening the modal (or preload players in the index loader). Reuse existing **Modal** + **ModalHeader** and **useRootLayout** (add `/` to `ROUTES_WITHOUT_INVENTORY`). Map thumbnails: fixed data file (map name → URL) with fallback for unknown maps. CS2 often returns empty player names (Valve limitation); UI must handle empty names and loading/empty states.

**Primary recommendation:** Use gamedig type `counterstrike2`, run all queries in loaders or a resource route, and use a single map-thumbnails data module with fallback URL.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Server list is the new landing at `/`; hide inventory on `/` via useRootLayout (add `/` or index to ROUTES_WITHOUT_INVENTORY).
- Config file in repo for server list (not env, not MySQL this phase).
- Map thumbnails: data file in app (map name → URL), fallback for unknown maps; fixed CS2 map set only.
- Default view: grid; grid/table toggle required.
- Player modal: data from gamedig (state.players: name + optional raw); show at least names; handle empty/loading.

### Claude's Discretion
- Exact config file path/format (e.g. app/data/servers.ts vs config/servers.json), host/port per entry.
- Map thumbnail fallback asset (placeholder URL or in-repo image).
- Whether to persist grid/table preference (localStorage or not).
- Modal layout and optional use of players[].raw (score, duration).
- Caching/refresh strategy for gamedig (loader cache, revalidation).
- How to add `/` to ROUTES_WITHOUT_INVENTORY.

### Deferred Ideas (OUT OF SCOPE)
- Server list from MySQL or admin-editable config — Phase 5.
- Custom or user-uploaded map images — fixed CS2 set only.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HOME-01 | User can see server list on homepage with live data from gamedig (CS2 servers) | Use gamedig with type `counterstrike2`; run in index loader (or resource route); server list from config file. |
| HOME-02 | Server list displays as vertical cards with map background (fixed CS2 map thumbnails) and server data on top | Map name → URL in app/data map (e.g. map-thumbnails.ts); fallback for unknown; card styling per rules-page-content (rounded-xl, border, bg-stone-900/80). |
| HOME-03 | User can toggle server list display between grid and table style | Client state (or localStorage); default grid; single list component with two layout modes. |
| HOME-04 | User can open a modal showing players on the server by clicking a server card | Reuse Modal + ModalHeader; useFetcher().load(resourceRoute) or preload players in loader; show players array (name, optional raw); handle empty/loading. |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| gamedig | ^5.x (e.g. 5.3.2) | Query CS2 servers (UDP); returns name, map, players, etc. | De facto Node.js game server query library; 320+ games; Valve protocol built-in. |
| React Router | 7.x (project: ^7.13.1) | Loaders, useFetcher, routes | Already in use; loaders run server-side; fetcher.load() for modal data without navigation. |
| Tailwind | 4.x (project) | Card/table/modal styling | Project standard; dark theme (stone/neutral). |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Modal/ModalHeader | existing | Player list modal | Reuse from app/components/modal.tsx; onClose or linkTo. |
| useRootLayout | existing | Hide inventory on `/` | Add `/` to ROUTES_WITHOUT_INVENTORY. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| gamedig | Custom UDP client | Don't: protocol and game-specific logic; gamedig handles Valve A2S. |
| Loader + fetcher | Only loader with all players | Preloading all players increases latency and payload; fetcher on modal open keeps index fast. |

**Installation:**
```bash
npm install gamedig
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── data/
│   ├── servers.ts (or config/servers.json)   # Server list config
│   └── map-thumbnails.ts                      # map name → thumbnail URL + fallback
├── routes/
│   ├── _index.tsx                             # Server list page; loader runs gamedig
│   └── api.servers.$host.$port.players.ts (optional)  # Resource route for player fetch
├── components/
│   ├── hooks/use-root-layout.ts               # Add "/" to ROUTES_WITHOUT_INVENTORY
│   └── modal.tsx                              # Reuse Modal, ModalHeader
```

### Pattern 1: Gamedig query (server-side only)
**What:** Call GameDig.query() in a loader or API route. Never in browser.
**When to use:** Any time you need server list or per-server state.
**Example:**
```typescript
// Source: gamedig README + GAMES_LIST.md
import { GameDig } from "gamedig";

const gamedig = new GameDig();
const state = await gamedig.query({
  type: "counterstrike2",  // CS2 game id in GAMES_LIST.md
  host: "127.0.0.1",
  port: 27015,             // optional; default game port used if omitted
});
// state: { name, map, password, numplayers, maxplayers, players: [{ name, raw }, ...], connect, ping, ... }
```

### Pattern 2: Index loader returns server list
**What:** Load server config, run gamedig for each (or in parallel), return array of results; handle per-server errors (e.g. offline) so one failure doesn’t break the list.
**When to use:** Initial homepage load.
**Example:**
```typescript
// Source: React Router 7 docs + project routes
import type { Route } from "./+types/_index";
import { middleware } from "~/http.server";

export async function loader({ request }: Route.LoaderArgs) {
  await middleware(request);
  const servers = getServerListFromConfig(); // from app/data/servers
  const results = await Promise.allSettled(
    servers.map((s) => gamedig.query({ type: "counterstrike2", host: s.host, port: s.port }))
  );
  return { servers: results.map((r) => r.status === "fulfilled" ? r.value : null) };
}
```

### Pattern 3: useFetcher for modal player list (no navigation)
**What:** When user opens modal, call fetcher.load("/api/servers/:host/:port/players") (or similar). Loader runs gamedig for that server and returns { players }. Show fetcher.data / fetcher.state in modal.
**When to use:** When you don’t want to preload all players in the index loader.
**Example:**
```typescript
// Source: React Router 7 useFetcher API
import { useFetcher } from "react-router";

const fetcher = useFetcher();
// On card click: fetcher.load(`/api/servers/${host}/${port}/players`);
// fetcher.state === "loading" | "idle"; fetcher.data === { players: [...] }
```

### Pattern 4: Hide inventory on homepage
**What:** useRootLayout checks pathname; if it’s in ROUTES_WITHOUT_INVENTORY, inventory is false. Add `/` so root path hides inventory.
**When to use:** Homepage at `/` must not show inventory.
**Example:**
```typescript
// Existing: app/components/hooks/use-root-layout.ts
const ROUTES_WITHOUT_INVENTORY = ["/rules"] as const;
// Add "/" so index route has no inventory:
const ROUTES_WITHOUT_INVENTORY = ["/", "/rules"] as const;
// pathname === "/" is already covered by pathname === path for "/"
```

### Anti-Patterns to Avoid
- **Running gamedig in the browser:** UDP and Node APIs; use only in loaders or resource routes.
- **Assuming CS2 player names are always present:** They are often empty; show "—" or "Unknown" and still show count.
- **Blocking entire server list on one failing server:** Use Promise.allSettled and show failed servers as offline or omit.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Game server query (UDP, Valve A2S) | Custom UDP client / protocol parser | gamedig | Protocol and game-specific; 320+ games; maintained. |
| Modal overlay + header + close | Custom modal component | Existing Modal + ModalHeader | Already in codebase; consistent UX. |
| Map name → image URL | Ad-hoc conditionals | Data file (map name → URL) + fallback key | Same pattern as app/data/backgrounds.ts; one place to add maps. |

**Key insight:** Game query protocols are UDP-based and differ per game; gamedig encapsulates this. Modal and map lookup are already solved in-project.

## Common Pitfalls

### Pitfall 1: Gamedig in the browser
**What goes wrong:** Build or runtime errors; "UDP not available" or similar.
**Why it happens:** gamedig uses Node dgram/net; it cannot run in the browser.
**How to avoid:** Only import and call gamedig in server-side code (loaders, resource routes). Never in components or client-only modules.
**Warning signs:** Import of "gamedig" in a file that ends up in client bundle.

### Pitfall 2: CS2 player names empty
**What goes wrong:** Modal shows correct count but names are blank.
**Why it happens:** CS2 often does not expose player names via the query protocol (GAMES_LIST.md); a server plugin can fix it.
**How to avoid:** Always handle empty `player.name` in UI (e.g. "—" or "Unknown"); don’t assume names exist.
**Warning signs:** UI that only shows player.name with no fallback.

### Pitfall 3: UDP/firewall blocking responses
**What goes wrong:** Queries time out in Docker, Replit, or some VPSs.
**Why it happens:** Outbound UDP may be blocked or not routable back.
**How to avoid:** Run in an environment that allows UDP (e.g. host network in Docker); document for deploy; optionally use listenUdpPort if a single port is forwarded.
**Warning signs:** All servers show "offline" or timeouts in certain hosts.

### Pitfall 4: Wrong game type
**What goes wrong:** Query fails or returns wrong format.
**Why it happens:** Game id changed in gamedig v5 (e.g. csgo vs counterstrike2).
**How to avoid:** Use type `counterstrike2` for CS2 (from GAMES_LIST.md).
**Warning signs:** type "cs2" or "csgo" when targeting CS2 servers.

## Code Examples

### Gamedig query (CS2)
```typescript
// Source: gamedig README, GAMES_LIST.md
import { GameDig } from "gamedig";

const gamedig = new GameDig();
const state = await gamedig.query({
  type: "counterstrike2",
  host: "192.168.1.1",
  port: 27015,  // optional
});
// state.players: Array<{ name: string; raw: Record<string, unknown> }>
// state.map, state.name, state.numplayers, state.maxplayers, state.connect, state.ping
```

### Loader with Route types (project style)
```typescript
// Source: app/routes/rules._index.tsx, React Router 7
import type { Route } from "./+types/_index";
import { middleware } from "~/http.server";

export async function loader({ request }: Route.LoaderArgs) {
  await middleware(request);
  return { servers: [...] };
}

export default function Index() {
  const { servers } = useLoaderData<typeof loader>();
  return ( ... );
}
```

### Modal with ModalHeader (existing)
```typescript
// Source: app/components/modal.tsx
import { Modal, ModalHeader } from "~/components/modal";

<Modal hidden={!open} blur onClose={...}>
  <ModalHeader title="Players" onClose={() => setOpen(false)} />
  <div>{/* player list */}</div>
</Modal>
```

### Map thumbnail lookup with fallback
```typescript
// Pattern: app/data/backgrounds.ts → map name → URL
// In map-thumbnails.ts:
const MAP_THUMBNAILS: Record<string, string> = { de_dust2: "/maps/dust2.jpg", ... };
const FALLBACK_URL = "/maps/unknown.jpg";
export function getMapThumbnailUrl(mapName: string): string {
  return MAP_THUMBNAILS[mapName] ?? FALLBACK_URL;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Remix loaders | React Router 7 loaders (same API) | RR7 | Use same loader/useLoaderData; types from +types. |
| type "csgo" for CS2 | type "counterstrike2" for CS2 | gamedig v5 GAMES_LIST | Use counterstrike2 for CS2 servers. |

**Deprecated/outdated:**
- Using gamedig in browser bundles: still not supported; server-only.

## Open Questions

1. **Resource route vs preload in index loader for players**
   - What we know: useFetcher().load(href) calls a loader without navigation; index loader can return all servers and optionally include players.
   - What's unclear: Whether to add a dedicated resource route (e.g. api.servers.$host.$port.players) or embed players in index response (larger payload, simpler).
   - Recommendation: Prefer resource route + fetcher.load() when modal opens to keep index response smaller and avoid long waits for many servers.

2. **CS2 player raw fields (score, duration)**
   - What we know: state.players[].raw is protocol-specific and may change; CONTEXT allows optional use.
   - What's unclear: Exact CS2/Valve keys in raw.
   - Recommendation: In modal, show name (with fallback); if raw has score/duration and is stable in testing, show in a second column; otherwise name-only is sufficient for HOME-04.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|--------|
| Framework | Vitest ^4.x |
| Config file | vitest.config.ts (mergeConfig with vite.config) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test -- --run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HOME-01 | Server list from gamedig on homepage | integration/unit | Loader or server-list component test with mocked gamedig | ❌ Wave 0 |
| HOME-02 | Cards show map background + server data | unit | Component test: card has map image + name/map text | ❌ Wave 0 |
| HOME-03 | Toggle grid/table | unit | Component test: toggle changes layout class or structure | ❌ Wave 0 |
| HOME-04 | Modal shows players on card click | unit | Component test: click opens modal, shows player list or empty state | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run app/routes/_index app/components/*server* app/data/map-thumbnails app/data/servers`
- **Per wave merge:** `npm test -- --run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Tests for index loader or server-list component (mock gamedig) — covers HOME-01
- [ ] Tests for server card (map background + data) — covers HOME-02
- [ ] Tests for grid/table toggle — covers HOME-03
- [ ] Tests for player modal (open, list/empty, loading) — covers HOME-04
- [ ] Optional: shared test fixture for gamedig state shape

*(Existing: vitest.config.ts, happy-dom, exclude .react-router; rules-page-content.test.tsx and server-rules.test.ts as patterns.)*

## Sources

### Primary (HIGH confidence)
- gamedig README (GitHub raw) — query API, options, response shape, server-side only, Valve requestPlayers
- gamedig GAMES_LIST.md — counterstrike2 id, CS2 note (no player names by default)
- React Router 7 (websites/reactrouter) — loader, Route.LoaderArgs, useFetcher, load without navigation

### Secondary (MEDIUM confidence)
- Project: use-root-layout.ts, modal.tsx, rules._index.tsx, rules-page-content.tsx, backgrounds.ts — patterns and reuse

### Tertiary (LOW confidence)
- Web search: CS2 player names blank (issue #387) — consistent with GAMES_LIST note

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — gamedig README + project deps; React Router 7 and Modal in codebase
- Architecture: HIGH — loader/fetcher and ROUTES_WITHOUT_INVENTORY patterns verified in project
- Pitfalls: HIGH — gamedig docs and GAMES_LIST.md describe server-only, CS2 names, type counterstrike2

**Research date:** 2026-03-15
**Valid until:** ~30 days (gamedig and React Router stable)
