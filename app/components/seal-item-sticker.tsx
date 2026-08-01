/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useInventoryItem } from "~/components/hooks/use-inventory-item";
import { useSync } from "~/components/hooks/use-sync";
import { SyncAction } from "~/data/sync";
import { playSound } from "~/utils/sound";
import { getStickerSlabKeychain, sealItemSticker } from "~/utils/sticker-slab";
import { useInventory, useTranslate } from "./app-context";
import { HoldButton } from "./hold-button";
import { useViewer } from "./hooks/use-viewer";
import { useViewerAvailability } from "./hooks/use-viewer-availability";
import { useViewerStatus } from "./hooks/use-viewer-status";
import { InGameOverlay } from "./in-game-overlay";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";
import { ViewerOverlay } from "./viewer-overlay";

const SEAL_STICKER_HOLD_MS = 1500;

interface SealItemStickerProps {
  onClose: () => void;
  toolUid: number;
  stickerUid: number;
}

function useSealSticker({
  onClose,
  toolUid,
  stickerUid
}: SealItemStickerProps) {
  const [inventory, setInventory] = useInventory();

  const sync = useSync();

  function handleSeal() {
    sync({ type: SyncAction.SealItemSticker, toolUid, stickerUid });
    setInventory(sealItemSticker(inventory, toolUid, stickerUid));
    playSound("inventory_new_item_accept");
    onClose();
  }

  return { handleSeal };
}

function SealItemStickerHeader() {
  const translate = useTranslate();
  return (
    <UseItemHeader
      title={translate("SealStickerTitle")}
      warning={translate("SealStickerDesc")}
    />
  );
}

function SealItemStickerFooter({
  className,
  onClose,
  onSeal
}: {
  className?: string;
  onClose: () => void;
  onSeal: () => void;
}) {
  const translate = useTranslate();
  return (
    <UseItemFooter
      className={className}
      right={
        <>
          <HoldButton
            durationMs={SEAL_STICKER_HOLD_MS}
            onHold={onSeal}
            tooltip={translate("SealStickerHint")}
            variant="primary"
          >
            {translate("SealStickerConfirm")}
          </HoldButton>
          <ModalButton
            children={translate("SealStickerClose")}
            onClick={onClose}
            variant="secondary"
          />
        </>
      }
    />
  );
}

function SealItemSticker3d(props: SealItemStickerProps) {
  const stickerItem = useInventoryItem(props.stickerUid);
  const { handleSeal } = useSealSticker(props);
  const { api, viewerProps } = useViewer({
    item: { id: getStickerSlabKeychain(stickerItem.id).id }
  });

  useViewerStatus(api);

  return (
    <ViewerOverlay header={<SealItemStickerHeader />} viewerProps={viewerProps}>
      <div className="pointer-events-none absolute bottom-8 left-0 w-full">
        <SealItemStickerFooter onClose={props.onClose} onSeal={handleSeal} />
      </div>
    </ViewerOverlay>
  );
}

function SealItemSticker2d(props: SealItemStickerProps) {
  const stickerItem = useInventoryItem(props.stickerUid);
  const { handleSeal } = useSealSticker(props);
  const slabKeychain = getStickerSlabKeychain(stickerItem.id);

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <InGameOverlay header={<SealItemStickerHeader />}>
            <div className="flex size-full items-center justify-center">
              <ItemImage className="max-w-lg" item={slabKeychain} />
            </div>
            <div className="absolute bottom-8 left-0 w-full">
              <SealItemStickerFooter
                className="mt-2 max-w-5xl px-8 lg:w-5xl"
                onClose={props.onClose}
                onSeal={handleSeal}
              />
            </div>
          </InGameOverlay>,
          document.body
        )
      }
    />
  );
}

export function SealItemSticker(props: SealItemStickerProps) {
  const stickerItem = useInventoryItem(props.stickerUid);
  const { canUse3d } = useViewerAvailability(
    getStickerSlabKeychain(stickerItem.id)
  );
  return canUse3d ? (
    <SealItemSticker3d {...props} />
  ) : (
    <SealItemSticker2d {...props} />
  );
}
