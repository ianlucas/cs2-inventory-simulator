/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem } from "@ianlucas/cs2-lib";
import { createFakeItem } from "~/utils/economy";
import { useTranslate } from "./app-context";
import { InventoryItemTile } from "./inventory-item-tile";

export function InventoryItemTileSpecial({
  containerItem,
  small
}: {
  containerItem: CS2EconomyItem;
  small?: boolean;
}) {
  const translate = useTranslate();

  return (
    <InventoryItemTile
      item={createFakeItem(containerItem, {
        name: `Container | ${translate("CaseRareItem")}`,
        imagePath: containerItem.specialsImagePath,
        rarityColor: "#e4ae39"
      })}
      small={small}
    />
  );
}
