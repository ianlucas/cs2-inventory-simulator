/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2EconomyItem } from "@ianlucas/cs2-lib";
import { useIsDesktop } from "~/components/hooks/use-is-desktop";
import { ItemPickerDesktop } from "./item-picker-desktop";
import { ItemPickerMobile } from "./item-picker-mobile";

export function ItemPicker({
  onPickItem
}: {
  onPickItem: (item: CS2EconomyItem) => void;
}) {
  return useIsDesktop() ? (
    <ItemPickerDesktop onPickItem={onPickItem} />
  ) : (
    <ItemPickerMobile onPickItem={onPickItem} />
  );
}
