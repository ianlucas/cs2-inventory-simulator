/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2Economy,
  CS2_MAX_STICKER_WEAR,
  CS2_STICKER_WEAR_FACTOR,
  CS2_WEAR_FACTOR
} from "@ianlucas/cs2-lib";
import { useState } from "react";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useNameItemString } from "~/components/hooks/use-name-item";
import { useSync } from "~/components/hooks/use-sync";
import { SyncAction } from "~/data/sync";
import { playSound } from "~/utils/sound";
import { useInventory, useLocalize, usePreferences } from "./app-context";
import { ItemImage } from "./item-image";
import { Modal, ModalHeader } from "./modal";
import { ModalButton } from "./modal-button";
import { Overlay } from "./overlay";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";

export function ScrapeItemSticker({
  onClose,
  uid
}: {
  onClose: () => void;
  uid: number;
}) {
  const nameItemString = useNameItemString();
  const { statsForNerds } = usePreferences();
  const [inventory, setInventory] = useInventory();

  const localize = useLocalize();
  const sync = useSync();

  const [confirmScrapeIndex, setConfirmScrapeIndex] = useState<number>();

  const item = inventory.get(uid);

  function doScrapeSticker(slot: number) {
    const scratch = Math.ceil(
      (item.getStickerWear(slot) + CS2_STICKER_WEAR_FACTOR) * 5
    );
    sync({
      type: SyncAction.ScrapeItemSticker,
      targetUid: uid,
      slot: slot
    });
    setInventory(inventory.scrapeItemSticker(uid, slot));
    playSound(`sticker_scratch${scratch as 1 | 2 | 3 | 4 | 5}`);
    if (item.getStickersCount() === 0) {
      onClose();
    }
  }

  function handleScrapeSticker(slot: number) {
    if (item.getStickerWear(slot) + CS2_WEAR_FACTOR > CS2_MAX_STICKER_WEAR) {
      setConfirmScrapeIndex(slot);
    } else {
      doScrapeSticker(slot);
    }
  }

  function handleConfirmScrape() {
    if (confirmScrapeIndex !== undefined) {
      // We do twice because wear 0 is probably invisible in-game. If this
      // doesn't hold true, we'll need to change this.
      doScrapeSticker(confirmScrapeIndex);
      doScrapeSticker(confirmScrapeIndex);
      setConfirmScrapeIndex(undefined);
    }
  }

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <>
            <Overlay>
              <UseItemHeader
                title={localize("ScrapeStickerUse")}
                warning={localize("ScrapeStickerWarn")}
                warningItem={nameItemString(item)}
              />
              <ItemImage
                className="m-auto aspect-[1.33333] max-w-[512px]"
                item={item}
              />
              <div className="flex justify-center">
                {item.someStickers().map(([index, { id, wear }]) => (
                  <button key={index} className="group">
                    <ItemImage
                      className="h-[126px] w-[168px] scale-90 drop-shadow-lg transition-all group-hover:scale-100 group-active:scale-125"
                      onClick={() => handleScrapeSticker(index)}
                      style={{
                        filter: `grayscale(${wear ?? 0})`,
                        opacity: `${1 - (wear ?? 0)}`
                      }}
                      item={CS2Economy.getById(id)}
                    />
                    {statsForNerds && (
                      <div className="text-sm font-bold text-neutral-300 transition-all group-hover:scale-150">
                        {((wear ?? 0) * 100).toFixed(0)}%
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <UseItemFooter
                right={
                  <ModalButton
                    children={localize("ScrapeStickerClose")}
                    onClick={onClose}
                    variant="secondary"
                  />
                }
              />
            </Overlay>
            {confirmScrapeIndex !== undefined && (
              <Modal className="w-[480px]" fixed>
                <ModalHeader title={localize("ScrapeStickerRemove")} />
                <p className="mt-2 px-4">
                  {localize("ScrapeStickerRemoveDesc")}
                </p>
                <div className="my-6 flex justify-center gap-2 px-4">
                  <ModalButton
                    onClick={() => setConfirmScrapeIndex(undefined)}
                    variant="secondary"
                    children={localize("ScrapeStickerCancel")}
                  />
                  <ModalButton
                    onClick={handleConfirmScrape}
                    variant="primary"
                    children={localize("ScrapeStickerRemove")}
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
