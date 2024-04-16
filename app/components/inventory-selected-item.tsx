/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { resolveItemImage } from "~/utils/economy";
import { getItemNameString } from "~/utils/inventory";
import { useInventory, useTranslate } from "./app-context";
import {
  ItemSelectorContextProps,
  useItemSelectorContext
} from "./item-selector-context";

function getLabelToken(token?: ItemSelectorContextProps["type"]) {
  switch (token) {
    case "deposit-to-storage-unit":
      return "InventorySelectItemToDeposit";
    case "retrieve-from-storage-unit":
      return "InventorySelectItemToRetrieve";
    case "inspect-storage-unit":
      return "InventorySelectInspectContents";
    default:
      return "InventorySelectAnItem";
  }
}

export function InventorySelectedItem({
  uid,
  onDismiss
}: {
  uid: number;
  onDismiss: () => void;
}) {
  const [inventory] = useInventory();
  const translate = useTranslate();
  const { itemSelector } = useItemSelectorContext();
  const item = inventory.get(uid);
  const name = getItemNameString(item, "inventory-name");

  return (
    <div className="m-auto w-full px-4 pb-4 text-xs drop-shadow lg:flex lg:w-[1024px] lg:items-center lg:px-0 lg:pb-0 lg:text-base">
      <button
        className="px-2 py-1 hover:bg-black/30 active:bg-black/70"
        onClick={onDismiss}
      >
        <FontAwesomeIcon icon={faArrowLeft} className="h-5" />
      </button>
      <div className="flex flex-1 select-none items-center justify-center gap-3">
        <strong>{translate(getLabelToken(itemSelector?.type))}</strong>
        <img
          draggable={false}
          className="h-12"
          src={resolveItemImage(item.data)}
        />
        <span className="text-neutral-300">{name}</span>
      </div>
    </div>
  );
}
