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
import { UseItemButton } from "./use-item-button";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";

export function RenameItem({
  onClose,
  targetIndex,
  targetItem,
  toolIndex
}: {
  onClose(): void;
  targetIndex: number;
  targetItem: CS_Item;
  toolIndex: number;
}) {
  const translate = useTranslation();
  const [nametag, setNametag] = useInput("");
  const { inventory, setInventory } = useRootContext();
  const sync = useSync();
  const freeItems = useMemo(
    () =>
      CS_filterItems({
        free: true
      }).map((item) => item.id),
    []
  );
  const isRenamingFreeItem = freeItems.includes(targetItem.id);
  function handleRename() {
    if (targetIndex < 0 && isRenamingFreeItem) {
      sync({
        type: AddWithNametagAction,
        toolIndex,
        itemId: targetItem.id,
        nametag
      });
      setInventory(inventory.addWithNametag(toolIndex, targetItem.id, nametag));
    } else {
      sync({
        type: RenameItemAction,
        toolIndex,
        targetIndex,
        nametag
      });
      setInventory(inventory.renameItem(toolIndex, targetIndex, nametag));
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
                className="aspect-[1.33333] max-w-[512px]"
                item={targetItem}
              />
              <div className="flex">
                <EditorInput
                  className="py-1 text-xl"
                  maxLength={20}
                  onChange={setNametag}
                  placeholder={translate("EditorNametagPlaceholder")}
                  validate={CS_safeValidateNametag}
                  value={nametag}
                />
              </div>
              <UseItemFooter
                right={
                  <>
                    <UseItemButton
                      disabled={
                        (nametag !== "" && !CS_safeValidateNametag(nametag)) ||
                        (nametag === "" && isRenamingFreeItem)
                      }
                      variant="primary"
                      onClick={handleRename}
                      children={translate("RenameRename")}
                    />
                    <UseItemButton
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
