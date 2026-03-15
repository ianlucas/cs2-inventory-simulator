/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

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
import type { Route } from "./+types/admin._index";

export const meta = getMetaTitle("Admin");

const ADMIN_ID_PLACEHOLDER = 0;

export async function loader(_args: Route.LoaderArgs) {
  const [bans, mutes] = await Promise.all([listBans(), listMutes()]);
  return { bans, mutes };
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
  const { bans, mutes } = useLoaderData<typeof loader>();
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
          <h2 className="font-display text-lg font-medium text-white mb-2">Server info</h2>
          <p className="text-neutral-400 text-sm">Server configuration and status. (Placeholder)</p>
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
