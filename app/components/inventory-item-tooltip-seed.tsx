/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2_MIN_SEED } from "@ianlucas/cs2-lib";
import { useLocalize } from "./app-context";

export function InventoryItemTooltipSeed({ seed }: { seed?: number }) {
  const localize = useLocalize();
  return (
    <div>
      <strong className="text-neutral-400">
        {localize("InventoryItemSeed")}
      </strong>{" "}
      {seed ?? CS2_MIN_SEED}
    </div>
  );
}
