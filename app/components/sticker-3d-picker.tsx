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
import {
  AttachmentEditorDrawer,
  AttachmentSlotsDrawer,
  FORM_ECHO_WINDOW_MS,
  attachmentName
} from "./attachment-3d-drawer";
import { ButtonWithTooltip } from "./button-with-tooltip";
import { useNameItemString } from "./hooks/use-name-item";
import { useViewer } from "./hooks/use-viewer";
import { useViewerStatus } from "./hooks/use-viewer-status";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { Presence } from "./presence";
import { SelectStickerModal } from "./select-sticker-modal";
import { StickerSlotGrid } from "./sticker-slot-grid";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";
import { ViewerOverlay } from "./viewer-overlay";

type Stickers = NonNullable<CS2BaseInventoryItem["stickers"]>;
type Sticker = Stickers[string];

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

function Sticker3dEditorOverlay({
  forItem,
  keychains,
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
  keychains?: CS2BaseInventoryItem["keychains"];
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
  const { inventoryItemMaxStickers } = useRules();

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
    stickers: toRecord(toArray(value, maxSchema)),
    keychains
  }));
  const { api, viewerProps } = useViewer({ item: initialItem });

  const [selected, setSelected] = useState<number>();
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
      stickers: toRecord(next),
      keychains
    };
  }

  function handleSelect(item: CS2EconomyItem) {
    const target = selecting;
    setSelecting(undefined);
    if (target === undefined) {
      return;
    }
    if (target.mode === "add") {
      if (count >= inventoryItemMaxStickers) {
        return;
      }
      const index = count;
      const schema = getNextStickerSchema(stickers, maxSchema);
      const next = [...stickers, { id: item.id, schema }];
      stageStickers(next);
      setSelected(index);
      api?.setItem(buildItem(next));
      api?.setActiveSticker({ index });
    } else {
      const { index } = target;
      const next = stickers.map((sticker, i) =>
        i === index ? { ...sticker, id: item.id } : sticker
      );
      stageStickers(next);
      api?.setItem(buildItem(next));
    }
  }

  function handleRemove(index: number) {
    const next = stickers.filter((_, i) => i !== index);
    stageStickers(next);
    api?.setItem(buildItem(next));
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
      const updated: Sticker = {
        id: current.id,
        rotation: data.rotation || undefined,
        schema,
        wear: data.wear || undefined,
        x: data.x || undefined,
        y: data.y || undefined
      };
      const next = stickers.map((sticker, i) =>
        i === index ? updated : sticker
      );
      stageStickers(next);
      api?.setItem(buildItem(next));
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
          warning={translate("ApplyStickerWarn")}
          stickerHint
        />
      }
      viewerClassName={isDragging ? "pointer-events-none" : undefined}
      viewerProps={viewerProps}
    >
      <AttachmentSlotsDrawer
        label={translate("EditorStickers")}
        listClassName={isDragging ? "overflow-visible" : "overflow-y-auto"}
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
                      isSelected ? "bg-blue-600/40" : "hover:bg-neutral-700/80"
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
                  {attachmentName(item.name)}
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
        {range(inventoryItemMaxStickers - count).map((index) => (
          <button
            key={`empty-${index}`}
            className="group pointer-events-auto flex items-center gap-1 rounded-l p-1 transition hover:bg-neutral-700/80"
            onClick={() => setSelecting({ mode: "add" })}
          >
            <span className="w-5 shrink-0" />
            <span className="flex aspect-256/192 h-12 shrink-0 items-center justify-center border-2 border-transparent bg-neutral-900 text-xs text-neutral-600 group-hover:border-blue-500/50">
              {translate("StickerPickerNA")}
            </span>
          </button>
        ))}
      </AttachmentSlotsDrawer>
      {selected !== undefined && selectedSticker !== undefined && (
        <AttachmentEditorDrawer
          label={attachmentName(CS2Economy.getById(selectedSticker.id).name)}
        >
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
        </AttachmentEditorDrawer>
      )}
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
  keychains,
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
  keychains?: CS2BaseInventoryItem["keychains"];
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
            keychains={keychains}
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
