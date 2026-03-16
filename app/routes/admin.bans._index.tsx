/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useFetcher, useLoaderData } from "react-router";
import { getMetaTitle } from "~/root-meta";
import { requireUser } from "~/auth.server";
import {
  listBans,
  addBan,
  unban,
  type SaBan
} from "~/admin/bans.server";
import type { Route } from "./+types/admin.bans._index";

export const meta = getMetaTitle("Admin · Bans");

const ADMIN_ID_PLACEHOLDER = 0;

export async function loader(_args: Route.LoaderArgs) {
  const bans = await listBans();
  return { bans };
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") return { ok: false, error: "Method not allowed" };
  const formData = await request.formData();
  const intent = formData.get("intent") as string | null;

  if (intent === "add-ban") {
    const user = await requireUser(request);
    const player_name = String(formData.get("player_name") ?? "").trim();
    const player_steamid = String(formData.get("player_steamid") ?? "").trim();
    const player_ip = (formData.get("player_ip") as string)?.trim() || undefined;
    const reason = String(formData.get("reason") ?? "").trim();
    const duration = Number(formData.get("duration")) || 0;
    const endsRaw = (formData.get("ends") as string)?.trim();
    const ends = endsRaw ? endsRaw : null;
    if (!player_name || !player_steamid || !reason) {
      return { ok: false, error: "Zorunlu alanlar eksik." };
    }
    return addBan({
      player_name,
      player_steamid,
      player_ip,
      admin_steamid: user.id,
      admin_name: user.name,
      reason,
      duration,
      ends
    });
  }

  if (intent === "unban") {
    const banId = Number(formData.get("banId"));
    const reason = String(formData.get("reason") ?? "Unbanned by admin").trim();
    if (!banId) return { ok: false, error: "Ban ID gerekli." };
    return unban(banId, ADMIN_ID_PLACEHOLDER, reason);
  }

  return { ok: false, error: "Bilinmeyen işlem." };
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toLocaleString();
  } catch {
    return value;
  }
}

export default function AdminBans() {
  const { bans } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const actionError =
    fetcher.data && "ok" in fetcher.data && !fetcher.data.ok
      ? (fetcher.data as { error: string }).error
      : null;
  const showError =
    actionError &&
    (fetcher.formData?.get("intent") === "add-ban" || fetcher.formData?.get("intent") === "unban");

  return (
    <div className="m-auto max-w-5xl px-4 py-6">
      <h1 className="font-display text-xl font-semibold text-white mb-4">Bans</h1>
      {showError && <p className="mb-4 text-sm text-red-400">{actionError}</p>}
      <fetcher.Form method="post" className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-stone-600/50 bg-stone-900/80 p-4 sm:grid-cols-2">
        <input type="hidden" name="intent" value="add-ban" />
        <input
          type="text"
          name="player_name"
          placeholder="Oyuncu adı"
          className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
        />
        <input
          type="text"
          name="player_steamid"
          placeholder="Oyuncu Steam ID"
          className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
        />
        <input
          type="text"
          name="player_ip"
          placeholder="Oyuncu IP (opsiyonel)"
          className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
        />
        <input
          type="text"
          name="reason"
          placeholder="Sebep"
          className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500 sm:col-span-2"
        />
        <input
          type="number"
          name="duration"
          placeholder="Süre (saniye)"
          className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
        />
        <input
          type="text"
          name="ends"
          placeholder="Bitiş (opsiyonel)"
          className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
        />
        <button
          type="submit"
          disabled={fetcher.state !== "idle"}
          className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50 sm:col-span-2"
        >
          {fetcher.state !== "idle" ? "Ekleniyor…" : "Ban Ekle"}
        </button>
      </fetcher.Form>
      <div className="overflow-hidden rounded-xl border border-stone-600/60 bg-stone-900/90 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-stone-600 bg-stone-800/80">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300">Oyuncu</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300">Steam ID</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300">Sebep</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300">Süre</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300">Bitiş</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300">Durum</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300">Tarih</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="text-neutral-300">
              {bans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-neutral-500">
                    Ban yok.
                  </td>
                </tr>
              ) : (
                bans.map((row: SaBan) => (
                  <tr
                    key={row.id}
                    className="border-b border-stone-700/40 transition-colors hover:bg-stone-800/50"
                  >
                    <td className="px-4 py-3 font-medium text-white">{row.player_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-stone-400">{row.player_steamid}</td>
                    <td className="max-w-[160px] truncate px-4 py-3 text-stone-300" title={row.reason}>
                      {row.reason}
                    </td>
                    <td className="px-4 py-3">{row.duration}</td>
                    <td className="px-4 py-3 text-stone-400">{formatDate(row.ends)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${row.status === "ACTIVE" ? "bg-amber-500/20 text-amber-400" : "bg-stone-600/50 text-stone-400"}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-400">{formatDate(row.created)}</td>
                    <td className="px-4 py-3 text-right">
                      {row.status === "ACTIVE" && (
                        <fetcher.Form method="post" className="inline">
                          <input type="hidden" name="intent" value="unban" />
                          <input type="hidden" name="banId" value={row.id} />
                          <input type="hidden" name="reason" value="Unbanned by admin" />
                          <button
                            type="submit"
                            disabled={fetcher.state !== "idle"}
                            className="rounded-md bg-red-900/70 px-2.5 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-800 disabled:opacity-50"
                          >
                            Kaldır
                          </button>
                        </fetcher.Form>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
