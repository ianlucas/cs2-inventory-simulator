/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem } from "@ianlucas/cs2-lib";
import { createFakeItem, resolveCaseSpecialsImage } from "~/utils/economy";
import { useLocalize } from "./app-context";
import { InventoryItemTile } from "./inventory-item-tile";

export function InventoryItemTileSpecial({
  containerItem
}: {
  containerItem: CS2EconomyItem;
}) {
  const localize = useLocalize();

  return (
    <InventoryItemTile
      item={createFakeItem(containerItem, {
        name: `Container | ${localize("CaseRareItem")}`,
        image: resolveCaseSpecialsImage(containerItem),
        rarity: "#e4ae39"
      })}
    />
  );
}
