/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CS_Item } from "@ianlucas/cslib";
import { MetaFunction } from "@remix-run/node";
import { Link, useNavigate } from "@remix-run/react";
import clsx from "clsx";
import { useState } from "react";
import {
  CSItemEditor,
  CSItemEditorAttributes
} from "~/components/cs-item-editor";
import { CSItemPicker } from "~/components/cs-item-picker";
import { Modal } from "~/components/modal";
import { useRootContext } from "~/components/root-context";
import { useIsDesktop } from "~/hooks/use-is-desktop";
import { useLockScroll } from "~/hooks/use-lock-scroll";
import { useSync } from "~/hooks/use-sync";
import { useTranslation } from "~/hooks/use-translation";
import { showQuantity } from "~/utils/economy";
import { range } from "~/utils/number";
import { ExternalInventoryItemShape } from "~/utils/shapes";
import { AddAction } from "./api.action.sync._index";

export const meta: MetaFunction = () => {
  return [{ title: "Craft - CS2 Inventory Simulator" }];
};

export default function Craft() {
  const sync = useSync();
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState<CS_Item>();
  const { inventory, setInventory } = useRootContext();
  const translate = useTranslation();
  const isDesktop = useIsDesktop();

  useLockScroll();

  function handleSubmit({
    quantity,
    stattrak,
    ...attributes
  }: CSItemEditorAttributes) {
    if (selectedItem !== undefined) {
      const inventoryItem = {
        id: selectedItem.id,
        stattrak: stattrak ? 0 : undefined,
        ...attributes
      };
      range(showQuantity(selectedItem) ? quantity : 1).forEach(() => {
        setInventory(inventory.add(inventoryItem));
        sync({
          type: AddAction,
          item: inventoryItem as ExternalInventoryItemShape
        });
      });
      return navigate("/");
    }
  }

  const isPickingItem = selectedItem === undefined;

  return (
    <Modal
      className={clsx(
        isPickingItem ? (isDesktop ? "w-[640px]" : "w-[540px]") : "w-[420px]"
      )}
    >
      <div className="flex select-none items-center justify-between px-4 py-2 text-sm font-bold">
        <span className="text-neutral-400">
          {isPickingItem
            ? translate("CraftSelectHeader")
            : translate("CraftConfirmHeader")}
        </span>
        <div className="flex items-center">
          <Link className="opacity-50 hover:opacity-100" to="/">
            <FontAwesomeIcon icon={faXmark} className="h-4" />
          </Link>
        </div>
      </div>
      {isPickingItem ? (
        <CSItemPicker onPickItem={setSelectedItem} />
      ) : (
        <CSItemEditor
          item={selectedItem}
          onSubmit={handleSubmit}
          onReset={() => setSelectedItem(undefined)}
        />
      )}
    </Modal>
  );
}
