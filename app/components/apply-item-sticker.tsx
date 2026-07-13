/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS2BaseInventoryItem,
  CS2Economy,
  CS2InventoryItem,
  getNextStickerSchema
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useInventoryItem } from "~/components/hooks/use-inventory-item";
import { useNameItemString } from "~/components/hooks/use-name-item";
import { useSync } from "~/components/hooks/use-sync";
import { SyncAction } from "~/data/sync";
import { range } from "~/utils/number";
import { playSound } from "~/utils/sound";
import { useInventory, useTranslate } from "./app-context";
import { ViewerOverlay } from "./viewer-overlay";
import { useViewer } from "./hooks/use-viewer";
import { useViewerAvailability } from "./hooks/use-viewer-availability";
import { useViewerStatus } from "./hooks/use-viewer-status";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { Overlay } from "./overlay";
import { ScrapeLevelSlider } from "./scrape-level-slider";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";

const CONFIRM_POSITION_DELAY_MS = 3500;

const HIGHLIGHT_PULSE_INTERVAL_MS = 1000;

interface ApplyItemStickerProps {
  onClose: () => void;
  targetUid: number;
  stickerUid: number;
}

interface StickerPlacement {
  schema: number;
  x?: number;
  y?: number;
  rotation?: number;
  wear?: number;
}

function useApplySticker(
  targetUid: number,
  stickerUid: number,
  onClose: () => void
) {
  const [inventory, setInventory] = useInventory();
  const sync = useSync();
  const targetItem = useInventoryItem(targetUid);
  return function applySticker({
    schema,
    x,
    y,
    rotation,
    wear
  }: StickerPlacement) {
    if (targetUid >= 0) {
      sync({
        type: SyncAction.ApplyItemSticker,
        targetUid,
        stickerUid,
        schema,
        x,
        y,
        rotation,
        wear
      });
      setInventory(
        inventory.applyItemSticker(targetUid, stickerUid, {
          schema,
          x,
          y,
          rotation,
          wear
        })
      );
    } else {
      sync({
        type: SyncAction.AddWithSticker,
        stickerUid,
        itemId: targetItem.id,
        schema,
        x,
        y,
        rotation,
        wear
      });
      setInventory(
        inventory.addWithSticker(stickerUid, targetItem.id, {
          schema,
          x,
          y,
          rotation,
          wear
        })
      );
    }
    playSound("sticker_apply_confirm");
    onClose();
  };
}

function ApplyItemSticker3d({
  onClose,
  targetUid,
  stickerUid
}: ApplyItemStickerProps) {
  const translate = useTranslate();
  const nameItemString = useNameItemString();
  const applySticker = useApplySticker(targetUid, stickerUid, onClose);

  const targetItem = useInventoryItem(targetUid);
  const stickerItem = useInventoryItem(stickerUid);
  const maxSchema = targetItem.getStickerSchemaCount();

  const [existing] = useState(() =>
    CS2InventoryItem.stickersToArray(
      Object.fromEntries(targetItem.someStickers()),
      maxSchema
    )
  );
  const [newSticker] = useState(() => ({
    id: stickerItem.id,
    // Anchor on the first free schema, never the stack index (overflows on
    // reduced-anchor models).
    schema: getNextStickerSchema(existing, maxSchema)
  }));
  const newIndex = existing.length;
  const [initialItem] = useState<CS2BaseInventoryItem>(() => ({
    id: targetItem.id,
    seed: targetItem.seed,
    wear: targetItem.wear,
    statTrak: targetItem.statTrak,
    nameTag: targetItem.nameTag,
    stickers: CS2InventoryItem.stickersFromArray([...existing, newSticker])
  }));
  const { api, viewerProps } = useViewer({ item: initialItem });

  const [schema, setSchema] = useState(newSticker.schema);
  const [wear, setWear] = useState(0);
  const placementRef = useRef<{ x?: number; y?: number; rotation?: number }>(
    {}
  );

  const [confirmEnabled, setConfirmEnabled] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const confirmedRef = useRef(false);
  const confirmSnapshotRef = useRef<{
    x?: number;
    y?: number;
    rotation?: number;
  }>({});

  const viewerStatus = useViewerStatus(api);

  useEffect(() => {
    if (api === undefined) {
      return;
    }
    const offChange = api.on("change", ({ item }) => {
      const sticker = item.stickers?.[newIndex];
      if (sticker === undefined) {
        return;
      }
      placementRef.current = {
        x: sticker.x,
        y: sticker.y,
        rotation: sticker.rotation
      };
      if (confirmedRef.current) {
        const snapshot = confirmSnapshotRef.current;
        if (
          sticker.x !== snapshot.x ||
          sticker.y !== snapshot.y ||
          sticker.rotation !== snapshot.rotation
        ) {
          confirmedRef.current = false;
          setConfirmed(false);
        }
      }
    });
    return () => offChange();
  }, [api, newIndex]);

  useEffect(() => {
    if (api === undefined || viewerStatus !== "ready") {
      return;
    }
    api.setActiveSticker({ index: newIndex });
    api.highlightSticker({ index: newIndex });
    const pulse = setInterval(
      () => api.highlightSticker({ index: newIndex }),
      HIGHLIGHT_PULSE_INTERVAL_MS
    );
    const unlock = setTimeout(() => {
      clearInterval(pulse);
      setConfirmEnabled(true);
    }, CONFIRM_POSITION_DELAY_MS);
    return () => {
      clearInterval(pulse);
      clearTimeout(unlock);
    };
  }, [api, viewerStatus, newIndex]);

  function handleWearChange(nextWear: number) {
    setWear(nextWear);
    api?.setStickerWear({ index: newIndex, wear: nextWear });
  }

  function handleNextPreset() {
    const nextSchema = (schema + 1) % maxSchema;
    setSchema(nextSchema);
    api?.setStickerSchema({ index: newIndex, schema: nextSchema });
  }

  function handleConfirm() {
    confirmSnapshotRef.current = { ...placementRef.current };
    confirmedRef.current = true;
    setConfirmed(true);
  }

  function handleCancelConfirm() {
    confirmedRef.current = false;
    setConfirmed(false);
  }

  return (
    <ViewerOverlay
      header={
        <UseItemHeader
          actionDesc={translate("ApplyStickerUseOn")}
          actionItem={nameItemString(targetItem)}
          stickerHint
          title={translate("ApplyStickerUse")}
          warning={translate("ApplyStickerWarn")}
        />
      }
      viewerProps={viewerProps}
    >
      <div className="pointer-events-none absolute bottom-8 left-0 flex w-full flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-2 text-white/95 drop-shadow-sm">
          <ItemImage className="h-25" item={stickerItem} />
          <div
            className={clsx(
              "flex items-center gap-2",
              confirmed && "opacity-50"
            )}
          >
            <span className="font-display text-xs tracking-wider">
              {translate("StickerScrapeLevel")}
            </span>
            <ScrapeLevelSlider
              disabled={confirmed}
              onChange={handleWearChange}
              value={wear}
            />
          </div>
          <div className="flex items-center gap-2">
            <ModalButton
              uppercaseless
              children={translate("ApplyStickerConfirmPosition")}
              disabled={!confirmEnabled || confirmed}
              onClick={handleConfirm}
              variant="primary"
            />
            {confirmed ? (
              <ModalButton
                uppercaseless
                className="gap-2"
                onClick={handleCancelConfirm}
                variant="tertiary"
              >
                {translate("ApplyStickerCancel")}
                <img
                  alt=""
                  className="h-4"
                  draggable={false}
                  src="/images/vectors/cancel.svg"
                />
              </ModalButton>
            ) : (
              maxSchema > 1 && (
                <ModalButton
                  className="gap-2"
                  onClick={handleNextPreset}
                  variant="tertiary"
                  uppercaseless
                >
                  {translate("ApplyStickerNextPreset")}
                  <img
                    alt=""
                    className="h-4 -scale-x-100"
                    draggable={false}
                    src="/images/vectors/back.svg"
                  />
                </ModalButton>
              )
            )}
          </div>
        </div>
        <UseItemFooter
          className="w-200"
          right={
            <>
              <ModalButton
                children={translate("ApplyStickerUse")}
                disabled={!confirmed}
                onClick={() =>
                  applySticker({
                    schema,
                    wear,
                    x: placementRef.current.x,
                    y: placementRef.current.y,
                    rotation: placementRef.current.rotation
                  })
                }
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
    </ViewerOverlay>
  );
}

function ApplyItemSticker2d({
  onClose,
  targetUid,
  stickerUid
}: ApplyItemStickerProps) {
  const translate = useTranslate();
  const nameItemString = useNameItemString();
  const applySticker = useApplySticker(targetUid, stickerUid, onClose);

  const [schema, setSchema] = useState<number>();
  const stickerItem = useInventoryItem(stickerUid);
  const targetItem = useInventoryItem(targetUid);

  const schemaCount = targetItem.getStickerSchemaCount();
  const stickerBySchema = new Map(
    targetItem
      .someStickers()
      .map(([index, sticker]) => [sticker.schema ?? index, sticker])
  );

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
                    onClick={() =>
                      schema !== undefined && applySticker({ schema })
                    }
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

export function ApplyItemSticker(props: ApplyItemStickerProps) {
  const targetItem = useInventoryItem(props.targetUid);
  const stickerItem = useInventoryItem(props.stickerUid);
  const { canUse3d, isStickerSupported } = useViewerAvailability(targetItem, {
    attachment: true
  });
  return canUse3d && isStickerSupported(stickerItem.id) ? (
    <ApplyItemSticker3d {...props} />
  ) : (
    <ApplyItemSticker2d {...props} />
  );
}
