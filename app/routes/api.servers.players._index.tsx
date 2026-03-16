/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { middleware } from "~/http.server";
import { cachedGamedigQuery } from "~/utils/gamedig-cache.server";
import type { Route } from "./+types/api.servers.players._index";

export async function loader({ request }: Route.LoaderArgs) {
  await middleware(request);

  const url = new URL(request.url);
  const host = url.searchParams.get("host");
  const portParam = url.searchParams.get("port");

  if (!host || !portParam) {
    return Response.json(
      { players: [] },
      { status: 400 }
    );
  }

  const port = Number(portParam);
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    return Response.json(
      { players: [] },
      { status: 400 }
    );
  }

  try {
    const state = await cachedGamedigQuery(host, port, { requestRules: false });
    // Source A2S_PLAYER only returns name, score, duration — no team. We still parse
    // team from raw in case a server sends it via an extension (normally empty).
    const players = (state.players ?? []).map((p) => {
      const raw = (p.raw ?? {}) as Record<string, unknown>;
      const score = typeof raw.score === "number" ? raw.score : undefined;
      const timeRaw = raw.time ?? raw.duration;
      const time =
        typeof timeRaw === "number"
          ? Math.round(timeRaw)
          : undefined;
      const rawTeam = raw.team ?? raw.teamid ?? raw.teamId;
      const teamNum =
        typeof rawTeam === "number"
          ? rawTeam
          : typeof rawTeam === "string"
            ? Number(rawTeam)
            : NaN;
      const team =
        teamNum === 2 || rawTeam === "2"
          ? "T"
          : teamNum === 3 || rawTeam === "3"
            ? "CT"
            : undefined;
      return {
        name: p.name ?? "",
        score,
        durationSeconds: time,
        team,
        raw
      };
    });
    return Response.json({ players });
  } catch {
    return Response.json({ players: [] }, { status: 503 });
  }
}
