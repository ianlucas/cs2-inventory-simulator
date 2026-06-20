/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2InventoryItem, CS2ItemType } from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { has } from "~/utils/misc";

export function InventoryItemTooltipDescription({
  item
}: {
  item: CS2InventoryItem;
}) {
  const isAgent = item.type === CS2ItemType.Agent;
  const baseDescription = (item.parent ?? item).desc;
  const itemDescription = item.parent !== undefined ? item.desc : undefined;

  let leadDescription: string;
  let flavorDescription: string;

  if (isAgent) {
    // Agents have no base description; their own description ends with an
    // italic flavor quote on its last line.
    const lines = (baseDescription ?? "").split("\n");
    flavorDescription = lines.length > 1 ? (lines.pop() ?? "").trim() : "";
    leadDescription = lines.join("\n").trim();
  } else {
    // The first line of the item's own description is concatenated with the
    // base description, and the remaining lines are shown in italic below.
    const [firstLine, ...otherLines] = (itemDescription ?? "").split("\n");
    leadDescription = [baseDescription, firstLine].filter(has).join(" ");
    flavorDescription = otherLines.join("\n").trim();
  }

  const isFlavorItalic = isAgent || item.isPaintable();

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
            isFlavorItalic && "italic"
          )}
        >
          {flavorDescription}
        </p>
      )}
    </>
  );
}
