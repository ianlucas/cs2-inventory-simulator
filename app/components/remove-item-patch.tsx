/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS2BaseInventoryItem,
  CS2Economy,
  CS2InventoryItem
} from "@ianlucas/cs2-lib";
import { useState } from "react";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useInventoryItem } from "~/components/hooks/use-inventory-item";
import { useNameItemString } from "~/components/hooks/use-name-item";
import { useSync } from "~/components/hooks/use-sync";
import { SyncAction } from "~/data/sync";
import { VIEWER_INSPECT_KINDS } from "~/data/viewer";
import { playSound } from "~/utils/sound";
import { useInventory, useTranslate } from "./app-context";
import { AttachmentSelectRow } from "./attachment-select-row";
import { HoldButton } from "./hold-button";
import { useViewer } from "./hooks/use-viewer";
import { useViewerAvailability } from "./hooks/use-viewer-availability";
import { useViewerStatus } from "./hooks/use-viewer-status";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { Overlay } from "./overlay";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";
import { ViewerOverlay } from "./viewer-overlay";

const REMOVE_PATCH_HOLD_MS = 1500;

interface RemoveItemPatchProps {
  onClose: () => void;
  uid: number;
}

function useRemovePatch({
  focus,
  onClose,
  uid
}: {
  focus: (slot: number) => void;
  onClose: () => void;
  uid: number;
}) {
  const [inventory, setInventory] = useInventory();
  const sync = useSync();
  const item = inventory.get(uid);

  const [selectedSlot, setSelectedSlot] = useState<number>();

  function select(slot: number) {
    setSelectedSlot(slot);
    focus(slot);
  }

  function handleLeave() {
    if (selectedSlot !== undefined) {
      focus(selectedSlot);
    }
  }

  function handleRemove() {
    if (selectedSlot === undefined) {
      return;
    }
    sync({
      type: SyncAction.RemoveItemPatch,
      targetUid: uid,
      slot: selectedSlot
    });
    setInventory(inventory.removeItemPatch(uid, selectedSlot));
    playSound("inventory_new_item_accept");
    onClose();
  }

  return { handleLeave, handleRemove, item, select, selectedSlot };
}

function RemovePatchControls({
  footerClassName,
  item,
  onClose,
  onHover,
  onLeave,
  onRemove,
  onSelect,
  selectedSlot
}: {
  footerClassName?: string;
  item: CS2InventoryItem;
  onClose: () => void;
  onHover?: (slot: number) => void;
  onLeave?: () => void;
  onRemove: () => void;
  onSelect: (slot: number) => void;
  selectedSlot: number | undefined;
}) {
  const translate = useTranslate();
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <AttachmentSelectRow
        entries={item.somePatches().map(([slot, id]) => ({
          index: slot,
          item: CS2Economy.getById(id)
        }))}
        onHover={onHover}
        onLeave={onLeave}
        onSelect={onSelect}
        selectedIndex={selectedSlot}
      />
      <UseItemFooter
        className={footerClassName}
        right={
          <>
            <HoldButton
              durationMs={REMOVE_PATCH_HOLD_MS}
              disabled={selectedSlot === undefined}
              onHold={onRemove}
              tooltip={translate("RemovePatchRemoveHint")}
            >
              {translate("RemovePatchRemove")}
            </HoldButton>
            <ModalButton
              children={translate("RemovePatchClose")}
              onClick={onClose}
              variant="secondary"
            />
          </>
        }
      />
    </div>
  );
}

function RemoveItemPatch3d({ onClose, uid }: RemoveItemPatchProps) {
  const translate = useTranslate();
  const nameItemString = useNameItemString();

  const item = useInventoryItem(uid);
  const [initialItem] = useState<CS2BaseInventoryItem>(() => ({
    id: item.id,
    patches: Object.fromEntries(item.somePatches())
  }));
  const { api, viewerProps } = useViewer({ item: initialItem });

  const remove = useRemovePatch({
    focus: (slot) => api?.focusPatch({ slot }),
    onClose,
    uid
  });

  // Bare call: flips availability so the parent swaps to 2D when the viewer
  // is rate-limited or never becomes ready.
  useViewerStatus(api);

  return (
    <ViewerOverlay
      header={
        <UseItemHeader
          actionDesc={translate("RemovePatchUseOn")}
          actionItem={nameItemString(item)}
          title={translate("RemovePatchUse")}
        />
      }
      viewerProps={viewerProps}
    >
      <div className="pointer-events-none absolute bottom-8 left-0 w-full">
        <RemovePatchControls
          footerClassName="w-200"
          item={remove.item}
          onClose={onClose}
          onHover={(slot) => api?.focusPatch({ slot })}
          onLeave={remove.handleLeave}
          onRemove={remove.handleRemove}
          onSelect={remove.select}
          selectedSlot={remove.selectedSlot}
        />
      </div>
    </ViewerOverlay>
  );
}

function RemoveItemPatch2d({ onClose, uid }: RemoveItemPatchProps) {
  const translate = useTranslate();
  const nameItemString = useNameItemString();

  const remove = useRemovePatch({ focus: () => {}, onClose, uid });

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <Overlay>
            <UseItemHeader
              actionDesc={translate("RemovePatchUseOn")}
              actionItem={nameItemString(remove.item)}
              title={translate("RemovePatchUse")}
            />
            <ItemImage className="m-auto max-w-lg" item={remove.item} />
            <RemovePatchControls
              item={remove.item}
              onClose={onClose}
              onRemove={remove.handleRemove}
              onSelect={remove.select}
              selectedSlot={remove.selectedSlot}
            />
          </Overlay>,
          document.body
        )
      }
    />
  );
}

export function RemoveItemPatch(props: RemoveItemPatchProps) {
  const item = useInventoryItem(props.uid);
  const { canUse3d, isIdSupported } = useViewerAvailability(item, {
    attachment: true,
    kinds: VIEWER_INSPECT_KINDS
  });
  return canUse3d && item.somePatches().every(([, id]) => isIdSupported(id)) ? (
    <RemoveItemPatch3d {...props} />
  ) : (
    <RemoveItemPatch2d {...props} />
  );
}
