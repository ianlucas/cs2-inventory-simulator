/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS_Economy,
  CS_INVENTORY_NO_STICKERS,
  CS_NO_STICKER
} from "@ianlucas/cslib";
import { useState } from "react";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useSync } from "~/hooks/use-sync";
import { useTranslation } from "~/hooks/use-translation";
import {
  AddWithStickerAction,
  ApplyItemStickerAction
} from "~/routes/api.action.sync._index";
import { playSound } from "~/utils/sound";
import { CSItemImage } from "./cs-item-image";
import { ModalButton } from "./modal-button";
import { useRootContext } from "./root-context";
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
  const translate = useTranslation();
  const { items, inventory, setInventory } = useRootContext();
  const sync = useSync();

  const [stickerIndex, setStickerIndex] = useState<number>();
  const [stickerItem] = useState(inventory.getItem(stickerUid));

  const targetItem =
    targetUid >= 0
      ? inventory.getItem(targetUid)
      : items.find(({ uid }) => uid === targetUid)!.item;
  const stickers =
    (targetUid >= 0 ? inventory.get(targetUid).stickers : undefined) ??
    CS_INVENTORY_NO_STICKERS.slice();

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
                actionDesc={translate("ApplyStickerUseOn")}
                actionItem={targetItem.name}
                title={translate("ApplyStickerUse")}
                warning={translate("ApplyStickerWarn")}
              />
              <CSItemImage
                className="m-auto aspect-[1.33333] max-w-[512px]"
                item={targetItem}
              />
              <div className="flex">
                {stickers.map((id, index) =>
                  id !== CS_NO_STICKER || index === stickerIndex ? (
                    <CSItemImage
                      key={index}
                      className="h-[126px] w-[168px]"
                      item={
                        index === stickerIndex
                          ? stickerItem
                          : CS_Economy.getById(id!)
                      }
                    />
                  ) : (
                    <button
                      key={index}
                      className="group flex h-[126px] w-[168px] items-center justify-center"
                      onClick={() => {
                        setStickerIndex(index);
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
                      children={translate("ApplyStickerUse")}
                      disabled={stickerIndex === undefined}
                      onClick={handleApplySticker}
                      variant="primary"
                    />
                    <ModalButton
                      children={translate("ApplyStickerCancel")}
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
