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
  { id: "vips", label: "VIP", href: "#vips" },
  { id: "bans", label: "Bans", href: "#bans" },
  { id: "mutes", label: "Mutes", href: "#mutes" },
  { id: "servers", label: "Server info", href: "#servers" }
] as const;

export default function AdminIndex() {
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
