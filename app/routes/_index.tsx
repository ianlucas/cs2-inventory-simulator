/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { middleware } from "~/http.server";
import { getMetaTitle } from "~/root-meta";
import type { Route } from "./+types/_index";

export const meta = getMetaTitle();

export async function loader({ request }: Route.LoaderArgs) {
  await middleware(request);
  return null;
}

export default function Index() {
  return null;
}
