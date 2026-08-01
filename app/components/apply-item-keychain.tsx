/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2BaseInventoryItem, CS2InventoryItem } from "@ianlucas/cs2-lib";
import { useEffect, useRef, useState } from "react";
import { useInventoryItem } from "~/components/hooks/use-inventory-item";
import { useNameItemString } from "~/components/hooks/use-name-item";
import { useSync } from "~/components/hooks/use-sync";
import { SyncAction } from "~/data/sync";
import { playSound } from "~/utils/sound";
import { useInventory, useTranslate } from "./app-context";
import { useViewer } from "./hooks/use-viewer";
import { useViewerStatus } from "./hooks/use-viewer-status";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";
import { ViewerOverlay } from "./viewer-overlay";

const CONFIRM_POSITION_DELAY_MS = 1500;

interface ApplyItemKeychainProps {
  onClose: () => void;
  targetUid: number;
  keychainUid: number;
}

interface KeychainPlacement {
  x?: number;
  y?: number;
  z?: number;
}

function useApplyKeychain(
  targetUid: number,
  keychainUid: number,
  onClose: () => void
) {
  const [inventory, setInventory] = useInventory();
  const sync = useSync();
  const targetItem = useInventoryItem(targetUid);
  return function applyKeychain({ x, y, z }: KeychainPlacement) {
    if (targetUid >= 0) {
      sync({
        type: SyncAction.ApplyItemKeychain,
        targetUid,
        keychainUid,
        x,
        y,
        z
      });
      setInventory(
        inventory.applyItemKeychain(targetUid, keychainUid, { x, y, z })
      );
    } else {
      sync({
        type: SyncAction.AddWithKeychain,
        keychainUid,
        itemId: targetItem.id,
        x,
        y,
        z
      });
      setInventory(
        inventory.addWithKeychain(keychainUid, targetItem.id, { x, y, z })
      );
    }
    playSound("sticker_apply_confirm");
    onClose();
  };
}

export function ApplyItemKeychain({
  onClose,
  targetUid,
  keychainUid
}: ApplyItemKeychainProps) {
  const translate = useTranslate();
  const nameItemString = useNameItemString();
  const applyKeychain = useApplyKeychain(targetUid, keychainUid, onClose);

  const targetItem = useInventoryItem(targetUid);
  const keychainItem = useInventoryItem(keychainUid);

  const [initialItem] = useState<CS2BaseInventoryItem>(() => ({
    id: targetItem.id,
    seed: targetItem.seed,
    wear: targetItem.wear,
    statTrak: targetItem.statTrak,
    nameTag: targetItem.nameTag,
    stickers: CS2InventoryItem.stickersFromArray(
      CS2InventoryItem.stickersToArray(
        Object.fromEntries(targetItem.someStickers()),
        targetItem.getStickerSchemaCount()
      )
    ),
    keychains: { 0: { id: keychainItem.id, seed: keychainItem.seed } }
  }));
  const { api, viewerProps } = useViewer({ item: initialItem });

  const placementRef = useRef<KeychainPlacement>({});

  const [confirmEnabled, setConfirmEnabled] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const confirmedRef = useRef(false);
  const confirmSnapshotRef = useRef<KeychainPlacement>({});

  const viewerStatus = useViewerStatus(api);

  useEffect(() => {
    if (api === undefined) {
      return;
    }
    const offChange = api.on("change", ({ item }) => {
      const keychain = item.keychains?.[0];
      if (keychain === undefined) {
        return;
      }
      placementRef.current = {
        x: keychain.x,
        y: keychain.y,
        z: keychain.z
      };
      if (confirmedRef.current) {
        const snapshot = confirmSnapshotRef.current;
        if (
          keychain.x !== snapshot.x ||
          keychain.y !== snapshot.y ||
          keychain.z !== snapshot.z
        ) {
          confirmedRef.current = false;
          setConfirmed(false);
        }
      }
    });
    return () => offChange();
  }, [api]);

  useEffect(() => {
    if (api === undefined || viewerStatus !== "ready") {
      return;
    }
    api.setSelection({ selection: { kind: "keychain", index: 0 } });
    const unlock = setTimeout(
      () => setConfirmEnabled(true),
      CONFIRM_POSITION_DELAY_MS
    );
    return () => clearTimeout(unlock);
  }, [api, viewerStatus]);

  function handleNextPreset() {
    api?.rerollKeychainPosition({ index: 0 });
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
          keychainHint
          title={translate("ApplyKeychainUse")}
          warning={translate("ApplyKeychainWarn")}
        />
      }
      viewerProps={viewerProps}
    >
      <div className="pointer-events-none absolute bottom-8 left-0 flex w-full flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-2 text-white/95 drop-shadow-sm">
          <ItemImage className="h-25" item={keychainItem} />
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
            )}
          </div>
        </div>
        <UseItemFooter
          className="w-200"
          right={
            <>
              <ModalButton
                children={translate("ApplyKeychainUse")}
                disabled={!confirmed}
                onClick={() =>
                  applyKeychain({
                    x: placementRef.current.x,
                    y: placementRef.current.y,
                    z: placementRef.current.z
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
