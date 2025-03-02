/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ensure } from "@ianlucas/cs2-lib";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useCounter } from "~/components/hooks/use-counter";
import { useSync } from "~/components/hooks/use-sync";
import { SyncAction } from "~/data/sync";
import { useInventory, useTranslate } from "./app-context";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { Overlay } from "./overlay";
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
  const [inventory, setInventory] = useInventory();
  const translate = useTranslate();
  const sync = useSync();

  function handleAccept() {
    sync({
      type: SyncAction.SwapItemsStatTrak,
      toolUid: toolUid,
      fromUid: fromUid,
      toUid: toUid
    });
    setInventory(inventory.swapItemsStatTrak(toolUid, fromUid, toUid));
    onClose();
  }

  const toItem = inventory.get(toUid);
  const fromItem = inventory.get(fromUid);
  const to = useCounter(ensure(toItem.statTrak), ensure(fromItem.statTrak));
  const from = useCounter(ensure(fromItem.statTrak), ensure(toItem.statTrak));

  const items = [
    { item: fromItem, value: from },
    { item: toItem, value: to }
  ];

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <Overlay>
            <UseItemHeader
              actionDesc={translate("ItemSwapStatTrakDesc")}
              title={translate("ItemSwapStatTrakUse")}
              warning={translate("ItemSwapStatTrakWarn")}
            />
            <div className="mt-16 flex items-center justify-center gap-10">
              {items.map(({ item, value }, index) => (
                <div className="flex flex-col justify-center" key={index}>
                  <ItemImage
                    className="aspect-[1.33333] max-w-[256px]"
                    item={item}
                  />
                  <div className="relative m-auto">
                    <img
                      className="h-[128px]"
                      src="/images/stattrak-module.png"
                      draggable={false}
                    />
                    <span className="font-display absolute top-[22%] w-full text-center text-3xl text-orange-500">
                      {String(value).padStart(6, "0")}
                    </span>
                  </div>
                </div>
              ))}
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
          </Overlay>,
          document.body
        )
      }
    />
  );
}
