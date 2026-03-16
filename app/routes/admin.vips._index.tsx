/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useFetcher, useLoaderData } from "react-router";
import { getMetaTitle } from "~/root-meta";
import { listVips, addVip, removeVip, type VipUser } from "~/admin/vip.server";
import type { Route } from "./+types/admin.vips._index";

export const meta = getMetaTitle("Admin · VIP");

export async function loader(_args: Route.LoaderArgs) {
  const vips = await listVips();
  return { vips };
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") return { ok: false, error: "Method not allowed" };
  const formData = await request.formData();
  const intent = formData.get("intent") as string | null;

  if (intent === "add-vip") {
    const account_id = Number(formData.get("account_id")) || 0;
    const name = String(formData.get("name") ?? "").trim();
    const lastvisit = Number(formData.get("lastvisit")) || 0;
    const sid = Number(formData.get("sid")) || 0;
    const group = String(formData.get("group") ?? "").trim();
    const expires = Number(formData.get("expires")) || 0;
    if (!account_id || !name || !sid || !group) {
      return { ok: false, error: "account_id, name, sid ve group zorunludur." };
    }
    return addVip({ account_id, name, lastvisit, sid, group, expires });
  }

  if (intent === "remove-vip") {
    const account_id = Number(formData.get("account_id"));
    const sid = Number(formData.get("sid"));
    if (!account_id || !sid) return { ok: false, error: "account_id ve sid gerekli." };
    return removeVip(account_id, sid);
  }

  return { ok: false, error: "Bilinmeyen işlem." };
}

export default function AdminVips() {
  const { vips } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const actionError =
    fetcher.data && "ok" in fetcher.data && !fetcher.data.ok
      ? (fetcher.data as { error: string }).error
      : null;

  return (
    <div className="m-auto max-w-4xl px-4 py-6">
      <h1 className="font-display text-xl font-semibold text-white mb-4">VIP</h1>
      {actionError && (
        <p className="mb-4 text-sm text-red-400">{actionError}</p>
      )}
      <fetcher.Form method="post" className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-stone-600/50 bg-stone-900/80 p-4 sm:grid-cols-2">
        <input type="hidden" name="intent" value="add-vip" />
        <input
          type="number"
          name="account_id"
          placeholder="Account ID"
          required
          className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
        />
        <input
          type="text"
          name="name"
          placeholder="İsim"
          required
          className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
        />
        <input
          type="number"
          name="lastvisit"
          placeholder="Last visit (unix)"
          className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
        />
        <input
          type="number"
          name="sid"
          placeholder="SID"
          required
          className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
        />
        <input
          type="text"
          name="group"
          placeholder="Group"
          required
          className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
        />
        <input
          type="number"
          name="expires"
          placeholder="Expires (unix)"
          className="rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
        />
        <button
          type="submit"
          disabled={fetcher.state !== "idle"}
          className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50 sm:col-span-2"
        >
          {fetcher.state !== "idle" ? "Ekleniyor…" : "VIP Ekle"}
        </button>
      </fetcher.Form>
      <div className="overflow-hidden rounded-xl border border-stone-600/60 bg-stone-900/90 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-stone-600 bg-stone-800/80">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300">Account ID</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300">İsim</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300">SID</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300">Group</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300">Expires</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="text-neutral-300">
              {vips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-neutral-500">
                    VIP kaydı yok.
                  </td>
                </tr>
              ) : (
                vips.map((row: VipUser) => (
                  <tr
                    key={`${row.account_id}-${row.sid}`}
                    className="border-b border-stone-700/40 transition-colors hover:bg-stone-800/50"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-stone-400">{row.account_id}</td>
                    <td className="px-4 py-3 font-medium text-white">{row.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-stone-400">{row.sid}</td>
                    <td className="px-4 py-3">{row.group}</td>
                    <td className="px-4 py-3 font-mono text-xs text-stone-400">{row.expires || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <fetcher.Form method="post" className="inline">
                        <input type="hidden" name="intent" value="remove-vip" />
                        <input type="hidden" name="account_id" value={row.account_id} />
                        <input type="hidden" name="sid" value={row.sid} />
                        <button
                          type="submit"
                          disabled={fetcher.state !== "idle"}
                          className="rounded-md bg-red-900/70 px-2.5 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-800 disabled:opacity-50"
                        >
                          Kaldır
                        </button>
                      </fetcher.Form>
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
