/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_InventoryItem } from "@ianlucas/cslib";
import clsx from "clsx";
import { useRootContext } from "./root-context";

export function InventoryItemName({
  inventoryItem: { stattrak },
  model,
  name,
  quality
}: {
  inventoryItem: CS_InventoryItem;
  model: string;
  name: string;
  quality?: string;
}) {
  const {
    translations: { translate }
  } = useRootContext();
  const hasModel = model || stattrak !== undefined;

  return (
    <>
      {hasModel && (
        <div className="font-bold">
          {quality}
          {stattrak !== undefined &&
            `${translate("InventoryItemStatTrak")} `}{" "}
          {model}
        </div>
      )}
      <div className={clsx(!hasModel && "font-bold")}>{name}</div>
    </>
  );
}
