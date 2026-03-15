/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";
import { Link, useFetcher, useLoaderData } from "react-router";
import { getMetaTitle } from "~/root-meta";
import {
  listBans,
  addBan,
  unban,
  type SaBan,
  type AddBanParams
} from "~/admin/bans.server";
import {
  listMutes,
  addMute,
  unmute,
  type SaMute,
  type AddMuteParams,
  type MuteType
} from "~/admin/mutes.server";
import {
  listServers,
  addServer,
  updateServer,
  removeServer,
  type ServerRow
} from "~/admin/servers.server";
import type { Route } from "./+types/admin._index";

export const meta = getMetaTitle("Admin");

const ADMIN_ID_PLACEHOLDER = 0;

export async function loader(_args: Route.LoaderArgs) {
  const [bans, mutes, servers] = await Promise.all([
    listBans(),
    listMutes(),
    listServers()
  ]);
  return { bans, mutes, servers };
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") return { ok: false, error: "Method not allowed" };
  const formData = await request.formData();
  const intent = formData.get("intent") as string | null;

  if (intent === "add-ban") {
    const player_name = String(formData.get("player_name") ?? "").trim();
    const player_steamid = String(formData.get("player_steamid") ?? "").trim();
    const player_ip = (formData.get("player_ip") as string)?.trim() || undefined;
    const admin_steamid = String(formData.get("admin_steamid") ?? "").trim();
    const admin_name = String(formData.get("admin_name") ?? "").trim();
    const reason = String(formData.get("reason") ?? "").trim();
    const duration = Number(formData.get("duration")) || 0;
    const endsRaw = (formData.get("ends") as string)?.trim();
    const ends = endsRaw ? endsRaw : null;
    if (!player_name || !player_steamid || !admin_steamid || !admin_name || !reason) {
      return { ok: false, error: "Missing required fields for ban." };
    }
    const result = await addBan({
      player_name,
      player_steamid,
      player_ip,
      admin_steamid,
      admin_name,
      reason,
      duration,
      ends
    });
    return result;
  }

  if (intent === "unban") {
    const banId = Number(formData.get("banId"));
    const reason = String(formData.get("reason") ?? "Unbanned by admin").trim();
    if (!banId) return { ok: false, error: "Missing ban ID." };
    const result = await unban(banId, ADMIN_ID_PLACEHOLDER, reason);
    return result;
  }

  if (intent === "add-mute") {
    const player_name = String(formData.get("player_name") ?? "").trim();
    const player_steamid = String(formData.get("player_steamid") ?? "").trim();
    const admin_steamid = String(formData.get("admin_steamid") ?? "").trim();
    const admin_name = String(formData.get("admin_name") ?? "").trim();
    const reason = String(formData.get("reason") ?? "").trim();
    const duration = Number(formData.get("duration")) || 0;
    const endsRaw = (formData.get("ends") as string)?.trim();
    const ends = endsRaw ? endsRaw : null;
    const type = (formData.get("type") as MuteType) || "GAG";
    if (!player_name || !player_steamid || !admin_steamid || !admin_name || !reason) {
      return { ok: false, error: "Missing required fields for mute." };
    }
    const result = await addMute({
      player_name,
      player_steamid,
      admin_steamid,
      admin_name,
      reason,
      duration,
      ends,
      type: type || "GAG"
    });
    return result;
  }

  if (intent === "unmute") {
    const muteId = Number(formData.get("muteId"));
    const reason = String(formData.get("reason") ?? "Unmuted by admin").trim();
    if (!muteId) return { ok: false, error: "Missing mute ID." };
    const result = await unmute(muteId, ADMIN_ID_PLACEHOLDER, reason);
    return result;
  }

  if (intent === "add-server") {
    const host = String(formData.get("host") ?? "").trim();
    const portRaw = formData.get("port");
    const port = portRaw !== null && portRaw !== "" ? Number(portRaw) : undefined;
    const gamemode = (formData.get("gamemode") as string)?.trim() || undefined;
    if (!host) return { ok: false, error: "Host is required." };
    const result = await addServer({ host, port, gamemode });
    return result;
  }

  if (intent === "update-server") {
    const id = Number(formData.get("id"));
    if (!id) return { ok: false, error: "Server ID is required." };
    const host = (formData.get("host") as string)?.trim();
    const portRaw = formData.get("port");
    const port = portRaw !== null && portRaw !== "" ? Number(portRaw) : undefined;
    const gamemode = (formData.get("gamemode") as string)?.trim();
    const sortOrderRaw = formData.get("sort_order");
    const sort_order =
      sortOrderRaw !== null && sortOrderRaw !== "" ? Number(sortOrderRaw) : undefined;
    const result = await updateServer(id, {
      ...(host !== undefined && { host }),
      ...(port !== undefined && { port }),
      ...(gamemode !== undefined && { gamemode }),
      ...(sort_order !== undefined && { sort_order })
    });
    return result;
  }

  if (intent === "remove-server") {
    const id = Number(formData.get("id"));
    if (!id) return { ok: false, error: "Server ID is required." };
    const result = await removeServer(id);
    return result;
  }

  return { ok: false, error: "Unknown action." };
}

const SECTIONS = [
  { id: "vips", label: "VIP", href: "#vips" },
  { id: "bans", label: "Bans", href: "#bans" },
  { id: "mutes", label: "Mutes", href: "#mutes" },
  { id: "servers", label: "Server info", href: "#servers" }
] as const;

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toLocaleString();
  } catch {
    return value;
  }
}

export default function AdminIndex() {
  const { bans, mutes, servers } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const actionError =
    fetcher.data && "ok" in fetcher.data && !fetcher.data.ok
      ? (fetcher.data as { error: string }).error
      : null;

  return (
    <div className="m-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-2xl font-semibold text-white mb-6">
        Admin
      </h1>
      <nav
        className="mb-8 flex flex-wrap gap-2 rounded-lg border border-stone-600/50 bg-stone-900/50 p-2"
        aria-label="Admin sections"
      >
        {SECTIONS.map(({ id, label, href }) => (
          <Link
            key={id}
            to={href}
            className="rounded-md px-3 py-2 text-sm font-medium text-neutral-300 transition hover:bg-stone-600/80 hover:text-white"
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="space-y-10">
        <section id="vips" className="rounded-xl border border-stone-600/50 bg-stone-900/80 px-6 py-4">
          <h2 className="font-display text-lg font-medium text-white mb-2">VIP</h2>
          <p className="text-neutral-400 text-sm">Manage VIP packages and users. (Placeholder)</p>
        </section>

        <section id="bans" className="rounded-xl border border-stone-600/50 bg-stone-900/80 px-6 py-4">
          <h2 className="font-display text-lg font-medium text-white mb-2">Bans</h2>
          {actionError && (fetcher.formData?.get("intent") === "add-ban" || fetcher.formData?.get("intent") === "unban") && (
            <p className="text-red-400 text-sm mb-2">{actionError}</p>
          )}
          <fetcher.Form method="post" className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input type="hidden" name="intent" value="add-ban" />
            <input
              type="text"
              name="player_name"
              placeholder="Player name"
              className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
            />
            <input
              type="text"
              name="player_steamid"
              placeholder="Player Steam ID"
              className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
            />
            <input
              type="text"
              name="player_ip"
              placeholder="Player IP (optional)"
              className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
            />
            <input
              type="text"
              name="admin_steamid"
              placeholder="Admin Steam ID"
              className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
            />
            <input
              type="text"
              name="admin_name"
              placeholder="Admin name"
              className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
            />
            <input
              type="text"
              name="reason"
              placeholder="Reason"
              className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500 sm:col-span-2"
            />
            <input
              type="number"
              name="duration"
              placeholder="Duration (seconds)"
              className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
            />
            <input
              type="text"
              name="ends"
              placeholder="Ends (optional, e.g. 2025-12-31 23:59:59)"
              className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
            />
            <button
              type="submit"
              disabled={fetcher.state !== "idle"}
              className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50 sm:col-span-2"
            >
              {fetcher.state !== "idle" ? "Adding…" : "Add ban"}
            </button>
          </fetcher.Form>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-300">
              <thead>
                <tr className="border-b border-stone-600">
                  <th className="py-2 pr-2 font-medium text-white">Player</th>
                  <th className="py-2 pr-2 font-medium text-white">Steam ID</th>
                  <th className="py-2 pr-2 font-medium text-white">Reason</th>
                  <th className="py-2 pr-2 font-medium text-white">Duration</th>
                  <th className="py-2 pr-2 font-medium text-white">Ends</th>
                  <th className="py-2 pr-2 font-medium text-white">Status</th>
                  <th className="py-2 pr-2 font-medium text-white">Created</th>
                  <th className="py-2 pr-2 font-medium text-white">Action</th>
                </tr>
              </thead>
              <tbody>
                {bans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-4 text-neutral-500">
                      No bans.
                    </td>
                  </tr>
                ) : (
                  bans.map((row: SaBan) => (
                    <tr key={row.id} className="border-b border-stone-700/50">
                      <td className="py-2 pr-2">{row.player_name}</td>
                      <td className="py-2 pr-2 font-mono text-xs">{row.player_steamid}</td>
                      <td className="py-2 pr-2 max-w-[120px] truncate" title={row.reason}>{row.reason}</td>
                      <td className="py-2 pr-2">{row.duration}</td>
                      <td className="py-2 pr-2">{formatDate(row.ends)}</td>
                      <td className="py-2 pr-2">{row.status}</td>
                      <td className="py-2 pr-2">{formatDate(row.created)}</td>
                      <td className="py-2 pr-2">
                        {row.status === "ACTIVE" && (
                          <UnbanForm banId={row.id} fetcher={fetcher} />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section id="mutes" className="rounded-xl border border-stone-600/50 bg-stone-900/80 px-6 py-4">
          <h2 className="font-display text-lg font-medium text-white mb-2">Mutes</h2>
          {actionError && (fetcher.formData?.get("intent") === "add-mute" || fetcher.formData?.get("intent") === "unmute") && (
            <p className="text-red-400 text-sm mb-2">{actionError}</p>
          )}
          <fetcher.Form method="post" className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input type="hidden" name="intent" value="add-mute" />
            <input
              type="text"
              name="player_name"
              placeholder="Player name"
              className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
            />
            <input
              type="text"
              name="player_steamid"
              placeholder="Player Steam ID"
              className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
            />
            <input
              type="text"
              name="admin_steamid"
              placeholder="Admin Steam ID"
              className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
            />
            <input
              type="text"
              name="admin_name"
              placeholder="Admin name"
              className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
            />
            <select
              name="type"
              className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white"
            >
              <option value="GAG">GAG</option>
              <option value="MUTE">MUTE</option>
              <option value="SILENCE">SILENCE</option>
            </select>
            <input
              type="text"
              name="reason"
              placeholder="Reason"
              className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
            />
            <input
              type="number"
              name="duration"
              placeholder="Duration (seconds)"
              className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
            />
            <input
              type="text"
              name="ends"
              placeholder="Ends (optional)"
              className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
            />
            <button
              type="submit"
              disabled={fetcher.state !== "idle"}
              className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50 sm:col-span-2"
            >
              {fetcher.state !== "idle" ? "Adding…" : "Add mute"}
            </button>
          </fetcher.Form>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-300">
              <thead>
                <tr className="border-b border-stone-600">
                  <th className="py-2 pr-2 font-medium text-white">Player</th>
                  <th className="py-2 pr-2 font-medium text-white">Steam ID</th>
                  <th className="py-2 pr-2 font-medium text-white">Type</th>
                  <th className="py-2 pr-2 font-medium text-white">Reason</th>
                  <th className="py-2 pr-2 font-medium text-white">Duration</th>
                  <th className="py-2 pr-2 font-medium text-white">Ends</th>
                  <th className="py-2 pr-2 font-medium text-white">Status</th>
                  <th className="py-2 pr-2 font-medium text-white">Created</th>
                  <th className="py-2 pr-2 font-medium text-white">Action</th>
                </tr>
              </thead>
              <tbody>
                {mutes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-4 text-neutral-500">
                      No mutes.
                    </td>
                  </tr>
                ) : (
                  mutes.map((row: SaMute) => (
                    <tr key={row.id} className="border-b border-stone-700/50">
                      <td className="py-2 pr-2">{row.player_name}</td>
                      <td className="py-2 pr-2 font-mono text-xs">{row.player_steamid}</td>
                      <td className="py-2 pr-2">{row.type || "—"}</td>
                      <td className="py-2 pr-2 max-w-[120px] truncate" title={row.reason}>{row.reason}</td>
                      <td className="py-2 pr-2">{row.duration}</td>
                      <td className="py-2 pr-2">{formatDate(row.ends)}</td>
                      <td className="py-2 pr-2">{row.status}</td>
                      <td className="py-2 pr-2">{formatDate(row.created)}</td>
                      <td className="py-2 pr-2">
                        {row.status === "ACTIVE" && (
                          <UnmuteForm muteId={row.id} fetcher={fetcher} />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section id="servers" className="rounded-xl border border-stone-600/50 bg-stone-900/80 px-6 py-4">
          <h2 className="font-display text-lg font-medium text-white mb-2">Servers</h2>
          {actionError &&
            ["add-server", "update-server", "remove-server"].includes(
              String(fetcher.formData?.get("intent") ?? "")
            ) && <p className="text-red-400 text-sm mb-2">{actionError}</p>}
          <fetcher.Form method="post" className="mb-4 flex flex-wrap gap-3 items-end">
            <input type="hidden" name="intent" value="add-server" />
            <input
              type="text"
              name="host"
              placeholder="Host (IP or hostname)"
              required
              className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500 min-w-[140px]"
            />
            <input
              type="number"
              name="port"
              placeholder="Port (optional)"
              className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500 w-24"
            />
            <input
              type="text"
              name="gamemode"
              placeholder="Gamemode (optional)"
              className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500 min-w-[100px]"
            />
            <button
              type="submit"
              disabled={fetcher.state !== "idle"}
              className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
            >
              {fetcher.state !== "idle" && fetcher.formData?.get("intent") === "add-server"
                ? "Adding…"
                : "Add server"}
            </button>
          </fetcher.Form>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-300">
              <thead>
                <tr className="border-b border-stone-600">
                  <th className="py-2 pr-2 font-medium text-white">Host</th>
                  <th className="py-2 pr-2 font-medium text-white">Port</th>
                  <th className="py-2 pr-2 font-medium text-white">Gamemode</th>
                  <th className="py-2 pr-2 font-medium text-white">Sort order</th>
                  <th className="py-2 pr-2 font-medium text-white">Action</th>
                </tr>
              </thead>
              <tbody>
                {servers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-neutral-500">
                      No servers. Add one above or configure MySQL server_list; homepage uses
                      app/data/servers fallback when empty.
                    </td>
                  </tr>
                ) : (
                  servers.map((row: ServerRow) => (
                    <ServerRowWithActions key={row.id} server={row} fetcher={fetcher} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function UnbanForm({ banId, fetcher }: { banId: number; fetcher: ReturnType<typeof useFetcher<typeof action>> }) {
  const isUnbanning =
    fetcher.formData?.get("intent") === "unban" && Number(fetcher.formData?.get("banId")) === banId;
  return (
    <fetcher.Form method="post" className="inline">
      <input type="hidden" name="intent" value="unban" />
      <input type="hidden" name="banId" value={banId} />
      <input type="hidden" name="reason" value="Unbanned by admin" />
      <button
        type="submit"
        disabled={fetcher.state !== "idle"}
        className="rounded bg-red-900/80 px-2 py-1 text-xs font-medium text-red-200 hover:bg-red-800 disabled:opacity-50"
      >
        {isUnbanning && fetcher.state !== "idle" ? "Unbanning…" : "Unban"}
      </button>
    </fetcher.Form>
  );
}

function UnmuteForm({ muteId, fetcher }: { muteId: number; fetcher: ReturnType<typeof useFetcher<typeof action>> }) {
  const isUnmuting =
    fetcher.formData?.get("intent") === "unmute" && Number(fetcher.formData?.get("muteId")) === muteId;
  return (
    <fetcher.Form method="post" className="inline">
      <input type="hidden" name="intent" value="unmute" />
      <input type="hidden" name="muteId" value={muteId} />
      <input type="hidden" name="reason" value="Unmuted by admin" />
      <button
        type="submit"
        disabled={fetcher.state !== "idle"}
        className="rounded bg-red-900/80 px-2 py-1 text-xs font-medium text-red-200 hover:bg-red-800 disabled:opacity-50"
      >
        {isUnmuting && fetcher.state !== "idle" ? "Unmuting…" : "Unmute"}
      </button>
    </fetcher.Form>
  );
}

function ServerRowWithActions({
  server,
  fetcher
}: {
  server: ServerRow;
  fetcher: ReturnType<typeof useFetcher<typeof action>>;
}) {
  const [editing, setEditing] = useState(false);
  const [host, setHost] = useState(server.host);
  const [port, setPort] = useState(String(server.port ?? ""));
  const [gamemode, setGamemode] = useState(server.gamemode ?? "");
  const [sortOrder, setSortOrder] = useState(String(server.sort_order ?? ""));

  const isUpdating =
    fetcher.formData?.get("intent") === "update-server" &&
    Number(fetcher.formData?.get("id")) === server.id;
  const isRemoving =
    fetcher.formData?.get("intent") === "remove-server" &&
    Number(fetcher.formData?.get("id")) === server.id;

  useEffect(() => {
    setHost(server.host);
    setPort(String(server.port ?? ""));
    setGamemode(server.gamemode ?? "");
    setSortOrder(String(server.sort_order ?? ""));
  }, [server.id, server.host, server.port, server.gamemode, server.sort_order]);

  useEffect(() => {
    if (editing && fetcher.state === "idle" && fetcher.data && "ok" in fetcher.data && fetcher.data.ok) {
      setEditing(false);
    }
  }, [editing, fetcher.state, fetcher.data]);

  if (editing) {
    return (
      <tr className="border-b border-stone-700/50">
        <td className="py-2 pr-2">
          <input
            type="text"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            className="rounded border border-stone-600 bg-stone-800 px-2 py-1 text-sm text-white w-full min-w-[120px]"
          />
        </td>
        <td className="py-2 pr-2">
          <input
            type="number"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            placeholder="—"
            className="rounded border border-stone-600 bg-stone-800 px-2 py-1 text-sm text-white w-20"
          />
        </td>
        <td className="py-2 pr-2">
          <input
            type="text"
            value={gamemode}
            onChange={(e) => setGamemode(e.target.value)}
            className="rounded border border-stone-600 bg-stone-800 px-2 py-1 text-sm text-white min-w-[80px]"
          />
        </td>
        <td className="py-2 pr-2">
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="rounded border border-stone-600 bg-stone-800 px-2 py-1 text-sm text-white w-16"
          />
        </td>
        <td className="py-2 pr-2 flex gap-1">
          <fetcher.Form method="post" className="inline">
            <input type="hidden" name="intent" value="update-server" />
            <input type="hidden" name="id" value={server.id} />
            <input type="hidden" name="host" value={host} />
            <input type="hidden" name="port" value={port || ""} />
            <input type="hidden" name="gamemode" value={gamemode} />
            <input type="hidden" name="sort_order" value={sortOrder || ""} />
            <button
              type="submit"
              disabled={fetcher.state !== "idle"}
              className="rounded bg-amber-600/80 px-2 py-1 text-xs font-medium text-white hover:bg-amber-500 disabled:opacity-50"
            >
              {isUpdating && fetcher.state !== "idle" ? "Saving…" : "Save"}
            </button>
          </fetcher.Form>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded bg-stone-600 px-2 py-1 text-xs font-medium text-white hover:bg-stone-500"
          >
            Cancel
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-stone-700/50">
      <td className="py-2 pr-2">{server.host}</td>
      <td className="py-2 pr-2">{server.port ?? "—"}</td>
      <td className="py-2 pr-2">{server.gamemode ?? "—"}</td>
      <td className="py-2 pr-2">{server.sort_order ?? "—"}</td>
      <td className="py-2 pr-2 flex gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded bg-stone-600 px-2 py-1 text-xs font-medium text-neutral-200 hover:bg-stone-500"
        >
          Edit
        </button>
        <fetcher.Form method="post" className="inline">
          <input type="hidden" name="intent" value="remove-server" />
          <input type="hidden" name="id" value={server.id} />
          <button
            type="submit"
            disabled={fetcher.state !== "idle"}
            className="rounded bg-red-900/80 px-2 py-1 text-xs font-medium text-red-200 hover:bg-red-800 disabled:opacity-50"
          >
            {isRemoving && fetcher.state !== "idle" ? "Removing…" : "Remove"}
          </button>
        </fetcher.Form>
      </td>
    </tr>
  );
}
