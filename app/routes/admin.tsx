/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Outlet } from "react-router";
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

export default function AdminLayout() {
  return <Outlet />;
}
