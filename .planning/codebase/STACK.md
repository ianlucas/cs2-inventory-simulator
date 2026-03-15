# Technology Stack

**Analysis Date:** 2025-03-15

## Languages

**Primary:**
- TypeScript 5.9 - All application code, configs, and tooling

**Secondary:**
- SQL - Prisma migrations in `prisma/migrations/`

## Runtime

**Environment:**
- Node.js >= 20.0.0 (from `package.json` engines)
- Browser runtime for React UI

**Package Manager:**
- npm (lockfile: `package-lock.json`)

## Frameworks

**Core:**
- React Router 7.x - Full-stack framework (routes, loaders, actions, SSR)
- React 19.x - UI
- Vite 7.x - Build and dev server (via `@react-router/dev`)

**Testing:**
- Vitest 4.x - Unit tests
- happy-dom - DOM environment for tests

**Build/Dev:**
- TypeScript 5.9 - Compilation
- vite-tsconfig-paths - Path resolution
- Tailwind CSS 4.x - Styling (PostCSS)

## Key Dependencies

**Critical:**
- `@ianlucas/cs2-lib` ^7.24 - CS2 item/economy data and logic
- `@ianlucas/cs2-lib-inspect` ^5.0 - Inspect links
- `@ianlucas/remix-auth-steam` ^7.0 - Steam OAuth
- `@prisma/client` ^7.5 - Database ORM
- `prisma` ^7.5 - Migrations and schema
- `remix-auth` ^4.2 - Auth session handling
- `steamapi` ^3.1 - Steam API client
- `zod` ^4.3 - Schema validation

**UI/UX:**
- `@floating-ui/react` - Tooltips/popovers
- `@fortawesome/*` - Icons
- `clsx` - Class names
- `country-flag-icons` - Locale flags
- `lz-string` - Compression (e.g. inventory state)

**Infrastructure:**
- `dotenv` - Env loading
- `isbot` - Bot detection
- `hash-object` - Hashing
- `react-router`, `@react-router/fs-routes`, `@react-router/node`, `@react-router/serve` - Routing and server

## Configuration

**Environment:**
- `.env` (gitignored), `.env.example` - Required: `DATABASE_URL`, `SESSION_SECRET`. Optional: `STEAM_API_KEY`, `STEAM_CALLBACK_URL`, `CLOUDFLARE_ANALYTICS_TOKEN`, `ASSETS_BASE_URL`
- Env asserted in `app/env.server.ts`

**Build:**
- `vite.config.ts` - Vite + React Router plugin, defines `__SPLASH_SCRIPT__`, `__TRANSLATION_CHECKSUM__`, `__SOURCE_COMMIT__`
- `vitest.config.ts` - Merges Vite config, happy-dom
- `tsconfig.json` - TypeScript
- `prisma/schema.prisma` - DB schema, client output to `app/generated/prisma`

## Platform Requirements

**Development:**
- Node >= 20, PostgreSQL (for DB)
- Optional: Steam API key for sign-in

**Production:**
- Docker image built in CI (`Dockerfile`), served via `react-router-serve`
- CI: GitHub Actions (typecheck, lint, test, build; optional Docker push and release)

---

*Stack analysis: 2025-03-15*
*Update after major dependency changes*
