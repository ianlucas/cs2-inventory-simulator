/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2_MAX_STICKER_WEAR,
  CS2_STICKER_WEAR_FACTOR,
  CS2BaseInventoryItem,
  CS2Economy,
  CS2InventoryItem
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useInventoryItem } from "~/components/hooks/use-inventory-item";
import { useNameItemString } from "~/components/hooks/use-name-item";
import { useSync } from "~/components/hooks/use-sync";
import { SyncAction } from "~/data/sync";
import { playSound } from "~/utils/sound";
import {
  useInventory,
  usePreferences,
  useRules,
  useTranslate
} from "./app-context";
import { ViewerOverlay } from "./viewer-overlay";
import { HoldButton } from "./hold-button";
import { useViewer } from "./hooks/use-viewer";
import { useViewerAvailability } from "./hooks/use-viewer-availability";
import { useViewerStatus } from "./hooks/use-viewer-status";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { Overlay } from "./overlay";
import { ScrapeLevelSlider } from "./scrape-level-slider";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";

const REMOVE_STICKER_HOLD_MS = 1500;

interface ScrapeItemStickerProps {
  onClose: () => void;
  uid: number;
}

interface ScrapeViewer {
  highlight: (index: number) => void;
  setWear: (index: number, wear: number) => void;
}

function useScrapeSticker({
  onClose,
  uid,
  viewer
}: {
  onClose: () => void;
  uid: number;
  viewer: ScrapeViewer;
}) {
  const [inventory, setInventory] = useInventory();
  const sync = useSync();
  const item = inventory.get(uid);

  const [selectedIndex, setSelectedIndex] = useState<number>();
  const [wear, setWear] = useState(0);
  const previewedIndexRef = useRef<number | undefined>(undefined);

  const committedWear =
    selectedIndex !== undefined ? item.getStickerWear(selectedIndex) : 0;
  // One factor below full so scraping never trips cs2-lib's wear-1 removal.
  const maxWear = CS2_MAX_STICKER_WEAR - CS2_STICKER_WEAR_FACTOR;
  const canScrape = selectedIndex !== undefined && wear > committedWear;

  function select(index: number) {
    const previewed = previewedIndexRef.current;
    if (previewed !== undefined && previewed !== index) {
      viewer.setWear(previewed, item.getStickerWear(previewed));
    }
    previewedIndexRef.current = index;
    setSelectedIndex(index);
    setWear(item.getStickerWear(index));
    viewer.highlight(index);
  }

  function handleWearChange(nextWear: number) {
    if (selectedIndex === undefined) {
      return;
    }
    const clamped = Math.max(committedWear, nextWear);
    setWear(clamped);
    viewer.setWear(selectedIndex, clamped);
  }

  function handleScrape() {
    if (selectedIndex === undefined || wear <= committedWear) {
      return;
    }
    const index = selectedIndex;
    sync({ type: SyncAction.ScrapeItemSticker, targetUid: uid, index, wear });
    setInventory(inventory.scrapeItemSticker(uid, index, wear));
    playSound("sticker_scratch1");
    viewer.highlight(index);
  }

  function handleRemove() {
    if (selectedIndex === undefined) {
      return;
    }
    sync({
      type: SyncAction.RemoveItemSticker,
      targetUid: uid,
      index: selectedIndex
    });
    setInventory(inventory.removeItemSticker(uid, selectedIndex));
    onClose();
  }

  return {
    canScrape,
    handleRemove,
    handleScrape,
    handleWearChange,
    item,
    maxWear,
    select,
    selectedIndex,
    wear
  };
}

function ScrapeStickerRow({
  item,
  onSelect,
  selectedIndex
}: {
  item: CS2InventoryItem;
  onSelect: (index: number) => void;
  selectedIndex: number | undefined;
}) {
  const { statsForNerds } = usePreferences();
  const [flashNonce, setFlashNonce] = useState(0);
  function handleSelect(index: number) {
    setFlashNonce((nonce) => nonce + 1);
    onSelect(index);
  }
  return (
    <div className="pointer-events-auto flex items-start justify-center gap-0">
      {item.someStickers().map(([index, { id, wear }]) => {
        const selected = index === selectedIndex;
        return (
          <button
            key={index}
            className="group relative flex flex-col items-center"
            onClick={() => handleSelect(index)}
          >
            <div
              className={clsx(
                "relative drop-shadow-lg transition-all",
                selected
                  ? "scale-100 opacity-100"
                  : "scale-80 opacity-50 group-hover:scale-100"
              )}
            >
              <span
                className={clsx(
                  "pointer-events-none absolute -top-6 left-1/2 z-0 -translate-x-1/2 transition-all duration-200",
                  selected
                    ? "translate-y-0 opacity-100"
                    : "translate-y-1.5 opacity-0"
                )}
              >
                <span
                  key={selected ? `check-${flashNonce}` : "check"}
                  className={clsx(
                    "flex size-6.5 items-center justify-center rounded-full bg-green-600 shadow-md",
                    selected && "animate-[scrape-pop_450ms_ease-out]"
                  )}
                >
                  <img
                    alt=""
                    className="h-4.5"
                    draggable={false}
                    src="/images/vectors/check.svg"
                  />
                </span>
              </span>
              <div
                key={selected ? `pop-${flashNonce}` : "pop"}
                className={clsx(
                  "relative z-10",
                  selected && "animate-[scrape-pop_450ms_ease-out]"
                )}
              >
                <ItemImage className="w-32" item={CS2Economy.getById(id)} />
              </div>
            </div>
            {statsForNerds && (
              <div className="text-sm font-bold text-neutral-300">
                {((wear ?? 0) * 100).toFixed(0)}%
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ScrapeStickerControls({
  canRemove,
  canScrape,
  footerClassName,
  item,
  maxWear,
  onClose,
  onRemove,
  onScrape,
  onSelect,
  onWearChange,
  selectedIndex,
  wear
}: {
  canRemove: boolean;
  canScrape: boolean;
  footerClassName?: string;
  item: CS2InventoryItem;
  maxWear: number;
  onClose: () => void;
  onRemove: () => void;
  onScrape: () => void;
  onSelect: (index: number) => void;
  onWearChange: (wear: number) => void;
  selectedIndex: number | undefined;
  wear: number;
}) {
  const translate = useTranslate();
  const hasSelection = selectedIndex !== undefined;
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <ScrapeStickerRow
        item={item}
        onSelect={onSelect}
        selectedIndex={selectedIndex}
      />
      <div
        className={clsx(
          "pointer-events-auto flex items-center gap-2 text-white/95 drop-shadow-sm transition-opacity",
          !hasSelection && "opacity-0"
        )}
      >
        <span className="font-display text-xs tracking-wider">
          {translate("StickerScrapeLevel")}
        </span>
        <ScrapeLevelSlider
          disabled={!hasSelection}
          max={maxWear}
          onChange={onWearChange}
          value={wear}
        />
      </div>
      <UseItemFooter
        className={footerClassName}
        right={
          <>
            {canRemove && (
              <HoldButton
                durationMs={REMOVE_STICKER_HOLD_MS}
                disabled={!hasSelection}
                onHold={onRemove}
                tooltip={translate("ScrapeStickerRemoveHint")}
              >
                {translate("ScrapeStickerRemove")}
              </HoldButton>
            )}
            <ModalButton
              children={translate("ScrapeStickerUse")}
              disabled={!canScrape}
              onClick={onScrape}
              variant="primary"
            />
            <ModalButton
              children={translate("ScrapeStickerClose")}
              onClick={onClose}
              variant="secondary"
            />
          </>
        }
      />
    </div>
  );
}

function ScrapeItemSticker3d({ onClose, uid }: ScrapeItemStickerProps) {
  const translate = useTranslate();
  const nameItemString = useNameItemString();
  const { inventoryItemAllowRemoveSticker } = useRules();

  const item = useInventoryItem(uid);
  const maxSchema = item.getStickerSchemaCount();
  const [initialItem] = useState<CS2BaseInventoryItem>(() => ({
    id: item.id,
    seed: item.seed,
    wear: item.wear,
    statTrak: item.statTrak,
    nameTag: item.nameTag,
    stickers: CS2InventoryItem.stickersFromArray(
      CS2InventoryItem.stickersToArray(
        Object.fromEntries(item.someStickers()),
        maxSchema
      )
    )
  }));
  const { api, viewerProps } = useViewer({ item: initialItem });

  const scrape = useScrapeSticker({
    onClose,
    uid,
    viewer: {
      highlight: (index) => api?.highlightSticker({ index }),
      setWear: (index, wear) => api?.setStickerWear({ index, wear })
    }
  });

  // Bare call: flips availability so the parent swaps to 2D when the viewer
  // is rate-limited or never becomes ready.
  useViewerStatus(api);

  return (
    <ViewerOverlay
      header={
        <UseItemHeader
          actionDesc={translate("ScrapeStickerUseOn")}
          actionItem={nameItemString(item)}
          title={translate("ScrapeStickerRemove")}
          warning={translate("ScrapeStickerSelectHint")}
        />
      }
      viewerProps={viewerProps}
    >
      <div className="pointer-events-none absolute bottom-8 left-0 w-full">
        <ScrapeStickerControls
          canRemove={inventoryItemAllowRemoveSticker}
          canScrape={scrape.canScrape}
          footerClassName="w-200"
          item={scrape.item}
          maxWear={scrape.maxWear}
          onClose={onClose}
          onRemove={scrape.handleRemove}
          onScrape={scrape.handleScrape}
          onSelect={scrape.select}
          onWearChange={scrape.handleWearChange}
          selectedIndex={scrape.selectedIndex}
          wear={scrape.wear}
        />
      </div>
    </ViewerOverlay>
  );
}

function ScrapeItemSticker2d({ onClose, uid }: ScrapeItemStickerProps) {
  const translate = useTranslate();
  const nameItemString = useNameItemString();
  const { inventoryItemAllowRemoveSticker } = useRules();

  const scrape = useScrapeSticker({
    onClose,
    uid,
    viewer: { highlight: () => {}, setWear: () => {} }
  });

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <Overlay>
            <UseItemHeader
              actionDesc={translate("ScrapeStickerUseOn")}
              actionItem={nameItemString(scrape.item)}
              title={translate("ScrapeStickerRemove")}
              warning={translate("ScrapeStickerSelectHint")}
            />
            <ItemImage className="m-auto max-w-lg" item={scrape.item} />
            <ScrapeStickerControls
              canRemove={inventoryItemAllowRemoveSticker}
              canScrape={scrape.canScrape}
              item={scrape.item}
              maxWear={scrape.maxWear}
              onClose={onClose}
              onRemove={scrape.handleRemove}
              onScrape={scrape.handleScrape}
              onSelect={scrape.select}
              onWearChange={scrape.handleWearChange}
              selectedIndex={scrape.selectedIndex}
              wear={scrape.wear}
            />
          </Overlay>,
          document.body
        )
      }
    />
  );
}

export function ScrapeItemSticker(props: ScrapeItemStickerProps) {
  const item = useInventoryItem(props.uid);
  const { canUse3d } = useViewerAvailability(item, { attachment: true });
  return canUse3d ? (
    <ScrapeItemSticker3d {...props} />
  ) : (
    <ScrapeItemSticker2d {...props} />
  );
}
