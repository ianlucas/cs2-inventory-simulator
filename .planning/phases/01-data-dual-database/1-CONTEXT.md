# Phase 1: Data (Dual database) - Context

**Gathered:** 2025-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

VIP, bans, and mutes are stored in MySQL; existing PostgreSQL usage (inventory, users, rules) is unaffected. No schema or connection mixing between the two databases. This phase establishes the MySQL connection and access pattern only — no UI or business flows.

</domain>

<decisions>
## Implementation Decisions

### MySQL schema ownership
- Use **existing** MySQL database — connect to an existing DB (e.g. from game server/panel); do not define or migrate VIP/bans/mutes tables in this project
- This app reads/writes to the existing schema; no new migrations for MySQL in this repo

### MySQL client choice
- Use a **separate** MySQL client (e.g. `mysql2`), not a second Prisma datasource
- Prisma remains PostgreSQL-only; clear separation between Postgres (existing `app/db.server.ts`) and MySQL (new client/module)

### Connection config
- Single URL env var: **`MYSQL_URL`**
- Add to `app/env.server.ts` (or equivalent) and document in `.env.example`; optional at app startup if hub features are disabled, or required when hub is used — planner can decide

### Where MySQL runs
- MySQL is used by the **same Node app** — dual connection in one process
- No separate service or microservice; this app holds both PostgreSQL and MySQL connections

### Claude's Discretion
- Exact env validation (assert vs optional MYSQL_URL)
- Connection pooling and lifecycle (singleton vs per-request, disconnect behavior)
- Module layout for MySQL client (e.g. `app/mysql.server.ts` or `app/db-mysql.server.ts`)
- How to expose the client to loaders/actions (exported singleton or factory)

</decisions>

<specifics>
## Specific Ideas

No specific product references — connect to existing MySQL, separate client, MYSQL_URL, same app. Standard Node MySQL client usage.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/db.server.ts` — Pattern: singleton Prisma client, uses `DATABASE_URL` from `app/env.server.ts`, `@prisma/adapter-pg`. New MySQL client can follow same singleton pattern in a separate module (e.g. `app/mysql.server.ts` or `app/db-mysql.server.ts`).
- `app/env.server.ts` — Add `MYSQL_URL` here (assert or optional per planner choice).
- `app/singleton.server.ts` — Used by db.server for Prisma singleton; can reuse for MySQL client singleton if desired.

### Established Patterns
- Server-only data access lives in `app/models/*.server.ts`; DB access via `app/db.server.ts`. MySQL access should live in server-only modules (new model(s) or a dedicated mysql client module) and never be imported from client bundles.
- Env: required vars asserted at startup in env.server.ts; optional vars read from process.env.

### Integration Points
- New code: new file(s) for MySQL connection and any thin accessors; no changes to `prisma/schema.prisma` or existing `app/db.server.ts` for this phase.
- `.env.example`: add `MYSQL_URL` with placeholder so deployers know to set it when using hub features.

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope (dual DB setup only).

</deferred>

---
*Phase: 01-data-dual-database*
*Context gathered: 2025-03-15*
