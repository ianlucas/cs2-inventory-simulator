/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem } from "@ianlucas/cs2-lib";
import { GridList } from "./grid-list";
import { ItemButton, ItemClickHandler } from "./item-button";

export function ItemBrowser({
  ignoreRarityColor,
  items,
  maxItemsIntoView = 6,
  onClick
}: {
  ignoreRarityColor?: boolean;
  items: CS2EconomyItem[];
  maxItemsIntoView?: number;
  onClick?: ItemClickHandler;
}) {
  return (
    <GridList itemHeight={64} maxItemsIntoView={maxItemsIntoView} items={items}>
      {(item, index) => (
        <ItemButton
          ignoreRarityColor={ignoreRarityColor}
          index={index}
          item={item}
          key={item.id}
          onClick={onClick}
        />
      )}
    </GridList>
  );
}
