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
import { useTranslate } from "./app-context";
import { AppliedStickerEditor } from "./applied-sticker-editor";
import { ButtonWithTooltip } from "./button-with-tooltip";
import { ViewerOverlay } from "./viewer-overlay";
import { useViewer } from "./hooks/use-viewer";
import { useViewerStatus } from "./hooks/use-viewer-status";
import { useNameItemString } from "./hooks/use-name-item";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { Presence } from "./presence";
import { SelectStickerModal } from "./select-sticker-modal";
import { StickerSlotGrid } from "./sticker-slot-grid";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";

// Window to ignore the viewer's `change` echo of our own form edits, so the
// panel isn't remounted under an active slider.
const FORM_ECHO_WINDOW_MS = 400;

type Stickers = NonNullable<CS2BaseInventoryItem["stickers"]>;
type Sticker = Stickers[string];

function stickerName(name: string): string {
  const separator = name.indexOf("|");
  return separator === -1 ? name : name.slice(separator + 1).trim();
}

function toArray(stickers: Stickers, maxSchema: number): Sticker[] {
  return CS2InventoryItem.stickersToArray(stickers, maxSchema);
}

function toRecord(stickers: Sticker[]): Stickers {
  return CS2InventoryItem.stickersFromArray(stickers) ?? {};
}

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

  const maxSchema = forItem.getStickerSchemaCount();

  const [stickers, setStickers] = useState<Sticker[]>(() =>
    toArray(value, maxSchema)
  );
  const [initialItem] = useState<CS2BaseInventoryItem>(() => ({
    id: forItem.id,
    seed,
    wear,
    statTrak,
    nameTag,
    stickers: toRecord(toArray(value, maxSchema))
  }));
  const { api, viewerProps } = useViewer({ item: initialItem });

  const [selected, setSelected] = useState<number>();
  const [leftOpen, setLeftOpen] = useState(true);
  const [userCollapsedRight, setUserCollapsedRight] = useState(false);
  const [rightEntered, setRightEntered] = useState(false);
  const [selecting, setSelecting] = useState<
    { mode: "add" } | { mode: "replace"; index: number }
  >();
  const [formVersion, setFormVersion] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragDelta, setDragDelta] = useState(0);
  const [dragTarget, setDragTarget] = useState(0);
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

  const viewerStatus = useViewerStatus(api);

  useEffect(() => {
    if (viewerStatus !== "unavailable") {
      return;
    }
    onChangeRef.current(toRecord(stickersRef.current));
    onCloseRef.current();
  }, [viewerStatus]);

  useEffect(() => {
    if (api === undefined) {
      return;
    }
    const offChange = api.on("change", ({ item }) => {
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

  useEffect(() => {
    if (!noTransition) {
      return;
    }
    const raf = requestAnimationFrame(() => setNoTransition(false));
    return () => cancelAnimationFrame(raf);
  }, [noTransition]);

  const hasSelectedSticker = selectedSticker !== undefined;
  useEffect(() => {
    if (!hasSelectedSticker) {
      setRightEntered(false);
      return;
    }
    const raf = requestAnimationFrame(() => setRightEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [hasSelectedSticker]);

  function stageStickers(next: Sticker[]) {
    stickersRef.current = next;
    setStickers(next);
  }

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
      // Anchor on the first free schema, never the stack index (overflows on
      // reduced-anchor models like the AK-47 HD).
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
      // -1 is the form's "auto": the first anchor not used by the other stickers.
      const schema =
        data.schema === -1
          ? getNextStickerSchema(
              stickers.filter((_, i) => i !== index),
              maxSchema
            )
          : data.schema;
      if (
        (current.rotation ?? 0) === (data.rotation || 0) &&
        (current.wear ?? 0) === (data.wear || 0) &&
        (current.x ?? 0) === (data.x || 0) &&
        (current.y ?? 0) === (data.y || 0) &&
        (current.schema ?? index) === schema
      ) {
        return;
      }
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
    setNoTransition(true);
    setDragIndex(null);
    setDragDelta(0);
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
    <ViewerOverlay
      header={
        <UseItemHeader
          actionDesc={translate("ApplyStickerUseOn")}
          actionItem={nameItemString(forItem)}
          title={translate("ApplyStickerUse")}
          stickerHint
        />
      }
      viewerClassName={isDragging ? "pointer-events-none" : undefined}
      viewerProps={viewerProps}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 flex h-full items-center p-4">
        <div
          className={clsx(
            "flex max-h-full items-center transition-transform duration-150 ease-out",
            !leftOpen && "-translate-x-84"
          )}
        >
          <div
            className={clsx(
              "pointer-events-none flex max-h-full w-80 flex-col gap-1",
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
      <div className="pointer-events-none absolute inset-y-0 right-0 flex h-full items-center p-4">
        {selected !== undefined && selectedSticker !== undefined && (
          <div
            className={clsx(
              "flex max-h-full items-center transition duration-150 ease-out",
              rightEntered ? "opacity-100" : "opacity-0",
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
    </ViewerOverlay>
  );
}

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
      <Presence present={isOpen}>
        {isOpen ? (
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
        ) : null}
      </Presence>
    </>
  );
}
