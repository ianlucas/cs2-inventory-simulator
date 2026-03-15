# Architecture

**Analysis Date:** 2025-03-15

## Pattern Overview

**Overall:** Full-stack React Router 7 app with file-based routes, server loaders/actions, and rule-driven configuration.

**Key Characteristics:**
- Single deployable (Node server with SSR and API routes)
- Route-centric: pages and API endpoints are routes under `app/routes/`
- Server-only modules use `.server.ts` suffix (e.g. `env.server.ts`, `api.server.ts`)
- Rules stored in DB drive feature flags and config (Steam keys, inventory limits, craft/edit visibility)
- Event-driven in-app: `app/app.ts` exposes `EventTarget` for cross-component events (e.g. unlock case)

## Layers

**Route layer:**
- Purpose: HTTP entry points, loaders (data), actions (mutations), and page components
- Contains: Route modules in `app/routes/` (e.g. `_index.tsx`, `api.*`, `craft._index.tsx`, `settings._index.tsx`)
- Depends on: models, utils, components
- Used by: Browser and API clients

**Model / server layer:**
- Purpose: Data access and server-only business logic
- Contains: `app/models/*.server.ts` (user, rule, api-auth-token), Prisma client in `app/generated/prisma`
- Depends on: env, Prisma schema
- Used by: Loaders, actions, strategies

**Component layer:**
- Purpose: Reusable UI and hooks
- Contains: `app/components/` (React components), `app/components/hooks/` (e.g. use-name-item, use-sync)
- Depends on: utils, translations, cs2-lib for item display
- Used by: Routes and other components

**Utility layer:**
- Purpose: Pure helpers and shared logic
- Contains: `app/utils/` (inventory, translation, number, misc, promise, shapes, splash)
- Depends on: Minimal (cs2-lib where needed)
- Used by: Components, routes, models

**Middleware:**
- Purpose: Request preprocessing
- Contains: `app/http.server.ts` (or equivalent middleware entry), `app/middlewares/` (remove-trailing-dots, remove-trailing-slashes), API validation in `is-valid-api-request.server.ts`
- Depends on: Request/response
- Used by: Framework before route handlers

## Data Flow

**Page request (SSR):**
1. Request hits server
2. Middleware runs (trailing dots/slashes)
3. React Router matches route
4. Loader runs (server), fetches data (e.g. user, rules, inventory)
5. Component tree rendered with loader data
6. HTML (and hydration payload) sent to client

**Action (mutation):**
1. Form submit or fetch to action URL
2. Action runs on server (e.g. update preferences, add item, unlock case)
3. Returns redirect or data; client revalidates loaders as needed

**API (programmatic):**
1. Request to `api.*` routes with API token (e.g. `api/user/$userId`, `api/inventory/$userId.json`)
2. `is-valid-api-request.server.ts` validates token
3. Route handler returns JSON

**State management:**
- Server: DB (PostgreSQL via Prisma); session for auth
- Client: React state, loaders/actions for server state; optional local/cache (e.g. `UserCache` for offline/cached inventory)
- In-app events: `app/app.ts` `EventTarget` for UI coordination (e.g. unlock case)

## Key Abstractions

**api():**
- Purpose: Wrap route actions with try/catch, standard error response (Zod vs generic), logging
- Location: `app/api.server.ts`
- Pattern: Higher-order function returning async handler

**Rule model:**
- Purpose: Key-value config with optional user/group overrides (`Rule`, `UserRule`, `GroupRule`)
- Location: `app/models/rule.server.ts`
- Used for: steamApiKey, steamCallbackUrl, inventory limits, craft/edit toggles, app branding

**SteamStrategy:**
- Purpose: Remix Auth strategy for Steam OpenID; fetches user summary and upserts user
- Location: `app/steam-strategy.server.ts`
- Depends on: `steamApiKey`, `steamCallbackUrl` rules, `upsertUser`

**Sync / cache:**
- Purpose: Sync user inventory with external source and cache; `UserCache` for storing response per user/url
- Location: `app/sync.ts`, cache in models

## Entry Points

**Web server:**
- Location: React Router server entry (build output); `npm run start` runs `react-router-serve ./build/server/index.js`
- Triggers: HTTP requests
- Responsibilities: Serve routes, run loaders/actions, middleware

**Dev server:**
- `npm run dev` → React Router dev (Vite)
- Port 3000 (from `vite.config.ts`)

**API routes:**
- Under `app/routes/api.*` — e.g. `api.user.$userId._index`, `api.inventory.$userId[.]json`, `api.action.*`
- Triggered by fetch/form from client or external API clients with token

## Error Handling

**Strategy:** Centralized in `api()` wrapper; otherwise throw and let framework or route handle.

**Patterns:**
- In `api()`: catch errors; if `Response`, rethrow; if ZodError, 400 with doc message; else 500 and `console.error`, return JSON `{ error }`
- Route loaders/actions: can throw Response (e.g. redirect, 404)
- Validation: Zod at API boundaries

## Cross-Cutting Concerns

**Validation:** Zod for request/body validation where used.

**Auth:** Remix Auth with Steam strategy; session in cookie. API routes use token from `ApiAuthToken` validated by middleware.

**Localization:** `app/translations/` (per-language modules), `app/utils/translation.ts`; checksum in build for cache busting.

**Config:** Env in `app/env.server.ts`; runtime config from Rule model (and optional env fallbacks).

---

*Architecture analysis: 2025-03-15*
*Update when major patterns change*
