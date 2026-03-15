/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Link, Form, useLoaderData, useActionData } from "react-router";
import { getMetaTitle } from "~/root-meta";
import { listVips, addVip, removeVip } from "~/admin/vip.server";
import type { Route } from "./+types/admin._index";

export const meta = getMetaTitle("Admin");

export async function loader(_args: Route.LoaderArgs) {
  const vips = await listVips();
  return { vips };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "add-vip") {
    const account_id = Number(formData.get("account_id") ?? 0);
    const name = String(formData.get("name") ?? "").trim();
    const lastvisit = Number(formData.get("lastvisit") ?? 0);
    const sid = Number(formData.get("sid") ?? 0);
    const group = String(formData.get("group") ?? "").trim();
    const expires = Number(formData.get("expires") ?? 0);
    const result = await addVip({
      account_id,
      name,
      lastvisit,
      sid,
      group,
      expires
    });
    if (result.ok) {
      return { ok: true, intent: "add-vip" };
    }
    return { ok: false, error: result.error, intent: "add-vip" };
  }
  if (intent === "remove-vip") {
    const account_id = Number(formData.get("account_id") ?? 0);
    const sid = Number(formData.get("sid") ?? 0);
    const result = await removeVip(account_id, sid);
    if (result.ok) {
      return { ok: true, intent: "remove-vip" };
    }
    return { ok: false, error: result.error, intent: "remove-vip" };
  }
  return { ok: false, error: "Unknown action" };
}

const SECTIONS = [
  { id: "vips", label: "VIP", href: "#vips" },
  { id: "bans", label: "Bans", href: "#bans" },
  { id: "mutes", label: "Mutes", href: "#mutes" },
  { id: "servers", label: "Server info", href: "#servers" }
] as const;

export default function AdminIndex() {
  const { vips } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

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
          {actionData?.ok === false && actionData?.error && (
            <p className="mb-2 text-sm text-red-400" role="alert">
              {actionData.error}
            </p>
          )}
          <div className="mb-4 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm text-neutral-300">
              <thead>
                <tr className="border-b border-stone-600/50">
                  <th className="py-2 pr-2 font-medium text-white">account_id</th>
                  <th className="py-2 pr-2 font-medium text-white">name</th>
                  <th className="py-2 pr-2 font-medium text-white">lastvisit</th>
                  <th className="py-2 pr-2 font-medium text-white">sid</th>
                  <th className="py-2 pr-2 font-medium text-white">group</th>
                  <th className="py-2 pr-2 font-medium text-white">expires</th>
                  <th className="py-2 font-medium text-white w-20">Action</th>
                </tr>
              </thead>
              <tbody>
                {vips.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-3 text-neutral-500">
                      No VIP entries yet.
                    </td>
                  </tr>
                ) : (
                  vips.map((v) => (
                    <tr key={`${v.account_id}-${v.sid}`} className="border-b border-stone-700/50">
                      <td className="py-2 pr-2">{v.account_id}</td>
                      <td className="py-2 pr-2">{v.name}</td>
                      <td className="py-2 pr-2">{v.lastvisit}</td>
                      <td className="py-2 pr-2">{v.sid}</td>
                      <td className="py-2 pr-2">{v.group}</td>
                      <td className="py-2 pr-2">{v.expires}</td>
                      <td className="py-2">
                        <Form method="post" className="inline">
                          <input type="hidden" name="intent" value="remove-vip" />
                          <input type="hidden" name="account_id" value={v.account_id} />
                          <input type="hidden" name="sid" value={v.sid} />
                          <button
                            type="submit"
                            className="rounded bg-red-900/60 px-2 py-1 text-xs font-medium text-red-300 hover:bg-red-800/80"
                          >
                            Remove
                          </button>
                        </Form>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Form method="post" className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="intent" value="add-vip" />
            <label className="flex flex-col gap-1">
              <span className="text-xs text-neutral-400">account_id</span>
              <input
                type="number"
                name="account_id"
                required
                className="rounded border border-stone-600 bg-stone-800 px-2 py-1.5 text-sm text-white w-28"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-neutral-400">name</span>
              <input
                type="text"
                name="name"
                maxLength={64}
                className="rounded border border-stone-600 bg-stone-800 px-2 py-1.5 text-sm text-white w-40"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-neutral-400">lastvisit</span>
              <input
                type="number"
                name="lastvisit"
                className="rounded border border-stone-600 bg-stone-800 px-2 py-1.5 text-sm text-white w-28"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-neutral-400">sid</span>
              <input
                type="number"
                name="sid"
                required
                className="rounded border border-stone-600 bg-stone-800 px-2 py-1.5 text-sm text-white w-28"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-neutral-400">group</span>
              <input
                type="text"
                name="group"
                maxLength={64}
                className="rounded border border-stone-600 bg-stone-800 px-2 py-1.5 text-sm text-white w-32"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-neutral-400">expires</span>
              <input
                type="number"
                name="expires"
                className="rounded border border-stone-600 bg-stone-800 px-2 py-1.5 text-sm text-white w-28"
              />
            </label>
            <button
              type="submit"
              className="rounded bg-stone-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-500"
            >
              Add VIP
            </button>
          </Form>
        </section>
        <section id="bans" className="rounded-xl border border-stone-600/50 bg-stone-900/80 px-6 py-4">
          <h2 className="font-display text-lg font-medium text-white mb-2">Bans</h2>
          <p className="text-neutral-400 text-sm">View and manage bans. (Placeholder)</p>
        </section>
        <section id="mutes" className="rounded-xl border border-stone-600/50 bg-stone-900/80 px-6 py-4">
          <h2 className="font-display text-lg font-medium text-white mb-2">Mutes</h2>
          <p className="text-neutral-400 text-sm">View and manage mutes. (Placeholder)</p>
        </section>
        <section id="servers" className="rounded-xl border border-stone-600/50 bg-stone-900/80 px-6 py-4">
          <h2 className="font-display text-lg font-medium text-white mb-2">Server info</h2>
          <p className="text-neutral-400 text-sm">Server configuration and status. (Placeholder)</p>
        </section>
      </div>
    </div>
  );
}
