/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CS2BaseInventoryItem, CS2Economy } from "@ianlucas/cs2-lib";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useInventoryItem } from "~/components/hooks/use-inventory-item";
import { useNameItemString } from "~/components/hooks/use-name-item";
import { useSync } from "~/components/hooks/use-sync";
import { SyncAction } from "~/data/sync";
import { VIEWER_INSPECT_KINDS } from "~/data/viewer";
import { playSound } from "~/utils/sound";
import { useInventory, useTranslate } from "./app-context";
import { useViewer } from "./hooks/use-viewer";
import { useViewerAvailability } from "./hooks/use-viewer-availability";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { Overlay } from "./overlay";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";
import { ViewerOverlay } from "./viewer-overlay";

interface ApplyItemPatchProps {
  onClose: () => void;
  targetUid: number;
  patchUid: number;
}

function useApplyPatch(
  targetUid: number,
  patchUid: number,
  onClose: () => void
) {
  const [inventory, setInventory] = useInventory();
  const sync = useSync();
  return function applyPatch(slot: number) {
    sync({
      type: SyncAction.ApplyItemPatch,
      patchUid,
      slot,
      targetUid
    });
    setInventory(inventory.applyItemPatch(targetUid, patchUid, slot));
    playSound("inventory_new_item_accept");
    onClose();
  };
}

function ApplyItemPatch3d({
  onClose,
  targetUid,
  patchUid
}: ApplyItemPatchProps) {
  const translate = useTranslate();
  const nameItemString = useNameItemString();
  const applyPatch = useApplyPatch(targetUid, patchUid, onClose);

  const targetItem = useInventoryItem(targetUid);
  const patchItem = useInventoryItem(patchUid);

  const [existing] = useState(() =>
    Object.fromEntries(targetItem.somePatches())
  );
  const [emptySlots] = useState(() =>
    targetItem
      .allPatches()
      .filter(([, patchId]) => patchId === undefined)
      .map(([slot]) => slot)
  );
  const [slot, setSlot] = useState(emptySlots[0]);
  const [initialItem] = useState<CS2BaseInventoryItem>(() => ({
    id: targetItem.id,
    patches: { ...existing, [slot]: patchItem.id }
  }));
  const { api, viewerProps } = useViewer({ item: initialItem });
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (api === undefined) {
      return;
    }
    // Focus requests sent before the agent model mounts are dropped.
    return api.once("rendered", () => api.focusPatch({ slot: emptySlots[0] }));
  }, [api, emptySlots]);

  function handleNextPreset() {
    const nextSlot =
      emptySlots[(emptySlots.indexOf(slot) + 1) % emptySlots.length];
    setSlot(nextSlot);
    api?.setItem({
      id: targetItem.id,
      patches: { ...existing, [nextSlot]: patchItem.id }
    });
    api?.focusPatch({ slot: nextSlot });
  }

  return (
    <ViewerOverlay
      header={
        <UseItemHeader
          actionDesc={translate("ApplyPatchUseOn")}
          actionItem={nameItemString(targetItem)}
          title={translate("ApplyPatchUse")}
          warning={translate("ApplyPatchWarn")}
        />
      }
      viewerProps={viewerProps}
    >
      <div className="pointer-events-none absolute bottom-8 left-0 flex w-full flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-2 text-white/95 drop-shadow-sm">
          <ItemImage className="h-25" item={patchItem} />
          <div className="flex items-center gap-2">
            <ModalButton
              uppercaseless
              children={translate("ApplyStickerConfirmPosition")}
              disabled={confirmed}
              onClick={() => setConfirmed(true)}
              variant="primary"
            />
            {confirmed ? (
              <ModalButton
                uppercaseless
                className="gap-2"
                onClick={() => setConfirmed(false)}
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
              emptySlots.length > 1 && (
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
                children={translate("ApplyPatchUse")}
                disabled={!confirmed}
                onClick={() => applyPatch(slot)}
                variant="primary"
              />
              <ModalButton
                children={translate("ApplyPatchCancel")}
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

function ApplyItemPatch2d({
  onClose,
  targetUid,
  patchUid
}: ApplyItemPatchProps) {
  const translate = useTranslate();
  const nameItemString = useNameItemString();
  const applyPatch = useApplyPatch(targetUid, patchUid, onClose);

  const [slot, setSlot] = useState<number>();
  const stickerItem = useInventoryItem(patchUid);
  const targetItem = useInventoryItem(targetUid);

  function handleApplyPatch() {
    if (slot !== undefined) {
      applyPatch(slot);
    }
  }

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <Overlay>
            <UseItemHeader
              actionDesc={translate("ApplyPatchUseOn")}
              actionItem={nameItemString(targetItem)}
              title={translate("ApplyPatchUse")}
              warning={translate("ApplyPatchWarn")}
            />
            <ItemImage className="m-auto max-w-lg" item={targetItem} />
            <div className="flex items-center justify-center">
              {targetItem.allPatches().map(([xslot, patchId]) =>
                patchId !== undefined || xslot === slot ? (
                  <ItemImage
                    key={xslot}
                    className="w-42"
                    item={
                      patchId !== undefined
                        ? CS2Economy.getById(patchId)
                        : stickerItem
                    }
                  />
                ) : (
                  <button
                    key={xslot}
                    className="group flex h-31.5 w-42 items-center justify-center"
                    onClick={() => {
                      setSlot(xslot);
                      playSound("buttonclick");
                    }}
                  >
                    <div className="rounded-md border-2 border-white/20 p-4 px-6 transition group-hover:border-white/80">
                      <FontAwesomeIcon className="h-4" icon={faPlus} />
                    </div>
                  </button>
                )
              )}
            </div>
            <UseItemFooter
              right={
                <>
                  <ModalButton
                    children={translate("ApplyPatchUse")}
                    disabled={slot === undefined}
                    onClick={handleApplyPatch}
                    variant="primary"
                  />
                  <ModalButton
                    children={translate("ApplyPatchCancel")}
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

export function ApplyItemPatch(props: ApplyItemPatchProps) {
  const targetItem = useInventoryItem(props.targetUid);
  const patchItem = useInventoryItem(props.patchUid);
  const { canUse3d, isIdSupported } = useViewerAvailability(targetItem, {
    attachment: true,
    kinds: VIEWER_INSPECT_KINDS
  });
  return canUse3d && isIdSupported(patchItem.id) ? (
    <ApplyItemPatch3d {...props} />
  ) : (
    <ApplyItemPatch2d {...props} />
  );
}
