/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS_Economy,
  CS_Item,
  CS_MAX_STICKER_WEAR,
  CS_STICKER_WEAR_FACTOR,
  CS_WEAR_FACTOR
} from "@ianlucas/cslib";
import { useState } from "react";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useSync } from "~/hooks/use-sync";
import { useTranslation } from "~/hooks/use-translation";
import { playSound } from "~/utils/sound";
import { CSItemImage } from "./cs-item-image";
import { Modal } from "./modal";
import { ModalButton } from "./modal-button";
import { useRootContext } from "./root-context";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";

export function ScrapeSticker({
  onClose,
  index
}: {
  onClose(): void;
  index: number;
}) {
  const translate = useTranslation();
  const { inventory, setInventory, statsForNerds } = useRootContext();
  const sync = useSync();
  const [item] = useState(inventory.getItem(index));
  const [confirmScrapeIndex, setConfirmScrapeIndex] = useState<number>();

  const inventoryItem = inventory.get(index);
  const stickers = inventoryItem.stickers ?? [null, null, null, null];
  const stickersWear = (
    inventoryItem.stickerswear ?? [null, null, null, null]
  ).map((wear) => (wear === null ? 0 : wear));

  function doScrapeSticker(stickerIndex: number) {
    const scratch = Math.ceil(
      (stickersWear[stickerIndex] + CS_STICKER_WEAR_FACTOR) * 5
    );
    sync({
      type: "scrape-item-sticker",
      itemIndex: index,
      stickerIndex
    });
    setInventory(inventory.scrapeItemSticker(index, stickerIndex));
    playSound(`/sounds/sticker_scratch${scratch}.wav`);
  }

  function handleScrapeSticker(stickerIndex: number) {
    if (stickersWear[stickerIndex] + CS_WEAR_FACTOR > CS_MAX_STICKER_WEAR) {
      setConfirmScrapeIndex(stickerIndex);
    } else {
      doScrapeSticker(stickerIndex);
    }
  }

  function handleConfirmScrape() {
    if (confirmScrapeIndex !== undefined) {
      // We do twice because wear 0 is probably invisible in-game.  If this
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
                  title={translate("ScrapeStickerUse")}
                  warning={translate("ScrapeStickerWarn")}
                  warningItem={item.name}
                />
                <CSItemImage
                  className="m-auto aspect-[1.33333] max-w-[512px]"
                  item={item}
                />
                <div className="flex justify-center">
                  {stickers.map((id, index) =>
                    id !== null ? (
                      <button key={index} className="group">
                        <CSItemImage
                          className="h-[126px] w-[168px] scale-90 drop-shadow-lg transition-all group-hover:scale-100 group-active:scale-125"
                          onClick={() => handleScrapeSticker(index)}
                          style={{
                            filter: `grayscale(${stickersWear[index]})`,
                            opacity: `${1 - stickersWear[index]}`
                          }}
                          item={CS_Economy.getById(id)}
                        />
                        {statsForNerds && (
                          <span className="text-sm text-neutral-300">
                            {stickersWear[index].toFixed(2)}
                          </span>
                        )}
                      </button>
                    ) : null
                  )}
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
              </div>
            </div>
            {confirmScrapeIndex !== undefined && (
              <Modal>
                <div className="px-4 py-2 text-sm font-bold">
                  <span className="text-neutral-400">
                    {translate("ScrapeStickerRemove")}
                  </span>
                </div>
                <p className="px-4">{translate("ScrapeStickerRemoveDesc")}</p>
                <div className="flex justify-end px-4 py-2">
                  <ModalButton
                    onClick={handleConfirmScrape}
                    variant="secondary"
                    children={translate("ScrapeStickerRemove")}
                  />
                  <ModalButton
                    onClick={() => setConfirmScrapeIndex(undefined)}
                    variant="secondary"
                    children={translate("ScrapeStickerCancel")}
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
