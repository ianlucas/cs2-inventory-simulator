/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Economy } from "@ianlucas/cs2-lib";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useInput } from "~/hooks/use-input";
import { useInventoryItem } from "~/hooks/use-inventory-item";
import { useSync } from "~/hooks/use-sync";
import { RenameStorageUnitAction } from "~/routes/api.action.sync._index";
import { getItemNameString } from "~/utils/inventory";
import { EditorInput } from "./editor-input";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { useRootContext } from "./root-context";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";

export function RenameStorageUnit({
  onClose,
  uid
}: {
  onClose: () => void;
  uid: number;
}) {
  const {
    inventory,
    setInventory,
    translations: { translate }
  } = useRootContext();
  const sync = useSync();

  const { data: item, nametag: defaultValue } = useInventoryItem(uid);
  const isStartUsingStorageUnit = defaultValue === undefined;
  const [nametag, setNametag] = useInput(defaultValue ?? "");

  function handleRename() {
    sync({
      type: RenameStorageUnitAction,
      uid: uid,
      nametag
    });
    setInventory(inventory.renameStorageUnit(uid, nametag));
    onClose();
  }

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <div className="fixed left-0 top-0 z-50 flex h-full w-full select-none items-center justify-center bg-black/60 backdrop-blur-sm">
            <div>
              <UseItemHeader
                actionDesc={translate("RenameStorageUnitEnterName")}
                actionItem={getItemNameString(item)}
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
                        nametag === "" ||
                        !CS_Economy.safeValidateNametag(nametag)
                      }
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
            </div>
          </div>,
          document.body
        )
      }
    />
  );
}
