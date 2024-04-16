/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item } from "@ianlucas/cs2-lib";
import { createFakeItem, resolveCaseSpecialsImage } from "~/utils/economy";
import { useTranslate } from "./app-context";
import { InventoryItemTile } from "./inventory-item-tile";

export function InventoryItemSpecialTile({ caseItem }: { caseItem: CS_Item }) {
  const translate = useTranslate();

  return (
    <InventoryItemTile
      item={createFakeItem(caseItem, {
        name: `Container | ${translate("CaseRareItem")}`,
        image: resolveCaseSpecialsImage(caseItem),
        rarity: "#e4ae39"
      })}
    />
  );
}
