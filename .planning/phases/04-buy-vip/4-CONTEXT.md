# Phase 4: Buy VIP - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can view a Buy VIP page with VIP information and prices, follow a link to Bynogame for external purchase, and complete a VIP purchase on-site via PayTR (iframe). This phase delivers the public VIP page and purchase flow only — no admin management of VIPs (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### VIP content and pricing
- **Single VIP product** with **three package durations:** 1 month, 3 months, 6 months
- **Content source:** Static file (e.g. TypeScript/JSON in `app/data/` or similar) — VIP benefits text, package labels, and prices
- **Language and currency:** Always Turkish; currency display and PayTR amounts in TRY (Turkish Lira)

### Bynogame link
- **URL from environment** — Bynogame VIP/purchase URL read from env (e.g. `BYNOGAME_VIP_URL` or similar; planner chooses name), documented in `.env.example`
- Open in **new tab** when user clicks (external link)
- Shown on the same page as PayTR option(s)

### PayTR integration
- **Iframe** — PayTR payment flow embedded in the page via iframe (not redirect-only)
- **VIP persistence:** On successful payment, VIP record is written to **MySQL VIP table** (Phase 1 MySQL connection; schema/table may exist in external DB or be defined per planner — app writes to MySQL for VIP data)
- Callback/return URL and iframe communication (e.g. success/failure) to be designed by planner/researcher using PayTR docs

### Page placement and navigation
- **Route path:** `/vip` (route file: `app/routes/vip._index.tsx` or equivalent)
- Add **header link** to the VIP page (e.g. "VIP" or "Buy VIP"); footer link optional — planner may mirror rules page pattern (header + footer) or header only
- **Separate from Donate link** — Existing "Donate" (DonateHeaderLink) remains for project donation; VIP is a distinct link and page

### Claude's Discretion
- Exact env var name for Bynogame URL; optional vs required at startup
- Static file path and structure for VIP packages (e.g. `app/data/vip-packages.ts` with labels, durations, prices in TRY)
- PayTR iframe integration details: API keys in env, callback route, how to pass amount/package and receive success/failure
- MySQL VIP table: assume table exists or define minimal schema (e.g. user identifier, package, expiry) for this phase; Phase 5 will add admin management
- Whether to add footer link to `/vip` (recommend yes for consistency with rules)

</decisions>

<specifics>
## Specific Ideas

- VIP page layout: intro/benefits text (static), then 1/3/6 month options with price and two CTAs per option or global: "Bynogame’da al" (env URL, new tab) and "PayTR ile öde" (or similar) leading to iframe
- Reuse existing patterns: route with `meta`, `loader`, middleware; Tailwind styling; translations for any UI labels (or keep page Turkish-only as decided)
- PayTR: researcher/planner to confirm iframe flow and callback; app must write to MySQL VIP table on success

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- **app/env.server.ts** — Optional env vars use `?? undefined`; add Bynogame URL here (and any PayTR keys). Document in `.env.example`.
- **app/mysql.server.ts** — Phase 1 MySQL pool; use for writing VIP records after PayTR success. Ensure server-only (loaders/actions).
- **Header** (`app/components/header.tsx`) — Add a header link to `/vip` (e.g. "VIP" or "Satın Al"); same nav area as Rules, Settings. DonateHeaderLink stays separate.
- **Footer** (`app/components/footer.tsx`) — Optional link to `/vip` for consistency with rules page.
- **app/data/server-rules.ts** — Precedent for static content in `app/data/`; VIP packages/prices can live in `app/data/vip-packages.ts` or similar.

### Established Patterns
- Routes: file-based; `vip._index.tsx` → `/vip`. Loader can return static VIP data or read from data file; actions for PayTR callback if needed.
- Middleware: `middleware(request)` in loaders. VIP page is public (no auth required to view); PayTR callback may need to validate server-side.
- Styling: Tailwind; rules page and server cards for layout reference (sections, cards, CTAs).

### Integration Points
- **New:** `app/routes/vip._index.tsx` — Buy VIP page (content, package selector, Bynogame link, PayTR iframe).
- **New:** Static data file for VIP packages (durations, prices TRY, labels) and optional benefits text.
- **Optional:** Callback or webhook route for PayTR (e.g. `app/routes/api.vip.paytr-callback.tsx` or action) to persist VIP to MySQL.
- **Modify:** Header (and optionally footer) to add link to `/vip`. Env and `.env.example` for Bynogame URL and PayTR config.

</code_context>

<deferred>
## Deferred Ideas

- Admin management of VIPs (view/add/remove) — Phase 5
- Multiple currencies or locales for VIP page — fixed Turkish and TRY for this phase

</deferred>

---
*Phase: 04-buy-vip*
*Context gathered: 2026-03-15*
