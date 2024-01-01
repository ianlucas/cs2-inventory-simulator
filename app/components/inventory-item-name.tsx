/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_InventoryItem } from "@ianlucas/cslib";
import clsx from "clsx";
import { useTranslation } from "~/hooks/use-translation";

export function InventoryItemName({
  inventoryItem: { stattrak },
  model,
  name
}: {
  inventoryItem: CS_InventoryItem;
  model: string;
  name: string;
}) {
  const translate = useTranslation();
  const hasModel = model || stattrak !== undefined;

  return (
    <>
      {hasModel && (
        <div className="font-bold">
          {stattrak !== undefined && `${translate("InventoryItemStatTrak")} `}{" "}
          {model}
        </div>
      )}
      <div className={clsx(!hasModel && "font-bold")}>{name}</div>
    </>
  );
}
