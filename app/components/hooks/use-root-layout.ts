/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useRouteLoaderData } from "react-router";
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

  return {
    background: !isProfile,
    footer: true,
    header: true,
    inventory: !isProfile,
    profile
  };
}
