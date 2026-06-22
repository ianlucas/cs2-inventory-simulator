/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  faChevronDown,
  faChevronUp,
  faGripVertical,
  faTrashCan,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem,
  CS2InventoryItem,
  CS2_MAX_STICKERS
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import {
  type PointerEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";
import { range } from "~/utils/number";
import { useRules, useTranslate } from "./app-context";
import { AppliedStickerEditor } from "./applied-sticker-editor";
import { ButtonWithTooltip } from "./button-with-tooltip";
import { Cs2Viewer } from "./cs2-viewer";
import { useCs2Viewer } from "./hooks/use-cs2-viewer";
import { markCs2ViewerRateLimited } from "./hooks/use-cs2-viewer-availability";
import { ItemImage } from "./item-image";
import { SelectStickerModal } from "./select-sticker-modal";

// How long to wait for the viewer's ready handshake before giving up and
// falling back, so a down/blocked viewer doesn't strand the user on a blank
// overlay.
const VIEWER_READY_TIMEOUT_MS = 6000;

// Client-side cooldown applied when the viewer fails to become ready (not a
// rate limit, but the same "fall back to 2D for a bit" behavior).
const VIEWER_UNREACHABLE_COOLDOWN_MS = 30_000;

// After a form edit, ignore the viewer's `change` echoes for this long so the
// panel isn't remounted from under an active slider (which made dragging stick).
const FORM_ECHO_WINDOW_MS = 400;

type Stickers = NonNullable<CS2BaseInventoryItem["stickers"]>;
type Sticker = Stickers[string];

function sortedKeys(stickers: Stickers): number[] {
  return Object.keys(stickers)
    .map((key) => Number(key))
    .sort((a, b) => a - b);
}

// Sticker names are "<localized category> | <name>"; the rail shows just the part
// after the first "|" (locale-safe — only the separator is constant).
function stickerName(name: string): string {
  const separator = name.indexOf("|");
  return separator === -1 ? name : name.slice(separator + 1).trim();
}

// Rebuild into contiguous keys (0..n-1) following `orderedKeys` (source keys in
// their new top->bottom order), freezing each sticker's effective `schema` to its
// current on-gun anchor. Re-keying therefore only changes draw order (z), never a
// sticker's position — which is exactly what reordering should do.
function reindex(orderedKeys: number[], stickers: Stickers): Stickers {
  const next: Stickers = {};
  orderedKeys.forEach((sourceKey, index) => {
    const sticker = stickers[sourceKey];
    next[index] = { ...sticker, schema: sticker.schema ?? sourceKey };
  });
  return next;
}

// Normalize whatever was stored (possibly sparse, e.g. {0, 3}) into the contiguous
// shape the editor and the viewer agree on: keys 0..n-1 in slot order. Keeps our
// keys == the viewer's sticker indices so index-based api calls line up.
function normalizeStickers(stickers: Stickers, max: number): Stickers {
  return reindex(sortedKeys(stickers).slice(0, max), stickers);
}

// Value-equality on the normalized shape; used to ignore the viewer's echo of our
// own edits (so only genuine in-viewer edits re-seed the form).
function stickersEqual(a: Stickers, b: Stickers): boolean {
  const keys = sortedKeys(a);
  if (keys.length !== sortedKeys(b).length) {
    return false;
  }
  return keys.every((key) => {
    const left = a[key];
    const right = b[key];
    return (
      right !== undefined &&
      left.id === right.id &&
      (left.rotation ?? 0) === (right.rotation ?? 0) &&
      (left.wear ?? 0) === (right.wear ?? 0) &&
      (left.x ?? 0) === (right.x ?? 0) &&
      (left.y ?? 0) === (right.y ?? 0) &&
      (left.schema ?? key) === (right.schema ?? key)
    );
  });
}

/**
 * Full-screen 3D editor: the weapon in the viewer iframe, a left rail of sticker
 * slots, and a right attributes panel for the selected slot. Slots can be added,
 * removed, reordered (drag = draw order) and edited; edits push to the live viewer
 * and persist up through `onChange`, and in-viewer offset/rotation edits flow back
 * into the panel. The rail/panel are the only pointer targets — the space around
 * them passes through to the iframe so the model stays orbitable.
 */
function Sticker3dEditorOverlay({
  forItem,
  onChange,
  onClose,
  seed,
  stickerFilter,
  value
}: {
  forItem: CS2EconomyItem | CS2InventoryItem;
  onChange: (value: Stickers) => void;
  onClose: () => void;
  seed?: number;
  stickerFilter?: (item: CS2EconomyItem) => boolean;
  value: Stickers;
}) {
  const translate = useTranslate();
  const { app3dViewerKey } = useRules();

  // Working copy for this editing session, normalized on open so our keys line up
  // 1:1 with the viewer's sticker indices; every op keeps it contiguous. Seeded
  // from `value` once — the parent is updated through `onChange`, not vice versa.
  const [stickers, setStickers] = useState<Stickers>(() =>
    normalizeStickers(value, CS2_MAX_STICKERS)
  );
  // The viewer reads its initial stickers from the iframe `src` (captured once), so
  // hand it the same normalized snapshot; later changes go through the api.
  const [initialItem] = useState<CS2BaseInventoryItem>(() => ({
    id: forItem.id,
    seed,
    stickers: normalizeStickers(value, CS2_MAX_STICKERS)
  }));
  const { api, viewerProps } = useCs2Viewer({
    apiKey: app3dViewerKey || undefined,
    item: initialItem
  });

  const [selected, setSelected] = useState<number>();
  const [collapsed, setCollapsed] = useState(false);
  const [selecting, setSelecting] = useState<
    { mode: "add" } | { mode: "replace"; index: number }
  >();
  // Bumped when an in-viewer edit changes our data, to remount the attributes form
  // so its sliders re-seed to the new values.
  const [formVersion, setFormVersion] = useState(0);
  // Drag-to-reorder. `dragKey` is the slot being dragged; `dragDelta` translates it
  // to follow the cursor (the "ghost"); `dragTarget` is the display position it will
  // drop into (other rows slide to open that gap). Geometry is captured once at drag
  // start (refs) so hit-testing never re-measures mid-drag.
  const [dragKey, setDragKey] = useState<number | null>(null);
  const [dragDelta, setDragDelta] = useState(0);
  const [dragTarget, setDragTarget] = useState(0);
  // Suppresses row transitions for the single frame after a drop, so the transform
  // reset snaps instead of replaying the slide animation.
  const [noTransition, setNoTransition] = useState(false);
  const isDragging = dragKey !== null;

  const stickersRef = useRef(stickers);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragKeyRef = useRef<number | null>(null);
  const dragStartYRef = useRef(0);
  const dragStartPosRef = useRef(0);
  const dragTargetRef = useRef(0);
  const rowStepRef = useRef(0);
  const lastEditAtRef = useRef(0);
  const onCloseRef = useRef(onClose);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onCloseRef.current = onClose;
    onChangeRef.current = onChange;
  }, [onChange, onClose]);

  useEffect(() => {
    if (api === undefined) {
      return;
    }
    const offRateLimited = api.on("rateLimited", ({ retryAfterMs, scope }) => {
      // Per-user limits (scope "ip") are transient and the viewer auto-retries, so
      // let it recover in place. Instance-wide cases (or an unknown scope) persist,
      // so record the backoff and close — flipping availability off and falling
      // back to the 2D picker.
      if (scope === "ip") {
        return;
      }
      markCs2ViewerRateLimited(retryAfterMs);
      onCloseRef.current();
    });
    // Mirror edits made inside the viewer (e.g. dragging a sticker's offset) back
    // into our state + the form. We ignore echoes of our own edits via value-equality
    // so the form isn't remounted from under an active slider.
    const offChange = api.on("change", ({ item }) => {
      // Our own form edits round-trip back as `change`; ignore them briefly so the
      // panel isn't remounted under an active slider. Genuine in-viewer edits (no
      // recent form edit) fall through and re-seed the form.
      if (Date.now() - lastEditAtRef.current < FORM_ECHO_WINDOW_MS) {
        return;
      }
      const incoming = normalizeStickers(item.stickers ?? {}, CS2_MAX_STICKERS);
      if (stickersEqual(stickersRef.current, incoming)) {
        return;
      }
      stickersRef.current = incoming;
      setStickers(incoming);
      onChangeRef.current(incoming);
      setFormVersion((version) => version + 1);
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
      offChange();
    };
  }, [api]);

  const filledKeys = sortedKeys(stickers);
  const count = filledKeys.length;
  const dragFrom = dragKey === null ? -1 : filledKeys.indexOf(dragKey);
  const selectedSticker =
    selected !== undefined ? stickers[selected] : undefined;

  // Capture the row pitch once the drag begins (rows are uniform, no transforms
  // applied yet), so move math is a stable delta -> slot conversion.
  useLayoutEffect(() => {
    if (dragKey === null) {
      return;
    }
    const first = rowRefs.current[0]?.getBoundingClientRect().top;
    const second = rowRefs.current[1]?.getBoundingClientRect().top;
    if (first !== undefined && second !== undefined) {
      rowStepRef.current = second - first;
    }
  }, [dragKey]);

  // Re-enable row transitions the frame after a drop, once the snapped layout has
  // painted (so future reorders animate again without re-animating this drop).
  useEffect(() => {
    if (!noTransition) {
      return;
    }
    const raf = requestAnimationFrame(() => setNoTransition(false));
    return () => cancelAnimationFrame(raf);
  }, [noTransition]);

  function applyStickers(next: Stickers) {
    stickersRef.current = next;
    setStickers(next);
    onChangeRef.current(next);
  }

  function buildItem(next: Stickers): CS2BaseInventoryItem {
    return { id: forItem.id, seed, stickers: next };
  }

  function handleSelect(item: CS2EconomyItem) {
    const target = selecting;
    setSelecting(undefined);
    if (target === undefined) {
      return;
    }
    if (target.mode === "add") {
      if (count >= CS2_MAX_STICKERS) {
        return;
      }
      const index = count;
      const next = { ...stickers, [index]: { id: item.id, schema: index } };
      api?.addSticker({ id: item.id, schema: index });
      applyStickers(next);
      setSelected(index);
      api?.setActiveSticker({ index });
    } else {
      const { index } = target;
      const next = {
        ...stickers,
        [index]: { ...stickers[index], id: item.id }
      };
      applyStickers(next);
      // No setStickerId in the embed api: rebuild so the viewer picks up the swap.
      api?.setItem(buildItem(next));
    }
  }

  function handleRemove(index: number) {
    const next = reindex(
      filledKeys.filter((key) => key !== index),
      stickers
    );
    api?.removeSticker({ index });
    applyStickers(next);
    // Removing compacts keys: anything below `index` shifts up one, so keep the
    // current selection pointing at the same sticker (or drop it if it was removed).
    if (selected === index) {
      setSelected(undefined);
      api?.setActiveSticker({ index: null });
    } else if (selected !== undefined && selected > index) {
      setSelected(selected - 1);
      api?.setActiveSticker({ index: selected - 1 });
    }
  }

  function handleToggleSelect(index: number) {
    if (selected === index) {
      setSelected(undefined);
      api?.setActiveSticker({ index: null });
    } else {
      setSelected(index);
      api?.setActiveSticker({ index });
    }
  }

  function handleEdit(index: number) {
    return function handleEdit(data: {
      rotation: number;
      schema: number;
      wear: number;
      x: number;
      y: number;
    }) {
      const current = stickers[index];
      if (current === undefined) {
        return;
      }
      const schema = data.schema === -1 ? index : data.schema;
      // AppliedStickerEditor fires once on mount with the seeded values; skip
      // no-ops so we neither spam the viewer nor churn parent state.
      if (
        (current.rotation ?? 0) === (data.rotation || 0) &&
        (current.wear ?? 0) === (data.wear || 0) &&
        (current.x ?? 0) === (data.x || 0) &&
        (current.y ?? 0) === (data.y || 0) &&
        (current.schema ?? index) === schema
      ) {
        return;
      }
      // Mark this as a local edit so the resulting `change` echo is ignored.
      lastEditAtRef.current = Date.now();
      if ((current.wear ?? 0) !== (data.wear || 0)) {
        api?.setStickerWear({ index, wear: data.wear });
      }
      if (
        (current.x ?? 0) !== (data.x || 0) ||
        (current.y ?? 0) !== (data.y || 0)
      ) {
        api?.setStickerOffset({ index, x: data.x, y: data.y });
      }
      if ((current.rotation ?? 0) !== (data.rotation || 0)) {
        api?.setStickerRotation({ index, rotation: data.rotation });
      }
      // The viewer resets offset+rotation when the anchor changes, and our form
      // mirrors that (isResetPlacementOnSchema), so a plain setStickerSchema keeps
      // both sides in sync.
      if ((current.schema ?? index) !== schema) {
        api?.setStickerSchema({ index, schema });
      }
      const next: Sticker = {
        id: current.id,
        rotation: data.rotation || undefined,
        schema,
        wear: data.wear || undefined,
        x: data.x || undefined,
        y: data.y || undefined
      };
      applyStickers({ ...stickers, [index]: next });
    };
  }

  function handleDragStart(key: number) {
    return function handleDragStart(event: PointerEvent<HTMLButtonElement>) {
      if (count < 2) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      setSelected(undefined);
      api?.setActiveSticker({ index: null });
      const from = filledKeys.indexOf(key);
      dragKeyRef.current = key;
      dragStartYRef.current = event.clientY;
      dragStartPosRef.current = from;
      dragTargetRef.current = from;
      setDragKey(key);
      setDragDelta(0);
      setDragTarget(from);
    };
  }

  function handleDragMove(event: PointerEvent<HTMLButtonElement>) {
    if (dragKeyRef.current === null) {
      return;
    }
    const delta = event.clientY - dragStartYRef.current;
    setDragDelta(delta);
    const step = rowStepRef.current;
    if (step > 0) {
      const position = Math.max(
        0,
        Math.min(count - 1, dragStartPosRef.current + Math.round(delta / step))
      );
      dragTargetRef.current = position;
      setDragTarget(position);
    }
  }

  function handleDragEnd(event: PointerEvent<HTMLButtonElement>) {
    if (dragKeyRef.current === null) {
      return;
    }
    const key = dragKeyRef.current;
    const from = dragStartPosRef.current;
    const to = dragTargetRef.current;
    dragKeyRef.current = null;
    // Snap the dropped row + slid rows to their final layout without animating the
    // transform reset (otherwise the slide replays instead of the ghost settling).
    setNoTransition(true);
    setDragKey(null);
    setDragDelta(0);
    // Commit before releasing capture so a release hiccup can't drop the reorder.
    if (to !== from) {
      const order = filledKeys.slice();
      order.splice(from, 1);
      order.splice(to, 0, key);
      const next = reindex(order, stickers);
      applyStickers(next);
      api?.setItem(buildItem(next));
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function rowTransform(position: number, key: number): string {
    if (dragKey === null) {
      return "none";
    }
    if (key === dragKey) {
      return `translateY(${dragDelta}px)`;
    }
    const step = rowStepRef.current;
    if (
      dragFrom < dragTarget &&
      position > dragFrom &&
      position <= dragTarget
    ) {
      return `translateY(${-step}px)`;
    }
    if (
      dragFrom > dragTarget &&
      position >= dragTarget &&
      position < dragFrom
    ) {
      return `translateY(${step}px)`;
    }
    return "none";
  }

  // Portal to document.body so the overlay fills the window, escaping the craft
  // modal's containing block. Only ever runs client-side (mounted on click).
  return createPortal(
    <div className="fixed top-0 left-0 z-50 size-full backdrop-blur-xs select-none">
      <Cs2Viewer
        {...viewerProps}
        className={clsx(
          "size-full border-0 bg-transparent",
          // While dragging, let pointer events skip the iframe so it can't swallow
          // the move/up that the rail's pointer capture needs.
          isDragging && "pointer-events-none"
        )}
        // The app forces `color-scheme: dark`; an iframe whose scheme differs from
        // its document gets an opaque backdrop. Reset it so the viewer shows through.
        style={{ colorScheme: "normal" }}
      />
      {/* Wrappers are pointer-events-none so the space around the tiles passes
          through to the iframe; only the tiles/controls opt back in. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex h-full items-center p-4">
        <div
          className={clsx(
            "pointer-events-none flex max-h-full w-80 flex-col gap-1",
            // Drop the scroll clip while dragging so the cursor-following ghost
            // isn't cut off; the list is short enough to fit.
            isDragging ? "overflow-visible" : "overflow-y-auto"
          )}
        >
          {filledKeys.map((key, position) => {
            const sticker = stickers[key];
            const item = CS2Economy.getById(sticker.id);
            const isDragged = dragKey === key;
            const isSelected = selected === key;
            return (
              <div
                key={key}
                ref={(element) => {
                  rowRefs.current[position] = element;
                }}
                className={clsx(
                  "pointer-events-auto overflow-hidden rounded",
                  isDragged
                    ? "z-10 bg-neutral-800 shadow-lg"
                    : clsx(
                        !noTransition && "transition duration-150",
                        isSelected
                          ? "bg-blue-600/40"
                          : "bg-neutral-900/80 hover:bg-neutral-800/70"
                      )
                )}
                style={{ transform: rowTransform(position, key) }}
                onMouseEnter={() => {
                  if (!isDragging) {
                    api?.highlightSticker({ index: key });
                  }
                }}
              >
                <div
                  className="flex cursor-pointer items-center gap-1 p-1"
                  onClick={() => handleToggleSelect(key)}
                >
                  <button
                    className="flex h-12 w-5 shrink-0 cursor-grab touch-none items-center justify-center text-neutral-400 transition hover:text-neutral-200 active:cursor-grabbing"
                    onClick={(event) => event.stopPropagation()}
                    onPointerDown={handleDragStart(key)}
                    onPointerMove={handleDragMove}
                    onPointerUp={handleDragEnd}
                    title={translate("StickerPickerReorder")}
                  >
                    <FontAwesomeIcon icon={faGripVertical} className="h-4" />
                  </button>
                  <button
                    className="aspect-256/192 h-12 shrink-0 overflow-hidden rounded-sm bg-neutral-950/40"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelecting({ mode: "replace", index: key });
                    }}
                    title={translate("EditorStickerEdit")}
                  >
                    <ItemImage item={item} />
                  </button>
                  <span className="flex-1 truncate px-1 text-sm text-neutral-200">
                    {stickerName(item.name)}
                  </span>
                  <ButtonWithTooltip
                    className="shrink-0 rounded-sm p-2 text-neutral-300 transition hover:bg-red-500/40"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRemove(key);
                    }}
                    tooltip={translate("StickerPickerRemove")}
                  >
                    <FontAwesomeIcon icon={faTrashCan} className="h-3.5" />
                  </ButtonWithTooltip>
                </div>
              </div>
            );
          })}
          {range(CS2_MAX_STICKERS - count).map((index) => (
            <button
              key={`empty-${index}`}
              className="pointer-events-auto flex items-center gap-1 rounded bg-neutral-950/40 p-1 transition hover:bg-neutral-900/60"
              onClick={() => setSelecting({ mode: "add" })}
            >
              <span className="w-5 shrink-0" />
              <span className="flex aspect-256/192 h-12 shrink-0 items-center justify-center rounded-sm bg-neutral-900 text-xs text-neutral-600">
                {translate("StickerPickerNA")}
              </span>
            </button>
          ))}
        </div>
      </div>
      {/* Right attributes panel — shown while a slot is selected; the title bar
          collapses it. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex h-full items-center p-4">
        {selected !== undefined && selectedSticker !== undefined && (
          <div className="pointer-events-auto flex max-h-full w-90 flex-col overflow-hidden rounded bg-neutral-900/90 shadow-lg">
            <button
              className="flex shrink-0 items-center justify-between gap-2 bg-black/30 px-3 py-2 text-left transition hover:bg-black/40"
              onClick={() => setCollapsed((value) => !value)}
            >
              <span className="font-display truncate text-sm font-bold text-neutral-200">
                {stickerName(CS2Economy.getById(selectedSticker.id).name)}
              </span>
              <FontAwesomeIcon
                icon={collapsed ? faChevronDown : faChevronUp}
                className="h-3 shrink-0 text-neutral-400"
              />
            </button>
            {!collapsed && (
              <div className="overflow-y-auto p-2">
                <AppliedStickerEditor
                  forItem={forItem}
                  isHideItemDisplay
                  isHidePreview
                  isResetPlacementOnSchema
                  item={CS2Economy.getById(selectedSticker.id)}
                  key={`${selected}-${formVersion}`}
                  onChange={handleEdit(selected)}
                  slot={selected}
                  stickers={stickers}
                  value={{
                    rotation: selectedSticker.rotation ?? 0,
                    schema: selectedSticker.schema ?? -1,
                    wear: selectedSticker.wear ?? 0,
                    x: selectedSticker.x ?? 0,
                    y: selectedSticker.y ?? 0
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
      <button
        className="absolute top-4 right-4 flex size-10 cursor-default items-center justify-center rounded-sm bg-black/40 text-white opacity-75 transition hover:opacity-100"
        onClick={() => onCloseRef.current()}
        title={translate("InspectClose")}
      >
        <FontAwesomeIcon icon={faXmark} className="size-5" />
      </button>
      <SelectStickerModal
        fixed
        hidden={selecting === undefined}
        onClose={() => setSelecting(undefined)}
        onSelect={handleSelect}
        stickerFilter={stickerFilter}
      />
    </div>,
    document.body
  );
}

/**
 * 3D counterpart to {@link StickerPicker}: an inline grid that launches the
 * full-screen {@link Sticker3dEditorOverlay}, where stickers are added, removed,
 * reordered, and edited against a live 3D preview of the weapon.
 */
export function Sticker3dPicker({
  disabled,
  forItem,
  onChange,
  seed,
  stickerFilter,
  value
}: {
  disabled?: boolean;
  forItem: CS2EconomyItem | CS2InventoryItem;
  onChange: (value: Stickers) => void;
  seed?: number;
  stickerFilter?: (item: CS2EconomyItem) => boolean;
  value: Stickers;
}) {
  const translate = useTranslate();
  const [isOpen, setIsOpen] = useState(false);

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
        <Sticker3dEditorOverlay
          forItem={forItem}
          onChange={onChange}
          onClose={() => setIsOpen(false)}
          seed={seed}
          stickerFilter={stickerFilter}
          value={value}
        />
      )}
    </>
  );
}
