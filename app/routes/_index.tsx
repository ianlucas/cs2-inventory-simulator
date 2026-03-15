/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { GameDig } from "gamedig";
import { middleware } from "~/http.server";
import { SERVER_LIST } from "~/data/servers";
import { getMetaTitle } from "~/root-meta";
import type { Route } from "./+types/_index";

export const meta = getMetaTitle();

/** Gamedig query result shape (name, map, players, etc.). Use for typing UI in Plan 02. */
export interface ServerState {
  name?: string;
  map?: string;
  password?: boolean;
  numplayers?: number;
  maxplayers?: number;
  players?: Array<{ name?: string; raw?: Record<string, unknown> }>;
  connect?: string;
  ping?: number;
  [key: string]: unknown;
}

/** One entry in the homepage server list: either live gamedig state or offline placeholder. */
export type ServerListItem = ServerState | { offline: true; host: string; port: number };

const DEFAULT_PORT = 27015;

export async function loader({ request }: Route.LoaderArgs) {
  await middleware(request);

  const gamedig = new GameDig();
  const results = await Promise.allSettled(
    SERVER_LIST.map((s) =>
      gamedig.query({
        type: "counterstrike2",
        host: s.host,
        port: s.port ?? DEFAULT_PORT
      })
    )
  );

  const servers: ServerListItem[] = results.map((result, i) => {
    const entry = SERVER_LIST[i];
    const port = entry?.port ?? DEFAULT_PORT;
    if (result.status === "fulfilled") {
      return result.value;
    }
    return { offline: true as const, host: entry?.host ?? "", port };
  });

  return { servers };
}

export default function Index() {
  return null;
}
