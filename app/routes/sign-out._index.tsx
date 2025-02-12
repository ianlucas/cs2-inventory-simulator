/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { redirect } from "react-router";
import { middleware } from "~/http.server";
import { destroySession, getSession } from "~/session.server";
import type { Route } from "./+types/sign-out._index";

export async function loader({ request }: Route.LoaderArgs) {
  await middleware(request);
  const session = await getSession(request.headers.get("cookie"));
  throw redirect("/", {
    headers: { "Set-Cookie": await destroySession(session) }
  });
}
