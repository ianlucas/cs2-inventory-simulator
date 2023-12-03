/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Economy, CS_Item, CS_unlockCase } from "@ianlucas/cslib";
import { resolveCaseSpecialItemImage, resolveItemImage } from "~/utils/economy";

export function CaseOpeningWheelItem({
  caseItem,
  index,
  unlockedItem
}: {
  caseItem: CS_Item;
  index: number;
  unlockedItem: ReturnType<typeof CS_unlockCase>;
}) {
  const item = CS_Economy.getById(unlockedItem.id);

  return (
    <div
      data-id={index}
      className="relative ml-4 inline-block h-[192px] w-[256px] first-of-type:ml-0"
      style={{
        backgroundImage: `linear-gradient(180deg, #8a8a8a 0%, #8a8a8a 60%, ${item.rarity} 92%, #000 100%)`
      }}
    >
      <div
        className="absolute bottom-0 left-0 h-2 w-full"
        style={{ backgroundColor: item.rarity }}
      />
      <img
        title={index.toString()}
        className="absolute left-0 top-0 h-full w-full"
        src={
          unlockedItem.special
            ? resolveCaseSpecialItemImage(caseItem)
            : resolveItemImage(item)
        }
      />
    </div>
  );
}
