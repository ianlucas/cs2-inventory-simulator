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
import { ScrapeItemStickerAction } from "~/routes/api.action.sync._index";
import { playSound } from "~/utils/sound";
import { useInventory, useLocalize, usePreferences } from "./app-context";
import { ItemImage } from "./item-image";
import { Modal } from "./modal";
import { ModalButton } from "./modal-button";
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
      type: ScrapeItemStickerAction,
      targetUid: uid,
      slot: slot
    });
    setInventory(inventory.scrapeItemSticker(uid, slot));
    playSound(`sticker_scratch${scratch as 1 | 2 | 3 | 4 | 5}`);
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
            <div className="fixed left-0 top-0 z-50 flex h-full w-full select-none items-center justify-center bg-black/60 backdrop-blur-sm">
              <div>
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
              </div>
            </div>
            {confirmScrapeIndex !== undefined && (
              <Modal>
                <div className="px-4 py-2 text-sm font-bold">
                  <span className="text-neutral-400">
                    {localize("ScrapeStickerRemove")}
                  </span>
                </div>
                <p className="px-4">{localize("ScrapeStickerRemoveDesc")}</p>
                <div className="flex justify-end px-4 py-2">
                  <ModalButton
                    onClick={handleConfirmScrape}
                    variant="secondary"
                    children={localize("ScrapeStickerRemove")}
                  />
                  <ModalButton
                    onClick={() => setConfirmScrapeIndex(undefined)}
                    variant="secondary"
                    children={localize("ScrapeStickerCancel")}
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
