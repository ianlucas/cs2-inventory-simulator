/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faBan, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CS2BaseInventoryItem,
  CS2Economy,
  CS2EconomyItem,
  CS2InventoryItem,
  CS2_MAX_PATCHES
} from "@ianlucas/cs2-lib";
import { useEffect, useRef, useState } from "react";
import { range } from "~/utils/number";
import { useRules, useTranslate } from "./app-context";
import { AttachmentSlotsDrawer, attachmentName } from "./attachment-3d-drawer";
import { ButtonWithTooltip } from "./button-with-tooltip";
import { useNameItemString } from "./hooks/use-name-item";
import { useViewer } from "./hooks/use-viewer";
import { useViewerStatus } from "./hooks/use-viewer-status";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { PatchSlotGrid } from "./patch-slot-grid";
import { Presence } from "./presence";
import { SelectPatchModal } from "./select-patch-modal";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";
import { ViewerOverlay } from "./viewer-overlay";

type Patches = NonNullable<CS2BaseInventoryItem["patches"]>;

function Patch3dEditorOverlay({
  forItem,
  initialSlot,
  onChange,
  onClose,
  patchFilter,
  value
}: {
  forItem: CS2EconomyItem | CS2InventoryItem;
  initialSlot: number;
  onChange: (value: Patches) => void;
  onClose: () => void;
  patchFilter?: (item: CS2EconomyItem) => boolean;
  value: Patches;
}) {
  const translate = useTranslate();
  const nameItemString = useNameItemString();
  const { inventoryItemMaxPatches } = useRules();

  const [patches, setPatches] = useState<Patches>(value);
  const [initialItem] = useState<CS2BaseInventoryItem>(() => ({
    id: forItem.id,
    patches: value
  }));
  const { api, viewerProps } = useViewer({ item: initialItem });
  const [selecting, setSelecting] = useState<number>();

  const patchesRef = useRef(patches);
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
    onChangeRef.current(patchesRef.current);
    onCloseRef.current();
  }, [viewerStatus]);

  useEffect(() => {
    if (api === undefined) {
      return;
    }
    // Focus requests sent before the agent model mounts are dropped.
    return api.once("rendered", () => api.focusPatch({ slot: initialSlot }));
  }, [api, initialSlot]);

  const isCapped = Object.keys(patches).length >= inventoryItemMaxPatches;

  function stagePatches(next: Patches) {
    patchesRef.current = next;
    setPatches(next);
    api?.setItem({ id: forItem.id, patches: next });
  }

  function handleApply() {
    onChangeRef.current(patchesRef.current);
    onCloseRef.current();
  }

  function handleSelect(item: CS2EconomyItem) {
    const slot = selecting;
    setSelecting(undefined);
    if (slot === undefined) {
      return;
    }
    stagePatches({ ...patches, [slot]: item.id });
  }

  function handleRemove(slot: number) {
    const next = { ...patches };
    delete next[slot];
    stagePatches(next);
  }

  return (
    <ViewerOverlay
      header={
        <UseItemHeader
          actionDesc={translate("ApplyPatchUseOn")}
          actionItem={nameItemString(forItem)}
          title={translate("ApplyPatchUse")}
          warning={translate("ApplyPatchWarn")}
        />
      }
      viewerProps={viewerProps}
    >
      <AttachmentSlotsDrawer
        label={translate("EditorPatches")}
        listClassName="overflow-y-auto"
      >
        {range(CS2_MAX_PATCHES).map((slot) => {
          const patchId = patches[slot];
          const item =
            patchId !== undefined ? CS2Economy.getById(patchId) : undefined;
          if (item === undefined) {
            return (
              <button
                key={slot}
                className="group pointer-events-auto flex items-center gap-1 rounded-l p-1 transition hover:bg-neutral-700/80 disabled:cursor-default"
                disabled={isCapped}
                onClick={() => setSelecting(slot)}
                onMouseEnter={() => api?.focusPatch({ slot })}
              >
                <span className="flex aspect-256/192 h-12 shrink-0 items-center justify-center border-2 border-transparent bg-neutral-900 text-xs text-neutral-600 group-enabled:group-hover:border-blue-500/50">
                  {isCapped ? (
                    <FontAwesomeIcon icon={faBan} className="h-3" />
                  ) : (
                    translate("PatchPickerNA")
                  )}
                </span>
              </button>
            );
          }
          return (
            <div
              key={slot}
              className="group pointer-events-auto flex items-center gap-1 rounded-l p-1 pr-2 transition hover:bg-neutral-700/80"
              onMouseEnter={() => api?.focusPatch({ slot })}
            >
              <button
                className="relative aspect-256/192 h-12 shrink-0 overflow-hidden bg-neutral-950/40"
                onClick={() => setSelecting(slot)}
              >
                <ItemImage item={item} />
                <div className="absolute top-0 left-0 size-full border-2 border-transparent group-hover:border-blue-500/50" />
              </button>
              <span className="flex-1 truncate px-1 text-sm text-neutral-200">
                {attachmentName(item.name)}
              </span>
              <ButtonWithTooltip
                className="shrink-0 rounded-sm p-2 text-neutral-300 transition hover:bg-red-500/40"
                onClick={() => handleRemove(slot)}
                tooltip={translate("PatchPickerRemove")}
              >
                <FontAwesomeIcon icon={faTrashCan} className="h-3.5" />
              </ButtonWithTooltip>
            </div>
          );
        })}
      </AttachmentSlotsDrawer>
      <div className="pointer-events-none absolute bottom-8 left-0 w-full">
        <UseItemFooter
          className="w-200"
          right={
            <>
              <ModalButton
                variant="primary"
                onClick={handleApply}
                children={translate("ApplyPatchUse")}
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
      <SelectPatchModal
        hidden={selecting === undefined}
        onClose={() => setSelecting(undefined)}
        onSelect={handleSelect}
        patchFilter={patchFilter}
      />
    </ViewerOverlay>
  );
}

export function Patch3dPicker({
  disabled,
  forItem,
  onChange,
  patchFilter,
  value
}: {
  disabled?: boolean;
  forItem: CS2EconomyItem | CS2InventoryItem;
  onChange: (value: Patches) => void;
  patchFilter?: (item: CS2EconomyItem) => boolean;
  value: Patches;
}) {
  const [openSlot, setOpenSlot] = useState<number>();

  return (
    <>
      <PatchSlotGrid
        disabled={disabled}
        onSlotClick={setOpenSlot}
        value={value}
      />
      <Presence present={openSlot !== undefined}>
        {openSlot !== undefined ? (
          <Patch3dEditorOverlay
            forItem={forItem}
            initialSlot={openSlot}
            onChange={onChange}
            onClose={() => setOpenSlot(undefined)}
            patchFilter={patchFilter}
            value={value}
          />
        ) : null}
      </Presence>
    </>
  );
}
