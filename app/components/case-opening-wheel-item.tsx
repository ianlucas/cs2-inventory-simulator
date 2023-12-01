/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item, CS_resolveCaseRareImage, CS_resolveItemImage, CS_roll } from "@ianlucas/cslib";
import { baseUrl } from "~/utils/economy";

export function CaseOpeningWheelItem(
  {
    caseItem,
    item,
    index
  }: {
    caseItem: CS_Item;
    item: ReturnType<typeof CS_roll>;
    index: number;
  }
) {
  return (
    <div
      data-id={index}
      className="w-[256px] h-[192px] relative inline-block ml-4 first-of-type:ml-0"
      style={{
        backgroundImage:
          `linear-gradient(180deg, #8a8a8a 0%, #8a8a8a 60%, ${item.csItem.rarity} 92%, #000 100%)`
      }}
    >
      <div
        className="absolute left-0 bottom-0 h-2 w-full"
        style={{ backgroundColor: item.csItem.rarity }}
      />
      <img
        title={index.toString()}
        className="w-full h-full absolute top-0 left-0"
        src={item.special
          ? CS_resolveCaseRareImage(baseUrl, caseItem)
          : CS_resolveItemImage(baseUrl, item.csItem)}
      />
    </div>
  );
}
