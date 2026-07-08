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
import { useViewerFallback } from "./hooks/use-viewer-fallback";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { Overlay } from "./overlay";
import { ScrapeLevelSlider } from "./scrape-level-slider";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";

// "Confirm position" stays disabled this long after the weapon loads so the user
// registers the sticker (pulsed via highlight) before they can lock in the apply.
const CONFIRM_POSITION_DELAY_MS = 3500;

// Cadence of the highlight sweep during the confirm-delay window (each sweep ~0.7s).
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

// Shared commit path: apply the sticker onto an existing weapon, or add a free item
// carrying it, syncing the same placement, playing the confirm cue, and closing.
// Used by both the 3D and 2D bodies so they apply identically.
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

/**
 * Game-like apply: the weapon in the 3D viewer with its already-applied stickers, the
 * one being applied appended on top and active so it (only) can be moved/rotated. A
 * scrape slider sets its wear and "Next preset" cycles its anchor. "Confirm position"
 * unlocks Apply after a short highlight window; nudging the sticker again cancels the
 * confirmation, mirroring the game. If the viewer can't be reached, availability flips
 * and the parent falls back to {@link ApplyItemSticker2d}.
 */
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

  // The weapon's already-applied stickers stay fixed context; the sticker being
  // applied is appended on top of the stack and made active. Seeded once: its stack
  // index is `newIndex` and lines up 1:1 with the viewer's sticker index.
  const [existing] = useState(() =>
    CS2InventoryItem.stickersToArray(
      Object.fromEntries(targetItem.someStickers()),
      maxSchema
    )
  );
  const [newSticker] = useState(() => ({
    id: stickerItem.id,
    // Anchor on the first free markup slot (bounded by the body's anchor count),
    // never the stack index — that would overflow on reduced-anchor models.
    schema: getNextStickerSchema(existing, maxSchema)
  }));
  const newIndex = existing.length;
  // The viewer reads its initial stickers from the iframe `src` (captured once), so
  // hand it the existing stack plus the appended sticker; later changes go through
  // the api.
  const [initialItem] = useState<CS2BaseInventoryItem>(() => ({
    id: targetItem.id,
    seed: targetItem.seed,
    wear: targetItem.wear,
    statTrak: targetItem.statTrak,
    nameTag: targetItem.nameTag,
    stickers: CS2InventoryItem.stickersFromArray([...existing, newSticker])
  }));
  const { api, viewerProps } = useViewer({ item: initialItem });

  // Anchor (schema) and wear are driven from here (Next preset / scrape slider); the
  // offset/rotation are driven inside the viewer and mirrored back via `change`.
  const [schema, setSchema] = useState(newSticker.schema);
  const [wear, setWear] = useState(0);
  const placementRef = useRef<{ x?: number; y?: number; rotation?: number }>(
    {}
  );

  // "Confirm position" is disabled until the weapon has been shown for a moment, then
  // unlocks Apply; moving/rotating the sticker afterwards cancels it. The refs hold
  // the live values the once-registered `change` listener reads.
  const [confirmEnabled, setConfirmEnabled] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const confirmedRef = useRef(false);
  const confirmSnapshotRef = useRef<{
    x?: number;
    y?: number;
    rotation?: number;
  }>({});

  const viewerStatus = useViewerFallback(api);

  // Mirror the active sticker's offset/rotation so Apply persists what's shown, and
  // cancel a pending confirmation the moment the user nudges the sticker.
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

  // Once the viewer is ready, make the appended sticker active and pulse a highlight
  // over it through the confirm-delay window so the user notices which one they're
  // placing before Apply unlocks.
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
    // setStickerSchema re-anchors and zeroes offset/rotation in the viewer; the
    // `change` echo refreshes placementRef.
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

/**
 * 2D fallback used when the 3D viewer is unavailable (disabled or rate-limited):
 * the weapon image with a "+" on each free markup anchor to choose the new
 * sticker's slot. Persists the chosen `schema` only.
 */
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

  // v8 stores stickers as a stack array; each sticker's `schema` is the markup
  // anchor (the in-game slot it sits on). Build the grid from the weapon's markup
  // positions and offer a "+" on each one no applied sticker occupies.
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

/**
 * Apply a sticker onto a weapon. Prefers the 3D viewer (move/rotate the sticker in
 * place); falls back to the 2D anchor picker when the viewer is unavailable.
 */
export function ApplyItemSticker(props: ApplyItemStickerProps) {
  // The 3D scene renders the target weapon (with its existing stickers) AND the sticker being
  // applied, so all of them must be viewer-supported; otherwise fall back to the 2D anchor picker.
  const targetItem = useInventoryItem(props.targetUid);
  const stickerItem = useInventoryItem(props.stickerUid);
  const { canUse3d, isStickerSupported } = useViewerAvailability(targetItem);
  return canUse3d && isStickerSupported(stickerItem.id) ? (
    <ApplyItemSticker3d {...props} />
  ) : (
    <ApplyItemSticker2d {...props} />
  );
}
