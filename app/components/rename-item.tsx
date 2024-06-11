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
import {
  AddWithNametagAction,
  RenameItemAction
} from "~/routes/api.action.sync._index";
import { playSound } from "~/utils/sound";
import { useInventory, useLocalize } from "./app-context";
import { EditorInput } from "./editor-input";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
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
  const localize = useLocalize();
  const sync = useSync();
  const nameItemString = useNameItemString();
  const [inventory, setInventory] = useInventory();
  const [nameTag, setNameTag] = useInput("");

  const inventoryItem = useInventoryItem(targetUid);

  function handleRename() {
    if (targetUid < 0 && inventoryItem.free) {
      playSound("inventory_new_item_accept");
      sync({
        type: AddWithNametagAction,
        toolUid: toolUid,
        itemId: inventoryItem.id,
        nametag: nameTag
      });
      setInventory(
        inventory.addWithNametag(toolUid, inventoryItem.id, nameTag)
      );
    } else {
      sync({
        type: RenameItemAction,
        toolUid: toolUid,
        targetUid: targetUid,
        nametag: nameTag
      });
      setInventory(inventory.renameItem(toolUid, targetUid, nameTag));
    }

    onClose();
  }

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <div className="fixed left-0 top-0 z-50 flex h-full w-full select-none items-center justify-center bg-black/60 backdrop-blur-sm">
            <div>
              <UseItemHeader
                actionDesc={localize("RenameEnterName")}
                actionItem={nameItemString(inventoryItem)}
                title={localize("RenameUse")}
                warning={localize("RenameWarn")}
              />
              <ItemImage
                className="m-auto my-8 aspect-[1.33333] max-w-[512px]"
                item={inventoryItem}
              />
              <div className="flex lg:m-auto lg:mb-4 lg:max-w-[360px]">
                <EditorInput
                  autoFocus
                  className="py-1 text-xl"
                  maxLength={20}
                  onChange={setNameTag}
                  placeholder={localize("EditorNametagPlaceholder")}
                  validate={(nametag) =>
                    CS2Economy.safeValidateNametag(nametag ?? "")
                  }
                  value={nameTag}
                />
              </div>
              <UseItemFooter
                right={
                  <>
                    <ModalButton
                      disabled={
                        (nameTag !== "" &&
                          !CS2Economy.safeValidateNametag(nameTag)) ||
                        (nameTag === "" && inventoryItem.free)
                      }
                      variant="primary"
                      onClick={handleRename}
                      children={localize("RenameRename")}
                    />
                    <ModalButton
                      variant="secondary"
                      onClick={onClose}
                      children={localize("RenameCancel")}
                    />
                  </>
                }
              />
            </div>
          </div>,
          document.body
        )
      }
    />
  );
}
