/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item } from "@ianlucas/cslib";
import { CSItemButton } from "./cs-item-button";
import { GridList } from "./grid-list";

export function CSItemBrowser({
  ignoreRarityColor,
  items,
  onClick
}: {
  ignoreRarityColor?: boolean;
  items: CS_Item[];
  onClick?(item: CS_Item): void;
}) {
  return (
    <GridList
      className="divide-y-2 divide-neutral-800/30"
      itemHeight={64}
      maxItemsIntoView={6}
    >
      {items.map((item) => (
        <CSItemButton
          ignoreRarityColor={ignoreRarityColor}
          item={item}
          key={item.id}
          onClick={onClick}
        />
      ))}
    </GridList>
  );
}
