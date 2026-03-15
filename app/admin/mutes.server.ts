/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { getMySQLPool } from "~/mysql.server";

export type MuteType = "GAG" | "MUTE" | "SILENCE" | "";

export interface SaMute {
  id: number;
  player_name: string;
  player_steamid: string;
  admin_steamid: string;
  admin_name: string;
  reason: string;
  duration: number;
  passed: number | null;
  ends: string | null;
  created: string;
  type: MuteType;
  server_id: number | null;
  unmute_id: number | null;
  status: string;
  unmute_reason: string | null;
  comment: string | null;
}

export interface AddMuteParams {
  player_name: string;
  player_steamid: string;
  admin_steamid: string;
  admin_name: string;
  reason: string;
  duration: number;
  ends: string | null;
  type?: MuteType;
  status?: string;
}

export async function listMutes(): Promise<SaMute[]> {
  const pool = getMySQLPool();
  if (!pool) return [];
  const [rows] = await pool.execute<import("mysql2").RowDataPacket[]>(
    "SELECT * FROM sa_mutes ORDER BY created DESC"
  );
  return (rows ?? []) as SaMute[];
}

export async function addMute(params: AddMuteParams): Promise<{ ok: true } | { ok: false; error: string }> {
  const pool = getMySQLPool();
  if (!pool) return { ok: false, error: "Database not configured" };
  const type = params.type ?? "GAG";
  const status = params.status ?? "ACTIVE";
  try {
    await pool.execute(
      `INSERT INTO sa_mutes (player_name, player_steamid, admin_steamid, admin_name, reason, duration, ends, type, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        params.player_name,
        params.player_steamid,
        params.admin_steamid,
        params.admin_name,
        params.reason,
        params.duration,
        params.ends,
        type,
        status,
      ]
    );
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export async function unmute(
  muteId: number,
  adminId: number,
  reason: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const pool = getMySQLPool();
  if (!pool) return { ok: false, error: "Database not configured" };
  try {
    const [result] = await pool.execute<import("mysql2").ResultSetHeader>(
      "INSERT INTO sa_unmutes (mute_id, admin_id, reason, date) VALUES (?, ?, ?, NOW())",
      [muteId, adminId, reason]
    );
    const unmuteId = result.insertId;
    await pool.execute(
      "UPDATE sa_mutes SET status = 'UNMUTED', unmute_id = ? WHERE id = ?",
      [unmuteId, muteId]
    );
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
