/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Economy } from "@ianlucas/cs2-lib";
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
import { useInventory, useTranslate } from "./app-context";
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
  const translate = useTranslate();
  const sync = useSync();
  const nameItemString = useNameItemString();
  const [inventory, setInventory] = useInventory();
  const [nametag, setNametag] = useInput("");

  const inventoryItem = useInventoryItem(targetUid);
  const { data: targetItem } = inventoryItem;

  function handleRename() {
    if (targetUid < 0 && targetItem.free) {
      playSound("inventory_new_item_accept");
      sync({
        type: AddWithNametagAction,
        toolUid: toolUid,
        itemId: targetItem.id,
        nametag
      });
      setInventory(inventory.addWithNametag(toolUid, targetItem.id, nametag));
    } else {
      sync({
        type: RenameItemAction,
        toolUid: toolUid,
        targetUid: targetUid,
        nametag
      });
      setInventory(inventory.renameItem(toolUid, targetUid, nametag));
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
                actionDesc={translate("RenameEnterName")}
                actionItem={nameItemString(inventoryItem)}
                title={translate("RenameUse")}
                warning={translate("RenameWarn")}
              />
              <ItemImage
                className="m-auto my-8 aspect-[1.33333] max-w-[512px]"
                item={targetItem}
              />
              <div className="flex">
                <EditorInput
                  autoFocus
                  className="py-1 text-xl"
                  maxLength={20}
                  onChange={setNametag}
                  placeholder={translate("EditorNametagPlaceholder")}
                  validate={(nametag) =>
                    CS_Economy.safeValidateNametag(nametag ?? "")
                  }
                  value={nametag}
                />
              </div>
              <UseItemFooter
                right={
                  <>
                    <ModalButton
                      disabled={
                        (nametag !== "" &&
                          !CS_Economy.safeValidateNametag(nametag)) ||
                        (nametag === "" && targetItem.free)
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
            </div>
          </div>,
          document.body
        )
      }
    />
  );
}
