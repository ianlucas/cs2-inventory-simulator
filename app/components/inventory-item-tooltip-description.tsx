/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2InventoryItem } from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { has } from "~/utils/misc";

export function InventoryItemTooltipDescription({
  item
}: {
  item: CS2InventoryItem;
}) {
  const baseDescription = (item.parent ?? item).desc;
  const itemDescription = item.parent !== undefined ? item.desc : undefined;

  // In-game, the first line of the item's own description is concatenated with
  // the base description, and the remaining lines are shown in italic below.
  const [firstLine, ...otherLines] = (itemDescription ?? "").split("\n");
  const leadDescription = [baseDescription, firstLine].filter(has).join(" ");
  const flavorDescription = otherLines.join("\n").trim();

  return (
    <>
      {has(leadDescription) && (
        <p className="mt-4 whitespace-pre-wrap text-neutral-300">
          {leadDescription}
        </p>
      )}
      {has(flavorDescription) && (
        <p
          className={clsx(
            "mt-4 whitespace-pre-wrap text-neutral-300",
            item.isPaintable() && "italic"
          )}
        >
          {flavorDescription}
        </p>
      )}
    </>
  );
}
