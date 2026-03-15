# Testing Patterns

**Analysis Date:** 2025-03-15

## Test Framework

**Runner:**
- Vitest 4.x
- Config: `vitest.config.ts` (merges with `vite.config.ts`), environment: happy-dom

**Assertion library:**
- Vitest built-in `expect` (describe, test, expect)
- Matchers: `toEqual`, `toBe`, etc.

**Run commands:**
```bash
npm test                    # Run all tests
npm run test -- --watch      # Watch mode (if supported)
npm run test -- path/to/file # Single file
```
No separate coverage script in package.json; use `vitest --coverage` if configured.

## Test File Organization

**Location:**
- Single test file found: `app/components/hooks/use-name-item.test.ts` (alongside source)
- Pattern: `*.test.ts` next to the module under test

**Naming:**
- `use-name-item.test.ts` for hook `use-name-item.ts`
- No integration/e2e suffixes observed

**Structure:**
```
app/components/hooks/
  use-name-item.ts
  use-name-item.test.ts
```

## Test Structure

**Suite organization:**
```typescript
describe("test useNameItem hook", () => {
  test("'default' formatter", () => {
    expect(nameItem(AK47_STOCK_ITEM)).toEqual(["AK-47", ""]);
    // ...
  });
  test("'case-contents-name' formatter", () => { /* ... */ });
  test("'craft-name' formatter", () => { /* ... */ });
  // ...
});
```
- One top-level describe for the unit (hook name)
- Multiple test() blocks per formatter/behavior
- Arrange: constants and helpers (e.g. `createFakeInventoryItem`, `nameItemFactory`)
- Act/assert: call function, expect on return value

**Patterns:**
- Helpers and constants at top of file (e.g. CS2Economy setup, fake items)
- No beforeEach/beforeAll in the single test file; pure functions and inline data

## Mocking

**Framework:**
- Vitest (vi) available; in use-name-item.test.ts no vi.mock used
- Translation injected as function: `const translate = () => "statTrak™";` passed to `nameItemFactory(translate)`

**What is mocked:**
- Translation function to control "statTrak™" string
- Item data via `createFakeInventoryItem` and `CS2Economy.getById` (real lib, no mock)

**What is not mocked:**
- `@ianlucas/cs2-lib` and `@ianlucas/cs2-lib/translations` — real usage
- `~/utils/inventory` and `~/utils/misc` — real usage

## Fixtures and Factories

**Test data:**
- `createFakeInventoryItem(item, overrides)` from `~/utils/inventory` to build inventory items with statTrak/nameTag
- Item IDs from `CS2Economy.getById(...)` (e.g. AK47, Karambit, stickers)
- Helpers: `statTrak()`, `nameTag()`, `statTrakAndnameTag()` wrapping `createFakeInventoryItem`

**Location:**
- In test file; no separate `tests/fixtures/` or `tests/factories/` directory

## Coverage

**Requirements:**
- No coverage threshold or script in package.json
- CI runs `npm run test` (no coverage step in workflow)

**Configuration:**
- Vitest; coverage can be enabled via vitest config (e.g. coverage provider)
- Exclusions: typically build/, node_modules, generated

## Test Types

**Unit tests:**
- Only unit tests observed: hook + formatters with fake items and injected translate
- No integration tests (DB, API) or E2E in repo

**Integration / E2E:**
- Not present; CI runs typecheck, lint, test, build only

## Common Patterns

**Async:**
- Test file uses synchronous tests only; no async/await in the hook test

**Dependencies:**
- Test depends on `@ianlucas/cs2-lib` and app utils; no test doubles for DB or HTTP

**Running tests:**
- `npm test` must run from project root; path alias `~` resolves via Vite/TS config used by Vitest

---

*Testing analysis: 2025-03-15*
*Update when test strategy or tooling changes*
