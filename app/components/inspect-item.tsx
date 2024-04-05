/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CS_Economy, CS_NONE } from "@ianlucas/cslib";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useInventoryItem } from "~/hooks/use-inventory-item";
import { CSItemCollectionImage } from "./cs-item-collection-image";
import { CSItemImage } from "./cs-item-image";
import { ModalButton } from "./modal-button";
import { useRootContext } from "./root-context";
import { UseItemFooter } from "./use-item-footer";

export function InspectItem({
  onClose,
  uid
}: {
  onClose: () => void;
  uid: number;
}) {
  const {
    translations: { translate }
  } = useRootContext();

  const { stickers, stickerswear, data: item, wear } = useInventoryItem(uid);

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <div className="fixed left-0 top-0 z-50 flex h-full w-full select-none items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="m-auto lg:w-[1024px]">
              <div className="flex items-center justify-center">
                <div
                  className="flex items-center justify-center gap-4 border-b-4 px-1 pb-2"
                  style={{ borderColor: item.rarity }}
                >
                  {item.collection !== undefined && (
                    <CSItemCollectionImage className="h-16" item={item} />
                  )}
                  <div className="font-display">
                    <div className="text-3xl">{item.name}</div>
                    {item.collectionname !== undefined && (
                      <div className="-mt-2 text-neutral-300">
                        {item.collectionname}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="relative mx-auto inline-block">
                  <CSItemImage
                    className="m-auto my-8 aspect-[1.33333] max-w-[512px]"
                    item={item}
                    wear={wear}
                  />
                  <div className="absolute bottom-0 left-0 flex items-center justify-center">
                    {stickers?.map((sticker, index) =>
                      sticker === CS_NONE ? null : (
                        <CSItemImage
                          key={index}
                          className="m-auto my-8 aspect-[1.33333] w-[128px]"
                          item={CS_Economy.getById(sticker)}
                          style={{
                            filter: `grayscale(${stickerswear?.[index] ?? 0})`,
                            opacity: `${1 - (stickerswear?.[index] ?? 0)}`
                          }}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
              <UseItemFooter
                right={
                  <>
                    <ModalButton
                      variant="secondary"
                      onClick={onClose}
                      children={translate("InspectClose")}
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
