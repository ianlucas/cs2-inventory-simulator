/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Economy } from "@ianlucas/cs2-lib";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useCounter } from "~/hooks/use-counter";
import { useSync } from "~/hooks/use-sync";
import { SwapItemsStatTrakAction } from "~/routes/api.action.sync._index";
import { CSItemImage } from "./cs-item-image";
import { ModalButton } from "./modal-button";
import { useRootContext } from "./root-context";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";

export function SwapItemsStatTrak({
  fromUid: fromUid,
  onClose,
  toUid: toUid,
  toolUid: toolUid
}: {
  fromUid: number;
  onClose: () => void;
  toUid: number;
  toolUid: number;
}) {
  const {
    inventory,
    setInventory,
    translations: { translate }
  } = useRootContext();

  const sync = useSync();

  function handleAccept() {
    sync({
      type: SwapItemsStatTrakAction,
      toolUid: toolUid,
      fromUid: fromUid,
      toUid: toUid
    });
    setInventory(inventory.swapItemsStatTrak(toolUid, fromUid, toUid));
    onClose();
  }

  const toInventoryItem = inventory.get(toUid);
  const fromInventoryItem = inventory.get(fromUid);
  const toItem = CS_Economy.getById(toInventoryItem.id);
  const fromItem = CS_Economy.getById(fromInventoryItem.id);
  const to = useCounter(toInventoryItem.stattrak!, fromInventoryItem.stattrak!);
  const from = useCounter(
    fromInventoryItem.stattrak!,
    toInventoryItem.stattrak!
  );

  const items = [
    { inventoryItem: fromInventoryItem, item: fromItem, value: from },
    { inventoryItem: toInventoryItem, item: toItem, value: to }
  ];

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <div className="fixed left-0 top-0 z-50 flex h-full w-full select-none items-center justify-center bg-black/60 backdrop-blur-sm">
            <div>
              <UseItemHeader
                actionDesc={translate("ItemSwapStatTrakDesc")}
                title={translate("ItemSwapStatTrakUse")}
                warning={translate("ItemSwapStatTrakWarn")}
              />
              <div className="mt-16 flex items-center justify-center gap-10">
                {items.map(
                  ({ inventoryItem: { wear }, item, value }, index) => (
                    <div className="flex flex-col justify-center" key={index}>
                      <CSItemImage
                        className="aspect-[1.33333] max-w-[256px]"
                        item={item}
                        wear={wear}
                      />
                      <div className="relative m-auto">
                        <img
                          className="h-[128px]"
                          src="/images/stattrak-module.png"
                          draggable={false}
                        />
                        <span className="absolute top-[22%] w-full text-center font-display text-3xl text-orange-500">
                          {String(value).padStart(6, "0")}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
              <UseItemFooter
                right={
                  <>
                    <ModalButton
                      variant="primary"
                      onClick={handleAccept}
                      children={translate("ItemSwapStatTrakAccept")}
                    />
                    <ModalButton
                      variant="secondary"
                      onClick={onClose}
                      children={translate("ItemSwapStatTrakClose")}
                    />
                  </>
                }
              />
            </div>
          </div>,
          document.body
        )
      }
    />
  );
}
