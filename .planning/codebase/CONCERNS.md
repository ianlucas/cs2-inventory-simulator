# Codebase Concerns

**Analysis Date:** 2025-03-15

## Tech Debt

**Single test file for application logic:**
- Issue: Only `app/components/hooks/use-name-item.test.ts` exists; no tests for routes, API handlers, models, or other hooks
- Why: Likely prioritization of feature work over test coverage
- Impact: Regressions in API, auth, sync, or rules harder to catch; refactors riskier
- Fix approach: Add unit tests for critical utils and hooks; add API/route tests for key endpoints (e.g. inventory, preferences, unlock-case)

**API error handling in one place:**
- Issue: All API actions go through `api()` in `app/api.server.ts`; ZodError vs generic error behavior is centralized but any route not using `api()` would not get the same behavior
- Why: Good centralization; just ensure all action handlers use the wrapper
- Impact: If new actions are added without `api()`, errors may leak or not be consistent
- Fix approach: Document that all API actions must use `api()`; add a lint or convention check if needed

**Rule and env coupling:**
- Issue: Some rules (e.g. steamApiKey, steamCallbackUrl) fall back to env; others are DB-only. Pattern is not uniform across all rules
- Why: Flexibility for deployment (env for secrets, DB for runtime config)
- Impact: Developers must check both Rule model and env.server to understand config
- Fix approach: Keep docs (e.g. docs/rules.md and .env.example) in sync; consider a single “config resolution” doc that lists source per key

## Known Bugs

- No explicit known bugs documented in the repo (no BUGS.md or similar). If you discover recurring issues, add them here.

## Security Considerations

**Secrets in env and rules:**
- Risk: STEAM_API_KEY, SESSION_SECRET, DATABASE_URL in .env; rules can override Steam key from DB
- Current mitigation: .env gitignored; .env.example has no real values; assert() on required env in env.server.ts
- Recommendations: Ensure production uses a secrets manager or secure env; restrict who can change steamApiKey rule if multi-tenant

**API token storage and validation:**
- Risk: API tokens in DB (ApiAuthToken); if leaked, allow access to user data
- Current mitigation: Tokens validated in `is-valid-api-request.server.ts`; tokens are UUIDs
- Recommendations: Token rotation story, scope/expiry if not present; rate limiting on API routes if not already in place

**Steam callback URL:**
- Risk: If steamCallbackUrl is wrong or hijacked, auth could be redirected
- Current mitigation: Rule/config driven; operator must set correct URL
- Recommendations: Validate callback URL format (same origin or allowlist) if possible; document secure configuration

## Performance Bottlenecks

- No specific bottlenecks documented. Potential areas: large inventory JSON in loaders, uncached rule lookups, sync/cache logic. Add measurements (e.g. logging, APM) if issues appear and document here.

## Fragile Areas

**Vite build defines:**
- File: `vite.config.ts`
- Why fragile: Injects `__SPLASH_SCRIPT__` (reads and minifies `app/utils/splash.ts` at build time), `__TRANSLATION_CHECKSUM__` (hashes translations + cs2-lib version), `__SOURCE_COMMIT__` from env
- Common failures: Build fails if splash.ts missing or Node APIs unavailable in build context; checksum changes when translations or cs2-lib version change
- Safe modification: Keep splash and translation paths valid; run build after dependency/translation changes
- Test coverage: No test for build output

**Prisma generate and client path:**
- File: `prisma/schema.prisma` (output to `../app/generated/prisma`)
- Why fragile: App imports from generated code; if generate is skipped, type/runtime errors
- Current mitigation: CI runs `npx prisma generate` before typecheck and build
- Safe modification: Always run `prisma generate` after schema changes; consider generate in postinstall

**Rule-driven feature flags:**
- Files: Various components that read rules (e.g. craft/edit/inventory toggles)
- Why fragile: Behavior depends on DB state and rule names; typos or missing rules could default incorrectly
- Safe modification: Use typed accessors from `app/models/rule.server.ts`; document default behavior in docs/rules.md

## Scaling Limits

- Not explicitly documented. Single Node process; DB connection pool (Prisma); no horizontal scaling details. For high traffic, consider connection pooling, caching (e.g. rules), and load testing.

## Dependencies at Risk

**@ianlucas/* packages:**
- cs2-lib, cs2-lib-inspect, remix-auth-steam are project-specific; upgrades may change item data or auth behavior
- Impact: Breaking changes in cs2-lib could affect inventory/craft logic; remix-auth-steam changes could affect login
- Mitigation: Pin versions or use caret; test after upgrades; watch for changelogs

**React Router 7:**
- Framework is fast-moving; major upgrades may change route/loader/action APIs
- Mitigation: Follow upgrade guides; run full test and manual smoke after upgrading

## Missing Critical Features

- None required for current scope; feature gaps are product decisions (see docs/rules.md for configurable behavior).

## Test Coverage Gaps

**Untested areas:**
- Route loaders and actions (all API and page routes)
- Models: user.server, rule.server, api-auth-token.server
- Middleware: remove-trailing-dots, remove-trailing-slashes, is-valid-api-request
- Utils: inventory, translation, misc, number, promise, shapes
- Sync and Steam strategy
- Most components and hooks (except use-name-item)

**Risk:** Regressions in auth, inventory, crafting, or API behavior may go unnoticed until manual or production testing.

**Priority:** High for payment/auth-adjacent and inventory mutation paths; medium for pure UI hooks.

**Difficulty:** Route/model tests need test DB or mocks; API tests need request/response harness; utils are easier to unit test.

---

*Concerns audit: 2025-03-15*
*Update as issues are fixed or new ones discovered*
