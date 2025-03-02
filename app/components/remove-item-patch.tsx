/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy } from "@ianlucas/cs2-lib";
import { useState } from "react";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useNameItemString } from "~/components/hooks/use-name-item";
import { useSync } from "~/components/hooks/use-sync";
import { SyncAction } from "~/data/sync";
import { playSound } from "~/utils/sound";
import { useInventory, useTranslate } from "./app-context";
import { ItemImage } from "./item-image";
import { Modal, ModalHeader } from "./modal";
import { ModalButton } from "./modal-button";
import { Overlay } from "./overlay";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";

export function RemoveItemPatch({
  onClose,
  uid
}: {
  onClose: () => void;
  uid: number;
}) {
  const nameItemString = useNameItemString();
  const translate = useTranslate();
  const sync = useSync();

  const [inventory, setInventory] = useInventory();
  const [confirmRemoveSlot, setConfirmRemoveSlot] = useState<number>();

  const item = inventory.get(uid);

  function doRemovePatch(slot: number) {
    sync({
      type: SyncAction.RemoveItemPatch,
      targetUid: uid,
      slot: slot
    });
    setInventory(inventory.removeItemPatch(uid, slot));
    playSound("inventory_new_item_accept");
    if (item.getPatchesCount() === 0) {
      onClose();
    }
  }

  function handleConfirmScrape() {
    if (confirmRemoveSlot !== undefined) {
      doRemovePatch(confirmRemoveSlot);
      setConfirmRemoveSlot(undefined);
    }
  }

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <>
            <Overlay>
              <UseItemHeader
                title={translate("ScrapeStickerUse")}
                warning={translate("RemovePatchWarn")}
                warningItem={nameItemString(item)}
              />
              <ItemImage
                className="m-auto aspect-[1.33333] max-w-[512px]"
                item={item}
              />
              <div className="flex justify-center">
                {item.somePatches().map(([slot, id]) => (
                  <button key={slot} className="group">
                    <ItemImage
                      className="h-[126px] w-[168px] scale-90 drop-shadow-lg transition-all group-hover:scale-100 group-active:scale-125"
                      onClick={() => setConfirmRemoveSlot(slot)}
                      item={CS2Economy.getById(id)}
                    />
                  </button>
                ))}
              </div>
              <UseItemFooter
                right={
                  <ModalButton
                    children={translate("ScrapeStickerClose")}
                    onClick={onClose}
                    variant="secondary"
                  />
                }
              />
            </Overlay>
            {confirmRemoveSlot !== undefined && (
              <Modal className="w-[480px]" fixed>
                <ModalHeader title={translate("RemovePatchRemove")} />
                <p className="mt-2 px-4">
                  {translate("RemovePatchRemoveDesc")}
                </p>
                <div className="my-6 flex justify-center gap-2 px-4">
                  {" "}
                  <ModalButton
                    onClick={() => setConfirmRemoveSlot(undefined)}
                    variant="secondary"
                    children={translate("ScrapeStickerCancel")}
                  />
                  <ModalButton
                    onClick={handleConfirmScrape}
                    variant="primary"
                    children={translate("RemovePatchRemove")}
                  />
                </div>
              </Modal>
            )}
          </>,
          document.body
        )
      }
    />
  );
}
