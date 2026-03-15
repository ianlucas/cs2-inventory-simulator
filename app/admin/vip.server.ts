/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { getMySQLPool } from "~/mysql.server";

export interface VipUser {
  account_id: number;
  name: string;
  lastvisit: number;
  sid: number;
  group: string;
  expires: number;
}

export async function listVips(): Promise<VipUser[]> {
  const pool = getMySQLPool();
  if (pool === null) {
    return [];
  }
  const [rows] = await pool.query<import("mysql2").RowDataPacket[]>(
    "SELECT account_id, name, lastvisit, sid, `group`, expires FROM vip_users ORDER BY expires DESC"
  );
  return (rows ?? []).map((row) => ({
    account_id: Number(row.account_id),
    name: String(row.name ?? ""),
    lastvisit: Number(row.lastvisit ?? 0),
    sid: Number(row.sid ?? 0),
    group: String(row.group ?? ""),
    expires: Number(row.expires ?? 0)
  }));
}

export interface AddVipParams {
  account_id: number;
  name: string;
  lastvisit: number;
  sid: number;
  group: string;
  expires: number;
}

export async function addVip(
  params: AddVipParams
): Promise<{ ok: true } | { ok: false; error: string }> {
  const pool = getMySQLPool();
  if (pool === null) {
    return { ok: false, error: "Database not configured" };
  }
  try {
    await pool.query(
      "INSERT INTO vip_users (account_id, name, lastvisit, sid, `group`, expires) VALUES (?, ?, ?, ?, ?, ?)",
      [
        params.account_id,
        params.name,
        params.lastvisit,
        params.sid,
        params.group,
        params.expires
      ]
    );
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export async function removeVip(
  account_id: number,
  sid: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  const pool = getMySQLPool();
  if (pool === null) {
    return { ok: false, error: "Database not configured" };
  }
  try {
    await pool.query("DELETE FROM vip_users WHERE account_id = ? AND sid = ?", [
      account_id,
      sid
    ]);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
