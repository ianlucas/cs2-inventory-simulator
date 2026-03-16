/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { GameDig } from "gamedig";

/** TTL in ms. Default 30s to avoid hammering game servers with A2S queries. */
const CACHE_TTL_MS =
  typeof process.env.GAMEDIG_CACHE_TTL_MS === "string"
    ? Math.max(5000, parseInt(process.env.GAMEDIG_CACHE_TTL_MS, 10) || 30000)
    : 30_000;

interface CacheEntry {
  data: Awaited<ReturnType<GameDig["query"]>>;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(host: string, port: number): string {
  return `${host}:${port}`;
}

function getCached(host: string, port: number): Awaited<ReturnType<GameDig["query"]>> | null {
  const key = cacheKey(host, port);
  const entry = cache.get(key);
  if (!entry || Date.now() >= entry.expiresAt) return null;
  return entry.data;
}

function setCached(
  host: string,
  port: number,
  data: Awaited<ReturnType<GameDig["query"]>>
): void {
  cache.set(cacheKey(host, port), {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS
  });
}

/**
 * Query a CS2 server via gamedig, with server-side caching to avoid excessive A2S traffic.
 * Same (host, port) within TTL returns cached result (default 30s).
 */
export async function cachedGamedigQuery(
  host: string,
  port: number,
  options?: { requestRules?: boolean }
): Promise<Awaited<ReturnType<GameDig["query"]>>> {
  const cached = getCached(host, port);
  if (cached !== null) return cached;

  const gamedig = new GameDig();
  const result = await gamedig.query({
    type: "counterstrike2",
    host,
    port,
    requestRules: options?.requestRules ?? false
  });
  setCached(host, port, result);
  return result;
}
