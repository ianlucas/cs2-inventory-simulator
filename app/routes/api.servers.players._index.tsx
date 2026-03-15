/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { GameDig } from "gamedig";
import { middleware } from "~/http.server";
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
    const gamedig = new GameDig();
    const state = await gamedig.query({
      type: "counterstrike2",
      host,
      port
    });
    const players = (state.players ?? []).map((p) => ({
      name: p.name ?? "",
      raw: p.raw ?? {}
    }));
    return Response.json({ players });
  } catch {
    return Response.json({ players: [] }, { status: 503 });
  }
}
