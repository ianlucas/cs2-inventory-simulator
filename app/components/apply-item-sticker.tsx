/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CS2Economy } from "@ianlucas/cs2-lib";
import { useState } from "react";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useInventoryItem } from "~/components/hooks/use-inventory-item";
import { useNameItemString } from "~/components/hooks/use-name-item";
import { useSync } from "~/components/hooks/use-sync";
import {
  AddWithStickerAction,
  ApplyItemStickerAction
} from "~/routes/api.action.sync._index";
import { playSound } from "~/utils/sound";
import { useInventory, useLocalize } from "./app-context";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";

export function ApplyItemSticker({
  onClose,
  targetUid,
  stickerUid
}: {
  onClose: () => void;
  targetUid: number;
  stickerUid: number;
}) {
  const [inventory, setInventory] = useInventory();
  const localize = useLocalize();
  const sync = useSync();
  const nameItemString = useNameItemString();

  const [stickerIndex, setStickerIndex] = useState<number>();
  const stickerItem = useInventoryItem(stickerUid);
  const targetItem = useInventoryItem(targetUid);

  function handleApplySticker() {
    if (stickerIndex !== undefined) {
      if (targetUid >= 0) {
        sync({
          type: ApplyItemStickerAction,
          targetUid,
          stickerIndex,
          stickerUid
        });
        setInventory(
          inventory.applyItemSticker(targetUid, stickerUid, stickerIndex)
        );
        playSound("sticker_apply_confirm");
        onClose();
      } else {
        sync({
          type: AddWithStickerAction,
          stickerUid,
          itemId: targetItem.id,
          stickerIndex
        });
        setInventory(
          inventory.addWithSticker(stickerUid, targetItem.id, stickerIndex)
        );
        playSound("sticker_apply_confirm");
        onClose();
      }
    }
  }

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <div className="fixed left-0 top-0 z-50 flex h-full w-full select-none items-center justify-center bg-black/60 backdrop-blur-sm">
            <div>
              <UseItemHeader
                actionDesc={localize("ApplyStickerUseOn")}
                actionItem={nameItemString(targetItem)}
                title={localize("ApplyStickerUse")}
                warning={localize("ApplyStickerWarn")}
              />
              <ItemImage
                className="m-auto aspect-[1.33333] max-w-[512px]"
                item={targetItem}
              />
              <div className="flex items-center justify-center">
                {targetItem.allStickers().map(([slot, sticker]) =>
                  slot === 4 ? undefined : sticker !== undefined ||
                    slot === stickerIndex ? (
                    <ItemImage
                      key={slot}
                      className="h-[126px] w-[168px]"
                      item={
                        sticker !== undefined
                          ? CS2Economy.getById(sticker.id)
                          : stickerItem
                      }
                    />
                  ) : (
                    <button
                      key={slot}
                      className="group flex h-[126px] w-[168px] items-center justify-center"
                      onClick={() => {
                        setStickerIndex(slot);
                        playSound("sticker_apply");
                      }}
                    >
                      <div className="rounded-md border-2 border-white/20 p-4 px-6 transition group-hover:border-white/80">
                        <FontAwesomeIcon className="h-4" icon={faPlus} />
                      </div>
                    </button>
                  )
                )}
              </div>
              <UseItemFooter
                right={
                  <>
                    <ModalButton
                      children={localize("ApplyStickerUse")}
                      disabled={stickerIndex === undefined}
                      onClick={handleApplySticker}
                      variant="primary"
                    />
                    <ModalButton
                      children={localize("ApplyStickerCancel")}
                      onClick={onClose}
                      variant="secondary"
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
