/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy } from "@ianlucas/cs2-lib";
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
import { ToolInput } from "./tool-input";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";

export function RenamePet({
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
  const [nameTag, setNameTag] = useInput(item.nameTag ?? "");

  const isInvalid =
    CS2Economy.trimNameTag(nameTag) === undefined ||
    !CS2Economy.safeValidateNameTag(nameTag);

  function handleRename() {
    sync({
      type: SyncAction.RenamePet,
      uid,
      nameTag
    });
    setInventory(inventory.renamePet(uid, nameTag));
    onClose();
  }

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <Overlay>
            <UseItemHeader
              actionDesc={translate("RenamePetEnterName")}
              actionItem={nameItemString(item)}
              title={
                item.nameTag !== undefined
                  ? translate("RenamePetRename")
                  : translate("RenamePetName")
              }
            />
            <ItemImage className="m-auto my-8 max-w-lg" item={item} />
            <div className="flex items-center justify-center lg:m-auto lg:mb-4">
              <ToolInput
                autoFocus
                className="text-2xl lg:max-w-107"
                maxCodePoints={20}
                onChange={setNameTag}
                placeholder={translate("InventoryItemRenamePlaceholder")}
                validate={(nameTag) =>
                  CS2Economy.safeValidateNameTag(nameTag ?? "")
                }
                value={nameTag}
              />
            </div>
            <UseItemFooter
              right={
                <>
                  <ModalButton
                    disabled={isInvalid}
                    variant="primary"
                    onClick={handleRename}
                    children={translate("RenamePetConfirm")}
                  />
                  <ModalButton
                    variant="secondary"
                    onClick={onClose}
                    children={translate("RenamePetCancel")}
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
