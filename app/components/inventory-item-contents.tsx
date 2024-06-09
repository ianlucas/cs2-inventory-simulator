/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CS2EconomyItem } from "@ianlucas/cs2-lib";
import { useNameItemString } from "~/components/hooks/use-name-item";
import { useLocalize } from "./app-context";

export function InventoryItemContents({
  item,
  unlockedItem
}: {
  item: CS2EconomyItem;
  unlockedItem?: CS2EconomyItem;
}) {
  const localize = useLocalize();
  const nameItemString = useNameItemString();

  return (
    <div className="mt-4">
      <div className="text-neutral-400">
        {unlockedItem === undefined
          ? localize("InventoryItemContainsOne")
          : unlockedItem.collectionName}
      </div>
      {item.listContents(true).map((item) => (
        <div
          className="flex items-center gap-1"
          key={item.id}
          style={{ color: item.rarity }}
        >
          {unlockedItem !== undefined && (
            <div className="w-[16px] text-right">
              {item.id === unlockedItem.id && (
                <FontAwesomeIcon
                  icon={faCheck}
                  className="h-3 text-neutral-500"
                />
              )}
            </div>
          )}
          <div className="flex-1">
            {nameItemString(item, "case-contents-name")}
          </div>
        </div>
      ))}
      {item.specials !== undefined && (
        <div className="text-yellow-300">
          {localize("InventoryItemRareItem")}
        </div>
      )}
    </div>
  );
}
