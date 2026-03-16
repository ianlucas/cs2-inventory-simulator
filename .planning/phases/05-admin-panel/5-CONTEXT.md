# Phase 5: Admin Panel - Context

**Gathered:** 2026-03-15 (minimal — from PROJECT.md + REQUIREMENTS)
**Status:** Ready for planning

<domain>
## Phase Boundary

Admins can access an admin panel using existing Steam auth and an admin flag; manage VIPs (view, add, remove); manage bans; manage mutes; view and edit server info. All VIP/bans/mutes data lives in MySQL (Phase 1); server list config is in repo (app/data/servers.ts). No change to existing PostgreSQL inventory/user flows.

</domain>

<decisions>
## Implementation Decisions

### Admin access
- **Existing Steam auth** — Reuse session; no separate login for admin.
- **Admin flag** — Planner decides: PostgreSQL (e.g. User in Group "admin" via existing Group/UserGroup) or env/config (e.g. list of Steam IDs). PROJECT: "add admin role/flag (e.g. in PostgreSQL or config)".

### Data source
- **Mevcut MySQL** — Zaten var olan bir MySQL veritabanına bağlanıyoruz; yeni şema veya migration yok. VIP, bans, mutes ve server list tabloları veritabanında mevcut. Uygulama sadece bu tabloları okur/yazar; CREATE TABLE veya şema dokümanı oluşturulmaz.
- **Server info** — Server listesi mevcut MySQL’deki tablodan okunur/güncellenir; homepage loader aynı kaynağı kullanır (gerekirse app/data/servers.ts fallback kalabilir).

### Claude's Discretion
- Where admin flag lives (Group "admin" vs env ADMIN_STEAM_IDS).
- Mevcut tablolardaki sütun isimleri (bans, mutes, server_list) — kod mevcut şemaya uyacak; gerekirse sütun eşlemesi kod içinde veya kısa bir yorumla belirtilir.
- Admin panel route ve layout (tabs/sections).

</decisions>

<code_context>
## Existing Code Insights

- **app/mysql.server.ts** — getMySQLPool(); use for VIP, bans, mutes.
- **app/models/user.server.ts**, **prisma/schema.prisma** — User has id (Steam ID), groups (UserGroup). Group/UserGroup exist; can add "admin" group and check membership.
- **app/data/servers.ts** — SERVER_LIST (host, port, gamemode); read in loader; editing requires write path (file or API to update).
- **Session/auth** — getSession, useUser; loaders can get userId and check admin before returning admin UI or data.
- **Phase 4** — VIP table (vip, vip_pending); callback and get-token already implemented.

</code_context>

<deferred>
- Public-facing changes to non-admin users — admin panel is gated; only admins see it.
</deferred>

---
*Phase: 05-admin-panel*
*Context: minimal, from PROJECT + REQUIREMENTS*
