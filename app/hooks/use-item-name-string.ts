/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useMemo } from "react";
import { useRootContext } from "~/components/root-context";
import { getItemName } from "~/utils/economy";

export function useItemNameString({
  model,
  name,
  quality,
  stattrak
}: Partial<ReturnType<typeof getItemName>> & {
  stattrak?: boolean;
}) {
  const {
    translations: { translate }
  } = useRootContext();

  model ??= "";
  name ??= "";
  quality ??= "";

  return useMemo(
    () =>
      [
        `${quality}${stattrak ? `${translate("InventoryItemStatTrak")} ` : ""}${model}`.trim(),
        name
      ]
        .filter(Boolean)
        .join(" | "),
    [model, name, quality, stattrak, translate]
  );
}
