/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy, CS2EconomyItem, CS2UnlockedItem } from "@ianlucas/cs2-lib";
import { resolveCaseSpecialsImage, resolveItemImage } from "~/utils/economy";

export function UnlockCaseWheelItem({
  caseItem,
  index,
  unlockedItem
}: {
  caseItem: CS2EconomyItem;
  index: number;
  unlockedItem: CS2UnlockedItem;
}) {
  const item = CS2Economy.getById(unlockedItem.id);

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
        className="absolute top-0 left-0 h-full w-full"
        src={
          unlockedItem.special
            ? resolveCaseSpecialsImage(caseItem)
            : resolveItemImage(item)
        }
      />
    </div>
  );
}
