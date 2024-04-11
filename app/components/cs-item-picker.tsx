/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item } from "@ianlucas/cs2-lib";
import { useIsDesktop } from "~/hooks/use-is-desktop";
import { CSItemPickerDesktop } from "./cs-item-picker-desktop";
import { CSItemPickerMobile } from "./cs-item-picker-mobile";

export function CSItemPicker({
  onPickItem
}: {
  onPickItem: (item: CS_Item) => void;
}) {
  return useIsDesktop() ? (
    <CSItemPickerDesktop onPickItem={onPickItem} />
  ) : (
    <CSItemPickerMobile onPickItem={onPickItem} />
  );
}
