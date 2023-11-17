/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item } from "@ianlucas/cslib";
import { CSItemButton } from "./cs-item-button";
import { GridList } from "./grid-list";

export function CSItemBrowser({
  csItems,
  ignoreRarityColor,
  onClick
}: {
  csItems: CS_Item[];
  ignoreRarityColor?: boolean;
  onClick?(csItem: CS_Item): void;
}) {
  return (
    <GridList
      className="divide-y-2 divide-neutral-800/30"
      itemHeight={64}
      maxItemsIntoView={6}
    >
      {csItems.map((csItem) => (
        <CSItemButton
          ignoreRarityColor={ignoreRarityColor}
          csItem={csItem}
          key={csItem.id}
          onClick={onClick}
        />
      ))}
    </GridList>
  );
}
