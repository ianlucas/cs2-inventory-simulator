---
phase: 3
slug: homepage
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-03-15"
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.x |
| **Config file** | vitest.config.ts (mergeConfig with vite.config) |
| **Quick run command** | `npm test -- --run app/routes/_index app/components/*server* app/data/map-thumbnails app/data/servers` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~10–30 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick command (phase-relevant tests)
- **After every plan wave:** Run full suite
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | 01 | 1 | HOME-01 | unit/integration | Loader or server-list test (mocked gamedig) | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | HOME-02 | unit | Card has map image + name/map text | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | HOME-03 | unit | Toggle changes layout class or structure | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | HOME-04 | unit | Click opens modal, shows player list or empty state | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Tests for index loader or server-list component (mock gamedig) — HOME-01
- [ ] Tests for server card (map background + data) — HOME-02
- [ ] Tests for grid/table toggle — HOME-03
- [ ] Tests for player modal (open, list/empty, loading) — HOME-04
- [ ] Optional: shared test fixture for gamedig state shape

*Existing: vitest.config.ts, happy-dom, exclude .react-router; rules-page-content.test.tsx and server-rules.test.ts as patterns.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live gamedig query from real CS2 server | HOME-01 | Requires running server | Deploy or run server, open `/`, confirm server appears with correct data. |

*All other phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter when wave 0 complete

**Approval:** pending
