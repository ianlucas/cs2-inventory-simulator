/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { getMetaTitle } from "~/root-meta";
import type { Route } from "./+types/inventory._index";
import { middleware } from "~/http.server";

export const meta = getMetaTitle("HeaderInventoryLabel");

export async function loader({ request }: Route.LoaderArgs) {
  await middleware(request);
  return null;
}

/** Inventory UI is rendered by root layout when pathname is /inventory. This route only provides the URL. */
export default function InventoryPage() {
  return null;
}
