/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { redirect } from "react-router";
import { middleware } from "~/http.server";
import type { Route } from "./+types/$";

export async function loader({ request }: Route.LoaderArgs) {
  await middleware(request);
  return redirect("/");
}
