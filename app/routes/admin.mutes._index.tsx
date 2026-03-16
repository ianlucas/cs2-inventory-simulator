/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useFetcher, useLoaderData } from "react-router";
import { getMetaTitle } from "~/root-meta";
import { requireUser } from "~/auth.server";
import {
  listMutes,
  addMute,
  unmute,
  type SaMute,
  type MuteType
} from "~/admin/mutes.server";
import type { Route } from "./+types/admin.mutes._index";

export const meta = getMetaTitle("Admin · Mutes");

const ADMIN_ID_PLACEHOLDER = 0;

export async function loader(_args: Route.LoaderArgs) {
  const mutes = await listMutes();
  return { mutes };
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") return { ok: false, error: "Method not allowed" };
  const formData = await request.formData();
  const intent = formData.get("intent") as string | null;

  if (intent === "add-mute") {
    const user = await requireUser(request);
    const player_name = String(formData.get("player_name") ?? "").trim();
    const player_steamid = String(formData.get("player_steamid") ?? "").trim();
    const reason = String(formData.get("reason") ?? "").trim();
    const duration = Number(formData.get("duration")) || 0;
    const endsRaw = (formData.get("ends") as string)?.trim();
    const ends = endsRaw ? endsRaw : null;
    const type = (formData.get("type") as MuteType) || "GAG";
    if (!player_name || !player_steamid || !reason) {
      return { ok: false, error: "Zorunlu alanlar eksik." };
    }
    return addMute({
      player_name,
      player_steamid,
      admin_steamid: user.id,
      admin_name: user.name,
      reason,
      duration,
      ends,
      type: type || "GAG"
    });
  }

  if (intent === "unmute") {
    const muteId = Number(formData.get("muteId"));
    const reason = String(formData.get("reason") ?? "Unmuted by admin").trim();
    if (!muteId) return { ok: false, error: "Mute ID gerekli." };
    return unmute(muteId, ADMIN_ID_PLACEHOLDER, reason);
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

export default function AdminMutes() {
  const { mutes } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const actionError =
    fetcher.data && "ok" in fetcher.data && !fetcher.data.ok
      ? (fetcher.data as { error: string }).error
      : null;
  const showError =
    actionError &&
    (fetcher.formData?.get("intent") === "add-mute" ||
      fetcher.formData?.get("intent") === "unmute");

  return (
    <div className="m-auto max-w-5xl px-4 py-6">
      <h1 className="font-display text-xl font-semibold text-white mb-4">Mutes</h1>
      {showError && <p className="mb-4 text-sm text-red-400">{actionError}</p>}
      <fetcher.Form method="post" className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-stone-600/50 bg-stone-900/80 p-4 sm:grid-cols-2">
        <input type="hidden" name="intent" value="add-mute" />
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
          placeholder="Sebep"
          className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
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
          {fetcher.state !== "idle" ? "Ekleniyor…" : "Mute Ekle"}
        </button>
      </fetcher.Form>
      <div className="overflow-hidden rounded-xl border border-stone-600/60 bg-stone-900/90 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-stone-600 bg-stone-800/80">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300">Oyuncu</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300">Steam ID</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300">Tür</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300">Sebep</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300">Süre</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300">Bitiş</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300">Durum</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300">Tarih</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="text-neutral-300">
              {mutes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-neutral-500">
                    Mute yok.
                  </td>
                </tr>
              ) : (
                mutes.map((row: SaMute) => (
                  <tr
                    key={row.id}
                    className="border-b border-stone-700/40 transition-colors hover:bg-stone-800/50"
                  >
                    <td className="px-4 py-3 font-medium text-white">{row.player_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-stone-400">{row.player_steamid}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-stone-700/60 px-2 py-0.5 text-xs font-medium text-stone-300">
                        {row.type || "—"}
                      </span>
                    </td>
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
                          <input type="hidden" name="intent" value="unmute" />
                          <input type="hidden" name="muteId" value={row.id} />
                          <input type="hidden" name="reason" value="Unmuted by admin" />
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
