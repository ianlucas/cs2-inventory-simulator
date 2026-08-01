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

const EXTRACT_STICKER_HOLD_MS = 1500;

interface ExtractItemStickerProps {
  onClose: () => void;
  uid: number;
}

function useExtractSticker({ onClose, uid }: ExtractItemStickerProps) {
  const [inventory, setInventory] = useInventory();
  const sync = useSync();

  function handleExtract() {
    sync({ type: SyncAction.ExtractItemSticker, uid });
    setInventory(inventory.unsealStickerSlab(uid));
    playSound("inventory_new_item_accept");
    onClose();
  }

  return { handleExtract };
}

function ExtractItemStickerHeader() {
  const translate = useTranslate();
  return (
    <UseItemHeader
      title={translate("ExtractStickerTitle")}
      warning={translate("ExtractStickerDesc")}
    />
  );
}

function ExtractItemStickerFooter({
  className,
  onClose,
  onExtract
}: {
  className?: string;
  onClose: () => void;
  onExtract: () => void;
}) {
  const translate = useTranslate();
  return (
    <UseItemFooter
      className={className}
      right={
        <>
          <HoldButton durationMs={EXTRACT_STICKER_HOLD_MS} onHold={onExtract}>
            {translate("InventoryItemExtractSticker")}
          </HoldButton>
          <ModalButton
            children={translate("ExtractStickerClose")}
            onClick={onClose}
            variant="secondary"
          />
        </>
      }
    />
  );
}

function ExtractItemSticker3d(props: ExtractItemStickerProps) {
  const item = useInventoryItem(props.uid);
  const { handleExtract } = useExtractSticker(props);
  const { api, viewerProps } = useViewer({ item });

  useViewerStatus(api);

  return (
    <ViewerOverlay
      header={<ExtractItemStickerHeader />}
      viewerProps={viewerProps}
    >
      <div className="pointer-events-none absolute bottom-8 left-0 w-full">
        <ExtractItemStickerFooter
          onClose={props.onClose}
          onExtract={handleExtract}
        />
      </div>
    </ViewerOverlay>
  );
}

function ExtractItemSticker2d(props: ExtractItemStickerProps) {
  const item = useInventoryItem(props.uid);
  const { handleExtract } = useExtractSticker(props);

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <InGameOverlay header={<ExtractItemStickerHeader />}>
            <div className="flex size-full items-center justify-center">
              <ItemImage className="max-w-lg" item={item} />
            </div>
            <div className="absolute bottom-8 left-0 w-full">
              <ExtractItemStickerFooter
                className="mt-2 max-w-5xl px-8 lg:w-5xl"
                onClose={props.onClose}
                onExtract={handleExtract}
              />
            </div>
          </InGameOverlay>,
          document.body
        )
      }
    />
  );
}

export function ExtractItemSticker(props: ExtractItemStickerProps) {
  const item = useInventoryItem(props.uid);
  const { canUse3d } = useViewerAvailability(item);
  return canUse3d ? (
    <ExtractItemSticker3d {...props} />
  ) : (
    <ExtractItemSticker2d {...props} />
  );
}
