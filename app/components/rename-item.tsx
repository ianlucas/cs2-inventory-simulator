/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
  CS_Item,
  CS_filterItems,
  CS_safeValidateNametag
} from "@ianlucas/cslib";
import { useMemo } from "react";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useInput } from "~/hooks/use-input";
import { useSync } from "~/hooks/use-sync";
import { useTranslation } from "~/hooks/use-translation";
import {
  AddWithNametagAction,
  RenameItemAction
} from "~/routes/api.action.sync._index";
import { CSItemImage } from "./cs-item-image";
import { EditorInput } from "./editor-input";
import { useRootContext } from "./root-context";
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
  const translate = useTranslation();
  const [nametag, setNametag] = useInput("");
  const { inventory, setInventory, items } = useRootContext();
  const sync = useSync();
  const freeItems = useMemo(
    () =>
      CS_filterItems({
        free: true
      }).map((item) => item.id),
    []
  );
  const targetItem =
    targetUid >= 0
      ? inventory.getItem(targetUid)
      : items.find(({ uid }) => uid === targetUid)!.item;
  const isRenamingFreeItem = freeItems.includes(targetItem.id);
  function handleRename() {
    if (targetUid < 0 && isRenamingFreeItem) {
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
                actionItem={targetItem.name}
                title={translate("RenameUse")}
                warning={translate("RenameWarn")}
              />
              <CSItemImage
                className="m-auto my-8 aspect-[1.33333] max-w-[512px]"
                item={targetItem}
              />
              <div className="flex">
                <EditorInput
                  className="py-1 text-xl"
                  maxLength={20}
                  onChange={setNametag}
                  placeholder={translate("EditorNametagPlaceholder")}
                  validate={(nametag) => CS_safeValidateNametag(nametag ?? "")}
                  value={nametag}
                />
              </div>
              <UseItemFooter
                right={
                  <>
                    <ModalButton
                      disabled={
                        (nametag !== "" && !CS_safeValidateNametag(nametag)) ||
                        (nametag === "" && isRenamingFreeItem)
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
