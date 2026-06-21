/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem,
  CS2InventoryItem,
  CS2_MAX_STICKERS
} from "@ianlucas/cs2-lib";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { range } from "~/utils/number";
import { useRules, useTranslate } from "./app-context";
import { Cs2Viewer } from "./cs2-viewer";
import { useCs2Viewer } from "./hooks/use-cs2-viewer";
import { markCs2ViewerRateLimited } from "./hooks/use-cs2-viewer-availability";
import { ItemImage } from "./item-image";

// How long to wait for the viewer's ready handshake before giving up and
// falling back, so a down/blocked viewer doesn't strand the user on a blank
// overlay.
const VIEWER_READY_TIMEOUT_MS = 6000;

// Client-side cooldown applied when the viewer fails to become ready (not a
// rate limit, but the same "fall back to 2D for a bit" behavior).
const VIEWER_UNREACHABLE_COOLDOWN_MS = 30_000;

function Sticker3dViewerOverlay({
  item,
  onClose
}: {
  item: CS2BaseInventoryItem;
  onClose: () => void;
}) {
  const translate = useTranslate();
  const { app3dViewerKey } = useRules();
  const { api, viewerProps } = useCs2Viewer({
    apiKey: app3dViewerKey || undefined,
    item
  });
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (api === undefined) {
      return;
    }
    const offRateLimited = api.on("rateLimited", ({ retryAfterMs, scope }) => {
      // Per-user limits (scope "ip") are transient (~1 min) and the viewer
      // shows its own loading and auto-retries, so let it recover in place.
      // Only the instance-wide cases (origin/partner) — or an unknown scope we
      // can't assume is transient — persist until the window resets, so those
      // record the backoff and close, which flips availability off (until the
      // cooldown elapses) and falls back to the 2D sticker picker.
      if (scope === "ip") {
        return;
      }
      markCs2ViewerRateLimited(retryAfterMs);
      onCloseRef.current();
    });
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
      markCs2ViewerRateLimited(VIEWER_UNREACHABLE_COOLDOWN_MS);
      onCloseRef.current();
    }, VIEWER_READY_TIMEOUT_MS);
    void api.whenReady().then(() => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
      }
    });
    return () => {
      clearTimeout(timer);
      offRateLimited();
    };
  }, [api]);

  // Portal to document.body so the overlay fills the window, escaping the craft
  // modal's containing block (its backdrop-blur/transition would otherwise trap
  // `fixed` positioning). Only ever runs client-side (mounted on click).
  return createPortal(
    <div className="fixed top-0 left-0 z-50 size-full backdrop-blur-xs select-none">
      <Cs2Viewer
        {...viewerProps}
        className="size-full border-0 bg-transparent"
        // The app forces `color-scheme: dark` on :root; an iframe whose scheme
        // differs from its document gets an opaque backdrop (here white). Reset
        // it so the transparent viewer shows through.
        style={{ colorScheme: "normal" }}
      />
      <button
        className="absolute top-4 right-4 flex size-10 cursor-default items-center justify-center rounded-sm bg-black/40 text-white opacity-75 transition hover:opacity-100"
        onClick={() => onCloseRef.current()}
        title={translate("InspectClose")}
      >
        <FontAwesomeIcon icon={faXmark} className="size-5" />
      </button>
    </div>,
    document.body
  );
}

/**
 * 3D counterpart to {@link StickerPicker}: renders the same sticker slot grid,
 * but clicking any slot opens a full-screen 3D viewer of the weapon instead of
 * the 2D editor. For now the overlay only renders (weapon + seed + the stickers
 * applied so far); editing in 3D comes in a later pass.
 */
export function Sticker3dPicker({
  disabled,
  forItem,
  seed,
  value
}: {
  disabled?: boolean;
  forItem: CS2EconomyItem | CS2InventoryItem;
  seed?: number;
  value: NonNullable<CS2BaseInventoryItem["stickers"]>;
}) {
  const translate = useTranslate();
  const [isOpen, setIsOpen] = useState(false);

  // Snapshot the weapon as the viewer reads it: id + seed + the stickers applied
  // so far. Wear is intentionally omitted (the viewer overlays its own default).
  const viewerItem: CS2BaseInventoryItem = {
    id: forItem.id,
    seed,
    stickers: value
  };

  return (
    <>
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${CS2_MAX_STICKERS}, minmax(0, 1fr))`
        }}
      >
        {range(CS2_MAX_STICKERS).map((index) => {
          const sticker = value[index];
          const item =
            sticker !== undefined ? CS2Economy.getById(sticker.id) : undefined;
          return (
            <div className="relative aspect-256/192" key={index}>
              <button
                disabled={disabled}
                className="absolute size-full cursor-default overflow-hidden bg-neutral-950/40"
                onClick={() => setIsOpen(true)}
              >
                {item !== undefined ? (
                  <ItemImage item={item} />
                ) : (
                  <div className="flex items-center justify-center text-neutral-700">
                    {translate("StickerPickerNA")}
                  </div>
                )}
                {!disabled && (
                  <div className="absolute top-0 left-0 size-full border-2 border-transparent hover:border-blue-500/50" />
                )}
              </button>
            </div>
          );
        })}
      </div>
      {isOpen && (
        <Sticker3dViewerOverlay
          item={viewerItem}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
