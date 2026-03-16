# Mevcut MySQL şeması (referans)

Admin panel bu tabloları kullanır. Uygulama migration çalıştırmaz; tablo/sütun isimleri birebir kullanılacak.

## vip_users

VIP listesi (oyun tarafı). PayTR’den gelen kayıtlar farklı bir akışta olabilir; admin panel bu tabloyu yönetir.

| Sütun       | Tip         | Not                    |
|------------|-------------|-------------------------|
| account_id | BIGINT      | PK (composite with sid) |
| name       | VARCHAR(64) |                        |
| lastvisit  | BIGINT      |                        |
| sid        | BIGINT      | PK (composite)         |
| group      | VARCHAR(64) |                        |
| expires    | BIGINT      |                        |

**Primary key:** `(account_id, sid)`

---

## sa_bans

| Sütun         | Tip           | Not                          |
|---------------|----------------|------------------------------|
| id            | INT AUTO_INCREMENT | PK                       |
| player_name   | VARCHAR(128)   |                              |
| player_steamid | VARCHAR(64)   |                              |
| player_ip     | VARCHAR(128)   |                              |
| admin_steamid | VARCHAR(64)   |                              |
| admin_name    | VARCHAR(128)   |                              |
| reason        | VARCHAR(255)   |                              |
| duration      | INT            |                              |
| ends          | TIMESTAMP NULL | NULL = kalıcı               |
| created       | TIMESTAMP      |                              |
| server_id     | INT            |                              |
| unban_id      | INT            | FK → sa_unbans.id           |
| status        | ENUM('ACTIVE','UNBANNED','EXPIRED','') | DEFAULT 'ACTIVE' |
| updated_at    | TIMESTAMP      |                              |
| unban_reason  | TEXT           |                              |
| comment       | TEXT           |                              |

**Kaldırma (unban):** `sa_unbans` kaydı eklenir, `sa_bans.status` = 'UNBANNED', `sa_bans.unban_id` = yeni sa_unbans.id. `sa_unbans` için `admin_id` gerekir (sa_admins.id).

---

## sa_mutes

| Sütun         | Tip           | Not                          |
|---------------|----------------|------------------------------|
| id            | INT AUTO_INCREMENT | PK                       |
| player_name   | VARCHAR(128)   |                              |
| player_steamid | VARCHAR(64)   |                              |
| admin_steamid | VARCHAR(64)   |                              |
| admin_name    | VARCHAR(128)   |                              |
| reason        | VARCHAR(255)   |                              |
| duration      | INT            |                              |
| passed        | INT            |                              |
| ends          | TIMESTAMP NULL |                              |
| created       | TIMESTAMP      |                              |
| type          | ENUM('GAG','MUTE','SILENCE','') | DEFAULT 'GAG'   |
| server_id     | INT            |                              |
| unmute_id     | INT            | FK → sa_unmutes.id           |
| status        | ENUM('ACTIVE','UNMUTED','EXPIRED','') | DEFAULT 'ACTIVE' |
| unmute_reason | TEXT           |                              |
| comment       | TEXT           |                              |

**Kaldırma (unmute):** `sa_unmutes` kaydı eklenir, `sa_mutes.status` = 'UNMUTED', `sa_mutes.unmute_id` = yeni sa_unmutes.id. `sa_unmutes` için `admin_id` gerekir (sa_admins.id).

---

## sa_unbans

| Sütun   | Tip      | Not            |
|---------|----------|----------------|
| id      | INT      | PK, AUTO_INCREMENT |
| ban_id  | INT      |                |
| admin_id| INT      | FK → sa_admins.id |
| reason  | VARCHAR(255) | DEFAULT 'Unknown' |
| date    | TIMESTAMP |                |

---

## sa_unmutes

| Sütun   | Tip      | Not            |
|---------|----------|----------------|
| id      | INT      | PK, AUTO_INCREMENT |
| mute_id | INT      |                |
| admin_id| INT      | FK → sa_admins.id |
| reason  | VARCHAR(255) | DEFAULT 'Unknown' |
| date    | TIMESTAMP |                |

---

## sa_admins

Şema paylaşılmadı; `sa_unbans.admin_id` ve `sa_unmutes.admin_id` bu tabloya referans veriyor. Unban/unmute yaparken giriş yapan admin’in Steam ID’si ile `sa_admins` üzerinden `id` alınması gerekir. Sütunlar (tahmini): `id`, `steamid` veya benzeri.

---

## sa_warns

Uyarılar. Admin panel gereksiniminde sadece bans ve mutes var; istenirse ileride eklenebilir.

| Sütun          | Tip      | Not   |
|----------------|----------|-------|
| id             | INT      | PK    |
| player_name    | VARCHAR(128) |  |
| player_steamid | VARCHAR(64)  |  |
| admin_steamid  | VARCHAR(64)  |  |
| admin_name     | VARCHAR(128)  |  |
| reason         | VARCHAR(255)  |  |
| duration       | INT          |  |
| ends           | TIMESTAMP    |  |
| created        | TIMESTAMP    |  |
| server_id      | INT          |  |
| status         | ENUM('ACTIVE','EXPIRED','') |  |
