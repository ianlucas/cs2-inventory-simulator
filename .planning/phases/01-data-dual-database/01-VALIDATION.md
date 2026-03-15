---
phase: 1
slug: data-dual-database
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2025-03-15
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | vitest.config.ts (merges with vite.config.ts) |
| **Quick run command** | `npm test -- path/to/file` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10–30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- app/mysql.server.test.ts` (or relevant path)
- **After every plan wave:** Run `npm test`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| (TBD by plan) | 1 | 1 | DATA-01 | unit | `npm test -- app/mysql.server.test.ts` | ❌ W0 | ⬜ pending |
| (TBD by plan) | 1 | 1 | DATA-02 | unit/smoke | `npm test` + typecheck/lint | ✅ Existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/mysql.server.test.ts` — unit test for getMySQLPool (mock or skip when MYSQL_URL unset; when set, expect pool or singleton behavior)
- Existing infrastructure: Vitest in package.json; typecheck/lint for DATA-02

*Framework install: already present (Vitest in package.json).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App starts without MYSQL_URL (hub disabled) | DATA-02 | Env-dependent | Run app without MYSQL_URL; confirm no crash. |
| Real MySQL read/write (if needed) | DATA-01 | Optional integration | Set MYSQL_URL to test DB; run trivial query. |

*Primary verification is automated; manual only for env and optional integration.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter when complete

**Approval:** pending
