# Phase 2: Server Rules - Context

**Gathered:** 2025-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can view a public server rules page. The page displays server rules for players (e.g. no cheating, be respectful). One route, one page; no auth required. Content and presentation only — no admin editing in this phase.

</domain>

<decisions>
## Implementation Decisions

### Content source
- **Static** — Rules content from a static source (e.g. markdown file, JSON, or hardcoded list in the app); no database for rules in this phase
- Planner can choose: single markdown file, JSON in repo, or component with an array of sections

### URL and navigation
- **Path:** `/rules` (route file: `app/routes/rules._index.tsx`)
- **Header:** Add a link to the rules page in the app header
- **Footer:** Add a link to the rules page in the app footer
- Both header and footer must link to `/rules` so users can find it from anywhere

### Presentation
- **Structure:** Sections (e.g. grouped by category: behavior, consequences, etc.) — not a single flat list
- **Tone:** Explanatory — rules are explained, not just one-line bullets
- Exact section titles and content are content/copy; planner can use placeholders or a small default set

### Access
- **Public only** — No login or auth; anyone can view the page
- No gating; page is accessible without session

### Claude's Discretion
- Where static content lives (e.g. `app/data/server-rules.ts`, markdown in `public/`, or inline)
- Exact section names and placeholder rule text
- Styling details (match existing app Tailwind/components)
- Whether to add meta/SEO for the rules page

</decisions>

<specifics>
## Specific Ideas

No specific product references — static content, sections with explanatory tone, linked from header and footer. Standard React Router page pattern.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- **root.tsx** — Renders Header and Footer; new rules page will render inside Outlet with same layout
- **Header / Footer** — Need to add a "Rules" (or similar) link in both; locate where nav links are defined (e.g. `app/components/header.tsx`, `app/components/footer.tsx`)
- **Route pattern** — File `settings._index.tsx` → path `/settings`; `craft._index.tsx` → `/craft`; so `rules._index.tsx` → `/rules`
- **getMetaTitle, meta** — Existing routes use `getMetaTitle("Key")` for meta; rules page can use same for title/SEO

### Established Patterns
- Routes export `meta` and `loader` (loader can return null if no data); default export is the page component
- Middleware: `middleware(request)` called in loaders; rules page is public so loader can be minimal
- Styling: Tailwind; existing components (Modal, Select, etc.) for reference; rules page can be simple layout + prose/sections

### Integration Points
- **New file:** `app/routes/rules._index.tsx` — route component and loader
- **Modify:** Header and Footer components to include a link to `/rules` (e.g. "Rules" or "Server Rules")
- Optional: `app/data/server-rules.ts` or similar for static content; or markdown in `public/` loaded at build/run time

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope (single public rules page, static, sections, header/footer links).

</deferred>

---
*Phase: 02-server-rules*
*Context gathered: 2025-03-15*
