# Phase 4: Buy VIP - Research

**Researched:** 2026-03-15
**Domain:** PayTR iFrame API, Turkish payment gateway, Node/React callback, MySQL VIP persistence
**Confidence:** HIGH

## Summary

PayTR iFrame integration is a two-step flow: (1) Server-side request to `https://www.paytr.com/odeme/api/get-token` with HMAC-SHA256 `paytr_token`, then render iframe with the returned token; (2) A separate Bildirim URL (callback) receives POST from PayTR with `merchant_oid`, `status`, `total_amount`, `hash` — you must verify the hash and respond with exactly `OK` (plain text). Order confirmation and VIP persistence must happen only in the callback; `merchant_ok_url` / `merchant_fail_url` are for user redirect only and must not be used to confirm orders. Use official hash formulas (exact string concatenation order); do not hand-roll crypto. Handle duplicate callbacks idempotently by `merchant_oid`.

**Primary recommendation:** Implement callback first (Bildirim URL), then token + iframe. Use PayTR’s documented hash formulas with Node `crypto.createHmac`; never skip callback hash verification.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Single VIP product with three package durations: 1, 3, 6 months.
- Content source: static file (e.g. TypeScript/JSON in `app/data/`) — VIP benefits, package labels, prices.
- Language and currency: Turkish; TRY.
- Bynogame: URL from env, open in new tab; shown on same page as PayTR.
- PayTR: iframe flow; on success write VIP record to MySQL VIP table (Phase 1 pool).
- Route: `/vip`; add header link; separate from Donate link.

### Claude's Discretion
- Exact env var name for Bynogame URL; optional vs required at startup.
- Static file path and structure for VIP packages (e.g. `app/data/vip-packages.ts`).
- PayTR iframe integration details: API keys in env, callback route, amount/package and success/failure handling.
- MySQL VIP table: assume table exists or define minimal schema (user identifier, package, expiry); Phase 5 adds admin management.
- Whether to add footer link to `/vip` (recommend yes for consistency with rules).

### Deferred Ideas (OUT OF SCOPE)
- Admin management of VIPs — Phase 5.
- Multiple currencies or locales — fixed Turkish and TRY for this phase.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIP-01 | User can view Buy VIP page with VIP information and prices | Static data file + route `/vip`; loader returns packages; page shows benefits and 1/3/6 month options with prices (TRY). |
| VIP-02 | User can open Bynogame purchase via external link from Buy VIP page | Env var for Bynogame URL; link with `target="_blank"`; no API integration. |
| VIP-03 | User can purchase VIP directly on site via PayTR integration | Server-side get-token (paytr_token formula), iframe with PayTR script; Bildirim URL callback with hash verification; on success write to MySQL VIP table; idempotency by merchant_oid. |

</phase_requirements>

## Standard Stack

### Core
| Library / API | Version / Source | Purpose | Why Standard |
|---------------|------------------|---------|--------------|
| PayTR iFrame API | Official dev.paytr.com | Token endpoint + iframe + callback | Only supported way to embed PayTR; official hash formulas. |
| Node `crypto` | Built-in | HMAC-SHA256 for paytr_token and callback hash | PayTR docs use this; do not use third-party crypto for these hashes. |
| mysql2 (existing) | Project pool | VIP table write after callback | Phase 1; server-only. |
| React Router 7 | Existing | Route `/vip`, API route for callback | Matches project. |

### Supporting
| Item | Purpose | When to Use |
|------|---------|-------------|
| PayTR iframeResizer.min.js | Resize iframe to content | Load when rendering PayTR iframe; use `?v2` for iFrame V2. |
| Env vars | merchant_id, merchant_key, merchant_salt, Bildirim URL | Required for PayTR; Bynogame URL optional. |

### Do Not Use
| Instead of | Do not use | Reason |
|------------|------------|--------|
| PayTR official flow | Redirect-only or custom crypto | PayTR expects iframe + callback; hash order and algorithm are fixed. |
| Confirming order on merchant_ok_url | Any logic that approves order on redirect | PayTR is asynchronous; only callback carries the definitive result. |

**Installation:** No new packages required for PayTR (use Node `crypto` and `fetch` or existing HTTP client). Ensure `mysql2` is already present (Phase 1).

## Architecture Patterns

### Recommended Project Structure
```
app/
├── data/
│   └── vip-packages.ts          # Static packages (1/3/6 mo), labels, prices TRY
├── routes/
│   ├── vip._index.tsx            # GET /vip — page with form/iframe entry
│   └── api.vip.paytr-callback._index.tsx  # POST only — Bildirim URL
├── mysql.server.ts               # Existing; use for VIP insert
└── env.server.ts                 # Add PAYTR_*, BYNOGAME_VIP_URL
```

### Pattern 1: Two-step PayTR flow
**What:** (1) Callback URL implemented and registered in PayTR panel. (2) VIP page: user picks package → server requests get-token with correct paytr_token → returns token to client → iframe shows `https://www.paytr.com/odeme/guvenli/{token}`.
**When:** Every PayTR iFrame integration.
**Critical:** Bildirim URL is configured in PayTR Mağaza Paneli > Destek & Kurulum > Ayarlar > Bildirim URL. It is not a parameter in the get-token request. Callback must return plain text `OK` only (no HTML/JSON).

### Pattern 2: Token request (get-token)
**What:** Server-side POST to `https://www.paytr.com/odeme/api/get-token` with form body. Include `paytr_token` computed as: `base64(HMAC-SHA256(merchant_key, hash_str + merchant_salt))` where `hash_str = merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode` (all strings concatenated, no separators). Do not send `merchant_key` or `merchant_salt` in the POST body.
**When:** When user initiates PayTR payment (e.g. selects package and clicks “PayTR ile öde”).

### Pattern 3: Callback (Bildirim URL)
**What:** POST handler receives `merchant_oid`, `status`, `total_amount`, `hash`, etc. Compute expected hash: `base64(HMAC-SHA256(merchant_key, merchant_oid + merchant_salt + status + total_amount))`. Compare with `post.hash`; if different, return non-OK or 4xx. If same and `status === 'success'`, look up or create order by `merchant_oid`, then insert/update VIP in MySQL and return `OK`. If already processed for that `merchant_oid`, return `OK` without re-applying. Response must be `Content-Type: text/plain` and body exactly `OK`.
**When:** Every payment result; PayTR may retry.

### Anti-Patterns to Avoid
- **Confirming order on merchant_ok_url:** PayTR redirects the user there before the callback may have been processed. Never approve or grant VIP based on redirect.
- **Sending merchant_key / merchant_salt in get-token POST:** Official PHP/Python examples do not send them; Node example in PayTR doc erroneously does — omit from request body.
- **Skipping callback hash verification:** PayTR explicitly warns that skipping it can cause financial loss.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Payment request signature | Custom signing or wrong order | PayTR’s exact formula: hash_str then HMAC with merchant_key, message = hash_str + merchant_salt (token); callback message = merchant_oid + merchant_salt + status + total_amount | PayTR validates server-side; wrong order or algorithm causes rejection or security risk. |
| Callback authenticity | Trusting POST body without check | Recomputed hash from POST fields vs `post.hash` using official formula | Prevents forged callbacks and tampering. |
| Duplicate callback handling | Processing every POST | Check by merchant_oid (DB or in-memory); if already processed return OK only | PayTR may send multiple notifications; double-grant causes duplicate VIP. |

**Key insight:** PayTR’s hashes are fixed-format. Use the exact concatenation order from official PHP/Python docs; the Node sample in the doc has the right callback formula but ensure token formula matches PHP (hash_str + merchant_salt as message, merchant_key as key).

## Common Pitfalls

### Pitfall 1: Invalid paytr_token (local IP)
**What goes wrong:** get-token returns an error or invalid token when developing locally.
**Why:** PayTR expects a valid client IP; localhost or wrong IP causes rejection.
**How to avoid:** In development use the machine’s public IP (e.g. from whatismyip.com) for `user_ip`, or ensure the request is made from a server that has a public IP. Do not send 127.0.0.1.
**Warning signs:** “Geçersiz paytr_token” or similar in get-token response.

### Pitfall 2: Hash string order (token and callback)
**What goes wrong:** Token or callback hash mismatch.
**Why:** Concatenation order is strict: token = merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode (then append merchant_salt for HMAC message). Callback = merchant_oid + merchant_salt + status + total_amount (all strings).
**How to avoid:** Copy the order from official PayTR 1. Adım / 2. Adım docs; use TypeScript constants for the order and unit-test with known values if possible.
**Warning signs:** get-token fails with signature error; callback returns OK but PayTR shows “Devam Ediyor” or retries.

### Pitfall 3: Callback returns HTML or wrong format
**What goes wrong:** PayTR does not accept the response and retries; order stays “Devam Ediyor”.
**Why:** Response must be plain text body exactly `OK`, no HTML/JSON/whitespace before or after.
**How to avoid:** Return `new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } })` and ensure no layout or error page wraps the callback route.
**Warning signs:** PayTR panel shows notification failure; multiple duplicate callbacks.

### Pitfall 4: Processing duplicate callbacks
**What goes wrong:** Same payment triggers multiple VIP grants or duplicate rows.
**Why:** PayTR can send the same notification more than once (retries).
**How to avoid:** Before inserting VIP, check by merchant_oid whether this order was already successfully processed; if yes, return `OK` without inserting again.
**Warning signs:** Two VIP records for one payment; user charged once but gets double duration.

### Pitfall 5: Bildirim URL not registered or wrong protocol
**What goes wrong:** Callback never called or PayTR cannot reach it.
**Why:** URL must be set in Mağaza Paneli > Ayarlar > Bildirim URL; if site uses HTTPS, URL must be HTTPS (and vice versa).
**How to avoid:** Register the exact callback URL (e.g. `https://yourdomain.com/api/vip/paytr-callback`) in the panel; test with PayTR test mode.
**Warning signs:** Test payment completes in iframe but order stays “Devam Ediyor”; no callback logs.

## Code Examples

### Token hash (get-token request)
```typescript
// Source: PayTR dev.paytr.com iframe-api 1. Adım (PHP/Python formula)
import crypto from "node:crypto";

function buildPaytrToken(params: {
  merchant_id: string;
  user_ip: string;
  merchant_oid: string;
  email: string;
  payment_amount: number;
  user_basket: string;
  no_installment: string;
  max_installment: string;
  currency: string;
  test_mode: string;
  merchant_key: string;
  merchant_salt: string;
}): string {
  const hashStr =
    params.merchant_id +
    params.user_ip +
    params.merchant_oid +
    params.email +
    String(params.payment_amount) +
    params.user_basket +
    params.no_installment +
    params.max_installment +
    params.currency +
    params.test_mode;
  const message = hashStr + params.merchant_salt;
  return crypto.createHmac("sha256", params.merchant_key).update(message).digest("base64");
}
```

### Callback hash verification
```typescript
// Source: PayTR dev.paytr.com iframe-api 2. Adım
function verifyCallbackHash(
  merchant_oid: string,
  status: string,
  total_amount: string,
  hashFromPaytr: string,
  merchant_key: string,
  merchant_salt: string
): boolean {
  const message = merchant_oid + merchant_salt + status + total_amount;
  const expected = crypto.createHmac("sha256", merchant_key).update(message).digest("base64");
  return expected === hashFromPaytr;
}
```

### user_basket format
```typescript
// Source: PayTR iframe API docs — base64(JSON array of [name, unit_price_str, quantity])
const basket = [
  ["VIP 1 Ay", "99.00", 1],
  // or multiple lines for multiple items
];
const user_basket = Buffer.from(JSON.stringify(basket)).toString("base64");
```

### Callback response (plain OK)
```typescript
// PayTR expects exactly "OK" as plain text
return new Response("OK", {
  status: 200,
  headers: { "Content-Type": "text/plain; charset=utf-8" },
});
```

### Iframe (V2) and script
```html
<script src="https://www.paytr.com/js/iframeResizer.min.js?v2"></script>
<iframe src={`https://www.paytr.com/odeme/guvenli/${token}`} id="paytriframe" frameborder="0" scrolling="no" style={{ width: "100%" }} />
<script>iFrameResize({}, '#paytriframe');</script>
```
Use `iframe_v2: 1` (and optionally `iframe_v2_dark: 1`) in get-token POST when using V2.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|-------------|------------------|--------------|--------|
| iFrame script without ?v2 | iframeResizer.min.js?v2 | iFrame V2 release | Use ?v2 and iframe_v2: 1 for new UI. |
| Confirming on redirect | Confirm only in callback | PayTR async design | Prevents false positives. |

**Deprecated/outdated:** Relying on merchant_ok_url for order confirmation. PayTR does not POST payment result to that URL.

## Open Questions

1. **MySQL VIP table schema**
   - What we know: Phase 1 uses existing MySQL DB; app does not run migrations. Context allows defining a minimal schema for this phase.
   - What's unclear: Exact column names in the existing DB (if any).
   - Recommendation: Define a minimal contract: e.g. `merchant_oid` (or order id), user identifier (e.g. email or steam_id if collected), package duration, expiry (or purchased_at). If the external DB already has a table, document the expected columns; otherwise provide a CREATE TABLE snippet for the operator to run.

2. **User identifier for VIP**
   - What we know: Callback has merchant_oid, status, total_amount; token request has email, user_name, etc. No Steam ID in PayTR flow.
   - What's unclear: Whether to store email only, or require a separate “VIP user id” from the game server.
   - Recommendation: Store at least merchant_oid, email (from token request, can be stored when creating the order before redirecting to iframe), package duration, and expiry. Phase 5 admin can map to Steam or game IDs if needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|--------|
| Framework | Vitest 4.x |
| Config | package.json scripts; vitest in project |
| Quick run command | `npm run test` (or scoped to a file) |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIP-01 | Buy VIP page shows packages and prices | Component/route | `npm run test -- app/routes/vip` or route test | ❌ Wave 0 |
| VIP-02 | Bynogame link opens in new tab | Component | `npm run test -- app/routes/vip` | ❌ Wave 0 |
| VIP-03 | PayTR token hash + callback hash + idempotency | Unit | `npm run test -- paytr` or hash/callback util | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test` (or targeted path).
- **Per wave merge:** Full `npm run test`.
- **Phase gate:** All tests green before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] Unit tests for PayTR token hash and callback hash (pure functions with known inputs/outputs).
- [ ] Optional: route or component test for `/vip` (loader returns packages; page renders).
- [ ] Callback route should be POST-only and return plain "OK"; no existing api.vip route.

*(E2E payment test against PayTR test mode is manual; automate only hash logic and idempotency.)*

## Sources

### Primary (HIGH confidence)
- PayTR Developer Portal — iFrame API: https://dev.paytr.com/iframe-api
- PayTR iFrame API 1. Adım (get-token, paytr_token formula): https://dev.paytr.com/iframe-api/iframe-api-1-adim
- PayTR iFrame API 2. Adım (callback, hash formula, OK response): https://dev.paytr.com/iframe-api/iframe-api-2-adim
- PayTR iFrame V2 (iframe_v2, script ?v2): https://dev.paytr.com/iframe-api/iframe-api-yeni-tasarim

### Secondary (MEDIUM confidence)
- PayTR entegrasyon süreci: https://dev.paytr.com/home/iframe-api-entegrasyon-sureci
- Web search: duplicate notification handling (merchant_oid idempotency) — consistent with PayTR 2. Adım text.

### Tertiary (LOW confidence)
- PayTR Node sample in doc: token formula matches PHP when read as (hashSTR + merchant_salt) as message; do not send merchant_key/merchant_salt in form body.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — official PayTR docs and existing project stack.
- Architecture: HIGH — two-step flow and hash formulas from official docs.
- Pitfalls: HIGH — documented by PayTR (local IP, hash, OK response, duplicates).

**Research date:** 2026-03-15
**Valid until:** ~30 days; re-check PayTR dev portal if API or hash format changes.
