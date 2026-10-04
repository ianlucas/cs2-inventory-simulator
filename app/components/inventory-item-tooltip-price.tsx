/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { formatUsd } from "~/shared/number";
import { useTranslate } from "./app-context";
import { InventoryItemTooltipInfo } from "./inventory-item-tooltip-info";

export function InventoryItemTooltipPrice({
  isApproximate,
  isLoading,
  price
}: {
  isApproximate: boolean;
  isLoading: boolean;
  price: number | null;
}) {
  const translate = useTranslate();

  return (
    <InventoryItemTooltipInfo label={translate("InventoryItemPrice")}>
      {isLoading ? (
        <span className="inline-block h-3 w-12 animate-pulse rounded-sm bg-neutral-700 align-middle" />
      ) : price !== null ? (
        `${isApproximate ? "≈ " : ""}${formatUsd(price)}`
      ) : (
        translate("InventoryItemPriceNA")
      )}
    </InventoryItemTooltipInfo>
  );
}
