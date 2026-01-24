/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { redirect } from "react-router";
import { middleware } from "~/http.server";
import type { Route } from "./+types/$";

export async function loader({ request }: Route.LoaderArgs) {
  await middleware(request);
  const url = new URL(request.url);
  if (url.pathname.startsWith("/assets")) {
    return new Response(null, {
      status: 404,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "CDN-Cache-Control": "no-store"
      }
    });
  }
  return redirect("/");
}
