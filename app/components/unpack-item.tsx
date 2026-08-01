/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2_CHARM_DETACHMENT_PACK_CHARGES } from "@ianlucas/cs2-lib";
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

export function UnpackItem({
  onClose,
  onUnpacked,
  uid
}: {
  onClose: () => void;
  onUnpacked?: (uid: number) => void;
  uid: number;
}) {
  const translate = useTranslate();
  const nameItemString = useNameItemString();
  const sync = useSync();
  const [inventory, setInventory] = useInventory();
  const item = useInventoryItem(uid);
  const charges = String(CS2_CHARM_DETACHMENT_PACK_CHARGES);

  function handleUnpack() {
    playSound("inventory_new_item_accept");
    const next = inventory.unpackItem(uid);
    setInventory(next);
    sync({ type: SyncAction.UnpackItem, uid });
    onClose();
    const detachmentsUid = next
      .getAll()
      .find((item) => item.isCharmDetachment())?.uid;
    if (detachmentsUid !== undefined) {
      onUnpacked?.(detachmentsUid);
    }
  }

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <InGameOverlay
            header={
              <UseItemHeader
                actionDesc={translate("UnpackDesc")}
                title={translate("UnpackTitle", nameItemString(item))}
              />
            }
          >
            <div className="flex size-full items-center justify-center">
              <ItemImage className="max-w-lg" item={item} />
            </div>
            <div className="absolute bottom-8 left-0 w-full">
              <div className="m-auto max-w-5xl px-24 pb-4 lg:w-5xl">
                <p className="whitespace-pre-wrap text-neutral-300">
                  {item.description}
                </p>
                <p className="mt-4 text-cyan-200/80">
                  {translate("UnpackNumberOfItems", charges)}
                </p>
              </div>
              <UseItemFooter
                className="mt-2 max-w-5xl px-8 lg:w-5xl"
                right={
                  <>
                    <ModalButton
                      variant="primary"
                      onClick={handleUnpack}
                      children={translate("UnpackAddCharges", charges)}
                    />
                    <ModalButton
                      variant="secondary"
                      onClick={onClose}
                      children={translate("UnpackClose")}
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
