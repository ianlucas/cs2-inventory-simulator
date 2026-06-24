/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS2_MAX_STICKER_WEAR,
  CS2_MIN_STICKER_WEAR,
  CS2_STICKER_WEAR_FACTOR,
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
import { useInventory, useRules, useTranslate } from "./app-context";
import { Cs2Viewer } from "./cs2-viewer";
import { useCs2Viewer } from "./hooks/use-cs2-viewer";
import {
  markCs2ViewerRateLimited,
  useCs2ViewerAvailability
} from "./hooks/use-cs2-viewer-availability";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { Overlay } from "./overlay";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";

// How long to wait for the viewer's ready handshake before falling back to the 2D
// picker, so a down/blocked viewer doesn't strand the user on a blank overlay.
const VIEWER_READY_TIMEOUT_MS = 6000;

// Client-side cooldown applied when the viewer fails to become ready (not a rate
// limit, but the same "fall back to 2D for a bit" behavior).
const VIEWER_UNREACHABLE_COOLDOWN_MS = 30_000;

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
 * In-game "scrape sticker level" slider: a bare track with a filled progress portion
 * and a square thumb, driving the active sticker's wear. Deliberately not the craft
 * editor's `EditorStepRange` — that thin/round look doesn't match the game.
 */
function ScrapeLevelSlider({
  disabled,
  onChange,
  value
}: {
  disabled?: boolean;
  onChange: (wear: number) => void;
  value: number;
}) {
  return (
    <div className="pointer-events-auto relative h-3 w-32">
      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-[3px] bg-black/40" />
      <div
        className="absolute top-1/2 left-0 h-1.5 -translate-y-1/2 rounded-[3px] bg-[#d0bfbf98]"
        style={{ width: `${value * 100}%` }}
      />
      <input
        className="absolute inset-0 w-full cursor-pointer appearance-none bg-transparent disabled:cursor-default [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-xs [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-[1px_1px_4px_1px_#00000050] [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-xs [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[1px_1px_4px_1px_#00000050]"
        disabled={disabled}
        max={CS2_MAX_STICKER_WEAR}
        min={CS2_MIN_STICKER_WEAR}
        onChange={(event) => onChange(Number(event.target.value))}
        step={CS2_STICKER_WEAR_FACTOR}
        type="range"
        value={value}
      />
    </div>
  );
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
  const { app3dViewerKey } = useRules();
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
    stickers: CS2InventoryItem.stickersFromArray([...existing, newSticker])
  }));
  const { api, viewerProps } = useCs2Viewer({
    apiKey: app3dViewerKey || undefined,
    item: initialItem
  });

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

  useEffect(() => {
    if (api === undefined) {
      return;
    }
    const offRateLimited = api.on("rateLimited", ({ retryAfterMs, scope }) => {
      // Per-user limits (scope "ip") are transient and the viewer auto-retries, so
      // let it recover in place. Instance-wide cases (or an unknown scope) persist,
      // so record the backoff — availability flips and the parent swaps to the 2D
      // picker (this overlay unmounts).
      if (scope === "ip") {
        return;
      }
      markCs2ViewerRateLimited(retryAfterMs);
    });
    // Mirror the active sticker's offset/rotation so Apply persists what's shown, and
    // cancel a pending confirmation the moment the user nudges the sticker.
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
    let settled = false;
    let pulse: ReturnType<typeof setInterval> | undefined;
    let unlock: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(() => {
      settled = true;
      markCs2ViewerRateLimited(VIEWER_UNREACHABLE_COOLDOWN_MS);
    }, VIEWER_READY_TIMEOUT_MS);
    void api.whenReady().then(() => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      api.setActiveSticker({ index: newIndex });
      // Pulse a highlight over the sticker through the confirm-delay window so the
      // user notices which one they're placing before Apply unlocks.
      api.highlightSticker({ index: newIndex });
      pulse = setInterval(
        () => api.highlightSticker({ index: newIndex }),
        HIGHLIGHT_PULSE_INTERVAL_MS
      );
      unlock = setTimeout(() => {
        if (pulse !== undefined) {
          clearInterval(pulse);
        }
        setConfirmEnabled(true);
      }, CONFIRM_POSITION_DELAY_MS);
    });
    return () => {
      clearTimeout(timer);
      if (pulse !== undefined) {
        clearInterval(pulse);
      }
      if (unlock !== undefined) {
        clearTimeout(unlock);
      }
      offRateLimited();
      offChange();
    };
  }, [api, newIndex]);

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

  // Portal to document.body so the overlay fills the window. Only ever runs
  // client-side (mounted on user action). The wrappers are pointer-events-none so
  // the space around the header/footer passes through to the iframe, keeping the
  // model orbitable; the buttons opt back in (ModalButton).
  return createPortal(
    <div className="fixed top-0 left-0 z-50 size-full overflow-hidden backdrop-blur-xs select-none">
      <Cs2Viewer
        {...viewerProps}
        className="size-full border-0 bg-transparent"
        // The app forces `color-scheme: dark`; an iframe whose scheme differs from
        // its document gets an opaque backdrop. Reset it so the viewer shows through.
        style={{ colorScheme: "normal" }}
      />
      <div className="pointer-events-none absolute top-0 left-0 w-full pt-8 text-center">
        <UseItemHeader
          actionDesc={translate("ApplyStickerUseOn")}
          actionItem={nameItemString(targetItem)}
          stickerHint
          title={translate("ApplyStickerUse")}
          warning={translate("ApplyStickerWarn")}
        />
      </div>
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
              {translate("ApplyStickerScrapeLevel")}
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
    </div>,
    document.body
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
  const { canUse3d } = useCs2ViewerAvailability();
  return canUse3d ? (
    <ApplyItemSticker3d {...props} />
  ) : (
    <ApplyItemSticker2d {...props} />
  );
}
