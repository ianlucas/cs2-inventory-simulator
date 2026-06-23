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
import { SyncAction } from "~/data/sync";
import { range } from "~/utils/number";
import { playSound } from "~/utils/sound";
import { useInventory, useTranslate } from "./app-context";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { Overlay } from "./overlay";
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
  const translate = useTranslate();
  const sync = useSync();
  const nameItemString = useNameItemString();

  const [schema, setSchema] = useState<number>();
  const stickerItem = useInventoryItem(stickerUid);
  const targetItem = useInventoryItem(targetUid);

  // v8 stores stickers as a stack array; each sticker's `schema` is the markup
  // anchor (the in-game slot it sits on). Build the grid from the weapon's
  // markup positions and offer a "+" on each one no applied sticker occupies.
  const schemaCount = targetItem.getStickerSchemaCount();
  const stickerBySchema = new Map(
    targetItem
      .someStickers()
      .map(([index, sticker]) => [sticker.schema ?? index, sticker])
  );

  function handleApplySticker() {
    if (schema !== undefined) {
      if (targetUid >= 0) {
        sync({
          type: SyncAction.ApplyItemSticker,
          targetUid,
          schema,
          stickerUid
        });
        setInventory(inventory.applyItemSticker(targetUid, stickerUid, schema));
        playSound("sticker_apply_confirm");
        onClose();
      } else {
        sync({
          type: SyncAction.AddWithSticker,
          stickerUid,
          itemId: targetItem.id,
          schema
        });
        setInventory(
          inventory.addWithSticker(stickerUid, targetItem.id, schema)
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
          <Overlay>
            <UseItemHeader
              actionDesc={translate("ApplyStickerUseOn")}
              actionItem={nameItemString(targetItem)}
              title={translate("ApplyStickerUse")}
              warning={translate("ApplyStickerWarn")}
            />
            <ItemImage className="m-auto max-w-lg" item={targetItem} />
            <div className="flex items-center justify-center">
              {range(schemaCount).map((position) => {
                const applied = stickerBySchema.get(position);
                return applied !== undefined || position === schema ? (
                  <ItemImage
                    key={position}
                    className="w-42"
                    item={
                      applied !== undefined
                        ? CS2Economy.getById(applied.id)
                        : stickerItem
                    }
                  />
                ) : (
                  <button
                    key={position}
                    className="group flex h-31.5 w-42 items-center justify-center"
                    onClick={() => {
                      setSchema(position);
                      playSound("sticker_apply");
                    }}
                  >
                    <div className="rounded-md border-2 border-white/20 p-4 px-6 transition group-hover:border-white/80">
                      <FontAwesomeIcon className="h-4" icon={faPlus} />
                    </div>
                  </button>
                );
              })}
            </div>
            <UseItemFooter
              right={
                <>
                  <ModalButton
                    children={translate("ApplyStickerUse")}
                    disabled={schema === undefined}
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
          </Overlay>,
          document.body
        )
      }
    />
  );
}
