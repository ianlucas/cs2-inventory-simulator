/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useMatches, useRouteLoaderData } from "react-router";
import type { loader as profileLoader } from "~/routes/profiles.$userId._index";

export function useRootLayout(): {
  background?: boolean;
  footer?: boolean;
  header?: boolean;
  inventory?: boolean;
  profile?: { avatar: string; name: string };
} {
  const profile = useRouteLoaderData<typeof profileLoader>(
    "routes/profiles.$userId._index"
  )?.user;
  // Profiles render the owner's background and inventory instead.
  const isProfile = profile !== undefined;
  const matches = useMatches();
  const isLoadouts = matches.some(({ id }) => id === "routes/loadout._index");
  const isCommunity = matches.some(
    ({ id }) => id === "routes/community._index"
  );

  return {
    background: !isProfile,
    footer: true,
    header: true,
    inventory: !isProfile && !isLoadouts && !isCommunity,
    profile
  };
}
