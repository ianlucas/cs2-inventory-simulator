# Phase 2: Server Rules - Research

**Researched:** 2026-03-15
**Domain:** Static content page in React Router 7, rules/legal-style sections, nav integration
**Confidence:** HIGH

## Summary

Phase 2 adds a single public route `/rules` that displays server rules in sections with explanatory copy. Content is static (no DB); the app already uses React Router 7 file-based routes, `getMetaTitle`, and Header/Footer with `HeaderLink`. The established pattern is: create `app/routes/rules._index.tsx` with `meta`, a loader that calls `middleware(request)` and returns `null`, and a default-export page component. Static content can live in `app/data/server-rules.ts` as an array of sections (title + body) or as markdown; if using markdown, use `react-markdown` and do not hand-roll a parser. Add a "Rules" link in both header and footer; use a translation key (e.g. `HeaderRulesLabel`) for the nav label and page title so the rules page is discoverable and has correct document title.

**Primary recommendation:** Implement the rules page as a standard route with static data from `app/data/server-rules.ts` (sections as typed array). Use the existing `getMetaTitle`, `HeaderLink`, and footer pattern. Only add `react-markdown` if the planner chooses markdown as the content format; otherwise render sections as React (headings + prose).

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Content source:** Static — rules from a static source (e.g. markdown file, JSON, or hardcoded list); no database for rules in this phase. Planner can choose: single markdown file, JSON in repo, or component with an array of sections.
- **URL and navigation:** Path `/rules` (route file `app/routes/rules._index.tsx`). Add a link to the rules page in the app header and in the app footer; both must link to `/rules`.
- **Structure:** Sections (e.g. grouped by category: behavior, consequences, etc.) — not a single flat list.
- **Tone:** Explanatory — rules are explained, not just one-line bullets.
- **Access:** Public only — no login or auth; anyone can view the page.

### Claude's Discretion
- Where static content lives (e.g. `app/data/server-rules.ts`, markdown in `public/`, or inline).
- Exact section names and placeholder rule text.
- Styling details (match existing app Tailwind/components).
- Whether to add meta/SEO for the rules page.

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope (single public rules page, static, sections, header/footer links).

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RULES-01 | User can view a public server rules page showing rules for players (e.g. no cheating, be respectful) | Route `/rules`, public loader, static content (sections); nav links in header and footer; meta title via getMetaTitle; optional prerender for static route. |

</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-router | ^7.13.1 | Routing, loaders, meta | Project standard; file `rules._index.tsx` → path `/rules` |
| Tailwind | ^4.2.1 | Styling | Existing app; match rules page to current components |

### Optional (only if content is markdown)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-markdown | ^9.x | Render markdown string to React | When static content is stored as .md or markdown string; do not hand-roll a parser |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Typed TS/JSON sections in app/data | Markdown file + react-markdown | TS/JSON: no extra dep, type-safe, easy to style per section. Markdown: good for long prose, need react-markdown. |
| getMetaTitle(key) | Inline meta return | getMetaTitle keeps title consistent with app name and i18n; use it. |

**Installation (only if using markdown):**
```bash
npm install react-markdown
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── routes/
│   └── rules._index.tsx     # Route: /rules, meta, loader, page component
├── data/
│   └── server-rules.ts      # Static sections: { title, body }[] or similar
├── components/
│   ├── header.tsx           # Add HeaderLink to="/rules" + translate("HeaderRulesLabel")
│   └── footer.tsx           # Add link to /rules (e.g. "Rules" or "Server Rules")
```

### Pattern 1: Static route with optional loader
**What:** Route file exports `meta`, `loader`, and default component. Loader runs `middleware(request)` and returns `null` for public static pages.
**When to use:** Public pages with no route-specific data, or data from static imports.
**Example:**
```typescript
// app/routes/rules._index.tsx — follows settings._index.tsx pattern
import { middleware } from "~/http.server";
import { getMetaTitle } from "~/root-meta";
import type { Route } from "./+types/rules._index";

export const meta = getMetaTitle("HeaderRulesLabel");

export async function loader({ request }: Route.LoaderArgs) {
  await middleware(request);
  return null;
}

export default function RulesPage() {
  return (/* sections UI */);
}
```

### Pattern 2: Static content as typed data
**What:** Content in `app/data/*.ts` as const arrays (e.g. backgrounds, languages). For rules, use an array of sections with `title` and `body` (or `content`).
**Example:**
```typescript
// app/data/server-rules.ts
export const serverRulesSections = [
  { id: "behavior", title: "Behavior", body: "Be respectful. No cheating." },
  { id: "consequences", title: "Consequences", body: "Violations may result in..." },
] as const;
```

### Pattern 3: Header and footer links
**What:** Header uses `HeaderLink` with `to`, `icon`, `label` (from `translate("HeaderRulesLabel")`), and `onClick={closeMenu}` for mobile. Footer adds a plain `<a href="/rules">` or `<Link to="/rules">` in the same block as copyright.
**When to use:** Any public page that must be discoverable from every screen.

### Anti-Patterns to Avoid
- **Single nav location:** Requirements say header *and* footer; both must link to `/rules`.
- **Hand-rolled markdown:** Do not parse markdown with regex or custom logic; use `react-markdown`.
- **Indented markdown in JSX:** If passing a markdown string to react-markdown, do not indent the string (whitespace becomes part of content); use a variable or template literal with no leading indent.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown → React | Custom regex or string split | react-markdown | Correct parsing of emphasis, lists, links, code; security and edge cases. |
| Document title | Hardcoded `<title>` in route | getMetaTitle("HeaderRulesLabel") | Consistent app name suffix and i18n via getSystemTranslation. |

**Key insight:** Markdown parsing has many edge cases (nested lists, code blocks, HTML). Use a well-tested library.

## Common Pitfalls

### Pitfall 1: Forgetting footer or header link
**What goes wrong:** Rules page exists but users only find it from one place, or not at all.
**Why it happens:** Implementing only header or only footer.
**How to avoid:** Add link in both `header.tsx` and `footer.tsx` in the same task.
**Warning signs:** Only one of header/footer mentions "Rules".

### Pitfall 2: Missing translation key for Rules
**What goes wrong:** Nav shows raw key "HeaderRulesLabel" or title is wrong.
**Why it happens:** Adding HeaderLink without adding the key to translations; or meta without a key.
**How to avoid:** Add `HeaderRulesLabel` (or chosen key) to `app/translations/english.ts` and other locale files (or at least english) and use it for both the nav label and getMetaTitle.
**Warning signs:** UI shows translation key string.

### Pitfall 3: Content not inside layout
**What goes wrong:** Rules page renders without header/footer or with wrong layout.
**Why it happens:** Route placed outside the root layout or wrong route hierarchy.
**How to avoid:** Use `app/routes/rules._index.tsx` (no parent path segment); root already renders `<Outlet />` between Header and Footer, so the rules page will render inside the same layout.
**Warning signs:** Page has no header/footer.

### Pitfall 4: Indented markdown when using react-markdown
**What goes wrong:** Rendered output has extra code blocks or wrong formatting.
**Why it happens:** JSX trims/indents the string; markdown interprets leading spaces as code.
**How to avoid:** Store markdown in a variable with no leading indent, or use template literal with content starting at column 0.
**Source:** react-markdown readme (Context7).

## Code Examples

Verified patterns from the codebase and Context7:

### Route: meta + loader + component (existing pattern)
```typescript
// Source: app/routes/settings._index.tsx
export const meta = getMetaTitle("HeaderSettingsLabel");

export async function loader({ request }: Route.LoaderArgs) {
  await middleware(request);
  return null;
}

export default function Settings() { ... }
```

### HeaderLink usage
```typescript
// Source: app/components/header.tsx
<HeaderLink
  to="/settings"
  icon={faCog}
  onClick={closeMenu}
  label={translate("HeaderSettingsLabel")}
/>
```

### Static data file pattern
```typescript
// Source: app/data/backgrounds.ts
export const backgrounds = [
  { label: "Ancient", value: "ancient" },
  ...
];
```

### react-markdown basic usage (if using markdown)
```jsx
// Source: Context7 - remarkjs/react-markdown
import Markdown from 'react-markdown';

const markdown = '# Hi, *Pluto*!';
<Markdown>{markdown}</Markdown>
// Do not indent the markdown string in JSX.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Remix route conventions | React Router 7 file-based routes (same convention) | RR7 | `rules._index.tsx` → `/rules`; types from `./+types/rules._index` |
| Manual meta in every route | getMetaTitle(key) for consistent title + app name | Project convention | Use getMetaTitle for rules page title |

**Deprecated/outdated:** None relevant for this phase.

## Open Questions

1. **Translation key name**
   - What we know: Header uses keys like `HeaderSettingsLabel`, `HeaderCraftLabel`. Footer currently has no translation keys for links (hardcoded "Report it here", etc.).
   - What's unclear: Whether to add a single key `HeaderRulesLabel` for both header and meta, or separate keys for footer.
   - Recommendation: Use `HeaderRulesLabel` for header and meta; footer can use same translate key or a short "Rules" link text from the same key for consistency.

2. **Prerender**
   - What we know: React Router supports `prerender: ["/rules"]` in config for static routes to avoid loading spinner on refresh.
   - What's unclear: Whether this project enables prerender for any route.
   - Recommendation: Optional enhancement; planner can add to config if desired.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x (happy-dom) |
| Config file | vitest.config.ts |
| Quick run command | `npm test -- app/routes/rules --run` or single file |
| Full suite command | `npm test -- --run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| RULES-01 | User can open /rules and see server rules content | Route/component or E2E | `npm test -- app/routes/rules --run` or route test | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Run tests for touched files (e.g. rules route, header, footer).
- **Per wave merge:** `npm test -- --run`.
- **Phase gate:** Full suite green before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] Route or page test for `/rules` (e.g. render RulesPage and assert section content or link present).
- [ ] Optional: test that header and footer contain a link to `/rules` (can be in component tests or single integration-style test).

*(If planner keeps rules page as pure presentational component + route, a test that renders the route component with static data and checks for at least one section or the title is sufficient for RULES-01.)*

## Sources

### Primary (HIGH confidence)
- Codebase: `app/routes/settings._index.tsx`, `app/root-meta.ts`, `app/components/header.tsx`, `app/components/footer.tsx`, `app/data/backgrounds.ts`
- Context7: /websites/reactrouter — prerender, meta, static about page pattern
- Context7: /remarkjs/react-markdown — basic usage, do not indent markdown

### Secondary (MEDIUM confidence)
- .planning/codebase/CONVENTIONS.md, TESTING.md — patterns and test layout

### Tertiary (LOW confidence)
- Web search for static page SEO/hydration pitfalls returned no direct results; pitfalls above are from codebase and general React Router/SSR knowledge.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — project already uses RR7, Tailwind; react-markdown is standard for MD in React.
- Architecture: HIGH — route and nav patterns are in the codebase; only content format (TS vs MD) is planner choice.
- Pitfalls: HIGH — header/footer and translation key requirements are explicit; react-markdown indent caveat is documented.

**Research date:** 2026-03-15
**Valid until:** ~30 days (stable stack)
