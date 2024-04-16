/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item } from "@ianlucas/cs2-lib";
import { GridList } from "./grid-list";
import { ItemButton } from "./item-button";

export function ItemBrowser({
  ignoreRarityColor,
  items,
  maxItemsIntoView = 6,
  onClick
}: {
  ignoreRarityColor?: boolean;
  items: CS_Item[];
  maxItemsIntoView?: number;
  onClick?: (item: CS_Item) => void;
}) {
  return (
    <GridList itemHeight={64} maxItemsIntoView={maxItemsIntoView}>
      {items.map((item) => (
        <ItemButton
          ignoreRarityColor={ignoreRarityColor}
          item={item}
          key={item.id}
          onClick={onClick}
        />
      ))}
    </GridList>
  );
}
