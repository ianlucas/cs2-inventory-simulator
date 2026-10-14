/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Link } from "react-router";
import { getLoadoutUrl } from "~/loadout-url";
import { useActiveLoadout, useTranslate } from "./app-context";
import { InfoIcon } from "./info-icon";

// The active loadout replaces some of the inventory's equipped items, so say
// which one is in use.
export function InventoryLoadoutNotice() {
  const translate = useTranslate();
  const activeLoadout = useActiveLoadout();

  if (activeLoadout === undefined) {
    return null;
  }

  // Each language places the name differently, so the text is split around it.
  const [before, after] = translate("InventoryUsingLoadout", "\0").split("\0");

  return (
    <div className="m-auto flex justify-center px-2 pb-4 select-none lg:w-5xl lg:px-0 lg:pb-0">
      <Link
        className="flex w-full items-center justify-center gap-2 bg-linear-to-r from-transparent via-black/30 to-transparent py-1 text-sm hover:underline"
        to={getLoadoutUrl(activeLoadout.id)}
      >
        <InfoIcon className="h-3.5 shrink-0" />
        <span className="truncate">
          {before}
          <strong>{activeLoadout.name}</strong>
          {after}
        </span>
      </Link>
    </div>
  );
}
