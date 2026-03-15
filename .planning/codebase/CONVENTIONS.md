# Coding Conventions

**Analysis Date:** 2025-03-15

## Naming Patterns

**Files:**
- kebab-case for all modules: `inventory-item.tsx`, `api.server.ts`, `use-name-item.ts`, `env.server.ts`
- `.server.ts` suffix for server-only code (excluded from client bundle)
- Test files: `*.test.ts` alongside source (e.g. `use-name-item.test.ts`)

**Functions:**
- camelCase: `nameItemFactory`, `upsertUser`, `dispatchAppEvent`
- Async: no special prefix; standard async/await
- Handlers: descriptive names (e.g. `handler` in api wrapper, loader/action in routes)

**Variables:**
- camelCase for variables
- Constants: UPPER_SNAKE_CASE where appropriate (e.g. env keys in docs)
- No underscore prefix for “private” members

**Types:**
- PascalCase for interfaces/types: `UnlockCaseEventData`, `UserSummary`
- No `I` prefix for interfaces

## Code Style

**Formatting:**
- Prettier: `npm run format` (prettier . --write)
- Config: project default (no separate .prettierrc in repo root from scan)
- Line length / quotes: Prettier defaults
- Semicolons: used in codebase
- Indentation: spaces (2)

**Linting:**
- ESLint: `eslint.config.mjs` (flat config)
- Extends: `@eslint/js` recommended, `typescript-eslint` strict
- Custom rules: `no-empty` allowEmptyCatch, `@typescript-eslint/no-unused-vars` caughtErrors "none", `prefer-const` destructuring "all", `@typescript-eslint/no-dynamic-delete` off
- Run: `npm run lint`
- Ignores: `build/`, `.react-router/`

## Import Organization

**Order:**
- External packages first (e.g. react, @ianlucas/*, vitest)
- Internal/alias: `~/` used in tests (e.g. `~/utils/inventory`)
- Relative: `./`, `../` for same app
- Type imports: `import type` where applicable

**Path aliases:**
- `~` used in at least one test for app root (e.g. `~/utils/inventory`); check tsconfig for full alias list

## Error Handling

**Patterns:**
- API actions: Centralized in `app/api.server.ts` — catch, rethrow `Response`, treat ZodError as 400 with doc message, else 500 and `console.error`, return JSON `{ error }`
- Env: `assert(process.env.X, "X must be set")` in `app/env.server.ts`
- Throw errors; let route/framework handle or return Response (redirect/status)

**Error types:**
- No custom error classes observed; Zod for validation errors, generic Error or Response for HTTP

## Logging

**Framework:**
- No dedicated logger; `console.error` in API wrapper for unhandled errors
- No structured logging library in dependencies

**Patterns:**
- Log only in server code (api.server); avoid logging in hot UI paths

## Comments

**When used:**
- Copyright header at top of files: `/*--------------------------------------------------------------------------------------------- ... License.txt ... */`
- Inline comments for non-obvious logic where present
- Docs: `docs/rules.md`, `docs/api.md` for user-facing and API behavior

**JSDoc/TSDoc:**
- Not consistently required; used where helpful (e.g. public helpers)

**TODO:**
- No standard format enforced; use descriptive text if needed

## Function Design

**Size:**
- Functions kept reasonably focused; test file uses describe/it blocks with many small assertions

**Parameters:**
- Destructuring used (e.g. in api wrapper `action(args)`)
- Options objects where many params (e.g. rule getters)

**Return values:**
- Explicit returns; loaders/actions return data or Response/redirect

## Module Design

**Exports:**
- Named exports common (utils, models, api wrapper)
- Default exports for route components (React Router convention)
- Barrel files: `translations/index.ts` re-exports language modules

**Server-only:**
- `.server.ts` ensures code stays server-side; no barrel that re-exports server code to client

---

*Convention analysis: 2025-03-15*
*Update when patterns change*
