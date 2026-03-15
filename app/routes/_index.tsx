/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { GameDig } from "gamedig";
import { middleware } from "~/http.server";
import { SERVER_LIST } from "~/data/servers";
import { getMetaTitle } from "~/root-meta";
import { Modal, ModalHeader } from "~/components/modal";
import { ServerCard } from "~/components/server-card";
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
    const host = entry?.host ?? "";
    if (result.status === "fulfilled") {
      return { ...result.value, host, port };
    }
    return { offline: true as const, host, port };
  });

  return { servers };
}

type ViewMode = "grid" | "table";

function serverDisplayName(server: ServerListItem): string {
  if ("offline" in server && server.offline) return "Offline";
  return server.name ?? "Unknown server";
}

function serverMap(server: ServerListItem): string {
  if ("offline" in server && server.offline) return "—";
  return server.map ?? "—";
}

function serverPlayers(server: ServerListItem): string {
  if ("offline" in server && server.offline) return "—";
  const num = server.numplayers ?? 0;
  const max = server.maxplayers ?? 0;
  return `${num} / ${max}`;
}

function serverConnect(server: ServerListItem): string {
  if ("offline" in server && server.offline) {
    const { host = "", port } = server;
    return port != null ? `${host}:${port}` : host;
  }
  return server.connect ?? "—";
}

function serverPing(server: ServerListItem): string {
  if ("offline" in server && server.offline) return "—";
  return server.ping != null ? `${server.ping} ms` : "—";
}

type SelectedServer = { host: string; port: number } | null;

export default function Index() {
  const { servers } = useLoaderData<typeof loader>();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedServer, setSelectedServer] = useState<SelectedServer>(null);
  const fetcher = useFetcher<{ players?: Array<{ name?: string; raw?: Record<string, unknown> }> }>();

  useEffect(() => {
    if (!selectedServer) return;
    const url = `/api/servers/players?host=${encodeURIComponent(selectedServer.host)}&port=${selectedServer.port}`;
    fetcher.load(url);
  }, [selectedServer]);

  const hasServers = Array.isArray(servers) && servers.length > 0;
  const players = fetcher.data?.players ?? [];
  const sortedPlayers = [...players].sort((a, b) =>
    (a.name ?? "").localeCompare(b.name ?? "")
  );

  return (
    <div className="m-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-white">
          Servers
        </h1>
        <div className="flex rounded-lg border border-stone-600/50 bg-stone-900/50 p-1">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              viewMode === "grid"
                ? "bg-stone-600/80 text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              viewMode === "table"
                ? "bg-stone-600/80 text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Table
          </button>
        </div>
      </div>

      {!hasServers ? (
        <p className="rounded-xl border border-stone-600/50 bg-stone-900/80 px-6 py-8 text-center text-neutral-400">
          No servers configured or all servers offline.
        </p>
      ) : viewMode === "grid" ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servers.map((server, i) => (
            <li key={i}>
              <ServerCard
                server={server}
                onSelect={(s) =>
                  setSelectedServer({
                    host: s.host ?? "",
                    port: s.port ?? DEFAULT_PORT
                  })
                }
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-600/50 bg-stone-900/80 shadow-lg backdrop-blur-sm">
          <table className="w-full min-w-[480px] border-collapse text-left">
            <thead>
              <tr className="border-b border-stone-600/50">
                <th className="px-4 py-3 font-display text-sm font-medium text-white">
                  Server
                </th>
                <th className="px-4 py-3 font-display text-sm font-medium text-white">
                  Map
                </th>
                <th className="px-4 py-3 font-display text-sm font-medium text-white">
                  Players
                </th>
                <th className="px-4 py-3 font-display text-sm font-medium text-white">
                  Connect
                </th>
                <th className="px-4 py-3 font-display text-sm font-medium text-white">
                  Ping
                </th>
              </tr>
            </thead>
            <tbody>
              {servers.map((server, i) => (
                <tr
                  key={i}
                  className="border-b border-stone-600/30 last:border-b-0"
                >
                  <td className="px-4 py-3 text-white">
                    {serverDisplayName(server)}
                  </td>
                  <td className="px-4 py-3 text-neutral-300">
                    {serverMap(server)}
                  </td>
                  <td className="px-4 py-3 text-neutral-300">
                    {serverPlayers(server)}
                  </td>
                  <td className="px-4 py-3 text-neutral-400 text-sm">
                    {serverConnect(server)}
                  </td>
                  <td className="px-4 py-3 text-neutral-400 text-sm">
                    {serverPing(server)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal hidden={!selectedServer} blur>
        <ModalHeader
          title="Players"
          onClose={() => setSelectedServer(null)}
        />
        <div className="min-w-[200px] px-4 py-3">
          {fetcher.state === "loading" ? (
            <p className="text-neutral-400">Loading players…</p>
          ) : sortedPlayers.length === 0 ? (
            <p className="text-neutral-400">No players</p>
          ) : (
            <ul className="space-y-1.5 text-sm text-white">
              {sortedPlayers.map((player, i) => (
                <li key={i}>
                  {player.name?.trim() ? player.name : "—"}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </div>
  );
}
