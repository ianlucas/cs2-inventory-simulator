# External Integrations

**Analysis Date:** 2025-03-15

## APIs & External Services

**Steam:**
- Steam Web API - User profile/summary for sign-in and avatar
  - SDK/Client: `steamapi` npm package
  - Auth: API key from rule `steamApiKey` (backed by `STEAM_API_KEY` env or DB)
  - Usage: `app/steam-strategy.server.ts` - getUserSummary for upsertUser on login

**No other third-party REST/GraphQL APIs** for business logic; CS2 item data is from `@ianlucas/cs2-lib` (bundled).

## Data Storage

**Databases:**
- PostgreSQL - Primary data store
  - Connection: `DATABASE_URL` env var (required)
  - Client: Prisma ORM 7.x, adapter `@prisma/adapter-pg`
  - Client output: `app/generated/prisma`
  - Migrations: `prisma/migrations/`

**Caching:**
- In-app: `UserCache` model for caching per-user (e.g. inventory/API responses). No Redis.

## Authentication & Identity

**Auth Provider:**
- Steam (OpenID) via Remix Auth
  - Implementation: `@ianlucas/remix-auth-steam`, custom `SteamStrategy` in `app/steam-strategy.server.ts`
  - Callback URL from rule `steamCallbackUrl` (default/env: `STEAM_CALLBACK_URL`)
  - Session: Remix Auth session (cookie-based), user stored in DB via `upsertUser`

**API Auth:**
- API keys in `ApiCredential` / `ApiAuthToken`; tokens used for programmatic access (e.g. `api.user.$userId`, inventory JSON endpoints). Validated by `app/middlewares/is-valid-api-request.server.ts`.

## Monitoring & Observability

**Analytics:**
- Cloudflare Web Analytics - Optional `CLOUDFLARE_ANALYTICS_TOKEN` in env (used in app if set)

**Logs:**
- No dedicated logging service; `console.error` in API error handler (`app/api.server.ts`)

## CI/CD & Deployment

**Hosting:**
- Docker - Image built in GitHub Actions, pushed to GHCR
  - Dockerfile at repo root
  - Build args: `SOURCE_COMMIT`
  - Serve: `react-router-serve ./build/server/index.js`

**CI Pipeline:**
- GitHub Actions - `.github/workflows/ci.yml`
  - On push/PR to main (paths-ignore: `docs/**`): typecheck, lint, test, build
  - Optional: workflow_dispatch with version → Docker build/push, changelog, GitHub release

## Environment Configuration

**Development:**
- Required: `DATABASE_URL`, `SESSION_SECRET`
- Optional: `STEAM_API_KEY`, `STEAM_CALLBACK_URL`, `CLOUDFLARE_ANALYTICS_TOKEN`, `ASSETS_BASE_URL`, `CS2_CSGO_PATH`, `SOURCE_COMMIT`
- Secrets: `.env` (gitignored); `.env.example` documents vars

**Production:**
- Same env vars; set in deployment (e.g. Docker env or host). No vault referenced in code.

## Webhooks & Callbacks

**Incoming:**
- Steam sign-in callback: route under `sign-in/steam/callback` (handled by Remix Auth Steam strategy)

**Outgoing:**
- None

---

*Integration audit: 2025-03-15*
*Update when adding/removing external services*
