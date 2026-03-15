/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { getMySQLPool } from "~/mysql.server";

export interface SaBan {
  id: number;
  player_name: string;
  player_steamid: string;
  player_ip: string | null;
  admin_steamid: string;
  admin_name: string;
  reason: string;
  duration: number;
  ends: string | null;
  created: string;
  server_id: number | null;
  unban_id: number | null;
  status: string;
  updated_at: string | null;
  unban_reason: string | null;
  comment: string | null;
}

export interface AddBanParams {
  player_name: string;
  player_steamid: string;
  player_ip?: string;
  admin_steamid: string;
  admin_name: string;
  reason: string;
  duration: number;
  ends: string | null;
  status?: string;
}

export async function listBans(): Promise<SaBan[]> {
  const pool = getMySQLPool();
  if (!pool) return [];
  const [rows] = await pool.execute<import("mysql2").RowDataPacket[]>(
    "SELECT * FROM sa_bans ORDER BY created DESC"
  );
  return (rows ?? []) as SaBan[];
}

export async function addBan(params: AddBanParams): Promise<{ ok: true } | { ok: false; error: string }> {
  const pool = getMySQLPool();
  if (!pool) return { ok: false, error: "Database not configured" };
  const status = params.status ?? "ACTIVE";
  try {
    await pool.execute(
      `INSERT INTO sa_bans (player_name, player_steamid, player_ip, admin_steamid, admin_name, reason, duration, ends, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        params.player_name,
        params.player_steamid,
        params.player_ip ?? null,
        params.admin_steamid,
        params.admin_name,
        params.reason,
        params.duration,
        params.ends,
        status,
      ]
    );
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export async function unban(
  banId: number,
  adminId: number,
  reason: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const pool = getMySQLPool();
  if (!pool) return { ok: false, error: "Database not configured" };
  try {
    const [result] = await pool.execute<import("mysql2").ResultSetHeader>(
      "INSERT INTO sa_unbans (ban_id, admin_id, reason, date) VALUES (?, ?, ?, NOW())",
      [banId, adminId, reason]
    );
    const unbanId = result.insertId;
    await pool.execute(
      "UPDATE sa_bans SET status = 'UNBANNED', unban_id = ? WHERE id = ?",
      [unbanId, banId]
    );
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
