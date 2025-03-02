/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faCheck, faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { CS2Economy } from "@ianlucas/cs2-lib";
import { useToggle } from "@uidotdev/usehooks";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useInput } from "~/components/hooks/use-input";
import { useInventoryItem } from "~/components/hooks/use-inventory-item";
import { useNameItemString } from "~/components/hooks/use-name-item";
import { useSync } from "~/components/hooks/use-sync";
import { SyncAction } from "~/data/sync";
import { playSound } from "~/utils/sound";
import { useInventory, useTranslate } from "./app-context";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { Overlay } from "./overlay";
import { ToolButton } from "./tool-button";
import { ToolInput } from "./tool-input";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";

export function RenameItem({
  onClose,
  targetUid,
  toolUid
}: {
  onClose: () => void;
  targetUid: number;
  toolUid: number;
}) {
  const translate = useTranslate();
  const sync = useSync();
  const nameItemString = useNameItemString();
  const [inventory, setInventory] = useInventory();
  const [nameTag, setNameTag] = useInput("");
  const [isConfirmed, toggleIsConfirmed] = useToggle();

  const inventoryItem = useInventoryItem(targetUid);
  const isInvalid = !CS2Economy.safeValidateNametag(nameTag);
  const isConfirmDisabled = nameTag.length === 0;

  function handleRename() {
    if (targetUid < 0 && inventoryItem.free) {
      playSound("inventory_new_item_accept");
      sync({
        type: SyncAction.AddWithNametag,
        toolUid: toolUid,
        itemId: inventoryItem.id,
        nameTag: nameTag
      });
      setInventory(
        inventory.addWithNametag(toolUid, inventoryItem.id, nameTag)
      );
    } else {
      sync({
        type: SyncAction.RenameItem,
        toolUid: toolUid,
        targetUid: targetUid,
        nameTag: nameTag
      });
      setInventory(inventory.renameItem(toolUid, targetUid, nameTag));
    }

    onClose();
  }

  function handleToggleConfirm() {
    toggleIsConfirmed();
  }

  useEffect(() => {
    if (!isConfirmed) {
      setNameTag("");
    }
  }, [isConfirmed]);

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <Overlay>
            <UseItemHeader
              actionDesc={translate("RenameEnterName")}
              actionItem={nameItemString(inventoryItem)}
              title={translate("RenameUse")}
              warning={translate("RenameWarn")}
            />
            <ItemImage
              className="m-auto my-8 aspect-[1.33333] max-w-[512px]"
              item={inventoryItem}
            />
            <div className="flex items-center justify-center gap-2 lg:m-auto lg:mb-4">
              <ToolInput
                autoFocus
                className="text-2xl lg:max-w-[428px]"
                maxLength={20}
                onChange={setNameTag}
                placeholder={translate("InventoryItemRenamePlaceholder")}
                validate={(nameTag) =>
                  CS2Economy.safeValidateNametag(nameTag ?? "")
                }
                value={nameTag}
              />
              <ToolButton
                onClick={handleToggleConfirm}
                icon={isConfirmed ? faCircleXmark : faCheck}
                isBorderless={isConfirmed}
                disabled={isConfirmDisabled}
                tooltip={
                  isConfirmDisabled || isInvalid
                    ? translate("InventoryItemRenameInvalidTooltip")
                    : isConfirmed
                      ? translate("InventoryItemRenameClearTooltip")
                      : undefined
                }
              />
            </div>
            <UseItemFooter
              right={
                <>
                  <ModalButton
                    disabled={
                      (nameTag !== "" && isInvalid) ||
                      (nameTag === "" && inventoryItem.free) ||
                      !isConfirmed
                    }
                    variant="primary"
                    onClick={handleRename}
                    children={translate("RenameRename")}
                  />
                  <ModalButton
                    variant="secondary"
                    onClick={onClose}
                    children={translate("RenameCancel")}
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
