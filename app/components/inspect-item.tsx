/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FloatingFocusManager } from "@floating-ui/react";
import {
  CS_Economy,
  CS_MIN_SEED,
  CS_MIN_WEAR,
  CS_NONE
} from "@ianlucas/cs2-lib";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useInspectFloating } from "~/hooks/use-inspect-floating";
import { useInventoryItem } from "~/hooks/use-inventory-item";
import { wearToString } from "~/utils/economy";
import { getItemNameString } from "~/utils/inventory";
import { useAppContext } from "./app-context";
import { InfoIcon } from "./info-icon";
import { ItemCollectionImage } from "./item-collection-image";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { UseItemFooter } from "./use-item-footer";

export function InspectItem({
  onClose,
  uid
}: {
  onClose: () => void;
  uid: number;
}) {
  const {
    preferences: { statsForNerds },
    translations: { translate }
  } = useAppContext();

  const inventoryItem = useInventoryItem(uid);
  const { data: item, seed, stickers, stickerswear, wear } = inventoryItem;
  const {
    getHoverFloatingProps,
    getHoverReferenceProps,
    hoverContext,
    hoverRefs,
    hoverStyles,
    isHoverOpen,
    ref
  } = useInspectFloating();

  const hasHover = CS_Economy.hasSeed(item) && CS_Economy.hasWear(item);
  const name = getItemNameString(inventoryItem);

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <div className="fixed left-0 top-0 z-50 flex h-full w-full select-none items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="m-auto lg:w-[1024px]">
              <div className="flex items-center justify-center">
                <div
                  className="flex items-center justify-center gap-2 border-b-4 px-1 pb-2"
                  style={{ borderColor: item.rarity }}
                >
                  {item.collectionid !== undefined && (
                    <ItemCollectionImage className="h-16" item={item} />
                  )}
                  <div className="font-display">
                    <div className="text-3xl">{name}</div>
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
                  <ItemImage
                    className="m-auto my-8 aspect-[1.33333] max-w-[512px]"
                    item={item}
                    wear={wear}
                  />
                  <div className="absolute bottom-0 left-0 flex items-center justify-center">
                    {stickers?.map((sticker, index) =>
                      sticker === CS_NONE ? null : (
                        <span className="inline-block" key={index}>
                          <ItemImage
                            className="aspect-[1.33333] w-[128px]"
                            item={CS_Economy.getById(sticker)}
                            style={{
                              filter: `grayscale(${stickerswear?.[index] ?? 0})`,
                              opacity: `${1 - (stickerswear?.[index] ?? 0)}`
                            }}
                          />
                          {statsForNerds && (
                            <div className="text-sm font-bold text-neutral-300 transition-all group-hover:scale-150">
                              {((stickerswear?.[index] ?? 0) * 100).toFixed(0)}%
                            </div>
                          )}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
              <UseItemFooter
                left={
                  <>
                    {hasHover && (
                      <ModalButton
                        variant="secondary"
                        forwardRef={ref}
                        {...getHoverReferenceProps()}
                      >
                        <InfoIcon className="h-6" />
                      </ModalButton>
                    )}
                  </>
                }
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
            {hasHover && isHoverOpen && (
              <FloatingFocusManager context={hoverContext} modal={false}>
                <div
                  className="z-20 max-w-[320px] space-y-3 rounded bg-neutral-900/95 px-6 py-4 text-sm text-white outline-none"
                  ref={hoverRefs.setFloating}
                  style={hoverStyles}
                  {...getHoverFloatingProps()}
                >
                  <div>
                    <strong>
                      {translate("InventoryItemInspectFinishCatalog")}:
                    </strong>{" "}
                    {item.index}
                  </div>
                  <div>
                    <strong>
                      {translate("InventoryItemInspectPatternTemplate")}:
                    </strong>{" "}
                    {seed ?? CS_MIN_SEED}
                  </div>
                  <div>
                    <strong>
                      {translate("InventoryItemInspectWearRating")}:
                    </strong>{" "}
                    {wearToString(wear ?? item.wearmin ?? CS_MIN_WEAR)}
                  </div>
                </div>
              </FloatingFocusManager>
            )}
          </div>,
          document.body
        )
      }
    />
  );
}
