/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem } from "@ianlucas/cs2-lib";
import { RarityLabel, getRarityItemName } from "~/utils/economy";
import { useLocalize } from "./app-context";
import { InventoryItemInfo } from "./inventory-item-info";

export function InventoryItemRarity({ item }: { item: CS2EconomyItem }) {
  const localize = useLocalize();

  const rarityType = item.isPaintable() ? "Weapon" : "";
  const rarityLabel = RarityLabel[item.rarity];
  const rarityKey = `Item${rarityType}Rarity${rarityLabel}` as const;
  const nameKey = `ItemRarityName${getRarityItemName(item)}` as const;

  return (
    <InventoryItemInfo
      style={{ color: item.rarity }}
      label={localize("InventoryItemRarity")}
    >
      {localize("ItemRarityFormat", localize(rarityKey), localize(nameKey))}
    </InventoryItemInfo>
  );
}
