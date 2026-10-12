/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LoadoutEditor } from "~/components/loadout-editor";
import { middleware } from "~/middleware.server";
import { getMetaTitle } from "~/root-meta";
import type { Route } from "./+types/loadout._index";

export const meta = getMetaTitle("HeaderLoadoutLabel");

export async function loader({ request }: Route.LoaderArgs) {
  await middleware(request);
  return null;
}

export default function Loadouts() {
  return <LoadoutEditor />;
}
