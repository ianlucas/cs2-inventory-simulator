/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Item, CS_safeValidateNametag } from "@ianlucas/cslib";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useInput } from "~/hooks/use-input";
import { useSync } from "~/hooks/use-sync";
import { useTranslation } from "~/hooks/use-translation";
import { RenameStorageUnitAction } from "~/routes/api.action.sync._index";
import { CSItemImage } from "./cs-item-image";
import { EditorInput } from "./editor-input";
import { ModalButton } from "./modal-button";
import { useRootContext } from "./root-context";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";

export function RenameStorageUnit({
  onClose,
  uid,
  item
}: {
  onClose: () => void;
  uid: number;
  item: CS_Item;
}) {
  const translate = useTranslation();
  const { inventory, setInventory } = useRootContext();
  const sync = useSync();

  const defaultValue = inventory.get(uid).nametag;
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
                actionItem={item.name}
                title={translate("RenameStorageUnitUse")}
                warning={
                  isStartUsingStorageUnit
                    ? translate("RenameStorageUnitFirstNameWarn")
                    : translate("RenameStorageUnitNewNameWarn")
                }
              />
              <CSItemImage
                className="m-auto my-8 aspect-[1.33333] max-w-[512px]"
                item={item}
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
                        nametag === "" || !CS_safeValidateNametag(nametag)
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
