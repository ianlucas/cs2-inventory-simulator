/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2EconomyItem,
  CS2ItemType,
  CS2ItemTypeValues
} from "@ianlucas/cs2-lib";
import { RarityLabel, getRarityItemName } from "~/utils/economy";
import { useTranslate } from "./app-context";
import { InventoryItemInfo } from "./inventory-item-info";

const HOLDABLE_ITEM_TYPES: CS2ItemTypeValues[] = [
  CS2ItemType.Gloves,
  CS2ItemType.Melee,
  CS2ItemType.Weapon
];

export function InventoryItemRarity({ data }: { data: CS2EconomyItem }) {
  const translate = useTranslate();

  const isWeapon = HOLDABLE_ITEM_TYPES.includes(data.type);
  const rarityType = isWeapon ? "Weapon" : "";
  const rarityKey =
    `Item${rarityType}Rarity${RarityLabel[data.rarity]}` as const;
  const nameKey = `ItemRarityName${getRarityItemName(data)}` as const;

  return (
    <InventoryItemInfo
      style={{ color: data.rarity }}
      label={translate("InventoryItemRarity")}
    >
      {translate("ItemRarityFormat", translate(rarityKey), translate(nameKey))}
    </InventoryItemInfo>
  );
}
