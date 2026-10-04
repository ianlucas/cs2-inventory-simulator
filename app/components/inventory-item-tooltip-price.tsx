/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { formatUsd } from "~/shared/number";
import { useTranslate } from "./app-context";

export function InventoryItemTooltipPrice({
  isLoading,
  price
}: {
  isLoading: boolean;
  price: number | null;
}) {
  const translate = useTranslate();

  return (
    <div>
      <strong className="text-neutral-400">
        {translate("InventoryItemPrice")}
      </strong>{" "}
      {isLoading ? (
        <span className="inline-block h-3 w-12 animate-pulse rounded-sm bg-neutral-700 align-middle" />
      ) : price !== null ? (
        formatUsd(price)
      ) : (
        translate("InventoryItemPriceNA")
      )}
    </div>
  );
}
