/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ian Lucas. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FloatingFocusManager } from "@floating-ui/react";
import { faCheck, faShareNodes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CS2Economy, CS2_MIN_SEED } from "@ianlucas/cs2-lib";
import { useCopyToClipboard } from "@uidotdev/usehooks";
import { createPortal } from "react-dom";
import { ClientOnly } from "remix-utils/client-only";
import { useInspectFloating } from "~/components/hooks/use-inspect-floating";
import { useInventoryItem } from "~/components/hooks/use-inventory-item";
import { useNameItemString } from "~/components/hooks/use-name-item";
import { wearToString } from "~/utils/economy";
import { getInventoryItemShareUrl } from "~/utils/inventory";
import { useLocalize, usePreferences, useUser } from "./app-context";
import { useTimedState } from "./hooks/use-timed-state";
import { InfoIcon } from "./info-icon";
import { ItemCollectionImage } from "./item-collection-image";
import { ItemImage } from "./item-image";
import { ModalButton } from "./modal-button";
import { Overlay } from "./overlay";
import { UseItemFooter } from "./use-item-footer";

export function InspectItem({
  onClose,
  uid
}: {
  onClose: () => void;
  uid: number;
}) {
  const [, copyToClipboard] = useCopyToClipboard();
  const localize = useLocalize();
  const nameItemString = useNameItemString();
  const item = useInventoryItem(uid);
  const { statsForNerds } = usePreferences();
  const user = useUser();
  const {
    getHoverFloatingProps,
    getHoverReferenceProps,
    hoverContext,
    hoverRefs,
    hoverStyles,
    isHoverOpen,
    ref
  } = useInspectFloating();
  const [clickedShare, triggerClickedShare] = useTimedState();

  const hasInfo = item.hasSeed() && item.hasWear();
  const hasShare = item.isPaintable();

  function handleClickShare() {
    triggerClickedShare();
    copyToClipboard(getInventoryItemShareUrl(item, user?.id));
  }

  return (
    <ClientOnly
      children={() =>
        createPortal(
          <Overlay className="m-auto lg:w-[1024px]">
            <div className="flex items-center justify-center">
              <div
                className="flex items-center justify-center gap-2 border-b-4 px-1 pb-2"
                style={{ borderColor: item.rarity }}
              >
                {item.collection !== undefined && (
                  <ItemCollectionImage className="h-16" item={item} />
                )}
                <div className="font-display">
                  <div className="text-3xl">{nameItemString(item)}</div>
                  {item.collectionName !== undefined && (
                    <div className="-mt-2 text-neutral-300">
                      {item.collectionName}
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
                />
                {item.stickers !== undefined && (
                  <div className="absolute bottom-0 left-0 flex items-center justify-center">
                    {item.someStickers().map(([index, { id, wear }]) => (
                      <span className="inline-block" key={index}>
                        <ItemImage
                          className="aspect-[1.33333] w-[128px]"
                          item={CS2Economy.getById(id)}
                          style={{
                            filter: `grayscale(${wear ?? 0})`,
                            opacity: `${1 - (wear ?? 0)}`
                          }}
                        />
                        {statsForNerds && (
                          <div className="text-sm font-bold text-neutral-300 transition-all group-hover:scale-150">
                            {((wear ?? 0) * 100).toFixed(0)}%
                          </div>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <UseItemFooter
              left={
                <>
                  {hasInfo && (
                    <ModalButton
                      variant="secondary"
                      forwardRef={ref}
                      {...getHoverReferenceProps()}
                    >
                      <InfoIcon className="h-6" />
                    </ModalButton>
                  )}
                  {hasShare && (
                    <ModalButton variant="secondary" onClick={handleClickShare}>
                      <FontAwesomeIcon
                        icon={clickedShare ? faCheck : faShareNodes}
                        className="h-6"
                      />
                    </ModalButton>
                  )}
                </>
              }
              right={
                <>
                  <ModalButton
                    variant="secondary"
                    onClick={onClose}
                    children={localize("InspectClose")}
                  />
                </>
              }
            />
            {hasInfo && isHoverOpen && (
              <FloatingFocusManager context={hoverContext} modal={false}>
                <div
                  className="z-20 max-w-[320px] space-y-3 rounded-sm bg-neutral-900/95 px-6 py-4 text-sm text-white outline-hidden"
                  ref={hoverRefs.setFloating}
                  style={hoverStyles}
                  {...getHoverFloatingProps()}
                >
                  <div>
                    <strong>
                      {localize("InventoryItemInspectFinishCatalog")}:
                    </strong>{" "}
                    {item.index}
                  </div>
                  <div>
                    <strong>
                      {localize("InventoryItemInspectPatternTemplate")}:
                    </strong>{" "}
                    {item.seed ?? CS2_MIN_SEED}
                  </div>
                  <div>
                    <strong>
                      {localize("InventoryItemInspectWearRating")}:
                    </strong>{" "}
                    {wearToString(item.getWear())}
                  </div>
                </div>
              </FloatingFocusManager>
            )}
          </Overlay>,
          document.body
        )
      }
    />
  );
}
