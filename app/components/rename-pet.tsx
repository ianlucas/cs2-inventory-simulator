/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2Economy } from "@ianlucas/cs2-lib";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useInput } from "~/components/hooks/use-input";
import { useInventoryItem } from "~/components/hooks/use-inventory-item";
import { useKeyRelease } from "~/components/hooks/use-key-release";
import { useNameItemString } from "~/components/hooks/use-name-item";
import { useSync } from "~/components/hooks/use-sync";
import { useViewerIcon } from "~/components/hooks/use-viewer-icon";
import { SyncAction } from "~/data/sync";
import { useInventory, useTranslate } from "./app-context";
import { InGameOverlay } from "./in-game-overlay";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
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
  const { ref: iconRef, url: iconUrl } = useViewerIcon(item, {
    enabled: true
  });
  const [nameTag, setNameTag] = useInput(item.nameTag ?? "");

  useKeyRelease("Escape", onClose);

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
          <InGameOverlay
            header={
              <UseItemHeader
                actionDesc={translate("RenamePetEnterName")}
                actionItem={nameItemString(item)}
                title={
                  item.nameTag !== undefined
                    ? translate("RenamePetRename")
                    : translate("RenamePetName")
                }
              />
            }
          >
            <div className="flex size-full items-center justify-center">
              <div ref={iconRef}>
                {iconUrl !== undefined ? (
                  <img
                    alt={item.name}
                    className="aspect-256/192 w-lg"
                    draggable={false}
                    src={iconUrl}
                  />
                ) : (
                  <ItemImage className="w-lg" item={item} />
                )}
              </div>
            </div>
            <div className="absolute bottom-8 left-0 w-full">
              <div className="flex justify-center px-8 pb-4">
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
                className="mt-2 max-w-5xl px-8 lg:w-5xl"
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
            </div>
          </InGameOverlay>,
          document.body
        )
      }
    />
  );
}
