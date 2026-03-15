# Codebase Structure

**Analysis Date:** 2025-03-15

## Directory Layout

```
cs2-inventory-simulator/
├── app/                    # Application source
│   ├── components/         # React components and hooks
│   ├── generated/           # Generated (Prisma client)
│   ├── middlewares/         # Server middleware
│   ├── models/              # Server-side data/domain
│   ├── routes/              # File-based routes (pages + API)
│   ├── translations/        # Locale files
│   ├── utils/               # Shared utilities
│   ├── api.server.ts        # API action wrapper
│   ├── app.ts               # In-app event bus
│   ├── env.server.ts        # Env validation
│   ├── http.server.ts       # Middleware entry
│   ├── root.tsx / root-seo.ts
│   └── ...
├── prisma/
│   ├── migrations/          # SQL migrations
│   └── schema.prisma       # Schema and client config
├── public/                 # Static assets
├── docs/                   # User/docs (e.g. rules.md)
├── scripts/                # One-off scripts (e.g. translate)
├── .github/workflows/      # CI (ci.yml)
├── package.json
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
├── eslint.config.mjs
└── Dockerfile
```

## Directory Purposes

**app/:**
- Purpose: All app source (routes, components, models, utils)
- Contains: `.ts`, `.tsx`, `.server.ts` modules
- Key files: `root.tsx`, `app.ts`, `api.server.ts`, `env.server.ts`, `http.server.ts`, `steam-strategy.server.ts`, `sync.ts`
- Subdirectories: components, generated, middlewares, models, routes, translations, utils

**app/routes/:**
- Purpose: File-based routes (pages and API)
- Contains: Route modules (`_index`, `api.*`, `craft._index`, `settings._index`, `sign-in.*`, etc.)
- Key files: `_index.tsx`, `api.user.$userId._index.tsx`, `api.inventory.$userId[.]json._index.tsx`, `api.action.*`, `craft._index.tsx`, `settings._index.tsx`
- Naming: Underscore for layout; `$param` for dynamic segments; `[.]json` for format

**app/components/:**
- Purpose: Reusable UI and hooks
- Contains: `.tsx` components, `hooks/` subfolder with hooks and `*.test.ts`
- Key files: inventory-item, item-browser, modal, select, editor-*, unlock-case, hooks/use-name-item, use-sync

**app/models/:**
- Purpose: Server-only data access and domain
- Contains: `*.server.ts` (user, rule, api-auth-token)
- Key files: `user.server.ts`, `rule.server.ts`, `api-auth-token.server.ts`

**app/utils/:**
- Purpose: Pure helpers
- Contains: inventory, translation, number, misc, promise, shapes, splash
- Key files: `inventory.ts`, `translation.ts`, `misc.ts`

**app/translations/:**
- Purpose: Per-language strings
- Contains: `*.ts` (e.g. english, spanish, french, index)

**app/generated/:**
- Purpose: Generated code (Prisma)
- Contains: `prisma/` (client, enums, etc.)
- Source: `prisma generate`; committed or generated in CI

**app/middlewares/:**
- Purpose: Request pipeline
- Contains: `remove-trailing-dots.server.ts`, `remove-trailing-slashes.server.ts`, `is-valid-api-request.server.ts`

**prisma/:**
- Purpose: Schema and migrations
- Contains: `schema.prisma`, `migrations/*.sql`
- Key files: `schema.prisma`

**public/:**
- Purpose: Static assets (images, scripts, etc.)
- Contains: images, scripts (e.g. service-worker.js)

**docs/:**
- Purpose: Documentation (e.g. rules, API)
- Contains: `rules.md`, `api.md`

## Key File Locations

**Entry / app bootstrap:**
- `app/root.tsx` - Root layout
- `app/app.ts` - EventTarget for app events
- `app/http.server.ts` - Middleware entry

**Configuration:**
- `app/env.server.ts` - Env vars (required/optional)
- `vite.config.ts` - Vite + React Router, build defines
- `vitest.config.ts` - Test config
- `tsconfig.json` - TypeScript
- `eslint.config.mjs` - ESLint
- `prisma/schema.prisma` - DB schema

**Core logic:**
- `app/api.server.ts` - API action wrapper (error handling)
- `app/steam-strategy.server.ts` - Steam auth strategy
- `app/sync.ts` - Sync/cache logic
- `app/models/*.server.ts` - User, rules, API auth
- `app/routes/*` - All route handlers and pages

**Testing:**
- `app/components/hooks/use-name-item.test.ts` - Vitest unit test (only test file found)
- `vitest.config.ts` - Test runner config

**Documentation:**
- `docs/rules.md` - Rule reference
- `docs/api.md` - API docs

## Naming Conventions

**Files:**
- kebab-case for most: `inventory-item.tsx`, `api.server.ts`, `use-name-item.ts`
- `.server.ts` suffix for server-only modules
- Route files follow React Router conventions: `_index`, `$param`, `[.]json`

**Components:**
- PascalCase in file names: `InventoryItem.tsx` → component `InventoryItem` (actual files are kebab-case: `inventory-item.tsx`)

**Hooks:**
- `use-*.ts` in `components/hooks/`
- Tests: `*.test.ts` next to source (e.g. `use-name-item.test.ts`)

**Routes:**
- Underscore for layout segments; `$` for params; brackets for optional/format

**Special patterns:**
- `*.server.ts` - Only run on server (no client bundle)
- `api.*` route prefix - API endpoints

## Where to Add New Code

**New page/flow:**
- Route: `app/routes/<name>._index.tsx` or under appropriate layout
- Component: `app/components/` if reusable
- Loader/action in same route file or in shared module

**New API endpoint:**
- Route: `app/routes/api.<resource>.<param?>._index.tsx` (or `.ts`), use `api()` wrapper for actions
- Auth: Use `is-valid-api-request` middleware where token required

**New component/hook:**
- Component: `app/components/<name>.tsx`
- Hook: `app/components/hooks/use-<name>.ts`; test: `use-<name>.test.ts`

**New server-only logic:**
- Model/data: `app/models/<name>.server.ts`
- Util: `app/utils/<name>.ts` if pure; else keep in model or route

**New migration:**
- `prisma migrate dev --name <name>` → new file under `prisma/migrations/`

## Special Directories

**app/generated/:**
- Purpose: Generated Prisma client
- Source: `prisma generate`
- Committed: Typically yes (or generated in CI)

**.react-router/:**
- Purpose: React Router build/typegen output
- Source: Build tooling
- Committed: No (build artifact)

---

*Structure analysis: 2025-03-15*
*Update when directory structure changes*
