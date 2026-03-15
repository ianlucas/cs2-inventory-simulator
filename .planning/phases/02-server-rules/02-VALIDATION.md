---
phase: 2
slug: server-rules
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2025-03-15
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x (happy-dom) |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test -- app/routes/rules --run` or single file |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~10–20 seconds |

---

## Sampling Rate

- **After every task commit:** Run tests for touched files (rules route, header, footer)
- **After every plan wave:** Run `npm test -- --run`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| (TBD by plan) | 2 | 1 | RULES-01 | route/component | `npm test -- app/routes/rules --run` or route test | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Route or page test for `/rules` (e.g. render RulesPage and assert section content or link present)
- Optional: test that header and footer contain a link to `/rules`

*Existing infrastructure: Vitest in package.json. Phase 2 adds route + optional route/component test.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Page visible at /rules in browser | RULES-01 | E2E not in scope | Open /rules, confirm sections and header/footer link. |
| Translation key shows in nav | RULES-01 | i18n depends on locale | Check header/footer show "Rules" or translated label. |

*Primary verification: automated route/component test. Manual: quick smoke that /rules loads and nav links work.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter when complete

**Approval:** pending
