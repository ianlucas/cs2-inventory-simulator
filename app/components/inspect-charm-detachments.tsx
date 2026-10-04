/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS2InventoryItem } from "@ianlucas/cs2-lib";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useTranslate } from "./app-context";
import { attachmentName } from "./attachment-3d-drawer";
import { InGameOverlay } from "./in-game-overlay";
import { InspectItemHeader } from "./inspect-item";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { UseItemFooter } from "./use-item-footer";

export function InspectCharmDetachments({
  item,
  onClose
}: {
  item: CS2InventoryItem;
  onClose: () => void;
}) {
  const translate = useTranslate();

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <InGameOverlay
            header={
              <InspectItemHeader
                icon={
                  <img
                    className="mr-2 w-29.5"
                    src="/images/vectors/keychain_removal.svg"
                    alt=""
                  />
                }
                item={item}
                subtitle={translate(
                  "CharmDetachmentsAvailable",
                  String(item.getCharges())
                )}
                title={attachmentName(item.name)}
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
              </div>
              <UseItemFooter
                className="mt-2 max-w-5xl px-8 lg:w-5xl"
                right={
                  <ModalButton
                    variant="secondary"
                    onClick={onClose}
                    children={translate("InspectClose")}
                  />
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
