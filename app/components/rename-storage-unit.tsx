/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { faCircleXmark } from "@fortawesome/free-regular-svg-icons";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
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
import { useInventory, useTranslate } from "./app-context";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { Overlay } from "./overlay";
import { ToolButton } from "./tool-button";
import { ToolInput } from "./tool-input";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";

export function RenameStorageUnit({
  onClose,
  uid
}: {
  onClose: () => void;
  uid: number;
}) {
  const [inventory, setInventory] = useInventory();
  const translate = useTranslate();
  const sync = useSync();
  const nameItemString = useNameItemString();

  const item = useInventoryItem(uid);
  const { nameTag: defaultValue } = item;
  const isStartUsingStorageUnit = defaultValue === undefined;
  const [nameTag, setNameTag] = useInput(defaultValue ?? "");
  const [isConfirmed, toggleIsConfirmed] = useToggle();

  const isConfirmDisabled = nameTag.length === 0;
  const isInvalid = !CS2Economy.safeValidateNametag(nameTag);

  function handleRename() {
    sync({
      type: SyncAction.RenameStorageUnit,
      uid: uid,
      nameTag: nameTag
    });
    setInventory(inventory.renameStorageUnit(uid, nameTag));
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
              actionDesc={translate("RenameStorageUnitEnterName")}
              actionItem={nameItemString(item)}
              title={translate("RenameStorageUnitUse")}
              warning={
                isStartUsingStorageUnit
                  ? translate("RenameStorageUnitFirstNameWarn")
                  : translate("RenameStorageUnitNewNameWarn")
              }
            />
            <ItemImage
              className="m-auto my-8 aspect-[1.33333] max-w-[512px]"
              item={item}
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
                    disabled={nameTag === "" || isInvalid || !isConfirmed}
                    variant="primary"
                    onClick={handleRename}
                    children={translate("RenameStorageUnitRename")}
                  />
                  <ModalButton
                    variant="secondary"
                    onClick={onClose}
                    children={translate("RenameStorageUnitClose")}
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
