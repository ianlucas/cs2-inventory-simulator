/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { assert, CS2EconomyItem, ensure } from "@ianlucas/cs2-lib";
import { useToggle } from "@uidotdev/usehooks";
import { useState } from "react";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useInventoryItem } from "~/components/hooks/use-inventory-item";
import { useNameItemString } from "~/components/hooks/use-name-item";
import { useSync } from "~/components/hooks/use-sync";
import { SyncAction } from "~/data/sync";
import { toArrayIf } from "~/utils/misc";
import { range } from "~/utils/number";
import { playSound } from "~/utils/sound";
import { useInventory, useRules, useTranslate } from "./app-context";
import { HoldButton } from "./hold-button";
import { useViewer } from "./hooks/use-viewer";
import { useViewerAvailability } from "./hooks/use-viewer-availability";
import { useViewerStatus } from "./hooks/use-viewer-status";
import { InGameOverlay } from "./in-game-overlay";
import { ItemEditor, ItemEditorAttributes } from "./item-editor";
import { ItemImage } from "./item-image";
import { Modal, ModalHeader } from "./modal";
import { ModalButton } from "./modal-button";
import { Select } from "./select";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";
import { ViewerOverlay } from "./viewer-overlay";

const SEAL_STICKER_HOLD_MS = 1500;
const SLAB_MAX_QUANTITY = 20;

interface SealItemStickerProps {
  onAddTool: (toolUid: number) => void;
  onClose: () => void;
  toolUid?: number;
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
    assert(toolUid !== undefined);
    sync({ type: SyncAction.SealItemSticker, toolUid, stickerUid });
    setInventory(inventory.sealStickerSlab(toolUid, stickerUid));
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

function SealItemStickerAddSlab({
  onAdd,
  slabToolItem
}: {
  onAdd: (toolUid: number) => void;
  slabToolItem: CS2EconomyItem;
}) {
  const translate = useTranslate();
  const sync = useSync();
  const [inventory, setInventory] = useInventory();
  const { craftMaxQuantity, inventoryMaxItems } = useRules();
  const [amount, setAmount] = useState("1");
  const [isCrafting, toggleIsCrafting] = useToggle(false);
  const [attributes, setAttributes] = useState<ItemEditorAttributes>();

  const maxQuantity = Math.min(
    inventoryMaxItems - inventory.size(),
    SLAB_MAX_QUANTITY,
    ...toArrayIf(craftMaxQuantity, (n) => n > 0)
  );

  function handleClose() {
    toggleIsCrafting();
  }

  function handleCraft() {
    assert(attributes);
    const inventoryItem = { id: slabToolItem.id };
    range(attributes.quantity).forEach(() => {
      setInventory(inventory.add(inventoryItem));
      sync({
        type: SyncAction.Add,
        item: inventoryItem
      });
    });
    const firstSlab = inventory
      .getAll()
      .find((item) => item.id === slabToolItem.id);
    if (firstSlab !== undefined) {
      onAdd(firstSlab.uid);
    }
  }

  return maxQuantity === 0 ? null : (
    <div className="mr-2 flex items-center gap-2 border-r border-r-white/10 pr-4">
      <Select
        direction="up"
        value={amount}
        onChange={setAmount}
        options={range(maxQuantity).map((n) => ({
          value: (n + 1).toString()
        }))}
        noMaxHeight
        className="pointer-events-auto min-w-16"
        optionsStyles="max-h-64 overflow-y-scroll"
      />
      <ModalButton
        children={translate("CaseAdd")}
        variant="primary"
        onClick={handleClose}
      />
      {isCrafting && (
        <Modal className="w-fit">
          <ModalHeader
            title={translate("CraftConfirmHeader")}
            onClose={handleClose}
          />
          <ItemEditor
            className="px-4"
            defaultQuantity={Number(amount)}
            item={slabToolItem}
            maxQuantity={maxQuantity}
            onChange={setAttributes}
          />
          <div className="my-6 flex justify-center gap-2">
            <ModalButton
              children={translate("EditorCancel")}
              onClick={handleClose}
              variant="secondary"
            />
            <ModalButton
              children={translate("EditorCraft")}
              onClick={handleCraft}
              variant="primary"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

function SealItemStickerFooter({
  className,
  onAddTool,
  onClose,
  onSeal,
  slabToolItem,
  toolUid
}: {
  className?: string;
  onAddTool: (toolUid: number) => void;
  onClose: () => void;
  onSeal: () => void;
  slabToolItem: CS2EconomyItem;
  toolUid?: number;
}) {
  const translate = useTranslate();
  const nameItemString = useNameItemString();
  const needsToAddSlab = toolUid === undefined;
  return (
    <UseItemFooter
      className={className}
      left={
        needsToAddSlab && (
          <div className="font-display flex items-center gap-2 text-lg">
            <ItemImage className="h-14" item={slabToolItem} />
            <strong>{nameItemString(slabToolItem)}</strong>
          </div>
        )
      }
      right={
        <>
          {needsToAddSlab ? (
            <SealItemStickerAddSlab
              onAdd={onAddTool}
              slabToolItem={slabToolItem}
            />
          ) : (
            <HoldButton
              durationMs={SEAL_STICKER_HOLD_MS}
              onHold={onSeal}
              tooltip={translate("SealStickerHint")}
              variant="primary"
            >
              {translate("SealStickerConfirm")}
            </HoldButton>
          )}
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
    item: { id: stickerItem.getDisplayCase().id }
  });

  useViewerStatus(api);

  return (
    <ViewerOverlay header={<SealItemStickerHeader />} viewerProps={viewerProps}>
      <div className="pointer-events-none absolute bottom-8 left-0 w-full">
        <SealItemStickerFooter
          onAddTool={props.onAddTool}
          onClose={props.onClose}
          onSeal={handleSeal}
          slabToolItem={ensure(stickerItem.getDisplayCase().parent)}
          toolUid={props.toolUid}
        />
      </div>
    </ViewerOverlay>
  );
}

function SealItemSticker2d(props: SealItemStickerProps) {
  const stickerItem = useInventoryItem(props.stickerUid);
  const { handleSeal } = useSealSticker(props);
  const slabKeychain = stickerItem.getDisplayCase();

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
                onAddTool={props.onAddTool}
                onClose={props.onClose}
                onSeal={handleSeal}
                slabToolItem={ensure(slabKeychain.parent)}
                toolUid={props.toolUid}
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
  const { canUse3d } = useViewerAvailability(stickerItem.getDisplayCase());
  return canUse3d ? (
    <SealItemSticker3d {...props} />
  ) : (
    <SealItemSticker2d {...props} />
  );
}
