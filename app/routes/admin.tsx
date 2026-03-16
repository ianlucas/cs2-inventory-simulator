/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { NavLink, Outlet } from "react-router";
import { isAdmin, requireUser } from "~/auth.server";
import { forbidden } from "~/responses.server";
import { middleware } from "~/http.server";
import type { Route } from "./+types/admin";

export async function loader({ request }: Route.LoaderArgs) {
  await middleware(request);
  await requireUser(request);
  if (!(await isAdmin(request))) throw forbidden;
  return {};
}

const NAV = [
  { to: "/admin", end: true, label: "Panel" },
  { to: "/admin/vips", end: false, label: "VIP" },
  { to: "/admin/bans", end: false, label: "Bans" },
  { to: "/admin/mutes", end: false, label: "Mutes" },
  { to: "/admin/servers", end: false, label: "Sunucular" }
] as const;

export default function AdminLayout() {
  return (
    <div className="flex min-h-[60vh] flex-col gap-6 lg:flex-row">
      <nav
        className="shrink-0 border-b border-stone-600/50 pb-4 lg:w-48 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4"
        aria-label="Admin"
      >
        <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-0">
          {NAV.map(({ to, end, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `block rounded px-3 py-2 text-sm font-medium transition lg:rounded-r-none lg:border-r-2 ${
                    isActive
                      ? "border-amber-500 bg-amber-500/10 text-amber-400"
                      : "border-transparent text-neutral-400 hover:bg-stone-800 hover:text-white"
                  }`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
