/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faGripVertical, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem,
  CS2InventoryItem,
  CS2_MAX_STICKERS,
  getNextStickerSchema
} from "@ianlucas/cs2-lib";
import clsx from "clsx";
import {
  type PointerEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import { range } from "~/utils/number";
import { useRules, useTranslate } from "./app-context";
import { AppliedStickerEditor } from "./applied-sticker-editor";
import { ButtonWithTooltip } from "./button-with-tooltip";
import { Cs2ViewerOverlay } from "./cs2-viewer-overlay";
import { useCs2Viewer } from "./hooks/use-cs2-viewer";
import { useCs2ViewerFallback } from "./hooks/use-cs2-viewer-fallback";
import { useNameItemString } from "./hooks/use-name-item";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { SelectStickerModal } from "./select-sticker-modal";
import { StickerSlotGrid } from "./sticker-slot-grid";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";

// After a form edit, ignore the viewer's `change` echoes for this long so the
// panel isn't remounted from under an active slider (which made dragging stick).
const FORM_ECHO_WINDOW_MS = 400;

type Stickers = NonNullable<CS2BaseInventoryItem["stickers"]>;
type Sticker = Stickers[string];

// Sticker names are "<localized category> | <name>"; the rail shows just the part
// after the first "|" (locale-safe — only the separator is constant).
function stickerName(name: string): string {
  const separator = name.indexOf("|");
  return separator === -1 ? name : name.slice(separator + 1).trim();
}

// Seed the editor's working array from stored data. cs2-lib sorts by key, caps at
// CS2_MAX_STICKERS, materializes each `schema` from its key when absent, and heals
// any anchor outside [0, maxSchema) onto a free one — the same normalization the
// viewer and the server validator run, so our stack index lines up 1:1 with the
// viewer's sticker index. The stack index (draw order) and the `schema` (markup
// anchor) are separate axes; they diverge on reduced-anchor models like the AK-47 HD.
function toArray(stickers: Stickers, maxSchema: number): Sticker[] {
  return CS2InventoryItem.stickersToArray(stickers, maxSchema);
}

// Serialize the working array back into the stored record (contiguous 0-based keys,
// `schema` always set, default wear/offsets dropped) for `onChange` and the viewer.
function toRecord(stickers: Sticker[]): Stickers {
  return CS2InventoryItem.stickersFromArray(stickers) ?? {};
}

// Value-equality on the stack array; used to ignore the viewer's echo of our own
// edits (so only genuine in-viewer edits re-seed the form).
function stickersEqual(a: Sticker[], b: Sticker[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((left, index) => {
    const right = b[index];
    return (
      right !== undefined &&
      left.id === right.id &&
      (left.rotation ?? 0) === (right.rotation ?? 0) &&
      (left.wear ?? 0) === (right.wear ?? 0) &&
      (left.x ?? 0) === (right.x ?? 0) &&
      (left.y ?? 0) === (right.y ?? 0) &&
      (left.schema ?? index) === (right.schema ?? index)
    );
  });
}

// Vertical drawer handle shared by both panels: a compact bookmark tab on the
// panel's inner edge that doubles as the collapse/expand toggle. `edge` is the
// screen side the panel lives on; the corners facing away from the body (toward
// the viewer) get rounded so it reads as a tab in both open and collapsed states.
function DrawerTab({
  className,
  edge,
  label,
  onClick
}: {
  className?: string;
  edge: "left" | "right";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={clsx(
        // self-stretch so the tab spans the panel's content height; bg/shadow come
        // from the caller so each tab can match its panel (rows vs. solid editor).
        "font-display pointer-events-auto flex shrink-0 items-center justify-center self-stretch px-1.5 py-3 text-sm font-bold text-neutral-200 transition",
        edge === "left" ? "rounded-r" : "rounded-l",
        className
      )}
      onClick={onClick}
      title={label}
    >
      <span className="max-h-full truncate [writing-mode:vertical-rl]">
        {label}
      </span>
    </button>
  );
}

/**
 * Full-screen 3D editor: the weapon in the viewer iframe, a left rail of sticker
 * slots, and a right attributes panel for the selected slot. Slots can be added,
 * removed, reordered (drag = draw order) and edited; edits push to the live viewer
 * but only stage locally — they persist up through `onChange` when the user clicks
 * Apply (close/cancel discards them). In-viewer offset/rotation edits flow back into
 * the panel. The rail/panel are the only pointer targets — the space around
 * them passes through to the iframe so the model stays orbitable.
 */
function Sticker3dEditorOverlay({
  forItem,
  nameTag,
  onChange,
  onClose,
  seed,
  statTrak,
  stickerFilter,
  value,
  wear
}: {
  forItem: CS2EconomyItem | CS2InventoryItem;
  nameTag?: string;
  onChange: (value: Stickers) => void;
  onClose: () => void;
  seed?: number;
  statTrak?: number;
  stickerFilter?: (item: CS2EconomyItem) => boolean;
  value: Stickers;
  wear?: number;
}) {
  const translate = useTranslate();
  const nameItemString = useNameItemString();
  const { app3dViewerKey } = useRules();

  // The weapon's markup-anchor count (e.g. 4 for the AK-47 HD body). A sticker's
  // `schema` must stay in [0, maxSchema); the stack index / draw order is a separate
  // axis capped at CS2_MAX_STICKERS, so the two diverge on reduced-anchor models —
  // conflating them is what put an invalid schema (4) on the AK-47 HD's 5th slot.
  const maxSchema = forItem.getStickerSchemaCount();

  // Working copy for this editing session, held as the stack array cs2-lib stores:
  // the array index is draw order and == the viewer's sticker index, so index-based
  // api calls line up. Seeded from `value` once; the parent is updated through
  // `onChange` only on Apply (not vice versa), so edits never flow back mid-session.
  const [stickers, setStickers] = useState<Sticker[]>(() =>
    toArray(value, maxSchema)
  );
  // The viewer reads its initial stickers from the iframe `src` (captured once), so
  // hand it the same normalized snapshot; later changes go through the api.
  const [initialItem] = useState<CS2BaseInventoryItem>(() => ({
    id: forItem.id,
    seed,
    wear,
    statTrak,
    nameTag,
    stickers: toRecord(toArray(value, maxSchema))
  }));
  const { api, viewerProps } = useCs2Viewer({
    apiKey: app3dViewerKey || undefined,
    item: initialItem
  });

  const [selected, setSelected] = useState<number>();
  // Both panels are collapsible drawers. The left ("Stickers") is a plain toggle,
  // open by default. The right (attributes) opens itself for the selected sticker,
  // but once the user collapses it the choice sticks — selecting other stickers
  // won't re-open it; only the tab does (`userCollapsedRight`). `rightEntered`
  // drives the slide+fade the first time the panel appears for a selection.
  const [leftOpen, setLeftOpen] = useState(true);
  const [userCollapsedRight, setUserCollapsedRight] = useState(false);
  const [rightEntered, setRightEntered] = useState(false);
  const [selecting, setSelecting] = useState<
    { mode: "add" } | { mode: "replace"; index: number }
  >();
  // Bumped when an in-viewer edit changes our data, to remount the attributes form
  // so its sliders re-seed to the new values.
  const [formVersion, setFormVersion] = useState(0);
  // Drag-to-reorder. `dragIndex` is the row being dragged; `dragDelta` translates it
  // to follow the cursor (the "ghost"); `dragTarget` is the display position it will
  // drop into (other rows slide to open that gap). Geometry is captured once at drag
  // start (refs) so hit-testing never re-measures mid-drag.
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragDelta, setDragDelta] = useState(0);
  const [dragTarget, setDragTarget] = useState(0);
  // Suppresses row transitions for the single frame after a drop, so the transform
  // reset snaps instead of replaying the slide animation.
  const [noTransition, setNoTransition] = useState(false);
  const isDragging = dragIndex !== null;

  const stickersRef = useRef(stickers);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragIndexRef = useRef<number | null>(null);
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

  const viewerStatus = useCs2ViewerFallback(api);

  // The viewer became unavailable (never ready, or an instance-wide rate limit):
  // preserve in-progress edits into the 2D fallback, then close so the parent swaps.
  useEffect(() => {
    if (viewerStatus !== "unavailable") {
      return;
    }
    onChangeRef.current(toRecord(stickersRef.current));
    onCloseRef.current();
  }, [viewerStatus]);

  // Mirror edits made inside the viewer (e.g. dragging a sticker's offset) back into
  // our local working copy + the form (not the parent — that waits for Apply). We ignore
  // echoes of our own edits via value-equality so the form isn't remounted from under an
  // active slider.
  useEffect(() => {
    if (api === undefined) {
      return;
    }
    const offChange = api.on("change", ({ item }) => {
      // Our own form edits round-trip back as `change`; ignore them briefly so the
      // panel isn't remounted under an active slider. Genuine in-viewer edits (no
      // recent form edit) fall through and re-seed the form.
      if (Date.now() - lastEditAtRef.current < FORM_ECHO_WINDOW_MS) {
        return;
      }
      const incoming = toArray(item.stickers ?? {}, maxSchema);
      if (stickersEqual(stickersRef.current, incoming)) {
        return;
      }
      stickersRef.current = incoming;
      setStickers(incoming);
      setFormVersion((version) => version + 1);
    });
    return () => offChange();
  }, [api, maxSchema]);

  const count = stickers.length;
  const dragFrom = dragIndex ?? -1;
  const selectedSticker =
    selected !== undefined ? stickers[selected] : undefined;

  // Capture the row pitch once the drag begins (rows are uniform, no transforms
  // applied yet), so move math is a stable delta -> slot conversion.
  useLayoutEffect(() => {
    if (dragIndex === null) {
      return;
    }
    const first = rowRefs.current[0]?.getBoundingClientRect().top;
    const second = rowRefs.current[1]?.getBoundingClientRect().top;
    if (first !== undefined && second !== undefined) {
      rowStepRef.current = second - first;
    }
  }, [dragIndex]);

  // Re-enable row transitions the frame after a drop, once the snapped layout has
  // painted (so future reorders animate again without re-animating this drop).
  useEffect(() => {
    if (!noTransition) {
      return;
    }
    const raf = requestAnimationFrame(() => setNoTransition(false));
    return () => cancelAnimationFrame(raf);
  }, [noTransition]);

  // Play the right panel's slide+fade-in the first time it mounts for a selection;
  // reset once nothing is selected so it re-plays on the next one. Keyed on the
  // has/has-not boundary so switching between selected stickers doesn't re-animate.
  const hasSelectedSticker = selectedSticker !== undefined;
  useEffect(() => {
    if (!hasSelectedSticker) {
      setRightEntered(false);
      return;
    }
    const raf = requestAnimationFrame(() => setRightEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [hasSelectedSticker]);

  // Stage edits into the local working copy (+ ref) only. The parent is committed
  // through `onChange` on Apply (handleApply), not here; the viewer is updated
  // separately by callers.
  function stageStickers(next: Sticker[]) {
    stickersRef.current = next;
    setStickers(next);
  }

  // Commit the staged working copy up to the parent, then close. Wired to the
  // primary "Apply" button (and the involuntary-close paths) so edits only persist
  // on an explicit apply — closing/cancelling discards them.
  function handleApply() {
    onChangeRef.current(toRecord(stickersRef.current));
    onCloseRef.current();
  }

  function buildItem(next: Sticker[]): CS2BaseInventoryItem {
    return {
      id: forItem.id,
      seed,
      wear,
      statTrak,
      nameTag,
      stickers: toRecord(next)
    };
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
      // Draw-order index is `index`; the markup anchor is the first free schema (which
      // may overlap an existing one once the body's anchors run out), never the stack
      // index — that would overflow on reduced-anchor models like the AK-47 HD.
      const schema = getNextStickerSchema(stickers, maxSchema);
      const next = [...stickers, { id: item.id, schema }];
      api?.addSticker({ id: item.id, schema });
      stageStickers(next);
      setSelected(index);
      api?.setActiveSticker({ index });
    } else {
      const { index } = target;
      const next = stickers.map((sticker, i) =>
        i === index ? { ...sticker, id: item.id } : sticker
      );
      stageStickers(next);
      // No setStickerId in the embed api: rebuild so the viewer picks up the swap.
      api?.setItem(buildItem(next));
    }
  }

  function handleRemove(index: number) {
    const next = stickers.filter((_, i) => i !== index);
    api?.removeSticker({ index });
    stageStickers(next);
    // Removing compacts the stack: anything below `index` shifts up one, so keep the
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
      // -1 is the form's "auto": resolve to the first anchor not used by the other
      // stickers (bounded by the body's anchor count), never the stack index.
      const schema =
        data.schema === -1
          ? getNextStickerSchema(
              stickers.filter((_, i) => i !== index),
              maxSchema
            )
          : data.schema;
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
      const updated: Sticker = {
        id: current.id,
        rotation: data.rotation || undefined,
        schema,
        wear: data.wear || undefined,
        x: data.x || undefined,
        y: data.y || undefined
      };
      stageStickers(
        stickers.map((sticker, i) => (i === index ? updated : sticker))
      );
    };
  }

  function handleDragStart(index: number) {
    return function handleDragStart(event: PointerEvent<HTMLButtonElement>) {
      if (count < 2) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      setSelected(undefined);
      api?.setActiveSticker({ index: null });
      dragIndexRef.current = index;
      dragStartYRef.current = event.clientY;
      dragStartPosRef.current = index;
      dragTargetRef.current = index;
      setDragIndex(index);
      setDragDelta(0);
      setDragTarget(index);
    };
  }

  function handleDragMove(event: PointerEvent<HTMLButtonElement>) {
    if (dragIndexRef.current === null) {
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
    if (dragIndexRef.current === null) {
      return;
    }
    const from = dragStartPosRef.current;
    const to = dragTargetRef.current;
    dragIndexRef.current = null;
    // Snap the dropped row + slid rows to their final layout without animating the
    // transform reset (otherwise the slide replays instead of the ghost settling).
    setNoTransition(true);
    setDragIndex(null);
    setDragDelta(0);
    // Commit before releasing capture so a release hiccup can't drop the reorder.
    if (to !== from) {
      const next = stickers.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      stageStickers(next);
      api?.setItem(buildItem(next));
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function rowTransform(position: number): string {
    if (dragIndex === null) {
      return "none";
    }
    if (position === dragIndex) {
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

  return (
    <Cs2ViewerOverlay
      header={
        <UseItemHeader
          actionDesc={translate("ApplyStickerUseOn")}
          actionItem={nameItemString(forItem)}
          title={translate("ApplyStickerUse")}
          stickerHint
        />
      }
      viewerClassName={
        // While dragging, let pointer events skip the iframe so it can't swallow the
        // move/up that the rail's pointer capture needs.
        isDragging ? "pointer-events-none" : undefined
      }
      viewerProps={viewerProps}
    >
      {/* Wrappers are pointer-events-none so the space around the tiles passes
          through to the iframe; only the tiles/controls opt back in. The drawer
          row slides out behind its tab on collapse; the overlay's overflow-hidden
          clips the off-screen body so it can't extend the page. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex h-full items-center p-4">
        <div
          className={clsx(
            "flex max-h-full items-center transition-transform duration-150 ease-out",
            // Collapsed: shift left by the body width (w-80) + wrapper padding (p-4
            // = 1rem), i.e. 21rem, so only the tab stays on screen.
            !leftOpen && "-translate-x-84"
          )}
        >
          <div
            className={clsx(
              "pointer-events-none flex max-h-full w-80 flex-col gap-1",
              // Drop the scroll clip while dragging so the cursor-following ghost
              // isn't cut off; the list is short enough to fit.
              isDragging ? "overflow-visible" : "overflow-y-auto"
            )}
          >
            {stickers.map((sticker, position) => {
              const item = CS2Economy.getById(sticker.id);
              const isDragged = dragIndex === position;
              const isSelected = selected === position;
              return (
                <div
                  key={position}
                  ref={(element) => {
                    rowRefs.current[position] = element;
                  }}
                  className={clsx(
                    // rounded-l only: the square right edge butts flush into the
                    // full-height "Stickers" tab so the row merges into it. `group`
                    // so the thumbnail's blue outline lights on hover of the whole
                    // row, not just the small thumbnail (matches the empty slots).
                    "group pointer-events-auto overflow-hidden rounded-l",
                    isDragged
                      ? "z-10 bg-neutral-800 shadow-lg"
                      : clsx(
                          !noTransition && "transition duration-150",
                          isSelected
                            ? "bg-blue-600/40"
                            : "bg-neutral-900/80 hover:bg-neutral-800/70"
                        )
                  )}
                  style={{ transform: rowTransform(position) }}
                  onMouseEnter={() => {
                    if (!isDragging) {
                      api?.highlightSticker({ index: position });
                    }
                  }}
                >
                  <div
                    className="flex items-center gap-1 p-1 pr-2"
                    onClick={() => handleToggleSelect(position)}
                  >
                    <button
                      className="flex h-12 w-5 shrink-0 cursor-grab touch-none items-center justify-center text-neutral-400 transition hover:text-neutral-200 active:cursor-grabbing"
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={handleDragStart(position)}
                      onPointerMove={handleDragMove}
                      onPointerUp={handleDragEnd}
                      title={translate("StickerPickerReorder")}
                    >
                      <FontAwesomeIcon icon={faGripVertical} className="h-4" />
                    </button>
                    <button
                      className="relative aspect-256/192 h-12 shrink-0 overflow-hidden bg-neutral-950/40"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelecting({ mode: "replace", index: position });
                      }}
                      title={translate("EditorStickerEdit")}
                    >
                      <ItemImage item={item} />
                      {/* Blue hover outline matching the inline grid tiles that open
                          this overlay; an overlay so the image stays full-bleed.
                          group-hover keys it to the row so it shows like the empty
                          slots do. */}
                      <div className="absolute top-0 left-0 size-full border-2 border-transparent group-hover:border-blue-500/50" />
                    </button>
                    <span className="flex-1 truncate px-1 text-sm text-neutral-200">
                      {stickerName(item.name)}
                    </span>
                    <ButtonWithTooltip
                      className="shrink-0 rounded-sm p-2 text-neutral-300 transition hover:bg-red-500/40"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleRemove(position);
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
                className="group pointer-events-auto flex items-center gap-1 rounded-l bg-neutral-950/40 p-1 transition hover:bg-neutral-900/60"
                onClick={() => setSelecting({ mode: "add" })}
              >
                <span className="w-5 shrink-0" />
                <span className="flex aspect-256/192 h-12 shrink-0 items-center justify-center border-2 border-transparent bg-neutral-900 text-xs text-neutral-600 group-hover:border-blue-500/50">
                  {translate("StickerPickerNA")}
                </span>
              </button>
            ))}
          </div>
          <DrawerTab
            className="bg-neutral-900/80 hover:bg-neutral-800/70"
            edge="left"
            label={translate("EditorStickers")}
            onClick={() => setLeftOpen((value) => !value)}
          />
        </div>
      </div>
      {/* Right attributes drawer — mounts while a slot is selected and slides +
          fades in; its tab collapses it back behind the right edge. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex h-full items-center p-4">
        {selected !== undefined && selectedSticker !== undefined && (
          <div
            className={clsx(
              // Bare `transition` (not the arbitrary transform,opacity list, which
              // didn't generate) so both the slide and the fade animate.
              "flex max-h-full items-center transition duration-150 ease-out",
              rightEntered ? "opacity-100" : "opacity-0",
              // Collapsed (and the pre-enter start state) sits one body width (w-90)
              // + wrapper padding (p-4 = 1rem), i.e. 23.5rem, off the right edge so
              // only the tab shows.
              userCollapsedRight || !rightEntered
                ? "translate-x-94"
                : "translate-x-0"
            )}
          >
            <DrawerTab
              className="bg-neutral-900/90 shadow-lg hover:bg-neutral-800/90"
              edge="right"
              label={stickerName(CS2Economy.getById(selectedSticker.id).name)}
              onClick={() => setUserCollapsedRight((value) => !value)}
            />
            <div className="pointer-events-auto flex max-h-full w-90 flex-col overflow-hidden rounded-r bg-neutral-900/90 shadow-lg">
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
                  stickers={toRecord(stickers)}
                  value={{
                    rotation: selectedSticker.rotation ?? 0,
                    schema: selectedSticker.schema ?? -1,
                    wear: selectedSticker.wear ?? 0,
                    x: selectedSticker.x ?? 0,
                    y: selectedSticker.y ?? 0
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute bottom-8 left-0 w-full">
        <UseItemFooter
          className="w-200"
          right={
            <>
              <ModalButton
                variant="primary"
                onClick={handleApply}
                children={translate("ApplyStickerUse")}
              />
              <ModalButton
                variant="secondary"
                onClick={() => onCloseRef.current()}
                children={translate("InspectClose")}
              />
            </>
          }
        />
      </div>
      <SelectStickerModal
        fixed
        hidden={selecting === undefined}
        onClose={() => setSelecting(undefined)}
        onSelect={handleSelect}
        stickerFilter={stickerFilter}
      />
    </Cs2ViewerOverlay>
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
  nameTag,
  onChange,
  seed,
  statTrak,
  stickerFilter,
  value,
  wear
}: {
  disabled?: boolean;
  forItem: CS2EconomyItem | CS2InventoryItem;
  nameTag?: string;
  onChange: (value: Stickers) => void;
  seed?: number;
  statTrak?: number;
  stickerFilter?: (item: CS2EconomyItem) => boolean;
  value: Stickers;
  wear?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <StickerSlotGrid
        disabled={disabled}
        onSlotClick={() => setIsOpen(true)}
        value={value}
      />
      {isOpen && (
        <Sticker3dEditorOverlay
          forItem={forItem}
          nameTag={nameTag}
          onChange={onChange}
          onClose={() => setIsOpen(false)}
          seed={seed}
          statTrak={statTrak}
          stickerFilter={stickerFilter}
          value={value}
          wear={wear}
        />
      )}
    </>
  );
}
