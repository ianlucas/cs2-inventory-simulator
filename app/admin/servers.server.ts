/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { getMySQLPool } from "~/mysql.server";
import { SERVER_LIST, type ServerEntry } from "~/data/servers";

/** Table: server_list. Columns: id, host, port, gamemode, sort_order (existing schema). */
export interface ServerRow {
  id: number;
  host: string;
  port: number | null;
  gamemode: string | null;
  sort_order: number | null;
}

export interface AddServerParams {
  host: string;
  port?: number;
  gamemode?: string;
}

export interface UpdateServerParams {
  host?: string;
  port?: number;
  gamemode?: string;
  sort_order?: number;
}

export async function listServers(): Promise<ServerRow[]> {
  const pool = getMySQLPool();
  if (!pool) return [];
  try {
    const [rows] = await pool.execute<import("mysql2").RowDataPacket[]>(
      "SELECT id, host, port, gamemode, sort_order FROM server_list ORDER BY sort_order ASC, id ASC"
    );
    return (rows ?? []) as ServerRow[];
  } catch {
    return [];
  }
}

export async function getServerListForDisplay(): Promise<ServerEntry[]> {
  const pool = getMySQLPool();
  if (!pool) return SERVER_LIST;
  try {
    const [rows] = await pool.execute<import("mysql2").RowDataPacket[]>(
      "SELECT host, port, gamemode FROM server_list ORDER BY sort_order ASC, id ASC"
    );
    const list = (rows ?? []) as Array<{ host: string; port: number | null; gamemode: string | null }>;
    if (list.length === 0) return SERVER_LIST;
    return list.map((r) => ({
      host: r.host,
      port: r.port ?? undefined,
      gamemode: r.gamemode ?? undefined
    }));
  } catch {
    return SERVER_LIST;
  }
}

export async function addServer(
  params: AddServerParams
): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  const pool = getMySQLPool();
  if (!pool) return { ok: false, error: "Database not configured" };
  const host = String(params.host ?? "").trim();
  if (!host) return { ok: false, error: "Host is required" };
  try {
    const [result] = await pool.execute<import("mysql2").ResultSetHeader>(
      "INSERT INTO server_list (host, port, gamemode) VALUES (?, ?, ?)",
      [host, params.port ?? null, params.gamemode ?? null]
    );
    return { ok: true, id: result.insertId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export async function updateServer(
  id: number,
  params: UpdateServerParams
): Promise<{ ok: true } | { ok: false; error: string }> {
  const pool = getMySQLPool();
  if (!pool) return { ok: false, error: "Database not configured" };
  const updates: string[] = [];
  const values: (string | number | null)[] = [];
  if (params.host !== undefined) {
    updates.push("host = ?");
    values.push(params.host.trim());
  }
  if (params.port !== undefined) {
    updates.push("port = ?");
    values.push(params.port);
  }
  if (params.gamemode !== undefined) {
    updates.push("gamemode = ?");
    values.push(params.gamemode.trim() || null);
  }
  if (params.sort_order !== undefined) {
    updates.push("sort_order = ?");
    values.push(params.sort_order);
  }
  if (updates.length === 0) return { ok: true };
  values.push(id);
  try {
    await pool.execute(
      `UPDATE server_list SET ${updates.join(", ")} WHERE id = ?`,
      values
    );
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export async function removeServer(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const pool = getMySQLPool();
  if (!pool) return { ok: false, error: "Database not configured" };
  try {
    await pool.execute("DELETE FROM server_list WHERE id = ?", [id]);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
