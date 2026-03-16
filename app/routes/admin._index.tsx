/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Link } from "react-router";
import { getMetaTitle } from "~/root-meta";
import type { Route } from "./+types/admin._index";

export const meta = getMetaTitle("Admin");

export async function loader(_args: Route.LoaderArgs) {
  return {};
}

const SECTIONS = [
  { to: "/admin/vips", label: "VIP", description: "VIP kullanıcılarını listele, ekle veya kaldır." },
  { to: "/admin/bans", label: "Bans", description: "Banları yönet: ekle veya kaldır." },
  { to: "/admin/mutes", label: "Mutes", description: "Susturmaları yönet: ekle veya kaldır." },
  { to: "/admin/servers", label: "Sunucular", description: "Sunucu listesini düzenle (ana sayfa)." }
] as const;

export default function AdminIndex() {
  return (
    <div className="m-auto max-w-2xl px-4 py-6">
      <h1 className="font-display text-2xl font-semibold text-white mb-2">Admin</h1>
      <p className="text-neutral-400 text-sm mb-8">Yönetim bölümünü seçin.</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {SECTIONS.map(({ to, label, description }) => (
          <li key={to}>
            <Link
              to={to}
              className="block rounded-xl border border-stone-600/50 bg-stone-900/80 px-5 py-4 transition hover:border-stone-500 hover:bg-stone-800/80"
            >
              <span className="font-medium text-white">{label}</span>
              <p className="mt-1 text-sm text-neutral-400">{description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
