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
import { playSound } from "~/utils/sound";
import { useInventory, useTranslate } from "./app-context";
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

const DETACH_CHARM_HOLD_MS = 1500;

interface DetachCharmProps {
  onClose: () => void;
  uid: number;
}

function useDetachCharmAction({ onClose, uid }: DetachCharmProps) {
  const [inventory, setInventory] = useInventory();
  const sync = useSync();
  const item = inventory.get(uid);
  const charges = inventory.getCharmDetachmentCharges();

  function handleDetach() {
    const [slot] = item.someKeychains()[0] ?? [];
    if (slot === undefined) {
      return;
    }
    sync({ type: SyncAction.RemoveItemKeychain, targetUid: uid, slot });
    setInventory(inventory.removeItemKeychain(uid, slot));
    playSound("inventory_item_pickup");
    onClose();
  }

  return { charges, handleDetach, item };
}

function DetachCharmHeader({
  charges,
  item
}: {
  charges: number;
  item: CS2InventoryItem;
}) {
  const translate = useTranslate();
  const nameItemString = useNameItemString();
  return (
    <UseItemHeader
      actionDesc={translate("DetachCharmUseOn")}
      actionItem={nameItemString(item)}
      title={translate("InventoryItemDetachCharm")}
      warning={translate("DetachCharmWarn", String(charges))}
    />
  );
}

function DetachCharmFooter({
  className,
  onClose,
  onDetach
}: {
  className?: string;
  onClose: () => void;
  onDetach: () => void;
}) {
  const translate = useTranslate();
  return (
    <UseItemFooter
      className={className}
      right={
        <>
          <HoldButton
            durationMs={DETACH_CHARM_HOLD_MS}
            onHold={onDetach}
            tooltip={translate("DetachCharmHint")}
          >
            {translate("DetachCharmConfirm")}
          </HoldButton>
          <ModalButton
            children={translate("DetachCharmClose")}
            onClick={onClose}
            variant="secondary"
          />
        </>
      }
    />
  );
}

function DetachCharm3d({ onClose, uid }: DetachCharmProps) {
  const { charges, handleDetach, item } = useDetachCharmAction({
    onClose,
    uid
  });
  const [initialItem] = useState<CS2BaseInventoryItem>(() => ({
    id: item.id,
    seed: item.seed,
    wear: item.wear,
    statTrak: item.statTrak,
    nameTag: item.nameTag,
    stickers: CS2InventoryItem.stickersFromArray(
      CS2InventoryItem.stickersToArray(
        Object.fromEntries(item.someStickers()),
        item.getStickerSchemaCount()
      )
    ),
    keychains: Object.fromEntries(item.someKeychains())
  }));
  const { api, viewerProps } = useViewer({ item: initialItem });

  useViewerStatus(api);

  return (
    <ViewerOverlay
      header={<DetachCharmHeader charges={charges} item={item} />}
      viewerProps={viewerProps}
    >
      <div className="pointer-events-none absolute bottom-8 left-0 w-full">
        <DetachCharmFooter onClose={onClose} onDetach={handleDetach} />
      </div>
    </ViewerOverlay>
  );
}

function DetachCharm2d({ onClose, uid }: DetachCharmProps) {
  const { charges, handleDetach, item } = useDetachCharmAction({
    onClose,
    uid
  });

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <Overlay>
            <DetachCharmHeader charges={charges} item={item} />
            <div className="text-center">
              <div className="relative mx-auto inline-block">
                <ItemImage className="m-auto my-8 max-w-lg" item={item} />
                <div className="absolute bottom-0 left-0 flex items-center justify-center">
                  {item.someKeychains().map(([slot, { id }]) => (
                    <ItemImage
                      key={slot}
                      className="w-32"
                      item={CS2Economy.getById(id)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DetachCharmFooter onClose={onClose} onDetach={handleDetach} />
          </Overlay>,
          document.body
        )
      }
    />
  );
}

export function DetachCharm(props: DetachCharmProps) {
  const item = useInventoryItem(props.uid);
  const { canUse3d } = useViewerAvailability(item);
  return canUse3d ? <DetachCharm3d {...props} /> : <DetachCharm2d {...props} />;
}
