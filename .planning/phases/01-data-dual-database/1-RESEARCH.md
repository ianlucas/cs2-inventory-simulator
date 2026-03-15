# Phase 1: Data (Dual database) - Research

**Researched:** 2025-03-15
**Domain:** Node.js dual database (PostgreSQL + MySQL), mysql2 client, connection pooling, coexistence with Prisma
**Confidence:** HIGH

## Summary

The phase adds a second database client (MySQL) alongside the existing Prisma/PostgreSQL setup. The established pattern is: **one pool per database, singleton per process, separate modules**. Use `mysql2` with its **promise API** (`mysql2/promise`) and **createPool** with a single `MYSQL_URL`; do not use Prisma for MySQL. Reuse the app’s existing singleton pattern (as in `app/db.server.ts`) so the MySQL pool is created once and reused. Keep MySQL behind a dedicated server-only module (e.g. `app/mysql.server.ts` or `app/db-mysql.server.ts`) so loaders/actions import a single getter; do not mix MySQL and Prisma in the same file. Make `MYSQL_URL` **optional** at startup and create the pool lazily (or only when hub features are used) so the app can run without MySQL when the hub is disabled.

**Primary recommendation:** Use `mysql2/promise` with `createPool(MYSQL_URL)` in a singleton, server-only module; expose a getter (e.g. `getMySQLPool()`) that returns the pool or null when `MYSQL_URL` is unset. Do not hand-roll pooling, URL parsing, or reconnection logic.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Use **existing** MySQL database — connect to an existing DB; do not define or migrate VIP/bans/mutes tables in this project.
- Use a **separate** MySQL client (e.g. `mysql2`), not a second Prisma datasource. Prisma remains PostgreSQL-only.
- Single URL env var: **`MYSQL_URL`**. Add to `app/env.server.ts` (or equivalent) and document in `.env.example`.
- MySQL is used by the **same Node app** — dual connection in one process; no separate service.

### Claude's Discretion
- Exact env validation (assert vs optional MYSQL_URL).
- Connection pooling and lifecycle (singleton vs per-request, disconnect behavior).
- Module layout for MySQL client (e.g. `app/mysql.server.ts` or `app/db-mysql.server.ts`).
- How to expose the client to loaders/actions (exported singleton or factory).

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope (dual DB setup only).

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-01 | VIP, bans, and mutes are stored in a separate MySQL database | mysql2 pool in dedicated module; app reads/writes via that pool to existing schema. No migrations in repo. |
| DATA-02 | MySQL integration does not affect existing PostgreSQL usage (inventory, users, rules) | Separate module and env var; no changes to `app/db.server.ts` or Prisma; existing imports of `prisma` remain unchanged. |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| mysql2 | ^3.x (current) | MySQL client with Promise API and connection pooling | De facto Node MySQL driver; supports URL, pool, prepared statements, no ORM required. |

### Supporting
| Library | Purpose | When to Use |
|---------|---------|-------------|
| Existing `app/singleton.server.ts` | One pool instance per process | Reuse for MySQL pool so it matches Prisma singleton pattern. |
| Existing `app/env.server.ts` | Central env validation | Add `MYSQL_URL` (optional read, no assert at startup). |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| mysql2 | Prisma MySQL datasource | Locked out: Prisma stays Postgres-only; separate client required. |
| mysql2 | mysql (mysqljs) | mysql2 is faster, Promise-native, maintained; mysql is callback-first. |

**Installation:**
```bash
npm install mysql2
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── db.server.ts          # Existing: Prisma + Postgres singleton (unchanged)
├── env.server.ts         # Add MYSQL_URL (optional)
├── mysql.server.ts       # New: MySQL pool singleton, getMySQLPool() or similar
├── singleton.server.ts   # Existing: reuse for MySQL pool
└── models/               # Future: VIP/bans/mutes accessors import from mysql.server
```

### Pattern 1: Singleton pool with optional URL
**What:** One pool per process, created lazily when `MYSQL_URL` is set; expose a getter that returns the pool or null.
**When to use:** Same Node app holding both Postgres and MySQL; hub may be disabled (no MySQL).
**Example:**
```typescript
// app/mysql.server.ts — server-only
import mysql from "mysql2/promise";
import { singleton } from "~/singleton.server";

function getMySQLPool() {
  const url = process.env.MYSQL_URL;
  if (!url) return null;
  return singleton("mysql-pool", () => mysql.createPool(url));
}

export { getMySQLPool };
```
Callers check `getMySQLPool()` for null before running MySQL queries.

### Pattern 2: Use pool.query() for simple queries
**What:** For single statements, use `pool.query(sql, values)` so the pool manages acquire/release.
**When to use:** Single SELECT/INSERT/UPDATE/DELETE per request.
**Example:**
```typescript
// Source: node-mysql2 docs (createPool + promise API)
const pool = getMySQLPool();
if (pool) {
  const [rows] = await pool.query("SELECT * FROM vip WHERE steam_id = ?", [steamId]);
}
```

### Pattern 3: getConnection() + release() for transactions or multi-statement work
**What:** Acquire a connection, run multiple statements or a transaction, then always release.
**When to use:** Transactions or multiple queries that must run on the same connection.
**Example:**
```typescript
const pool = getMySQLPool();
if (!pool) return;
const conn = await pool.getConnection();
try {
  await conn.execute("INSERT INTO bans ...", [/* values */]);
  await conn.execute("INSERT INTO audit_log ...", [/* values */]);
} finally {
  conn.release();
}
```

### Anti-Patterns to Avoid
- **Per-request pools:** Do not create a new pool per request; use one singleton pool (same as Prisma).
- **Mixing Prisma and MySQL in one module:** Keep `db.server.ts` Postgres-only; MySQL in a separate `.server.ts` module.
- **Asserting MYSQL_URL at startup:** If hub can be disabled, make MYSQL_URL optional and lazy-init the pool (or skip creation when absent).
- **Importing MySQL client from non-.server code:** Only load `mysql.server.ts` (or equivalent) from server context (loaders, actions, server routines) so the client never lands in the client bundle.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Connection pooling | Custom pool or per-request connections | `mysql2/promise` `createPool()` | Pool reuse, backpressure, and limits are built in. |
| URL parsing | Manual parse of MYSQL_URL | `createPool(MYSQL_URL)` (string) | mysql2 accepts URI format; no need for a separate parser. |
| Reconnection / backoff | Custom retry logic for connections | Pool's default behavior | Pool creates new connections as needed; avoid layering custom retry unless required. |
| Promise API | Wrapping callbacks | `mysql2/promise` | Use the official promise API instead of promisifying the callback API. |

**Key insight:** Pooling and URL handling are subtle (connection limits, queue limits, idle timeouts). Using the library’s pool and URL support avoids bugs and keeps behavior consistent with common Node/MySQL usage.

## Common Pitfalls

### Pitfall 1: Leaking connections when using getConnection()
**What goes wrong:** Code calls `pool.getConnection()` but never calls `connection.release()`, so connections are never returned to the pool and the pool is exhausted.
**Why it happens:** Only `pool.query()` auto-releases; `getConnection()` does not.
**How to avoid:** Always use try/finally and call `conn.release()` in the finally block when using `getConnection()`.
**Warning signs:** Growing number of connections, timeouts under load, "Pool is closed" or queue errors.

### Pitfall 2: Requiring MYSQL_URL at startup when hub is optional
**What goes wrong:** `assert(process.env.MYSQL_URL)` in env.server.ts makes the app fail to start when the hub (and MySQL) is not used.
**Why it happens:** Treating MySQL as mandatory like DATABASE_URL.
**How to avoid:** Read MYSQL_URL without asserting; create the pool lazily (e.g. inside the singleton factory) only when MYSQL_URL is set; document in .env.example that MYSQL_URL is optional and required only for hub features.
**Warning signs:** App won’t start in environments where only Postgres is configured.

### Pitfall 3: Client bundle importing MySQL code
**What goes wrong:** A route or shared module imports the MySQL pool or mysql2; the client bundle pulls in the driver and can break or bloat.
**Why it happens:** Import path not restricted to server-only code.
**How to avoid:** Put the pool in a `*.server.ts` file (e.g. `mysql.server.ts`); only import it from loaders, actions, and other server-only modules (Remix/React Router convention).
**Warning signs:** Build errors or large client JS containing "mysql" or "createPool".

### Pitfall 4: Mixing PostgreSQL and MySQL in the same module
**What goes wrong:** One module imports both `prisma` and the MySQL pool and becomes the "dual DB" layer; later changes risk coupling and mistakes (wrong client for a query).
**Why it happens:** Convenience of a single "data" module.
**How to avoid:** Keep `db.server.ts` for Prisma/Postgres only; add a separate MySQL module; let callers import from both when a feature needs both.
**Warning signs:** Same file exporting prisma and mysql pool; queries to different DBs in one function without clear separation.

## Code Examples

Verified patterns from official/Context7 sources:

### Create pool from URL (Promise API)
```javascript
// Source: node-mysql2 docs (create-pool.mdx)
import mysql from 'mysql2/promise';

const pool = mysql.createPool('mysql://root:password@localhost:3306/test');
const connection = await pool.getConnection();
// ... use connection
connection.release();
```

### Singleton pool with optional env
```typescript
// Align with existing app/db.server.ts + singleton.server.ts
import mysql from "mysql2/promise";
import { singleton } from "~/singleton.server";

export function getMySQLPool() {
  const url = process.env.MYSQL_URL;
  if (!url) return null;
  return singleton("mysql-pool", () => mysql.createPool(url));
}
```

### Simple query (pool manages connection)
```javascript
// Source: node-mysql2 promise API
const [rows, fields] = await pool.query('SELECT 1');
// For parameterized: pool.query('SELECT * FROM t WHERE id = ?', [id])
```

### Prepared statement with execute
```javascript
// Source: node-mysql2 docs
const [results, fields] = await connection.execute(
  'SELECT * FROM `table` WHERE `name` = ? AND `age` > ?',
  ['Rick C-137', 53]
);
```

### Pool options (when not using URL string)
```javascript
// Source: node-mysql2 docs — use URL when possible; otherwise:
mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'test',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| mysql (mysqljs) callback API | mysql2 with mysql2/promise | Long-standing | Use promise API and createPool; avoid callback API for new code. |
| One global DB client | Separate clients per DB (Prisma + mysql2) | N/A | This phase adopts dual client by design; no single "DB" facade. |

**Deprecated/outdated:** Relying on the old `mysql` package for new Node apps when mysql2 is available and preferred.

## Open Questions

1. **Graceful shutdown (pool.end())**
   - What we know: mysql2 pools have `pool.end()` to close all connections; Remix/React Router doesn’t always expose a clean shutdown hook.
   - What's unclear: Whether this phase must wire `pool.end()` on process shutdown (e.g. in production with PM2 or Docker).
   - Recommendation: Omit explicit `pool.end()` in Phase 1 unless the plan includes a shutdown hook; add later if process lifecycle requirements appear.

2. **Pool options (connectionLimit, etc.)**
   - What we know: createPool(URL) uses defaults; an options object can set connectionLimit, queueLimit, etc.
   - What's unclear: Whether to parse URL and merge with options for production tuning.
   - Recommendation: Start with createPool(MYSQL_URL) only; add options in a later phase if load or ops require it.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | vitest.config.ts (merges with vite.config.ts) |
| Quick run command | `npm test` (or `npm test -- path/to/file`) |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | MySQL pool available when MYSQL_URL set; can run a trivial query | unit | `npm test -- app/mysql.server.test.ts` | ❌ Wave 0 |
| DATA-02 | Existing Postgres usage unchanged (prisma still used by existing models) | unit/smoke | `npm test` + typecheck/lint | ✅ Existing |

### Sampling Rate
- **Per task commit:** `npm test -- app/mysql.server.test.ts` (or relevant path)
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `app/mysql.server.test.ts` — unit test for getMySQLPool (mock or skip when MYSQL_URL unset; when set, expect pool or singleton behavior).
- [ ] No shared DB integration test harness; MySQL tests can use vi.mock for process.env or optional integration test with real DB when MYSQL_URL present.
- [ ] Framework install: already present (Vitest in package.json).

## Sources

### Primary (HIGH confidence)
- Context7 `/sidorares/node-mysql2` — createPool with URL, promise API, pool.query, getConnection/release, pool options.
- Existing codebase: `app/db.server.ts`, `app/env.server.ts`, `app/singleton.server.ts`, CONVENTIONS.md.

### Secondary (MEDIUM confidence)
- Web search: Node.js dual DB (PostgreSQL + MySQL) same app — singleton pool per DB, separate modules; consistent with Context7 and project patterns.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — mysql2 is the standard Node MySQL driver; Context7 and npm usage confirm.
- Architecture: HIGH — singleton + optional URL + separate module matches CONTEXT.md and existing db.server/singleton pattern.
- Pitfalls: HIGH — getConnection/release and optional env are well documented; .server.ts and no-mixing are project conventions.

**Research date:** 2025-03-15
**Valid until:** ~30 days for stable stack (mysql2, Node patterns).
