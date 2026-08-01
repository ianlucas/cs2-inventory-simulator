/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useInventoryItem } from "~/components/hooks/use-inventory-item";
import { useNameItemString } from "~/components/hooks/use-name-item";
import { useSync } from "~/components/hooks/use-sync";
import { SyncAction } from "~/data/sync";
import { playSound } from "~/utils/sound";
import { useInventory, useTranslate } from "./app-context";
import { InGameOverlay } from "./in-game-overlay";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { UseItemFooter } from "./use-item-footer";
import { UseItemHeader } from "./use-item-header";

export function UnsealGraffiti({
  onClose,
  uid
}: {
  onClose: () => void;
  uid: number;
}) {
  const translate = useTranslate();
  const nameItemString = useNameItemString();
  const sync = useSync();
  const [inventory, setInventory] = useInventory();
  const item = useInventoryItem(uid);

  function handleUnseal() {
    playSound("inventory_new_item_accept");
    setInventory(inventory.unsealItem(uid).equip(uid));
    sync({ type: SyncAction.UnsealItem, uid });
    sync({ type: SyncAction.Equip, uid });
    onClose();
  }

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <InGameOverlay
            header={
              <UseItemHeader
                actionDesc={translate("UnsealGraffitiDesc")}
                actionItem={nameItemString(item)}
                title={translate("UnsealGraffitiTitle")}
                warning={translate("UnsealGraffitiWarn")}
              />
            }
          >
            <div className="flex size-full items-center justify-center">
              <ItemImage className="max-w-lg" item={item} />
            </div>
            <div className="absolute bottom-8 left-0 w-full">
              <UseItemFooter
                className="mt-2 max-w-5xl px-8 lg:w-5xl"
                right={
                  <>
                    <ModalButton
                      variant="primary"
                      onClick={handleUnseal}
                      children={translate("UnsealGraffitiUse")}
                    />
                    <ModalButton
                      variant="secondary"
                      onClick={onClose}
                      children={translate("UnsealGraffitiClose")}
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
