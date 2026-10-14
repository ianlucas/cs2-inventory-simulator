/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Team } from "@ianlucas/cs2-lib";
import type { LoadoutTeam } from "~/shared/loadout";

export function getLoadoutUrl(id: string, team?: LoadoutTeam) {
  const params = new URLSearchParams({ id });
  if (team !== undefined) {
    params.set("team", team === CS2Team.T ? "t" : "ct");
  }
  return `/loadout?${params}`;
}

export function getLoadoutUrlTeam(searchParams: URLSearchParams): LoadoutTeam {
  return searchParams.get("team") === "t" ? CS2Team.T : CS2Team.CT;
}
