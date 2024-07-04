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
import { useInventory, useLocalize } from "./app-context";
import { EditorInput } from "./editor-input";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
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
  const localize = useLocalize();
  const sync = useSync();
  const nameItemString = useNameItemString();

  const item = useInventoryItem(uid);
  const { nameTag: defaultValue } = item;
  const isStartUsingStorageUnit = defaultValue === undefined;
  const [nameTag, setNameTag] = useInput(defaultValue ?? "");

  function handleRename() {
    sync({
      type: SyncAction.RenameStorageUnit,
      uid: uid,
      nameTag: nameTag
    });
    setInventory(inventory.renameStorageUnit(uid, nameTag));
    onClose();
  }

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <div className="fixed left-0 top-0 z-50 flex h-full w-full select-none items-center justify-center bg-black/60 backdrop-blur-sm">
            <div>
              <UseItemHeader
                actionDesc={localize("RenameStorageUnitEnterName")}
                actionItem={nameItemString(item)}
                title={localize("RenameStorageUnitUse")}
                warning={
                  isStartUsingStorageUnit
                    ? localize("RenameStorageUnitFirstNameWarn")
                    : localize("RenameStorageUnitNewNameWarn")
                }
              />
              <ItemImage
                className="m-auto my-8 aspect-[1.33333] max-w-[512px]"
                item={item}
              />
              <div className="flex lg:m-auto lg:mb-4 lg:max-w-[360px]">
                <EditorInput
                  autoFocus
                  className="py-1 text-xl"
                  maxLength={20}
                  onChange={setNameTag}
                  placeholder={localize("EditorNametagPlaceholder")}
                  validate={(nameTag) =>
                    CS2Economy.safeValidateNametag(nameTag ?? "")
                  }
                  value={nameTag}
                />
              </div>
              <UseItemFooter
                right={
                  <>
                    <ModalButton
                      disabled={
                        nameTag === "" ||
                        !CS2Economy.safeValidateNametag(nameTag)
                      }
                      variant="primary"
                      onClick={handleRename}
                      children={localize("RenameStorageUnitRename")}
                    />
                    <ModalButton
                      variant="secondary"
                      onClick={onClose}
                      children={localize("RenameStorageUnitClose")}
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
