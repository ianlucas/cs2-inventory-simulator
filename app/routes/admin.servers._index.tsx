/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { getMetaTitle } from "~/root-meta";
import {
  listServers,
  addServer,
  updateServer,
  removeServer,
  type ServerRow
} from "~/admin/servers.server";
import type { Route } from "./+types/admin.servers._index";

export const meta = getMetaTitle("Admin · Sunucular");

export async function loader(_args: Route.LoaderArgs) {
  const servers = await listServers();
  return { servers };
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") return { ok: false, error: "Method not allowed" };
  const formData = await request.formData();
  const intent = formData.get("intent") as string | null;

  if (intent === "add-server") {
    const host = String(formData.get("host") ?? "").trim();
    const portRaw = formData.get("port");
    const port = portRaw !== null && portRaw !== "" ? Number(portRaw) : undefined;
    const gamemode = (formData.get("gamemode") as string)?.trim() || undefined;
    if (!host) return { ok: false, error: "Host zorunludur." };
    return addServer({ host, port, gamemode });
  }

  if (intent === "update-server") {
    const id = Number(formData.get("id"));
    if (!id) return { ok: false, error: "Server ID zorunludur." };
    const host = (formData.get("host") as string)?.trim();
    const portRaw = formData.get("port");
    const port = portRaw !== null && portRaw !== "" ? Number(portRaw) : undefined;
    const gamemode = (formData.get("gamemode") as string)?.trim();
    const sortOrderRaw = formData.get("sort_order");
    const sort_order =
      sortOrderRaw !== null && sortOrderRaw !== "" ? Number(sortOrderRaw) : undefined;
    return updateServer(id, {
      ...(host !== undefined && { host }),
      ...(port !== undefined && { port }),
      ...(gamemode !== undefined && { gamemode }),
      ...(sort_order !== undefined && { sort_order })
    });
  }

  if (intent === "remove-server") {
    const id = Number(formData.get("id"));
    if (!id) return { ok: false, error: "Server ID zorunludur." };
    return removeServer(id);
  }

  return { ok: false, error: "Bilinmeyen işlem." };
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
    if (
      editing &&
      fetcher.state === "idle" &&
      fetcher.data &&
      "ok" in fetcher.data &&
      fetcher.data.ok
    ) {
      setEditing(false);
    }
  }, [editing, fetcher.state, fetcher.data]);

  if (editing) {
    return (
      <tr className="border-b border-stone-700/40 bg-stone-800/30">
        <td className="px-4 py-3">
          <input
            type="text"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            className="w-full min-w-[120px] rounded-md border border-stone-600 bg-stone-800 px-2.5 py-1.5 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="number"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            placeholder="—"
            className="w-20 rounded-md border border-stone-600 bg-stone-800 px-2.5 py-1.5 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="text"
            value={gamemode}
            onChange={(e) => setGamemode(e.target.value)}
            className="min-w-[80px] rounded-md border border-stone-600 bg-stone-800 px-2.5 py-1.5 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-16 rounded-md border border-stone-600 bg-stone-800 px-2.5 py-1.5 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex justify-end gap-2">
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
              className="rounded-md bg-amber-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-amber-500 disabled:opacity-50"
            >
              {isUpdating && fetcher.state !== "idle" ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </fetcher.Form>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-md bg-stone-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-stone-500"
          >
            İptal
          </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-stone-700/40 transition-colors hover:bg-stone-800/50">
      <td className="px-4 py-3 font-mono text-xs text-white">{server.host}</td>
      <td className="px-4 py-3 font-mono text-xs text-stone-400">{server.port ?? "—"}</td>
      <td className="px-4 py-3">
        {server.gamemode ? (
          <span className="rounded bg-stone-700/60 px-2 py-0.5 text-xs font-medium text-stone-300">
            {server.gamemode}
          </span>
        ) : (
          "—"
        )}
      </td>
      <td className="px-4 py-3 text-stone-400">{server.sort_order ?? "—"}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md bg-stone-600 px-2.5 py-1.5 text-xs font-medium text-neutral-200 transition hover:bg-stone-500"
          >
            Düzenle
          </button>
          <fetcher.Form method="post" className="inline">
            <input type="hidden" name="intent" value="remove-server" />
            <input type="hidden" name="id" value={server.id} />
            <button
              type="submit"
              disabled={fetcher.state !== "idle"}
              className="rounded-md bg-red-900/70 px-2.5 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-800 disabled:opacity-50"
            >
              {isRemoving && fetcher.state !== "idle" ? "Kaldırılıyor…" : "Kaldır"}
            </button>
          </fetcher.Form>
        </div>
      </td>
    </tr>
  );
}

export default function AdminServers() {
  const { servers } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const actionError =
    fetcher.data && "ok" in fetcher.data && !fetcher.data.ok
      ? (fetcher.data as { error: string }).error
      : null;
  const showError =
    actionError &&
    ["add-server", "update-server", "remove-server"].includes(
      String(fetcher.formData?.get("intent") ?? "")
    );

  return (
    <div className="m-auto max-w-4xl px-4 py-6">
      <h1 className="font-display text-xl font-semibold text-white mb-4">Sunucular</h1>
      {showError && <p className="mb-4 text-sm text-red-400">{actionError}</p>}
      <fetcher.Form method="post" className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-stone-600/50 bg-stone-900/80 p-4">
        <input type="hidden" name="intent" value="add-server" />
        <input
          type="text"
          name="host"
          placeholder="Host (IP veya hostname)"
          required
          className="min-w-[140px] rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
        />
        <input
          type="number"
          name="port"
          placeholder="Port (opsiyonel)"
          className="w-24 rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
        />
        <input
          type="text"
          name="gamemode"
          placeholder="Gamemode (opsiyonel)"
          className="min-w-[100px] rounded border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-white placeholder-neutral-500"
        />
        <button
          type="submit"
          disabled={fetcher.state !== "idle"}
          className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
        >
          {fetcher.state !== "idle" && fetcher.formData?.get("intent") === "add-server"
            ? "Ekleniyor…"
            : "Sunucu Ekle"}
        </button>
      </fetcher.Form>
      <div className="overflow-hidden rounded-xl border border-stone-600/60 bg-stone-900/90 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-stone-600 bg-stone-800/80">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300">Host</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300">Port</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300">Gamemode</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300">Sıra</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-300 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="text-neutral-300">
              {servers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                    Sunucu yok. Yukarıdan ekleyin; MySQL server_list boşsa ana sayfa app/data/servers
                    listesini kullanır.
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
      </div>
    </div>
  );
}
